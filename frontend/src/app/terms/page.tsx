"use client";

import { LandingHeader, LandingFooter } from "@/components/landing-layout";

export default function TermsPage() {
  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />
      <main className="pt-32 pb-20 lg:pt-40">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <section className="mb-10 lg:mb-12">
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-xs font-bold">
                <span>Kullanım Şartları ve Hizmet Sözleşmesi</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                MOI Port kullanım koşulları
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl">
                MOI Port Agency OS yazılımını ve ilişkili servisleri kullanarak,
                bu Kullanım Şartları&apos;nı ve ilgili gizlilik/çerez politikalarını
                kabul etmiş olursunuz. Hesap açmadan önce bu metni dikkatle
                okumanızı öneririz.
              </p>
            </div>
          </section>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            <section className="space-y-8">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">Tanımlar</h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Bu metinde geçen;
                </p>
                <ul className="text-sm text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li>
                    <span className="font-semibold">MOI Port</span>: moiport.com
                    alan adı altında sunulan SaaS tabanlı ajans işletim sistemi
                    yazılımını,
                  </li>
                  <li>
                    <span className="font-semibold">Kullanıcı</span>: MOI Port
                    üzerinde hesap oluşturan veya davet edilen gerçek kişiyi,
                  </li>
                  <li>
                    <span className="font-semibold">Müşteri</span>: MOI Port
                    lisansını satın alan tüzel kişiyi (ajans, şirket vb.),
                  </li>
                  <li>
                    <span className="font-semibold">Hizmet</span>: MOI Port
                    platformu üzerinden sunulan tüm modül ve fonksiyonları
                    ifade eder.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Hizmet kapsamı ve sözleşmenin kurulması
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  MOI Port; proje yönetimi, CRM, finans, insan kaynakları ve
                  benzeri operasyonel süreçleri tek bir panel üzerinden
                  yönetebilmeniz için tasarlanmış bulut tabanlı bir yazılımdır.
                  Deneme hesabı açmanız veya abonelik satın almanız hâlinde,
                  elektronik ortamda bu şartları kabul etmiş sayılırsınız.
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Platforma erişim; yürürlükteki mevzuat, işbu şartlar ve
                  taraflar arasında akdedilen ticari sözleşme hükümleri
                  çerçevesinde sağlanır. Ajans ve çalışanları ile ajansın
                  müşterileri için farklı yetki seviyeleri tanımlanabilir.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Hesap oluşturma ve kullanıcı sorumlulukları
                </h2>
                <ul className="text-sm text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li>
                    Hesap bilgilerinizi (e-posta, şifre vb.) gizli tutmakla
                    yükümlüsünüz; hesabınız üzerinden yapılan tüm işlemlerden
                    siz sorumlusunuz.
                  </li>
                  <li>
                    Şifrenizi üçüncü kişilerle paylaşmamalı, yetkisiz kullanım
                    şüphesi halinde derhal bizimle iletişime geçmelisiniz.
                  </li>
                  <li>
                    Sisteme girdiğiniz tüm içerik ve verilerin mevzuata uygun
                    olmasından siz sorumlusunuz; MOI Port yalnızca servis
                    sağlayıcı konumundadır.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Kullanım kuralları ve yasaklar
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  MOI Port aşağıdaki amaçlarla kullanılamaz:
                </p>
                <ul className="text-sm text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li>
                    Yürürlükteki mevzuata, kamu düzenine veya genel ahlaka aykırı
                    faaliyetler yürütmek,
                  </li>
                  <li>
                    Başka kullanıcıların hesaplarına veya sisteme izinsiz
                    erişmeye çalışmak, güvenliği test etmeye teşebbüs etmek,
                  </li>
                  <li>
                    Hizmeti tersine mühendislik, kaynak koda dönüştürme, kopyalama
                    veya yetkisiz dağıtım amacıyla kullanmak,
                  </li>
                  <li>
                    Zararlı yazılım, spam veya yetkisiz toplu e-posta gönderimi
                    için sistemi kullanmak.
                  </li>
                </ul>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Bu kurallara aykırılık hâlinde hesabınız askıya alınabilir
                  veya sonlandırılabilir; hukuki haklarımız saklıdır.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Ücretlendirme, faturalandırma ve yenileme
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  MOI Port; abonelik modeliyle lisanslanan, bulut tabanlı bir
                  hizmettir. Geçerli paket fiyatları, ödeme dönemleri ve tahsilat
                  yöntemleri sözleşme ve kontrol panelinde ayrı olarak
                  açıklanır.
                </p>
                <ul className="text-sm text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li>
                    Faturalar, sözleşmede belirtilen para birimi ve dönemlerde
                    elektronik ortamda düzenlenir.
                  </li>
                  <li>
                    Ödeme gecikmesi hâlinde, hizmete erişimin durdurulması veya
                    kısıtlanması mümkündür.
                  </li>
                  <li>
                    Abonelik yenilemeleri, sözleşmede aksi belirtilmedikçe
                    otomatik olarak gerçekleştirilebilir; iptal talepleri
                    dönem sonundan önce iletilmelidir.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Fikri mülkiyet hakları
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  MOI Port&apos;a ilişkin tüm yazılım kodları, tasarımlar,
                  logolar, metinler ve diğer içerikler üzerindeki her türlü
                  fikri ve sınai hak MOI Port veya lisans aldığı üçüncü
                  kişilere aittir.
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Kullanıcılara verilen lisans; münhasır olmayan, devredilemez
                  ve alt lisans verilemeyen sınırlı bir kullanım hakkı olup,
                  hiçbir şekilde mülkiyet devri anlamına gelmez.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Sorumluluğun sınırlandırılması
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  MOI Port, makul teknik ve idari tedbirleri almakla birlikte,
                  kesintisiz ve hatasız hizmet sunulacağına dair mutlak bir
                  garanti vermez. Bakım çalışmaları, altyapı sağlayıcılarındaki
                  kesintiler veya mücbir sebep halleri nedeniyle geçici
                  erişim sorunları yaşanabilir.
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Kanunun zorunlu kıldığı haller saklı kalmak üzere; dolaylı
                  zararlar, kar kaybı, veri kaybı veya iş kesintisi gibi
                  sonuçlardan doğan sorumluluğumuz sınırlıdır.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Uygulanacak hukuk ve yetkili mahkeme
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  İşbu Kullanım Şartları, Türkiye Cumhuriyeti kanunlarına tabi
                  olup; uyuşmazlıkların çözümünde, yetkili tüketici mevzuatı
                  hükümleri saklı kalmak kaydıyla İstanbul (Anadolu) mahkemeleri
                  ve icra daireleri yetkilidir.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Şartlarda değişiklik ve yürürlük
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  MOI Port, işbu şartları mevzuat değişiklikleri veya hizmetteki
                  güncellemeler doğrultusunda tek taraflı olarak güncelleyebilir.
                  Güncel metin her zaman bu sayfada yayınlanır ve yayın
                  tarihinde yürürlüğe girer.
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Platformu kullanmaya devam etmeniz, güncellenen şartları da
                  kabul ettiğiniz anlamına gelir. Her zaman en güncel sürümü
                  buradan takip edebilirsiniz.
                </p>
              </div>
            </section>

            <aside className="space-y-4 lg:pl-6 lg:border-l lg:border-white/5">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2">
                  Kısaca bu sayfada ne var?
                </h3>
                <ul className="text-xs text-zinc-400 space-y-1.5">
                  <li>• Hizmetin kapsamı ve sözleşmenin tarafları</li>
                  <li>• Hesap sorumluluklarınız ve kullanım kuralları</li>
                  <li>• Ücretlendirme ve faturalandırma esasları</li>
                  <li>• Fikri mülkiyet haklarının korunması</li>
                  <li>• Sorumluluğun sınırlandırılması ve yetkili mahkeme</li>
                </ul>
              </div>
              <div className="p-4 rounded-2xl bg-[#00e676]/10 border border-[#00e676]/30">
                <h3 className="text-sm font-bold text-white mb-2">
                  Soru ve talepler
                </h3>
                <p className="text-xs text-zinc-100 leading-relaxed">
                  Bu şartlara ilişkin sorularınız veya kurumsal sözleşme
                  talepleriniz için{" "}
                  <span className="font-semibold">destek@moiport.com</span>{" "}
                  adresine &quot;Kullanım Şartları&quot; konu başlığıyla
                  e-posta gönderebilirsiniz.
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
