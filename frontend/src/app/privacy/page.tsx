"use client";

import { LandingHeader, LandingFooter } from "@/components/landing-layout";

export default function PrivacyPage() {
  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />
      <main className="pt-32 pb-20 lg:pt-40">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <section className="mb-10 lg:mb-12">
            <div className="flex flex-col gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e676]/10 text-[#00e676] text-xs font-bold">
                <span>Gizlilik Politikası</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                Kişisel verilerinizi nasıl koruyoruz?
              </h1>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl">
                MOI Port olarak, kişisel verilerinizi KVKK ve ilgili mevzuata
                uygun şekilde işler, saklar ve koruruz. Bu metin, hangi
                verileri neden topladığımızı ve haklarınızı açık bir dille
                anlatmak için hazırlanmıştır.
              </p>
            </div>
          </section>

          <section className="mb-10 grid gap-6 md:grid-cols-3">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                Veri Sorumlusu
              </div>
              <p className="text-sm text-zinc-300">
                MOI Port Agency OS (\"MOI Port\"), moiport.com alan adı ve
                bağlı dijital ürünlerin işletmecisidir.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                Kapsam
              </div>
              <p className="text-sm text-zinc-300">
                Bu politika, MOI Port web arayüzü, paneli ve ilişkili tüm
                çevrimiçi servisler için geçerlidir.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                İletişim
              </div>
              <p className="text-sm text-zinc-300">
                Gizlilikle ilgili her türlü soru için{" "}
                <span className="font-semibold text-white">
                  destek@moiport.com
                </span>{" "}
                adresine ulaşabilirsiniz.
              </p>
            </div>
          </section>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <section className="space-y-8">
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Hangi verileri topluyoruz?
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  MOI Port&apos;u kullanırken aşağıda belirtilen veri
                  kategorileri işlenebilir. Toplanan veri seti, kullandığınız
                  modüllere ve sözleşmesel ilişkiye göre değişebilir.
                </p>
                <ul className="text-sm text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li>Kimlik &amp; iletişim bilgileri (ad, soyad, e-posta vb.)</li>
                  <li>Hesap ve oturum bilgileri (giriş kayıtları, rol bilgisi)</li>
                  <li>Fatura ve ödeme bilgileri (fatura adresi, şirket ünvanı)</li>
                  <li>Kullanım verileri (oturum süresi, tıklama ve gezinme kayıtları)</li>
                  <li>Destek talepleri ve iletişim geçmişi</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Verileri hangi amaçlarla kullanıyoruz?
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Kişisel verilerinizi, meşru menfaat ve sözleşmenin ifası
                  çerçevesinde aşağıdaki amaçlarla işleriz:
                </p>
                <ul className="text-sm text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li>Hizmet sözleşmesinin kurulması ve ifası</li>
                  <li>Hesap yönetimi, kullanıcı doğrulama ve güvenlik</li>
                  <li>Faturalandırma ve ödeme süreçlerinin yürütülmesi</li>
                  <li>Ürün geliştirme, hata tespiti ve performans analizi</li>
                  <li>Destek taleplerinin yanıtlanması ve müşteri memnuniyeti</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  Verilerin paylaşımı ve saklama süreleri
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Verileriniz, yalnızca hizmeti sunmak için zorunlu olduğu
                  ölçüde ve yasal yükümlülükler çerçevesinde üçüncü taraf
                  hizmet sağlayıcılarla paylaşılabilir.
                </p>
                <ul className="text-sm text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li>Bulut altyapı sağlayıcıları ve barındırma hizmetleri</li>
                  <li>Ödeme altyapısı sağlayıcıları ve bankalar</li>
                  <li>Gerekmesi halinde yasal merciler ve düzenleyici kurumlar</li>
                </ul>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Kişisel veriler, ilgili mevzuatta öngörülen veya işleme
                  amacının gerektirdiği süre boyunca saklanır; süre sonunda
                  anonimleştirilir veya silinir.
                </p>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">
                  KVKK kapsamındaki haklarınız
                </h2>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında,
                  veri sahibi olarak aşağıdaki haklara sahipsiniz:
                </p>
                <ul className="text-sm text-zinc-300 space-y-1.5 list-disc list-inside">
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>İşlenmişse buna ilişkin bilgi talep etme</li>
                  <li>İşleme amacını ve bu amaçlara uygun kullanılıp kullanılmadığını öğrenme</li>
                  <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
                  <li>Eksik veya yanlış işlenmişse düzeltilmesini talep etme</li>
                  <li>Mevzuat çerçevesinde silinmesini veya yok edilmesini isteme</li>
                  <li>Bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini talep etme</li>
                  <li>Otomatik sistemlerce analiz edilen sonuçlara itiraz etme</li>
                </ul>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Haklarınızı kullanmak için{" "}
                  <span className="font-semibold text-white">
                    destek@moiport.com
                  </span>{" "}
                  adresine &quot;KVKK Bilgi Talebi&quot; konu başlığıyla
                  başvurabilirsiniz.
                </p>
              </div>
            </section>

            <aside className="space-y-4 lg:pl-6 lg:border-l lg:border-white/5">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <h3 className="text-sm font-bold text-white mb-2">
                  Özet başlıklar
                </h3>
                <ul className="text-xs text-zinc-400 space-y-1.5">
                  <li>• Hangi verileri topladığımız</li>
                  <li>• Verilerin hangi amaçla işlendiği</li>
                  <li>• Kimlerle paylaşılabileceği</li>
                  <li>• Saklama süreleri ve güvenlik önlemleri</li>
                  <li>• KVKK kapsamındaki haklarınız</li>
                </ul>
              </div>
              <div className="p-4 rounded-2xl bg-[#00e676]/10 border border-[#00e676]/30">
                <h3 className="text-sm font-bold text-white mb-2">
                  Güvenlik yaklaşımımız
                </h3>
                <p className="text-xs text-zinc-100 leading-relaxed">
                  Erişim kontrolleri, rol bazlı yetkilendirme ve şifreli
                  iletişim (HTTPS) standartlarını uyguluyor; üretim
                  altyapısına erişimi minimum yetki prensibiyle
                  sınırlandırıyoruz.
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
