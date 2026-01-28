"use client";

import { LandingHeader, LandingFooter } from "@/components/landing-layout";

export default function CookiesPage() {
  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />
      <main className="pt-32 pb-20 lg:pt-40">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <section className="mb-10 lg:mb-12">
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-xs font-bold">
                <span>Çerez (Cookie) Politikası</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Çerezleri nasıl kullanıyoruz?
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl">
                MOI Port web arayüzünde, hizmetlerimizi güvenli, hızlı ve kişiselleştirilmiş
                bir şekilde sunabilmek için çerezler ve benzeri teknolojiler
                kullanılır. Bu metin, hangi çerezleri neden kullandığımızı ve
                tercihlerinizi nasıl yönetebileceğinizi açıklar.
              </p>
            </div>
          </section>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            <section className="space-y-8">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">Çerez nedir?</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Çerezler; bir internet sitesini ziyaret ettiğinizde tarayıcınız
                  üzerinden cihazınıza kaydedilen küçük metin dosyalarıdır.
                  Çerezler sayesinde, site tercihlerinizi hatırlayabilir,
                  oturumunuzu sürdürebilir ve site kullanımınızı analiz ederek
                  deneyiminizi geliştirebiliriz.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Hangi tür çerezleri kullanıyoruz?
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  MOI Port üzerinde kullanılan çerez türleri, fonksiyonlarına
                  göre aşağıdaki başlıklarda toplanabilir. Kullanılan spesifik
                  çerezler; modüllere, oturum tipine ve entegrasyonlara göre
                  değişebilir.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Zorunlu çerezler
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Oturum açma, güvenlik, form işlemleri ve sayfalar arasında
                      gezinme için teknik olarak gerekli çerezlerdir. Bu
                      çerezler olmadan MOI Port düzgün çalışamaz.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Performans ve analitik çerezler
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Ziyaret sayıları, sayfada kalma süresi ve tıklama davranışları
                      gibi kullanım istatistiklerini anonim olarak toplar; ürün
                      performansını ve kullanılabilirliğini geliştirmemize yardımcı
                      olur.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      İşlevsel çerezler
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Dil seçimi, tema tercihleri, son kullanılan modüller gibi
                      kişiselleştirme ayarlarını hatırlamak için kullanılır.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Pazarlama ve üçüncü taraf çerezleri
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Kullanılması halinde; kampanya iletişimi, ölçümleme ve
                      yeniden hedefleme amaçlı üçüncü taraf servisler tarafından
                      yerleştirilen çerezlerdir. Bu çerezler için açık rızanız
                      talep edilir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Çerezlerin kullanım amaçları
                </h2>
                <ul className="text-sm text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li>Oturum açmış kullanıcıların güvenli şekilde doğrulanması</li>
                  <li>Yetki ve rol bazlı erişim kontrollerinin uygulanması</li>
                  <li>Hata takibi, performans ölçümü ve ürün geliştirme</li>
                  <li>Kullanıcı deneyiminin kişiselleştirilmesi</li>
                  <li>
                    Tercih ettiğiniz dil ve görüntüleme ayarlarının hatırlanması
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Çerez tercihlerinizi nasıl yönetebilirsiniz?
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Çerez tercihlerinizi hem MOI Port arayüzü üzerinden, hem de
                  tarayıcı ayarlarınızdan yönetebilirsiniz:
                </p>
                <ul className="text-sm text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li>
                    Tarayıcınızın ayarları üzerinden tüm çerezleri engelleyebilir
                    veya belirli siteler için izin verebilirsiniz.
                  </li>
                  <li>
                    Mevcut çerezleri dilediğiniz zaman silebilir, yeni çerez
                    yerleştirilmesini engelleyebilirsiniz.
                  </li>
                  <li>
                    Çerez tercihlerinizi değiştirdiğinizde, MOI Port deneyiminizde
                    bazı bozulmalar veya kısıtlamalar oluşabileceğini göz önünde
                    bulundurmalısınız.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Zorunlu çerezler ve hizmetin kullanımı
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Güvenlik, kimlik doğrulama ve temel oturum yönetimi için
                  kullanılan bazı çerezler zorunlu niteliktedir. Bu çerezlerin
                  devre dışı bırakılması, MOI Port&apos;a giriş yapmanızı veya
                  belirli temel fonksiyonları kullanmanızı engelleyebilir.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Kişisel verileriniz ve KVKK
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Çerezler aracılığıyla elde edilen veriler, 6698 sayılı Kişisel
                  Verilerin Korunması Kanunu ve ilgili mevzuata uygun olarak
                  işlenir. Verilerinizin işlenme amaçları, hukuki sebepleri ve
                  haklarınız hakkında detaylı bilgi için Gizlilik Politikası
                  sayfamıza göz atabilirsiniz.
                </p>
              </div>
            </section>

            <aside className="space-y-4 lg:pl-6 lg:border-l lg:border-white/5">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2">
                  Özet bilgi
                </h3>
                <ul className="text-xs text-zinc-400 space-y-1.5">
                  <li>• Zorunlu çerezler hizmetin çalışması için gereklidir.</li>
                  <li>• Diğer çerezler için tercihlerinizi yönetebilirsiniz.</li>
                  <li>
                    • Tercih değişiklikleri deneyiminizi etkileyebilir
                    (performans, kişiselleştirme vb.).
                  </li>
                </ul>
              </div>
              <div className="p-4 rounded-2xl bg-[#00e676]/10 border border-[#00e676]/30">
                <h3 className="text-sm font-bold text-white mb-2">
                  İletişim ve talepler
                </h3>
                <p className="text-xs text-zinc-100 leading-relaxed">
                  Çerezlere ilişkin sorularınız veya talepleriniz için{" "}
                  <span className="font-semibold">destek@moiport.com</span>{" "}
                  adresine &quot;Çerez Politikası&quot; konu başlığıyla e-posta
                  gönderebilirsiniz.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
