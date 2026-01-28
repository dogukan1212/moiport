'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { 
  Sparkles, 
  Search, 
  Globe, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle,
  BarChart3,
  PenTool,
  MessageSquare,
  Instagram,
  Zap,
  Layout,
  Music,
  Video,
  FileText,
  User,
  Download,
  Save,
  Trash2,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface GeneratedContent {
  id: string;
  type: string;
  topic: string;
  content: string;
  createdAt: Date;
}

const modelLabelMap: Record<string, string> = {
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
  'gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
  'gemini-3-flash-preview': 'Gemini 3 Flash Preview',
  'gemini-pro': 'Gemini Pro'
};

export default function AIContentPage() {
  // Sector Analysis State
  const [sector, setSector] = useState('');
  const [customerUrl, setCustomerUrl] = useState('');
  const [customerIg, setCustomerIg] = useState('');
  const [deepSearch, setDeepSearch] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // Content Generation State
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('Instagram Post');
  const [tone, setTone] = useState('Profesyonel ve İlgi Çekici');
  const [generationLoading, setGenerationLoading] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);
  const [selectedContentIds, setSelectedContentIds] = useState<string[]>([]);
  
  // Customer State for Saving
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {
      console.error('Müşteriler yüklenemedi:', error);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    try {
      const response = await api.get('/ai/test-connection');
      if (response.data.status === 'success') {
        alert('Bağlantı Başarılı: ' + response.data.message);
      } else {
        alert('Bağlantı Hatası: ' + response.data.message);
      }
    } catch (error: any) {
      alert('Bağlantı Testi Başarısız: ' + (error.response?.data?.message || error.message));
    } finally {
      setTestLoading(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector) return;
    
    setAnalysisLoading(true);
    setAnalysisResult(null);
    try {
      const response = await api.post('/ai/analyze-sector', { 
        sector,
        customerUrl,
        customerIg,
        deepSearch
      });
      setAnalysisResult(response.data);
    } catch (error: any) {
      console.error('Analiz hatası:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Sektör analizi yapılamadı.';
      alert(`Hata: ${errorMessage}`);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!sector) {
      alert('Lütfen önce sol taraftaki "Sektör / İş Kolu" alanını doldurun.');
      return;
    }
    
    // If topic is empty, we can provide a default one to make it easier for the user
    const finalTopic = topic || 'Genel tanıtım ve marka bilinirliği';
    
    setPromptLoading(true);
    try {
      const response = await api.post('/ai/generate-prompt', { 
        sector, 
        type, 
        topic: finalTopic,
        context: analysisResult?.report,
        aiModel // Model seçimini gönderiyoruz
      });
      setTopic(response.data.prompt);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Prompt oluşturulamadı.';
      alert(`Hata: ${errorMessage}`);
    } finally {
      setPromptLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sector) {
      alert('Lütfen önce sol taraftaki "Sektör / İş Kolu" alanını doldurun.');
      return;
    }
    
    if (!topic) {
      alert('Lütfen içerik için bir "Konu" yazın veya otomatik prompt oluşturun.');
      return;
    }
    
    setGenerationLoading(true);
    try {
      const response = await api.post('/ai/generate-content', { 
        type, 
        topic,
        sector,
        customerUrl,
        customerIg,
        tone,
        context: analysisResult?.report,
        aiModel // Model seçimini gönderiyoruz
      });
      
      const newContent: GeneratedContent = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        topic,
        content: response.data.content,
        createdAt: new Date()
      };
      
      setGeneratedContents(prev => [newContent, ...prev]);
    } catch (error: any) {
      console.error('Üretim hatası:', error);
      const errorMessage = error.response?.data?.message || error.message || 'İçerik üretilemedi.';
      alert(`Hata: ${errorMessage}`);
    } finally {
      setGenerationLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('İçerik kopyalandı!');
  };

  const toggleSelection = (id: string) => {
    setSelectedContentIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const deleteContent = (id: string) => {
    setGeneratedContents(prev => prev.filter(c => c.id !== id));
    setSelectedContentIds(prev => prev.filter(i => i !== id));
  };

  const exportToPDF = async () => {
    if (selectedContentIds.length === 0) {
      alert('Lütfen dışa aktarmak için en az bir içerik seçin.');
      return;
    }

    const doc = new jsPDF();
    let yPos = 20;

    const selectedContents = generatedContents.filter(c => selectedContentIds.includes(c.id));

    doc.setFontSize(20);
    doc.text('Üretilen Sosyal Medya İçerikleri', 20, yPos);
    yPos += 15;

    selectedContents.forEach((item, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 255);
      doc.text(`${index + 1}. ${item.type}`, 20, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Konu: ${item.topic}`, 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      const splitText = doc.splitTextToSize(item.content, 170);
      doc.text(splitText, 20, yPos);
      yPos += (splitText.length * 6) + 15;
    });

    doc.save('sosyal-medya-icerikleri.pdf');
  };

  const saveToCustomer = async () => {
    if (!selectedCustomerId) {
      alert('Lütfen bir müşteri seçin.');
      return;
    }
    if (selectedContentIds.length === 0) {
      alert('Lütfen kaydedilecek içerikleri seçin.');
      return;
    }

    setIsSaving(true);
    try {
      const selectedContents = generatedContents.filter(c => selectedContentIds.includes(c.id));
      
      for (const item of selectedContents) {
        await api.post('/social-media', {
          content: item.content,
          type: item.type,
          customerId: selectedCustomerId
        });
      }

      alert('İçerikler başarıyla müşteriye kaydedildi!');
      setSelectedContentIds([]);
    } catch (error: any) {
      console.error('Kaydetme hatası:', error);
      alert('İçerikler kaydedilemedi: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const activeModelLabel = modelLabelMap[aiModel] || aiModel;
  const totalGenerated = generatedContents.length;
  const selectedCount = selectedContentIds.length;

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <span>AI İçerik Aracı</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-300 text-sm mt-2">
            Sektör analizi yapın, rakiplerinizi tanıyın ve yapay zeka ile profesyonel içerikler üretin.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleTestConnection}
          disabled={testLoading}
          className="text-xs"
        >
          {testLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Zap className="h-3 w-3 mr-2" />}
          API Bağlantısını Test Et
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.16em] mb-1">
            Toplam Üretilen İçerik
          </p>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {totalGenerated || '0'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Bu oturumda AI ile üretilen içerik adedi.
          </p>
        </Card>
        <Card className="p-4 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.16em] mb-1">
            Değerlendirme İçin Seçilenler
          </p>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {selectedCount || '0'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            PDF aktarımı veya müşteri kaydı için seçili içerikler.
          </p>
        </Card>
        <Card className="p-4 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.16em] mb-1">
            Aktif AI Modeli
          </p>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {activeModelLabel}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Model seçimine göre hız ve içerik derinliği değişir.
          </p>
        </Card>
        <Card className="p-4 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.16em] mb-1">
            Derin Pazar Araştırması
          </p>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {deepSearch ? 'Açık' : 'Kapalı'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Google araması ve web site incelemesi {deepSearch ? 'kullanılıyor.' : 'kullanılmıyor.'}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-50 mb-1">
                Pazar Araştırması
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                Hedef pazarınızdaki trend ve davranışları analiz ederek içeriği konumlandırır.
              </p>
              <div className="space-y-1">
                {['Trend Analizi', 'Hedef Kitle Segmentasyonu', 'Lokasyon Bazlı İçerik'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 p-2">
              <Search className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-50 mb-1">
                Rakip Analizi
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                Rakip içeriklerini inceleyerek boşlukları ve fırsatları ortaya çıkarır.
              </p>
              <div className="space-y-1">
                {['İçerik Boşluğu Analizi', 'Rakip Performans Takibi', 'SEO Strateji Kıyaslama'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-5 bg-white/90 border-slate-200/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 p-2">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-50 mb-1">
                Akıllı İçerik Stratejisi
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                Marka tonunuza uygun tutarlı içerikler üretip kanallar arasında ölçekler.
              </p>
              <div className="space-y-1">
                {['Marka Tona Uyumu', 'Otomatik Yayın Takvimi', 'Performans Odaklı Taslaklar'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
        {/* Left Column: Context & Analysis (4/12) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-50">
              <Globe className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              1. Bağlam ve Sektör
            </h3>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Sektör / İş Kolu</label>
                <input
                  type="text"
                  placeholder="Örn: Butik Kahveci, Yazılım Ajansı"
                  className="w-full px-4 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-sm bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Müşteri Web Sitesi (Opsiyonel)</label>
                <div className="relative">
                  <Layout className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="url"
                    placeholder="https://site.com"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                    value={customerUrl}
                    onChange={(e) => setCustomerUrl(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Müşteri Instagram (Opsiyonel)</label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="@kullaniciadi"
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                    value={customerIg}
                    onChange={(e) => setCustomerIg(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  AI Model Seçimi
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Hızlı)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Zeki)</option>
                  <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Yeni/Deneysel)</option>
                  <option value="gemini-3-flash-preview">Gemini 3 Flash Preview (En Yeni/Ücretsiz)</option>
                  <option value="gemini-pro">Gemini Pro (Klasik)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-md border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="deepSearch"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  checked={deepSearch}
                  onChange={(e) => setDeepSearch(e.target.checked)}
                />
                <label htmlFor="deepSearch" className="text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                  Google'da Ara & Web Sitelerini İncele
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 shadow-sm"
                disabled={analysisLoading}
              >
                {analysisLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {deepSearch ? 'İnternet Taranıyor...' : 'Analiz Yapılıyor...'}
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Pazar ve Rakip Analizi Yap
                  </>
                )}
              </Button>
            </form>

            {analysisResult && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100 max-h-[400px] overflow-y-auto dark:bg-slate-900 dark:border-slate-800">
                <h4 className="font-bold text-emerald-900 dark:text-slate-50 text-sm flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Strateji Raporu
                </h4>
                <div className="text-xs text-emerald-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {analysisResult.report}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Content Generation (8/12) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-slate-50">
              <PenTool className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              2. Akıllı İçerik Üretici
            </h3>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">İçerik Türü</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <optgroup label="Sosyal Medya">
                      <option>Instagram Post</option>
                      <option>Instagram Reels (Senaryolu)</option>
                      <option>Instagram Story Seti (5'li)</option>
                      <option>LinkedIn Makalesi</option>
                      <option>Twitter/X Flood</option>
                    </optgroup>
                    <optgroup label="Reklam & Satış">
                      <option>Google Reklam Metni</option>
                      <option>Meta Reklam Kreatif Metni</option>
                      <option>Satış Sayfası (Landing Page) Metni</option>
                    </optgroup>
                    <optgroup label="İçerik Pazarlama">
                      <option>Blog Başlığı ve Taslağı</option>
                      <option>E-Bülten İçeriği</option>
                      <option>YouTube Video Senaryosu</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Dil Tonu</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-sm bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  >
                    <option>Profesyonel ve İlgi Çekici</option>
                    <option>Samimi ve Eğlenceli</option>
                    <option>Lüks ve Seçkin</option>
                    <option>Minimalist ve Modern</option>
                    <option>Heyecan Verici ve Dinamik</option>
                    <option>Otoriter ve Bilgi Verici</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Konu / Detaylar / Prompt</label>
                  <button
                    type="button"
                    onClick={handleGeneratePrompt}
                    className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1 font-medium disabled:opacity-70"
                    disabled={promptLoading}
                  >
                    {promptLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                    Otomatik Prompt Oluştur
                  </button>
                </div>
                <textarea
                  placeholder="İçeriğin ne hakkında olacağını yazın veya 'Otomatik Prompt' butonunu kullanın..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-emerald-500 text-sm min-h-[120px] bg-white text-slate-900 placeholder:text-slate-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  disabled={generationLoading}
                >
                  {generationLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-5 w-5 mr-2" />
                  )}
                  İçeriği Sihirle Oluştur
                </Button>
              </div>
            </form>

            {generatedContents.length > 0 && (
              <div className="mt-12 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
                  <h4 className="font-bold text-slate-900 dark:text-slate-50 text-lg flex items-center gap-2">
                    <Check className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                    Üretilen İçerik Havuzu ({generatedContents.length})
                  </h4>
                  
                  <div className="flex flex-wrap gap-2">
                    <select 
                      className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                      <option value="">Müşteri Seçin...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      onClick={saveToCustomer}
                      disabled={isSaving || selectedContentIds.length === 0}
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Seçilenleri Kaydet
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-slate-600"
                      onClick={exportToPDF}
                      disabled={selectedContentIds.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF'e Aktar
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {generatedContents.map((item) => (
                    <Card key={item.id} className={cn(
                      "p-0 overflow-hidden transition-all duration-300 border-2",
                      selectedContentIds.includes(item.id) ? "border-emerald-500 shadow-md dark:border-emerald-400" : "border-slate-100 dark:border-slate-800"
                    )}>
                      <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center dark:bg-slate-950/60 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 dark:border-slate-600"
                            checked={selectedContentIds.includes(item.id)}
                            onChange={() => toggleSelection(item.id)}
                          />
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded dark:bg-emerald-500/10 dark:text-emerald-300">
                              {item.type}
                            </span>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {new Date(item.createdAt).toLocaleTimeString('tr-TR')} - {item.topic.substring(0, 50)}...
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                            onClick={() => copyToClipboard(item.content)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                            onClick={() => deleteContent(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="prose prose-sm max-w-none text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed text-sm">
                          {item.content}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {generatedContents.length === 0 && !generationLoading && (
              <div className="mt-8 py-20 text-center border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/40 dark:border-slate-800">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-full shadow-sm w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                </div>
                <p className="text-slate-400 dark:text-slate-300 font-medium">Stratejik içeriğiniz burada canlanacak.</p>
                <p className="text-slate-300 dark:text-slate-500 text-xs mt-1">Sektör analizi yapmak sonucu daha kaliteli hale getirir.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
