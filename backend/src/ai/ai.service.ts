import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  ForbiddenException,
} from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { WebSearchService } from './web-search.service';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class AIService implements OnModuleInit {
  private readonly logger = new Logger(AIService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    private readonly webSearchService: WebSearchService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.logger.log(
        `Gemini API Key found: ${apiKey.substring(0, 5)}... (Length: ${apiKey.length})`,
      );
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Try gemini-1.5-flash as default
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // List available models for debugging
      void this.listAvailableModels();
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is not defined in environment variables!',
      );
    }
  }

  async listAvailableModels() {
    try {
      // Note: listModels is not directly on genAI in some versions of the SDK
      // We might need to use a different approach or just rely on trial and error
      this.logger.log('Checking available Gemini models...');
    } catch (error) {
      this.logger.error('Error listing models:', error);
    }
  }

  private getAiMonthlyLimit(planCode?: string, subscriptionStatus?: string) {
    if (subscriptionStatus === 'TRIAL') {
      return 50;
    }
    switch (planCode) {
      case 'PRO':
        return 200;
      case 'ENTERPRISE':
        return null;
      case 'STARTER':
      default:
        return 50;
    }
  }

  private async checkAiQuota(tenantId: string, action: string) {
    if (!tenantId) return;
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subscriptionPlan: true, subscriptionStatus: true },
    });
    const limit = this.getAiMonthlyLimit(
      tenant?.subscriptionPlan || undefined,
      tenant?.subscriptionStatus || undefined,
    );
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);
    if (limit !== null) {
      const count = await this.prisma.systemLog.count({
        where: {
          tenantId,
          source: 'AI',
          message: 'AI_USAGE',
          createdAt: { gte: periodStart },
        },
      });
      if (count >= limit) {
        throw new ForbiddenException(
          'AI kullanım limitine ulaşıldı. Lütfen paketinizi yükseltin.',
        );
      }
    }
    await this.prisma.systemLog.create({
      data: {
        tenantId,
        level: 'INFO',
        source: 'AI',
        message: 'AI_USAGE',
        details: JSON.stringify({ action }),
      },
    });
  }

  private async tryGenerateContent(prompt: string, preferredModel?: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }

    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
      'gemini-3-flash-preview',
      'gemini-pro',
    ];

    // If preferred model is provided, put it at the beginning
    if (preferredModel && !modelsToTry.includes(preferredModel)) {
      modelsToTry.unshift(preferredModel);
    } else if (preferredModel) {
      // Move to front
      const index = modelsToTry.indexOf(preferredModel);
      modelsToTry.splice(index, 1);
      modelsToTry.unshift(preferredModel);
    }

    let lastError = null;

    // 1. Try standard SDK approach first
    for (const modelName of modelsToTry) {
      try {
        this.logger.log(`Trying model: ${modelName} with standard SDK`);
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        this.logger.log(`Success with model: ${modelName} (SDK)`);
        return response;
      } catch (error) {
        this.logger.warn(
          `Standard SDK failed for ${modelName}: ${error.message}`,
        );
        lastError = error;
        // If the error is about model not found, we continue to next model
        if (
          error.message.includes('not found') ||
          error.message.includes('404')
        ) {
          continue;
        }
        // If it's a safety error, we might want to stop or continue
        if (error.message.includes('SAFETY')) {
          continue;
        }
      }
    }

    // 2. If SDK fails, try direct axios call to various endpoints
    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    ];

    for (const url of endpoints) {
      try {
        const urlObj = new URL(url);
        const modelName = url.split('models/')[1]?.split(':')[0] || 'unknown';
        const apiVersion = url.includes('/v1beta/') ? 'v1beta' : 'v1';

        this.logger.log(
          `Trying direct API call for model ${modelName} (${apiVersion}): ${urlObj.pathname}`,
        );

        const response = await axios.post(
          url,
          {
            contents: [{ parts: [{ text: prompt }] }],
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE',
              },
            ],
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000, // 60 seconds timeout
          },
        );

        if (
          response.data &&
          response.data.candidates &&
          response.data.candidates.length > 0
        ) {
          const candidate = response.data.candidates[0];

          if (candidate.finishReason === 'SAFETY') {
            this.logger.warn(
              `Content blocked by safety filters for ${modelName}`,
            );
            continue;
          }

          if (
            candidate.content &&
            candidate.content.parts &&
            candidate.content.parts.length > 0
          ) {
            this.logger.log(
              `Direct API call success: ${modelName} (${apiVersion})`,
            );
            return {
              text: () => candidate.content.parts[0].text,
            };
          }
        }

        this.logger.warn(
          `Direct API call returned no valid candidates for ${modelName}`,
        );
      } catch (axiosError) {
        const errorData = axiosError.response?.data?.error;
        const errorMsg = errorData?.message || axiosError.message;
        const statusCode = axiosError.response?.status;

        this.logger.warn(
          `Direct API call failed for ${url.split('models/')[1]?.split(':')[0] || 'unknown'} (${statusCode}): ${errorMsg}`,
        );
        lastError = axiosError;

        // If it's a 403 (Permission Denied), it's a serious key issue
        if (statusCode === 403) {
          this.logger.error(
            `PERMISSION DENIED (403): Check 'Generative Language API' in Google Cloud Console.`,
          );
          throw new Error(
            `API Anahtarı yetki hatası (403). Lütfen Google Cloud Console'dan 'Generative Language API'nin açık olduğundan emin olun.`,
          );
        }

        // Skip 404 (Model not found) or other minor errors and try next
        continue;
      }
    }

    throw lastError || new Error('All attempts (SDK and Direct) failed');
  }

  async analyzeSector(
    tenantId: string,
    sector: string,
    customerUrl?: string,
    customerIg?: string,
    deepSearch = false,
  ) {
    if (!this.genAI) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY tanımlanmamış veya servis başlatılamadı.',
      );
    }
    await this.checkAiQuota(tenantId, 'analyze-sector');

    let webContext = '';
    if (deepSearch) {
      try {
        this.logger.log(
          `Deep searching for sector: ${sector} and customer: ${customerUrl || sector}`,
        );

        // 1. Search for the specific brand to see current status
        const brandQuery = customerUrl
          ? `site:${customerUrl} OR "${sector}"`
          : `"${sector}" firması inceleme`;
        const brandResults = await this.webSearchService.search(brandQuery);

        // 2. Search for local/specific competitors
        const competitorQuery = `${sector} rakipleri karşılaştırma yorumlar 2026`;
        const compResults = await this.webSearchService.search(competitorQuery);

        const allResults = [
          ...brandResults.slice(0, 2),
          ...compResults.slice(0, 2),
        ];

        if (allResults.length > 0) {
          const scrapeTargets = allResults
            .map((result) =>
              typeof result.link === 'string' ? result.link : undefined,
            )
            .filter((link): link is string => Boolean(link));
          const scrapedData = await Promise.all(
            scrapeTargets.map((link) =>
              this.webSearchService.scrapeWebsite(link),
            ),
          );
          webContext = scrapedData.join('\n\n---\n\n');
        }
      } catch (searchError) {
        this.logger.error(
          'Web search error, continuing without web data:',
          searchError,
        );
      }
    }

    const prompt = `
      Sen kıdemli bir marka stratejisti ve dijital pazarlama direktörüsün. 
      Müşteri Markası/Sektörü: ${sector}
      Müşteri Web Sitesi: ${customerUrl || 'Belirtilmedi'}
      Müşteri Instagram: ${customerIg || 'Belirtilmedi'}

      ${webContext ? `Aşağıda internetten taranan GERÇEK VE GÜNCEL veriler bulunmaktadır:\n${webContext}\n` : 'NOT: İnternet erişimi kısıtlı olduğu için genel sektör bilgileri kullanılacaktır.'}

      GÖREVİN:
      Leka Motors (veya belirtilen marka) için derinlemesine bir "Kimlik ve Rekabet" analizi yap. 
      İnternet verilerini kullanarak şu sorulara yanıt ver:
      1. **Bu firma tam olarak ne iş yapıyor?** (Hizmet kalemleri, uzmanlık alanları).
      2. **Hangi bölgelere hizmet sağlıyor?** (Fiziksel adres, hizmet kapsama alanı).
      3. **Ürün/Hizmet Gamı Nedir?** (Net listeleme: Örn: Ekonomik araçlar, VIP transfer, uzun dönem kiralama vb.).
      4. **Gerçek Rakip Kıyaslaması**: Sektördeki en dişli 3 rakip. Onlar neyi iyi yapıyor? Biz neyi yapmıyoruz? (Tablo formatında ver).
      5. **Sosyal Medya Röntgeni**: Rakiplerin son dönemde viral olan postları/reelsleri üzerinden trend analizi.
      6. **Stratejik Farklılaşma Noktası**: "Neden bizi seçmeliler?" sorusuna verilecek 3 benzersiz cevap.
      7. **3 Viral İçerik Taslağı**: Doğrudan rakiplerin zayıf yanlarına vuran, yüksek etkileşimli fikirler.

      ANALİZ YAPISI (Markdown formatında):
      - **Firma Kimlik Kartı** (Hizmetler, Bölge, Ürünler)
      - **Mevcut Durum Analizi** (Web ve Sosyal Medya)
      - **Rakip Kıyaslama Tablosu**
      - **Trendler ve Viral Fikirler**

      ÖNEMLİ: Eğer internetten veri çekilemediyse "Genel analiz" olduğunu belirt ama mümkün olduğunca spesifik olmaya çalış.
    `;

    try {
      const response = await this.tryGenerateContent(prompt);
      return { report: response.text() };
    } catch (error) {
      this.logger.error('Sector analysis fatal error:', error);
      const detail = error.response?.data?.error?.message || error.message;
      throw new InternalServerErrorException(
        `Sektör analizi yapılamadı. Hata: ${detail}`,
      );
    }
  }

  async generateSmartPrompt(
    tenantId: string,
    data: {
      sector: string;
      type: string;
      topic: string;
      aiModel?: string;
    },
  ) {
    if (!this.genAI)
      throw new InternalServerErrorException('GEMINI_API_KEY tanımlanmamış.');
    await this.checkAiQuota(tenantId, 'generate-prompt');

    const prompt = `
      Sadece ve sadece "${data.type}" formatında bir içerik üret. Başka formatlarda (Reels, Story vb.) alternatifler sunma.
      
      Sektör: ${data.sector}
      Konu: ${data.topic}

      Talimatlar:
      1. Sadece "${data.type}" için uygun olan yapıyı kullan.
      2. AI'ya rol ver, hedef kitleyi tanımlayan ve içerik yapısını (başlık, gövde, CTA, hashtag) detaylandıran teknik bir prompt metni hazırla.
      3. Yanıtında asla "Harika!", "İşte promptun:" gibi giriş cümleleri veya açıklama yapma. 
      4. Sadece promptun kendisini döndür.
    `;

    try {
      const response = await this.tryGenerateContent(prompt, data.aiModel);
      return { prompt: response.text() };
    } catch (error) {
      throw new InternalServerErrorException(
        `Prompt oluşturulamadı: ${error.message}`,
      );
    }
  }

  async analyzeSite(
    tenantId: string,
    url: string,
    deepSearch = false,
    siteId?: string,
  ) {
    if (!this.genAI)
      throw new InternalServerErrorException('GEMINI_API_KEY tanımlanmamış.');
    await this.checkAiQuota(tenantId, 'analyze-site');

    let webContext = '';
    if (deepSearch) {
      try {
        // Scrape the main page
        webContext = await this.webSearchService.scrapeWebsite(url);
      } catch (e) {
        this.logger.warn(`Failed to scrape ${url}: ${e.message}`);
      }
    }

    const prompt = `
      Sen bir SEO ve içerik stratejistisin.
      Aşağıdaki web sitesini analiz et ve içerik üretimi için kritik bilgileri çıkar.
      URL: ${url}
      
      WEB SİTESİ İÇERİĞİ (Kısmi):
      ${webContext.substring(0, 5000)}

      GÖREV:
      1. Site ne hakkında? (Niş/Sektör)
      2. Hedef kitle kim?
      3. Öne çıkan anahtar kelimeler neler? (En az 5 tane)
      4. Marka dili ve tonu nasıl? (Örn: Kurumsal, Samimi, Teknik vb.)

      YANIT FORMATI (SAF JSON):
      {
        "niche": "Sektör tanımı",
        "audience": "Hedef kitle tanımı",
        "keywords": ["kelime1", "kelime2", "kelime3", "kelime4", "kelime5"],
        "tone": "Marka tonu",
        "summary": "Kısa özet"
      }
      
      KURALLAR:
      - Sadece geçerli bir JSON objesi döndür.
      - Markdown ('''json) veya başka bir açıklama metni EKLEME.
    `;

    try {
      const response = await this.tryGenerateContent(prompt);
      let text = response.text().trim();

      // Temizlik
      text = text
        .replace(/^```json\s*/, '')
        .replace(/^```\s*/, '')
        .replace(/```$/, '');

      let result;
      try {
        // Find JSON object
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          text = jsonMatch[0];
        }
        result = JSON.parse(text);
      } catch (e) {
        this.logger.error(
          `Analyze site JSON parse failed. Text: ${text.substring(0, 100)}...`,
        );
        // Fallback result instead of throwing
        result = {
          niche: 'Genel',
          audience: 'Belirlenemedi',
          keywords: ['analiz', 'hata', 'manuel'],
          tone: 'Profesyonel',
          summary: 'Otomatik analiz formatı işlenemedi. Lütfen tekrar deneyin.',
        };
      }

      // Save analysis if siteId provided
      if (siteId) {
        try {
          await this.prisma.wordpressSite.update({
            where: { id: siteId, tenantId },
            data: { siteAnalysis: JSON.stringify(result) },
          });
        } catch (dbError) {
          this.logger.warn(
            `Failed to save site analysis for site ${siteId}: ${dbError.message}`,
          );
          // DB kaydı başarısız olsa bile sonucu dönelim, kullanıcı görsün
        }
      }

      return result;
    } catch (error) {
      this.logger.error('Analyze site error:', error);
      throw new InternalServerErrorException(
        `Site analizi yapılamadı: ${error.message}`,
      );
    }
  }

  async suggestTitles(
    tenantId: string,
    data: { topic: string; context?: string; aiModel?: string },
  ) {
    if (!this.genAI)
      throw new InternalServerErrorException('GEMINI_API_KEY tanımlanmamış.');
    await this.checkAiQuota(tenantId, 'suggest-titles');

    const prompt = `
        Konu: ${data.topic}
        Bağlam/Site Bilgisi: ${data.context || 'Yok'}

        GÖREV:
        Bu konu için 5 adet tıklanabilir, SEO uyumlu ve dikkat çekici blog yazısı başlığı öner.
        Başlıklar viral olma potansiyeli taşımalı.
        
        Sadece başlıkları listele (madde işareti olmadan, her satıra bir tane).
      `;

    try {
      const response = await this.tryGenerateContent(prompt, data.aiModel);
      return {
        titles: response
          .text()
          .split('\n')
          .filter((t) => t.trim().length > 0),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Başlık önerilemedi: ${error.message}`,
      );
    }
  }

  async generateContent(
    tenantId: string,
    data: {
      sector: string;
      customerUrl?: string;
      customerIg?: string;
      type: string;
      topic: string;
      tone?: string;
      context?: string;
      deepSearch?: boolean;
      aiModel?: string;
      length?: 'SHORT' | 'MEDIUM' | 'LONG';
    },
  ) {
    if (!this.genAI)
      throw new InternalServerErrorException('GEMINI_API_KEY tanımlanmamış.');
    await this.checkAiQuota(tenantId, 'generate-content');

    this.logger.log(
      `Generating content for sector: ${data.sector}, type: ${data.type}`,
    );

    const lengthInstruction =
      data.length === 'LONG'
        ? 'Detaylı, uzun ve kapsamlı bir makale yaz (en az 1000 kelime).'
        : data.length === 'SHORT'
          ? 'Kısa, öz ve vurucu bir metin yaz (maks 300 kelime).'
          : 'Orta uzunlukta, dengeli bir yazı olsun (yaklaşık 600 kelime).';

    const prompt = `
      Sen uzman bir dijital pazarlama dehasısın. Görevin sadece belirtilen sektöre ve firmaya özel içerik üretmektir.
      
      MÜŞTERİ BİLGİLERİ:
      - Sektör: ${data.sector}
      - Firma Web Sitesi: ${data.customerUrl || 'Belirtilmedi'}
      - İçerik Türü: ${data.type}
      - Hedef Konu/Başlık: ${data.topic}
      - Dil Tonu: ${data.tone || 'Profesyonel ve İlgi Çekici'}
      - Uzunluk: ${lengthInstruction}

      STRATEJİK BAĞLAM:
      ${data.context || 'Genel sektör bilgileri kullanılacak.'}

      GÖREVİN:
      1. %100 özgün, SEO uyumlu bir içerik üret.
      2. İçerik yapısı: 
         - ÖNEMLİ: Asla H1 etiketi kullanma. Asla ana başlığı metnin en başına yazma.
         - Doğrudan giriş paragrafı ile başla.
         - Alt başlıklar için sadece H2 ve H3 kullan.
      3. Çıktı formatı KESİNLİKLE sadece saf JSON olmalıdır. Markdown, kod bloğu veya başka bir metin içermemelidir.
      
      BEKLENEN JSON FORMATI:
      {
        "html_content": "<p>Giriş paragrafı...</p><h2>Alt Başlık</h2><p>Detaylar...</p>",
        "tags": ["etiket1", "etiket2", "etiket3", "etiket4", "etiket5"]
      }

      4. "html_content" alanı sadece HTML etiketleri (p, h2, h3, ul, li, strong) içermelidir.
      5. "tags" alanı 5-10 adet ilgili anahtar kelime içermelidir.
    `;

    try {
      const response = await this.tryGenerateContent(prompt, data.aiModel);
      let text = response.text().trim();

      // Temizlik: Markdown code block varsa kaldır
      text = text
        .replace(/^```json\s*/, '')
        .replace(/^```\s*/, '')
        .replace(/```$/, '');

      let content = '';
      let tags: string[] = [];

      try {
        // Find JSON object
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          text = jsonMatch[0];
        }

        const jsonResponse = JSON.parse(text);
        content = jsonResponse.html_content || jsonResponse.content || '';
        tags = jsonResponse.tags || [];
      } catch (e) {
        // JSON parse edilemezse, metni olduğu gibi al ama etiket üretemeyiz
        this.logger.warn(
          'AI response was not valid JSON, using raw text fallback',
        );
        content = text;
      }

      // KESİN TEMİZLİK: H1 ve Başlık Kaldırma
      // 1. HTML h1 etiketlerini h2'ye çevir (silmek yerine küçültelim ki anlam bozulmasın, veya tamamen silelim)
      // Kullanıcı "istemiyorum" dediği için tamamen siliyoruz veya içeriğini h2 yapıyoruz.
      // Genelde başlık tekrarı olduğu için silmek daha mantıklı.
      content = content.replace(/<h1[^>]*>.*?<\/h1>/gi, '');

      // 2. Markdown # Başlık formatını temizle (eğer AI HTML yerine Markdown verdiyse)
      content = content.replace(/^#\s+.*$/gm, '');

      // 3. İçeriğin en başında, makale başlığının aynısı veya çok benzeri bir metin varsa onu da sil (h2 veya p içinde olsa bile)
      // Bu zor bir regex, ama en azından ilk h1'i sildik.

      return { content, tags };
    } catch (error) {
      this.logger.error('Content generation error:', error);
      throw new InternalServerErrorException(
        `İçerik üretilemedi: ${error.message}`,
      );
    }
  }

  async generateProposal(
    tenantId: string,
    data: {
      clientName: string;
      projectScope: string;
      sector: string;
      timeline?: string;
      goals?: string;
      deepSearch?: boolean;
      customerWebsite?: string;
      selectedServices?: any[];
      aiModel?: string;
    },
  ) {
    if (!this.genAI)
      throw new InternalServerErrorException('GEMINI_API_KEY tanımlanmamış.');
    await this.checkAiQuota(tenantId, 'generate-proposal');

    // Fetch tenant info for agency name
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    const agencyName = tenant?.name || 'Ajansımız';

    let webContext = '';
    const searchQueries = [
      `${data.clientName} ${data.sector} dijital pazarlama durumu`,
      `${data.customerWebsite || data.clientName} rakipler ve pazar analizi`,
    ];

    if (data.deepSearch) {
      this.logger.log(
        `Searching web for proposal context: ${data.clientName} ${data.sector}`,
      );
      for (const query of searchQueries) {
        const searchResults = await this.webSearchService.search(query);
        if (searchResults.length > 0) {
          const topLinks = searchResults
            .slice(0, 1)
            .map((r) => (typeof r.link === 'string' ? r.link : undefined))
            .filter((link): link is string => Boolean(link));
          for (const link of topLinks) {
            const content = await this.webSearchService.scrapeWebsite(link);
            webContext += `\nKaynak (${link}):\n${content.substring(0, 1000)}\n`;
          }
        }
      }
    }

    const cycleMap: any = {
      MONTHLY: 'Aylık',
      YEARLY: 'Yıllık',
      ONCE: 'Tek Seferlik',
    };
    const selectedServicesText =
      data.selectedServices
        ?.map(
          (s) =>
            `### ${s.name}\n${s.description || 'Bu hizmet kapsamında stratejik çözümler sunulacaktır.'}\nYatırım: ${s.basePrice?.toLocaleString('tr-TR')} TL (${cycleMap[s.billingCycle] || s.billingCycle})`,
        )
        .join('\n\n') || '';

    const servicesContext = `
      ${selectedServicesText ? `SEÇİLEN HİZMETLER:\n${selectedServicesText}` : ''}
      ${data.projectScope ? `ÖZEL NOTLAR VE EK KAPSAM:\n${data.projectScope}` : ''}
    `.trim();

    const prompt = `
      Sen profesyonel bir dijital ajans olan "${agencyName}" strateji ve satış direktörüsün. 
      Görevin, müşteriyi ikna edecek, ajansın uzmanlığını kanıtlayacak, son derece DETAYLI, kapsamlı ve profesyonel bir "Dijital Pazarlama ve Stratejik İş Birliği Teklifi" hazırlamaktır.
      
      MÜŞTERİ BİLGİLERİ:
      - Müşteri Adı: ${data.clientName}
      - Web Sitesi: ${data.customerWebsite || 'Belirtilmedi'}
      - Sektör: ${data.sector}
      - Hedefler: ${data.goals || 'Belirtilmedi'}
      - Tahmini Süre: ${data.timeline || 'Belirtilmedi'}

      TEKLİF KAPSAMI VE ÖZEL TALEPLER:
      ${servicesContext}

      ${webContext ? `GÜNCEL PAZAR VE RAKİP VERİLERİ (Bu verileri teklifin strateji kısmında mutlaka kullan):\n${webContext}\n` : ''}

      GÖREV TALİMATLARI:
      1. Her bölümü derinlemesine detaylandır. Sadece başlıklar değil, her başlık altında en az 2-3 paragraf açıklayıcı, ikna edici metin yaz.
      2. Müşterinin sektörüne özel terminoloji kullan ve onlara özel çözümler öner.
      3. "Özel Notlar ve Ek Kapsam" kısmında belirtilen her bir maddeyi teklifin içine yedir ve bunlara özel çözümler üret.
      
      TEKLİF YAPISI (Markdown formatında):
      ÖNEMLİ: Teklifi bölümlere ayırırken [PAGE_BREAK] etiketini kullan.

      1. **Kapak Sayfası**: [PAGE_BREAK]
         Sadece Müşteri Adı, Ajans Bilgileri (${agencyName}) ve "Dijital Dönüşüm ve Strateji Teklifi" başlığı.

      2. **Stratejik Vizyon ve Analiz**: [PAGE_BREAK]
         Müşterinin vizyonuna odaklanan giriş, ${webContext ? 'pazar analizi verileriyle zenginleştirilmiş' : 'sektörel'} mevcut durum değerlendirmesi ve neden dijitalleşmeleri gerektiğine dair güçlü bir argüman.

      3. **Hizmet Detayları**: [PAGE_BREAK]
         Her bir ana hizmet için mutlaka AYRI bir [PAGE_BREAK] etiketi kullanarak yeni sayfa başlat. 
         Her sayfa şunları içermelidir:
         - Hizmet Başlığı (H1)
         - Stratejik Yaklaşım (Neden bu hizmet seçildi?)
         - Uygulama Metodolojisi (Adım adım neler yapılacak?)
         - Beklenen KPI'lar ve Çıktılar
         - ${data.projectScope ? 'Özel kapsam notlarına dair detaylar' : ''}

      4. **Yatırım ve Bütçelendirme**: [PAGE_BREAK]
         Sadece bu sayfada fiyatlandırma olsun. Seçilen hizmetleri, birim fiyatlarını, miktarlarını ve periyotlarını içeren profesyonel bir Markdown tablosu sun.

      ÖNEMLİ KURALLAR:
      - Dili "Siz" odaklı, kurumsal, güven verici ve son derece profesyonel tut.
      - Kesinlikle kısa veya yüzeysel geçme. Her bölüm dolu dolu olmalı.
      - Para birimi olarak Türk Lirası (TL) kullan.
      - Yanıtında asla giriş veya kapanış cümleleri kullanma. Sadece teklif metnini döndür.
      - Ajans adı olarak mutlaka "${agencyName}" ismini kullan.
    `;

    try {
      const response = await this.tryGenerateContent(prompt, data.aiModel);
      return { proposal: response.text() };
    } catch (error) {
      this.logger.error('Proposal generation error:', error);
      throw new InternalServerErrorException(
        `Teklif oluşturulamadı: ${error.message}`,
      );
    }
  }

  async financeInsights(
    tenantId: string,
    data: { aiModel?: string; preferredCurrency?: string },
    options?: any,
    context?: any,
  ) {
    if (!this.genAI)
      throw new InternalServerErrorException('GEMINI_API_KEY tanımlanmamış.');
    await this.checkAiQuota(tenantId, 'finance-insights');

    const preferredCurrency = (data?.preferredCurrency || 'TRY').toUpperCase();

    // Filter for CLIENT users if provided in context
    const userRole = context?.user?.role;
    const userCustomerId = context?.user?.customerId;

    const txWhere: any = { tenantId };
    const invWhere: any = { tenantId };
    const recWhere: any = { tenantId, isActive: true };
    if (userRole === 'CLIENT' && userCustomerId) {
      txWhere.customerId = userCustomerId;
      invWhere.customerId = userCustomerId;
      recWhere.customerId = userCustomerId;
    }

    // Fetch transactions for totals
    const transactions = await this.prisma.transaction.findMany({
      where: txWhere,
      select: {
        type: true,
        status: true,
        amount: true,
        category: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    const toMonthKey = (d: Date) => d.toISOString().slice(0, 7);
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now);
      dt.setMonth(now.getMonth() - i);
      months.push(toMonthKey(dt));
    }

    const incomePaid = transactions
      .filter((t) => t.type === 'INCOME' && t.status === 'PAID')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const expensePaid = transactions
      .filter((t) => t.type === 'EXPENSE' && t.status === 'PAID')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const balance = incomePaid - expensePaid;

    const monthlyIncome = months.map((m) =>
      transactions
        .filter(
          (t) =>
            t.type === 'INCOME' &&
            t.status === 'PAID' &&
            toMonthKey(new Date(t.date)) === m,
        )
        .reduce((acc, t) => acc + Number(t.amount || 0), 0),
    );
    const monthlyExpense = months.map((m) =>
      transactions
        .filter(
          (t) =>
            t.type === 'EXPENSE' &&
            t.status === 'PAID' &&
            toMonthKey(new Date(t.date)) === m,
        )
        .reduce((acc, t) => acc + Number(t.amount || 0), 0),
    );

    // Expense breakdown
    const expenseTotals: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'EXPENSE' && t.status === 'PAID') {
        const key = String(t.category || 'Diğer');
        expenseTotals[key] = (expenseTotals[key] || 0) + Number(t.amount || 0);
      }
    }
    const sortedExpense = Object.entries(expenseTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, amount]) => ({ label, amount }));

    // Invoices: receivables and overdue
    const pendingStatuses = ['SENT', 'OVERDUE'];
    const pendingInvoicesAgg = await this.prisma.invoice.aggregate({
      where: { ...invWhere, status: { in: pendingStatuses } },
      _sum: { totalAmount: true },
      _count: true,
    });
    const overdueInvoices = await this.prisma.invoice.findMany({
      where: { ...invWhere, status: 'OVERDUE' },
      select: { id: true, number: true, totalAmount: true, dueDate: true },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    const upcomingDue = await this.prisma.invoice.findMany({
      where: {
        ...invWhere,
        status: 'SENT',
        dueDate: { gte: new Date(), lte: new Date(Date.now() + 14 * 86400000) },
      },
      select: { id: true, number: true, totalAmount: true, dueDate: true },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    // Recurring overview
    const recurring = await this.prisma.recurringTransaction.findMany({
      where: recWhere,
      select: { type: true, amount: true, category: true, interval: true },
    });
    const mrr = recurring
      .filter((r) => r.type === 'INCOME' && r.interval === 'MONTHLY')
      .reduce((acc, r) => acc + Number(r.amount || 0), 0);
    const monthlyFixedExpense = recurring
      .filter((r) => r.type === 'EXPENSE' && r.interval === 'MONTHLY')
      .reduce((acc, r) => acc + Number(r.amount || 0), 0);

    const metrics = {
      currency: preferredCurrency,
      totals: {
        incomePaid,
        expensePaid,
        balance,
        receivables: pendingInvoicesAgg._sum.totalAmount || 0,
        receivableCount: pendingInvoicesAgg._count || 0,
        mrr,
        monthlyFixedExpense,
      },
      months,
      monthlyIncome,
      monthlyExpense,
      topExpenses: sortedExpense,
      overdueInvoices,
      upcomingDue,
    };

    const prompt = `
      Sen kıdemli bir finans analisti ve CFO danışmanısın.
      Aşağıda bir ajansın gerçek zamanlı finansal metrikleri bulunuyor (para birimi TRY).
      Bu verilere dayanarak kısa ve iş odaklı bir analiz hazırla.

      METRİKLER (JSON):
      ${JSON.stringify(metrics, null, 2)}

      GÖREV:
      1) Nakit Akışı Özeti (maks. 4 madde)
      2) Risk Uyarıları (gecikmiş faturalar, sabit gider yükü vb.)
      3) Önerilen Aksiyonlar (tahsilat, gider optimizasyonu, MRR büyütme)
      4) 30 Günlük Basit Projeksiyon (gelir/gider ve beklenen denge)

      Yanıtı Markdown olarak üret; başlıkları ve madde işaretlerini kullan.
      Kısa ve net ol; sayıları mümkünse TL olarak belirt.
    `;

    try {
      const response = await this.tryGenerateContent(prompt, data.aiModel);
      return { metrics, insights: response.text() };
    } catch (error) {
      this.logger.error('Finance insights generation error:', error);
      const detail = error.response?.data?.error?.message || error.message;
      throw new InternalServerErrorException(
        `Finans analizleri üretilemedi: ${detail}`,
      );
    }
  }

  async financeQA(
    tenantId: string,
    data: { question: string; aiModel?: string; preferredCurrency?: string },
    options?: any,
    context?: any,
  ) {
    if (!this.genAI)
      throw new InternalServerErrorException('GEMINI_API_KEY tanımlanmamış.');
    await this.checkAiQuota(tenantId, 'finance-qa');

    const userRole = context?.user?.role;
    const userCustomerId = context?.user?.customerId;
    const txWhere: any = { tenantId };
    const invWhere: any = { tenantId };
    if (userRole === 'CLIENT' && userCustomerId) {
      txWhere.customerId = userCustomerId;
      invWhere.customerId = userCustomerId;
    }

    const q = String(data?.question || '')
      .toLocaleLowerCase('tr-TR')
      .trim();
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diffToMonday = (day + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const fmtTR = (n: number) =>
      new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(n);

    const directAnswer = async () => {
      if (q.includes('kaç müşteri') || q.includes('müşteri sayısı')) {
        const count = await this.prisma.customer.count({ where: { tenantId } });
        return `Toplam ${count} müşteri var.`;
      }
      if (
        q.includes('gecikmiş fatura sayısı') ||
        q.includes('kaç fatura gecikmiş')
      ) {
        const count = await this.prisma.invoice.count({
          where: { ...invWhere, status: 'OVERDUE' },
        });
        return `Gecikmiş fatura sayısı ${count}.`;
      }
      if (
        q.includes('gecikmiş fatura') &&
        (q.includes('toplam') || q.includes('tutar'))
      ) {
        const agg = await this.prisma.invoice.aggregate({
          where: { ...invWhere, status: 'OVERDUE' },
          _sum: { totalAmount: true },
        });
        const sum = Number(agg._sum.totalAmount || 0);
        return `Gecikmiş faturaların toplam tutarı ${fmtTR(sum)}.`;
      }
      if (
        q.includes('bu ay') &&
        (q.includes('alacak') || q.includes('alacağım'))
      ) {
        const agg = await this.prisma.invoice.aggregate({
          where: {
            ...invWhere,
            status: { in: ['SENT', 'OVERDUE'] },
            dueDate: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { totalAmount: true },
        });
        const sum = Number(agg._sum.totalAmount || 0);
        return `Bu ay vadesi olan bekleyen alacak toplamı ${fmtTR(sum)}.`;
      }
      if (q.includes('bugün') && q.includes('gelir')) {
        const agg = await this.prisma.transaction.aggregate({
          where: {
            ...txWhere,
            type: 'INCOME',
            status: 'PAID',
            date: { gte: startOfDay, lte: endOfDay },
          },
          _sum: { amount: true },
        });
        const sum = Number(agg._sum.amount || 0);
        return `Bugünkü gelir ${fmtTR(sum)}.`;
      }
      if (q.includes('bugün') && q.includes('gider')) {
        const agg = await this.prisma.transaction.aggregate({
          where: {
            ...txWhere,
            type: 'EXPENSE',
            status: 'PAID',
            date: { gte: startOfDay, lte: endOfDay },
          },
          _sum: { amount: true },
        });
        const sum = Number(agg._sum.amount || 0);
        return `Bugünkü gider ${fmtTR(sum)}.`;
      }
      if (q.includes('bu hafta') && q.includes('gelir')) {
        const agg = await this.prisma.transaction.aggregate({
          where: {
            ...txWhere,
            type: 'INCOME',
            status: 'PAID',
            date: { gte: startOfWeek, lte: endOfWeek },
          },
          _sum: { amount: true },
        });
        const sum = Number(agg._sum.amount || 0);
        return `Bu haftaki gelir ${fmtTR(sum)}.`;
      }
      if (q.includes('bu hafta') && q.includes('gider')) {
        const agg = await this.prisma.transaction.aggregate({
          where: {
            ...txWhere,
            type: 'EXPENSE',
            status: 'PAID',
            date: { gte: startOfWeek, lte: endOfWeek },
          },
          _sum: { amount: true },
        });
        const sum = Number(agg._sum.amount || 0);
        return `Bu haftaki gider ${fmtTR(sum)}.`;
      }
      if (q.includes('bu ay') && q.includes('gelir')) {
        const agg = await this.prisma.transaction.aggregate({
          where: {
            ...txWhere,
            type: 'INCOME',
            status: 'PAID',
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        });
        const sum = Number(agg._sum.amount || 0);
        return `Bu ayki gelir ${fmtTR(sum)}.`;
      }
      if (q.includes('bu ay') && q.includes('gider')) {
        const agg = await this.prisma.transaction.aggregate({
          where: {
            ...txWhere,
            type: 'EXPENSE',
            status: 'PAID',
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        });
        const sum = Number(agg._sum.amount || 0);
        return `Bu ayki gider ${fmtTR(sum)}.`;
      }
      return null;
    };

    const pre = await directAnswer();
    if (pre) {
      return { answer: pre };
    }

    const recentTx = await this.prisma.transaction.findMany({
      where: txWhere,
      select: {
        type: true,
        status: true,
        amount: true,
        category: true,
        date: true,
        description: true,
      },
      orderBy: { date: 'desc' },
      take: 50,
    });
    const pendingInvoices = await this.prisma.invoice.findMany({
      where: { ...invWhere, status: { in: ['SENT', 'OVERDUE'] } },
      select: { number: true, totalAmount: true, status: true, dueDate: true },
      orderBy: { dueDate: 'asc' },
      take: 50,
    });

    const qaContext = {
      recentTransactions: recentTx,
      pendingInvoices,
    };

    const prompt = `
      Sen bir finans asistanısın. Soruyu sadece aşağıdaki verilere dayanarak yanıtla.
      Varsayım yapma; bilinmeyeni açıkça belirt. Kısa ve net ol, Türkçe yanıt ver.

      SORU:
      ${data.question}

      BAĞLAM (JSON):
      ${JSON.stringify(qaContext, null, 2)}

      ÇIKTI:
      - Madde madde, uygulanabilir cevaplar üret.
      - Gerekirse tarih ve tutar belirt.
    `;

    try {
      const response = await this.tryGenerateContent(prompt, data.aiModel);
      return { answer: response.text() };
    } catch (error) {
      this.logger.error('Finance QA generation error:', error);
      throw new InternalServerErrorException(
        `Finans AI yanıtı üretilemedi: ${error.message}`,
      );
    }
  }

  async testGemini() {
    if (!this.genAI)
      throw new InternalServerErrorException('GEMINI_API_KEY tanımlanmamış.');
    try {
      const response = await this.tryGenerateContent(
        'Merhaba, bu bir test mesajıdır. Lütfen sadece "Bağlantı başarılı" cevabı ver.',
      );
      return { status: 'success', message: response.text() };
    } catch (error) {
      this.logger.error('Gemini test error:', error);
      return { status: 'error', message: error.message };
    }
  }

  async generateSmartReplies(messages: string[]): Promise<string[]> {
    if (messages.length === 0) return [];

    const prompt = `
      Aşağıdaki konuşma geçmişine dayanarak, son mesaja verilebilecek 3 kısa, profesyonel ve yardımcı yanıt önerisi oluştur.
      Yanıtlar Türkçe olmalı. Sadece yanıtları JSON dizisi olarak döndür. Ek açıklama yapma.
      
      Konuşma Geçmişi:
      ${messages.join('\n')}
      
      Örnek Çıktı Formatı:
      ["Merhaba, size nasıl yardımcı olabilirim?", "Fiyat listemizi iletiyorum.", "Müsait olduğunuzda arayabiliriz."]
    `;

    try {
      const result = await this.tryGenerateContent(prompt);
      const text = String(result.text());

      // Clean up markdown code blocks if present
      const cleanedText = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      try {
        const parsed = JSON.parse(cleanedText);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 3);
        }
      } catch {
        this.logger.warn('Failed to parse smart replies JSON: ' + text);
      }

      // Fallback if parsing fails but text looks like a list
      return text
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .slice(0, 3);
    } catch (error) {
      this.logger.error('Failed to generate smart replies:', error);
      return [];
    }
  }
}
