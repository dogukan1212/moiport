"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Plus, Edit2, Trash2, Save, Upload, CheckCircle2 } from "lucide-react";
import jsPDF from "jspdf";
import { renderTurkishText } from "@/lib/pdf-helper";
import { useAuth } from "@/hooks/use-auth";

type Employee = {
  id: string;
  name: string;
  email?: string;
  role: string;
  salary?: number;
  startDate?: string;
  phone?: string;
};

type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};
type Template = {
  id: string;
  name: string;
  content: string;
  variables: string[];
};

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "is-sozlesmesi-gelismis",
    name: "Gelişmiş Belirsiz Süreli İş Sözleşmesi",
    variables: [
      "firma_adi",
      "personel_adi",
      "tc_kimlik_no",
      "pozisyon",
      "baslangic_tarihi",
      "maas_tutari",
      "calisma_yeri",
      "haftalik_calisma_saat",
      "deneme_suresi_ay",
      "gizlilik_suresi_yil",
      "rekabet_suresi_ay",
      "cezai_sart_tutari",
      "ekipman_listesi",
      "yan_haklar",
      "prim_politikasi",
      "izin_politikasi",
      "performans_periyot",
      "ic_politika_url",
      "sosyal_medya_politikasi_url",
      "yetkili_mahkeme"
    ],
    content:
      "1. Taraflar ve Konu: {firma_adi} (İşveren) ile {personel_adi} (T.C.: {tc_kimlik_no}) arasında, {pozisyon} pozisyonunda {baslangic_tarihi} tarihinde başlamak üzere belirsiz süreli iş akdi kurulmuştur.\n\n" +
      "2. Çalışma Yeri ve Modeli: Esas çalışma yeri {calisma_yeri} olup işin niteliği gereği uzaktan/hibrit çalışma, müşteri sahası veya farklı lokasyonlarda görev verilebilir. Personel, işverenin makul talimatlarına uymayı kabul eder.\n\n" +
      "3. Çalışma Süresi: Haftalık çalışma süresi {haftalik_calisma_saat} saat olup, fazla mesai 4857 sayılı Kanun hükümlerine göre ücretlendirilir. Esnek çalışma uygulamalarında, personel iş planına ve teslim tarihine riayet eder.\n\n" +
      "4. Ücret ve Ödeme: Aylık brüt ücret {maas_tutari} TL’dir. Ücret, mevzuat uyarınca vergiler ve yasal kesintilere tabidir. Prim ve yan haklar: {yan_haklar}. Prim uygulamaları: {prim_politikasi}. Avans ödemeleri, işveren onayı ile yapılır ve bordroda mahsup edilir.\n\n" +
      "5. Deneme Süresi ve Fesih: Deneme süresi {deneme_suresi_ay} ay olup bu sürede taraflar bildirimsiz fesih hakkına sahiptir. Deneme sonrası ihbar süreleri kıdeme göre 4857 sayılı Kanun md. 17 uyarınca: 6 aydan az 2 hafta; 6 ay–1,5 yıl 4 hafta; 1,5–3 yıl 6 hafta; 3 yıl ve üzeri 8 hafta. 4857 sayılı Kanun’un haklı nedenle derhal fesih halleri saklıdır.\n\n" +
      "6. Gizlilik ve KVKK: Personel, işverenin ticari sırları, müşteri bilgileri ve kişisel verilerini gizli tutar; yalnızca iş amacıyla ve mevzuata uygun kullanır. Gizlilik yükümlülüğü iş akdinin sona ermesinden sonra {gizlilik_suresi_yil} yıl devam eder. KVKK kapsamındaki aydınlatma metinleri ve politika dokümanlarına uymak zorundadır.\n\n" +
      "7. Fikri ve Sınai Haklar: Personel tarafından işbu sözleşme kapsamında üretilen tüm eser ve çıktılara ilişkin mali haklar işverene aittir. Personel, işverenin talebi üzerine devir ve tescil işlemlerinde gereken desteği sağlayacağını kabul eder.\n\n" +
      "8. Rekabet Yasağı ve Müşteri Kaçırma: Personel, iş akdi süresince ve sona ermesinden itibaren {rekabet_suresi_ay} ay süreyle işverenin faaliyet alanında rekabet etmeyecek, işverenin müşterilerini ve çalışanlarını ayartmayacaktır. İhlal halinde {cezai_sart_tutari} TL cezai şartı ödemeyi kabul eder.\n\n" +
      "9. Disiplin ve Uygunsuzluk: İşyerine ve iç politikalara aykırı davranışlar (geç kalma, devamsızlık, gizlilik ihlali, uygunsuz içerik paylaşımları) disiplin hükümlerine tabidir. Politika ve talimatlar: {ic_politika_url}, sosyal medya politikası: {sosyal_medya_politikasi_url}.\n\n" +
      "10. Ekipman ve İade: Personel, kendisine teslim edilen ekipmanları ( {ekipman_listesi} ) özenle kullanır; iade etmediği veya zarara uğrattığı ekipman bedelleri ücretinden mahsup edilebilir.\n\n" +
      "11. Performans ve Raporlama: Performans değerlendirme periyodu {performans_periyot} olup, hedef ve teslimatlar düzenli raporlanır. Yetersiz performans durumunda iyileştirme planı uygulanır.\n\n" +
      "12. İzinler ve Çalışma Düzeni: İzin hak ve kullanımları iş kanunu ve iç uygulamalara tabidir: {izin_politikasi}. Uzaktan çalışmada iş sağlığı ve güvenliği bilgilendirmeleri elektronik ortamda yapılır ve personelce kabul edilir.\n\n" +
      "13. Uyuşmazlık ve Yetkili Mercii: İşbu sözleşmeden doğan uyuşmazlıklarda {yetkili_mahkeme} yetkilidir. Türkiye Cumhuriyeti hukuku uygulanır.\n\n" +
      "14. Tebligat ve Bildirim: Taraflar, yazılı bildirimleri kayıtlı e‑posta ve sistem içi bildirimler yoluyla yapabilir. Adres değişiklikleri yazılı olarak bildirilmedikçe mevcut adreslere yapılan tebligatlar geçerlidir.\n\n" +
      "15. Yürürlük: İşbu sözleşme taraflarca imzalandığı tarihte yürürlüğe girer ve belirsiz süreyle devam eder.",
  },
  {
    id: "is-sozlesmesi",
    name: "Belirsiz Süreli İş Sözleşmesi",
    variables: ["firma_adi", "personel_adi", "tc_kimlik_no", "adres", "pozisyon", "maas_tutari", "baslangic_tarihi"],
    content:
      "Taraflar: {firma_adi} (İşveren) ile {personel_adi} (T.C.: {tc_kimlik_no}) arasında, {pozisyon} pozisyonunda çalışmak üzere {baslangic_tarihi} tarihinde başlamak kaydıyla belirsiz süreli iş sözleşmesi akdedilmiştir.\n\n" +
      "Ücret: Aylık brüt ücret {maas_tutari} TL olup, ilgili mevzuat uyarınca vergiler ve kesintiler uygulanır.\n\n" +
      "Çalışma Yeri: {adres}\n\n" +
      "İşbu sözleşme 4857 sayılı İş Kanunu hükümlerine tabidir.",
  },
  {
    id: "kvkk-aydinlatma",
    name: "KVKK Aydınlatma Metni",
    variables: [
      "firma_adi",
      "personel_adi",
      "tc_kimlik_no",
      "adres",
      "kvkk_yetkili_ad",
      "kvkk_yetkili_eposta",
      "kvkk_yetkili_tel",
      "veri_kategorileri",
      "isleme_amaclari",
      "hukuki_sebepler",
      "toplama_yontemleri",
      "aktarim_taraflari",
      "yurtdisi_aktarim",
      "saklama_suresi",
      "guvenlik_onlemleri",
      "hak_basvuru_kanali",
      "politika_url"
    ],
    content:
      "Veri Sorumlusu ve İletişim: {firma_adi}, {adres} adresinde faaliyet göstermekte olup veri sorumlusu sıfatıyla çalışan adayları ve çalışanların kişisel verilerini işlemektedir. İletişim: {kvkk_yetkili_ad}, e‑posta: {kvkk_yetkili_eposta}, telefon: {kvkk_yetkili_tel}.\n\n" +
      "İşlenen Kişisel Veri Kategorileri: {veri_kategorileri}. Örnek: kimlik, iletişim, özlük, eğitim, mesleki deneyim, performans ve bordro bilgileri, SGK ve vergi bilgileri, sistem erişim/kullanım logları.\n\n" +
      "İşleme Amaçları: {isleme_amaclari}. Örnek: işe alım süreçlerinin yürütülmesi; iş sözleşmesinin kurulması ve ifası; bordro ve yan hak yönetimi; iş sağlığı ve güvenliği; yasal yükümlülüklerin yerine getirilmesi; bilgi güvenliği ve operasyon süreçlerinin yürütülmesi.\n\n" +
      "Hukuki Sebepler: {hukuki_sebepler}. KVKK m.5 ve m.6 kapsamında; sözleşmenin kurulması/ifası, kanuni yükümlülüklerin yerine getirilmesi, veri sorumlusunun meşru menfaatleri, açık rıza ve sağlık/kamu güvenliği gibi özel durumlara ilişkin hukuki sebepler.\n\n" +
      "Toplama Yöntemleri ve Kanalları: {toplama_yontemleri}. Örnek: elektronik ve fiziki ortamda başvuru formları, sözleşmeler, e‑posta ve HR yazılımı, cihaz ve ağ logları, kamera sistemleri.\n\n" +
      "Aktarım: {aktarim_taraflari}. İlgili mevzuat çerçevesinde resmi kurumlar, finans ve hukuk danışmanları, hizmet sağlayıcılar ve grup şirketleriyle paylaşım yapılabilir. Yurtdışı aktarım durumu: {yurtdisi_aktarim}.\n\n" +
      "Saklama Süresi: {saklama_suresi}. Kişisel veriler, amaçla sınırlı olarak ve ilgili mevzuatta öngörülen süreler boyunca saklanır; süre dolduğunda güvenli şekilde imha edilir.\n\n" +
      "Güvenlik Önlemleri: {guvenlik_onlemleri}. Örnek: erişim yetkilendirme, şifreleme, yedekleme, ağ güvenliği, loglama, çalışan gizlilik taahhütleri ve üçüncü taraf sözleşmelerinde veri koruma hükümleri.\n\n" +
      "İlgili Kişinin Hakları: KVKK m.11 kapsamında; kişisel veriler hakkında bilgi talep etme, düzeltme/silme/işlemenin kısıtlanmasını isteme, itiraz, veri taşınabilirliği ve açık rızanın geri alınması haklarına sahipsiniz.\n\n" +
      "Başvuru: Haklarınıza ilişkin taleplerinizi {hak_basvuru_kanali} üzerinden veri sorumlusuna iletebilirsiniz. Detaylı politika ve güncel duyurular için: {politika_url}.",
  },
  {
    id: "gizlilik-sozlesmesi",
    name: "Gizlilik Sözleşmesi (NDA)",
    variables: [
      "firma_adi",
      "personel_adi",
      "gizli_bilgi_tanimi",
      "izinli_kullanimlar",
      "paylasim_kisitlari",
      "istisnalar",
      "gizlilik_suresi_yil",
      "iade_imha_suresi",
      "guvenlik_standartlari",
      "ihlal_bildirimi_suresi_gun",
      "cezai_sart_tutari",
      "yetkili_mahkeme",
      "ic_politika_url"
    ],
    content:
      "Taraflar: {firma_adi} ile {personel_adi} arasında gizli bilgilerin korunmasına ilişkin işbu Gizlilik Sözleşmesi akdedilmiştir.\n\n" +
      "Tanımlar: Gizli Bilgi; yazılı/sözlü/elektronik her türlü ticari, teknik, finansal, ürün yol haritası, müşteri/veri listeleri, yazılım kodu/algoritmalar, süreç ve politika bilgilerini kapsar. Kapsam: {gizli_bilgi_tanimi}.\n\n" +
      "Kullanım: {izinli_kullanimlar}. Gizli bilgi yalnızca işin yürütülmesi ve talimatlar doğrultusunda kullanılabilir; üçüncü kişilerle paylaşım {paylasim_kisitlari} hükümlerine tabidir.\n\n" +
      "İstisnalar: {istisnalar}. Örnek: kamuya açık hale gelen, önceden bilinen, bağımsız olarak geliştirilen veya yetkili mercilerce talep edilen bilgiler (talep gerekçesi kayıt altına alınır ve yalnızca gerekli asgari kapsamda paylaşılır).\n\n" +
      "Süre ve Yürürlük: Gizlilik yükümlülükleri sözleşme süresince ve sona ermesinden itibaren {gizlilik_suresi_yil} yıl devam eder.\n\n" +
      "İade/İmha: Sözleşme bitişi veya talep halinde tüm fiziksel/elektronik kopyalar {iade_imha_suresi} içinde iade edilir veya güvenli biçimde imha edilir ve kayıt altına alınır.\n\n" +
      "Güvenlik: {guvenlik_standartlari}. Örnek: erişim yetkilendirme, şifreleme, loglama, cihaz ve ağ güvenliği; şirket içi politika ve prosedürlere uyum: {ic_politika_url}.\n\n" +
      "İhlal Bildirimi: Şüpheli veya gerçekleşen ihlaller, öğrenildiği andan itibaren en geç {ihlal_bildirimi_suresi_gun} gün içinde veri sorumlusuna ve ilgili yöneticilere bildirilir; gerekli önlemler gecikmeksizin uygulanır.\n\n" +
      "Cezai Şart ve Tazmin: İhlal halinde {cezai_sart_tutari} TL cezai şart uygulanır; ayrıca doğan zararın tamamı, doğrudan/dolaylı kayıplar ve makul hukuk/uzmanlık masrafları talep edilir.\n\n" +
      "Uyuşmazlık: İşbu sözleşmeden doğan uyuşmazlıklarda {yetkili_mahkeme} yetkilidir.",
  },
  {
    id: "kamera-izleme-riza",
    name: "Güvenlik Kamerası İzleme ve Ses/Görüntü Kaydı Rıza Metni",
    variables: [
      "firma_adi",
      "personel_adi",
      "tc_kimlik_no",
      "adres",
      "kamera_kapsami",
      "amaclar",
      "hukuki_sebepler",
      "saklama_suresi",
      "guvenlik_onlemleri",
      "aktarim_taraflari",
      "yurtdisi_aktarim",
      "sorumlu_kisi",
      "sorumlu_eposta",
      "sorumlu_tel",
      "hak_basvuru_kanali",
      "politika_url",
      "tarih"
    ],
    content:
      "Taraflar: {firma_adi} ile {personel_adi} (T.C.: {tc_kimlik_no}) arasında işyerinde görüntü ve ses kaydı alınmasına ilişkin aydınlatma ve açık rıza metni düzenlenmiştir.\n\n" +
      "Konum ve Kapsam: İzleme ve kayıt sistemleri {adres} adresinde konumlandırılmış kameralar ile {kamera_kapsami} kapsamında faaliyet gösterir; iş güvenliği, tesis güvenliği ve operasyon güvenliği amacıyla giriş‑çıkış, ortak alanlar ve cihaz/altyapı odaları izlenir.\n\n" +
      "Amaç ve Hukuki Sebep: {amaclar}. Hukuki sebepler: {hukuki_sebepler} (KVKK m.5/2, meşru menfaat; yasal yükümlülükler; açık rıza).\n\n" +
      "Saklama ve Erişim: Kayıtlar {saklama_suresi} süreyle saklanır; yetkilendirilmiş birimlerce ihtiyaç halinde erişilir; süre sonunda güvenli imha yapılır.\n\n" +
      "Güvenlik Önlemleri: {guvenlik_onlemleri}. Erişim yetkilendirme, şifreleme, loglama ve fiziksel güvenlik önlemleri uygulanır.\n\n" +
      "Aktarım: {aktarim_taraflari}. Yurtdışı aktarım: {yurtdisi_aktarim}.\n\n" +
      "Sorumlu: {sorumlu_kisi}, e‑posta: {sorumlu_eposta}, telefon: {sorumlu_tel}.\n\n" +
      "Haklar ve Başvuru: KVKK m.11 kapsamındaki haklarınızı {hak_basvuru_kanali} üzerinden kullanabilirsiniz. Politika ve duyurular: {politika_url}.\n\n" +
      "Açık Rıza Beyanı: İşbu metni okuyup anladığımı, işyerinde güvenlik amaçlı ses ve görüntü kaydı alınmasına, belirtilen kapsam ve sürelerde işlenmesine ve aktarılmasına kendi özgür irademle açık rıza gösterdiğimi beyan ederim. Tarih: {tarih}.",
  },
  {
    id: "musteri-hizmet-sozlesmesi",
    name: "Hizmet Sözleşmesi (Müşteri)",
    variables: [
      "firma_adi",
      "musteri_adi",
      "musteri_eposta",
      "musteri_tel",
      "musteri_vergi_no",
      "musteri_adres",
      "hizmet_listesi",
      "hizmet_kapsami",
      "teslim_cikti_listesi",
      "kabul_kriterleri",
      "sla_duzeyi",
      "servis_penceresi",
      "yanit_suresi",
      "duzeltme_suresi",
      "sure_tipi",
      "sure_baslangic_tarihi",
      "sure_bitis_tarihi",
      "fesih_ihbar_gun",
      "bedel",
      "faturalama_periyodu",
      "odeme_vadesi_gun",
      "gecikme_faizi_orani",
      "teslim_takvimi",
      "revizyon_hakki",
      "fikri_haklar",
      "gizlilik_atif_url",
      "kvkk_atif_url",
      "sorumluluk_sinirlamasi",
      "sigorta",
      "denetim_raporlama",
      "referans_kullanimi",
      "temsil_garanti",
      "vergi_tevkifat",
      "alt_yuklenici_onay",
      "sozlesme_devri",
      "bolunebilirlik",
      "bildirim_kanali",
      "delil_sozlesmesi",
      "uygulanacak_hukuk",
      "mucbir_sebep_tanimi",
      "yetkili_mahkeme",
      "teklif_numarasi",
      "teklif_tarihi",
      "teklif_url",
      "resmi_yukumlulukler_ek"
    ],
    content:
      "Madde 1 – Taraflar ve Konu: {firma_adi} (Hizmet Sağlayıcı) ile {musteri_adi} (Müşteri) arasında, {hizmet_listesi} başlıklı hizmetlerin {hizmet_kapsami} kapsamında sunulmasına ilişkin işbu sözleşme akdedilmiştir.\n\n" +
      "Madde 2 – Tanımlar ve Yorum: İşbu sözleşmede geçen terimler, sektör ve mevzuattaki genel kabullere uygun şekilde yorumlanır; ekler ve teklif metni sözleşmenin ayrılmaz parçasıdır.\n\n" +
      "Madde 3 – Süre ve Fesih: Sözleşme {sure_tipi} olup başlangıç {sure_baslangic_tarihi}, bitiş {sure_bitis_tarihi} şeklindedir. Süresiz sözleşmelerde taraflar {fesih_ihbar_gun} gün önceden yazılı bildirimle fesih hakkına sahiptir; haklı sebepler saklıdır.\n\n" +
      "Madde 4 – Hizmetler ve İşin Kapsamı: Aşağıda sayılan hizmetler {hizmet_listesi} başlığı altında sunulacaktır. Genel kapsam: {hizmet_kapsami}. Teslim çıktı listesi: {teslim_cikti_listesi}. Kabul kriterleri: {kabul_kriterleri}. Değişiklik ve kapsam genişlemeleri, yazılı talep ve onay ile yürütülür; çelişki halinde teklif metnindeki açık hükümler önceliklidir.\n\n" +
      "Madde 5 – SLA ve Hizmet Seviyesi: Düzey {sla_duzeyi}; servis penceresi {servis_penceresi}; hedef yanıt süresi {yanit_suresi}; düzeltme/tamir süresi {duzeltme_suresi}. Aşım durumlarında düzeltici faaliyetler ve raporlama uygulanır.\n\n" +
      "Madde 6 – Ücret, Faturalama ve Ödeme: Toplam bedel {bedel}. Faturalama {faturalama_periyodu} yapılır; ödeme vadesi {odeme_vadesi_gun} gündür; gecikme faizi {gecikme_faizi_orani}. Gecikmelerde operasyonel etkiler söz konusu olabilir.\n\n" +
      "Madde 7 – Teslim, Revizyon ve Değişiklik: Teslim takvimi {teslim_takvimi}; revizyon hakkı {revizyon_hakki}. Ek kapsam ve değişiklikler yazılı onayla ayrıca ücretlendirilir.\n\n" +
      "Madde 8 – Fikri ve Sınai Haklar: {fikri_haklar}. Üçüncü kişi lisans ve içerik kullanımında sınırlamalar ve yükümlülükler taraflarca gözetilir.\n\n" +
      "Madde 9 – Gizlilik ve KVKK: Taraflar gizlilik ve veri koruma mevzuatına uyar. Politika/atıflar: {gizlilik_atif_url}, {kvkk_atif_url}.\n\n" +
      "Madde 10 – Sorumluluk ve Sigorta: (a) Toplam sorumluluk limiti: {sorumluluk_sinirlamasi}. (b) Dolaylı/sonuçsal zararlar, kar kaybı, veri kaybı ve itibar zedelenmesi kapsam dışıdır. (c) Üçüncü kişi talepleri ve mevzuat kaynaklı yükümlülükler, ilgili tarafın sorumluluğundadır. (d) Profesyonel sorumluluk ve siber risk sigortası: {sigorta}. (e) İhlal ve zarar ihbarı makul süre içinde yapılır ve düzeltici tedbirler uygulanır.\n\n" +
      "Madde 11 – Denetim ve Raporlama: {denetim_raporlama}. Hizmet sağlayıcı, makul denetim taleplerine ve düzenli raporlamaya uygun hareket eder.\n\n" +
      "Madde 12 – Ticari Tanıtım ve Referans: {referans_kullanimi}. Logoların ve marka unsurlarının kullanımı yazılı onaya tabidir.\n\n" +
      "Madde 13 – Temsil ve Garanti: {temsil_garanti}. Taraflar, yetki ve uygunluk beyanlarını sağlar; aykırılık halinde düzeltici süreçler işletilir.\n\n" +
      "Madde 14 – Vergi ve Tevkifat: {vergi_tevkifat}. Mevzuata uygun vergilendirme ve tevkifat işlemleri uygulanır.\n\n" +
      "Madde 15 – Alt Yüklenici ve Devir: {alt_yuklenici_onay}. Sözleşmenin devri: {sozlesme_devri}; devrin geçerliliği yazılı onaya tabidir.\n\n" +
      "Madde 16 – Bölünebilirlik ve Feragat: {bolunebilirlik}. Herhangi bir hükmün geçersizliği, diğer hükümleri etkilemez; feragat yazılı olmalıdır.\n\n" +
      "Madde 17 – Bildirim ve İletişim: {bildirim_kanali}. Adres değişiklikleri yazılı bildirilmedikçe mevcut adresler geçerlidir.\n\n" +
      "Madde 18 – Delil Sözleşmesi: {delil_sozlesmesi}. Elektronik kayıtlar ve sistem logları kesin delil kabul edilir.\n\n" +
      "Madde 19 – Mücbir Sebep: {mucbir_sebep_tanimi}. Mücbir sebeple yükümlülükler askıya alınır; makul süre içinde çözüm için işbirliği yapılır.\n\n" +
      "Madde 20 – Uyuşmazlık ve Uygulanacak Hukuk: {uygulanacak_hukuk}. Yetkili mahkeme: {yetkili_mahkeme}.\n\n" +
      "Madde 21 – Teklif ve Ekler: {teklif_numarasi} numaralı ve {teklif_tarihi} tarihli teklif ile beraber iletilen metin ve ekler geçerlidir; çelişki halinde teklif maddeleri önceliklidir. Ulaşım: {teklif_url}.\n\n" +
      "Madde 22 – Resmi Yükümlülükler ve İzinler: (1) Vergi ve e‑Fatura/e‑Arşiv/e‑İrsaliye süreçlerinin yürütülmesi ve beyanları. (2) SGK, çalışma mevzuatı ve iş sağlığı‑güvenliği yükümlülükleri. (3) Ticari iletişim (İYS) ve KVKK uyumu ile aydınlatma metinlerinin yürütülmesi. (4) Telif/lisans ve görsel‑işitsel içerik kullanım izinleri. (5) Reklam, tanıtım ve sektörel düzenlemelere uyum. (6) Proje niteliğine göre gerekli resmi izinlerin alınması ve bildirimlerin yapılması. (7) Denetimlerde belge ve kayıtların ibrazı. (8) Ek yükümlülükler: {resmi_yukumlulukler_ek}.\n\n" +
      "Madde 23 – Yürürlük: Taraflarca imza ile yürürlüğe girer ve hükümleri sözleşme süresince geçerlidir.",
  },
];

export default function HRContractsPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATES[0].id);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [newTpl, setNewTpl] = useState<{ name: string; content: string }>({ name: "", content: "" });
  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [bundleSelections, setBundleSelections] = useState<Record<string, boolean>>({});
  const [clauseSelections, setClauseSelections] = useState<Record<string, boolean>>({});
  const [signatures, setSignatures] = useState<{ firma_yetkili_adi?: string; firma_unvan?: string; personel_imza_adi?: string }>({});
  const [docNumber, setDocNumber] = useState<string>("");
  const [successTick, setSuccessTick] = useState<number>(0);
  const [tenant, setTenant] = useState<any | null>(null);

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  );
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || templates[0],
    [selectedTemplateId, templates]
  );

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/finance/employees");
      setEmployees(res.data || []);
    } catch {
    }
  };
  const fetchCustomers = async () => {
    try {
      const res = await api.get("/customers");
      setCustomers(res.data || []);
    } catch {
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchCustomers();
    const init = new Date();
    setDocNumber(
      `${init.getFullYear()}${String(init.getMonth() + 1).padStart(2, "0")}${String(init.getDate()).padStart(2, "0")}-${init.getHours()}${String(init.getMinutes()).padStart(2, "0")}`
    );
    setFieldValues((prev) => ({ ...prev, tarih: new Date().toLocaleDateString("tr-TR") }));
    api.get("/tenants/me").then((r) => setTenant(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!tenant) return;
    const companyName = tenant?.name || "";
    const workplace = tenant?.address || "";
    setFieldValues((prev) => ({
      ...prev,
      firma_adi: companyName,
      calisma_yeri: workplace,
      haftalik_calisma_saat: prev.haftalik_calisma_saat || "45",
      deneme_suresi_ay: prev.deneme_suresi_ay || "2",
      ihbar_suresi_hafta: prev.ihbar_suresi_hafta || "4",
      gizlilik_suresi_yil: prev.gizlilik_suresi_yil || "3",
      rekabet_suresi_ay: prev.rekabet_suresi_ay || "6",
      kvkk_yetkili_eposta: prev.kvkk_yetkili_eposta || tenant?.email || "",
      kvkk_yetkili_tel: prev.kvkk_yetkili_tel || tenant?.phone || "",
      kvkk_yetkili_ad: prev.kvkk_yetkili_ad || tenant?.title || "",
      politika_url: prev.politika_url || "",
      guvenlik_onlemleri: prev.guvenlik_onlemleri || "",
      ic_politika_url: prev.ic_politika_url || "",
      sorumlu_kisi: prev.sorumlu_kisi || tenant?.title || "",
      sorumlu_eposta: prev.sorumlu_eposta || tenant?.email || "",
      sorumlu_tel: prev.sorumlu_tel || tenant?.phone || "",
      sure_tipi: prev.sure_tipi || "SURELI",
      faturalama_periyodu: prev.faturalama_periyodu || "AYLIK",
      odeme_vadesi_gun: prev.odeme_vadesi_gun || "15",
      fesih_ihbar_gun: prev.fesih_ihbar_gun || "30",
    }));
  }, [tenant]);

  useEffect(() => {
    if (!selectedEmployee) return;
    const auto: Record<string, string> = {
      personel_adi: selectedEmployee.name || "",
      maas_tutari: selectedEmployee.salary != null ? String(selectedEmployee.salary) : "",
      baslangic_tarihi: selectedEmployee.startDate ? selectedEmployee.startDate.substring(0, 10) : "",
      email: selectedEmployee.email || "",
      telefon: selectedEmployee.phone || "",
    };
    setFieldValues((prev) => ({ ...prev, ...auto }));
  }, [selectedEmployee]);

  useEffect(() => {
    if (!selectedCustomerId) return;
    const c = customers.find((x) => x.id === selectedCustomerId);
    if (!c) return;
    const auto: Record<string, string> = {
      musteri_adi: c.name || "",
      musteri_eposta: c.email || "",
      musteri_tel: c.phone || "",
    };
    setFieldValues((prev) => ({ ...prev, ...auto }));
  }, [selectedCustomerId, customers]);

  useEffect(() => {
    if (!selectedEmployeeId) return;
    api
      .get(`/finance/employees/${selectedEmployeeId}/details`)
      .then((res) => {
        const u = res.data?.user || {};
        const auto: Record<string, string> = {
          pozisyon: u.jobTitle || "",
          tc_kimlik_no: u.tckn || "",
          deneme_suresi_ay: u.probationMonths != null ? String(u.probationMonths) : (fieldValues.deneme_suresi_ay || "2"),
          haftalik_calisma_saat: u.weeklyHours != null ? String(u.weeklyHours) : (fieldValues.haftalik_calisma_saat || "45"),
          gizlilik_suresi_yil: u.confidentialityYears != null ? String(u.confidentialityYears) : (fieldValues.gizlilik_suresi_yil || "3"),
          rekabet_suresi_ay: u.nonCompeteMonths != null ? String(u.nonCompeteMonths) : (fieldValues.rekabet_suresi_ay || "6"),
          cezai_sart_tutari: u.penaltyAmount != null ? String(u.penaltyAmount) : (fieldValues.cezai_sart_tutari || ""),
          ekipman_listesi: u.equipmentList || "",
          yan_haklar: u.benefits || "",
          performans_periyot: u.performancePeriod || "",
          adres: tenant?.address || "",
        };
        setFieldValues((prev) => ({ ...prev, ...auto }));
      })
      .catch(() => {});
  }, [selectedEmployeeId, tenant]);
  useEffect(() => {
    const saved = localStorage.getItem("hr_contract_templates");
    if (saved) {
      try {
        const parsed: Template[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          setTemplates(mergeTemplates(DEFAULT_TEMPLATES, parsed));
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hr_contract_templates", JSON.stringify(templates));
  }, [templates]);

  const mergeTemplates = (defs: Template[], custom: Template[]) => {
    const map = new Map<string, Template>();
    for (const t of defs) map.set(t.id, t);
    for (const t of custom) map.set(t.id, t);
    return Array.from(map.values());
  };

  const extractVariables = (content: string) => {
    const set = new Set<string>();
    const re = /\{([a-zA-Z0-9_]+)\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content)) != null) {
      set.add(m[1]);
    }
    return Array.from(set);
  };

  const CLAUSES: { id: string; name: string; content: string }[] = [
    { id: "deneme-suresi", name: "Deneme Süresi", content: "Taraflar, {baslangic_tarihi} tarihinden itibaren iki ay deneme süresi üzerinde mutabıktır. Bu süre içinde taraflar bildirimsiz fesih hakkına sahiptir." },
    { id: "mesai", name: "Fazla Mesai", content: "Fazla mesai gereksiniminde, ilgili ay içinde fazla mesai ücretleri 4857 sayılı Kanun hükümlerine göre hesaplanır ve ödenir." },
    { id: "uzaktan-calisma", name: "Uzaktan Çalışma", content: "Taraflar uygun gördüklerinde uzaktan çalışma modeli uygulanabilir. Uzaktan çalışmada iş sağlığı ve güvenliği bilgilendirmeleri personel tarafından kabul edilir." },
    { id: "fikri-haklar", name: "Fikri Haklar", content: "Personel tarafından işbu sözleşme kapsamında üretilen eser ve çıktılara ilişkin tüm fikri ve sınai haklar işverene aittir." },
    { id: "ekipman", name: "Ekipman Teslim", content: "İşveren tarafından teslim edilen ekipmanların kullanım, iade ve sorumluluk esasları ayrı bir protokol ile belirlenir." },
  ];

  useEffect(() => {
    if (!selectedTemplate) return;
    const vars = selectedTemplate.variables.length ? selectedTemplate.variables : extractVariables(selectedTemplate.content);
    const autoDefaults: Record<string, string> = {};
    for (const v of vars) {
      if (!(v in fieldValues)) autoDefaults[v] = "";
    }
    setFieldValues((prev) => ({ ...autoDefaults, ...prev }));
  }, [selectedTemplate?.id]);

  const fillTemplate = (tpl: Template, values: Record<string, string>) => {
    let out = tpl.content;
    for (const key of tpl.variables) {
      const val = (values[key] || "").trim();
      out = out.replaceAll(`{${key}}`, val || "—");
    }
    return out;
  };

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const companyName = tenant?.name || "Ajans";
      const finalValues: any = { ...fieldValues, firma_adi: companyName, personel_imza_adi: selectedEmployee?.name || "" };
      const baseText = fillTemplate(selectedTemplate, finalValues);
      const extraClauses = Object.entries(clauseSelections)
        .filter(([, on]) => on)
        .map(([id]) => CLAUSES.find((c) => c.id === id)?.content || "")
        .filter(Boolean);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;

      if (selectedTemplate.id === "musteri-hizmet-sozlesmesi") {
        const mainTitle = renderTurkishText("SÖZLEŞME", 20, "800", "#000000");
        if (mainTitle) {
          const x = (pageWidth - mainTitle.width) / 2;
          doc.addImage(mainTitle.data, "PNG", x, 20, mainTitle.width, mainTitle.height);
        }
        const dateText = renderTurkishText(`Tarih: ${(finalValues as any).tarih || new Date().toLocaleDateString("tr-TR")}`, 10, "normal", "#000000");
        if (dateText) {
          doc.addImage(dateText.data, "PNG", pageWidth - margin - dateText.width, 20, dateText.width, dateText.height);
        }
        const leftParty = renderTurkishText(
          `Ajans\n${finalValues.firma_adi}\nAdres: ${finalValues.adres || finalValues.calisma_yeri || "—"}\nE‑posta: ${finalValues.sorumlu_eposta || finalValues.kvkk_yetkili_eposta || "—"}\nTel: ${finalValues.sorumlu_tel || finalValues.kvkk_yetkili_tel || "—"}`,
          10,
          "normal",
          "#000000"
        );
        const rightParty = renderTurkishText(
          `Müşteri\n${finalValues.musteri_adi || "—"}\nAdres: ${finalValues.musteri_adres || "—"}\nE‑posta: ${finalValues.musteri_eposta || "—"}\nTel: ${finalValues.musteri_tel || "—"}\nVergi No: ${finalValues.musteri_vergi_no || "—"}`,
          10,
          "normal",
          "#000000"
        );
        let y = 20 + (mainTitle?.height || 12) + 12;
        if (leftParty) {
          doc.addImage(leftParty.data, "PNG", margin, y, leftParty.width, leftParty.height);
        }
        if (rightParty) {
          doc.addImage(rightParty.data, "PNG", pageWidth - margin - rightParty.width, y, rightParty.width, rightParty.height);
        }
        y += Math.max(leftParty?.height || 0, rightParty?.height || 0) + 12;
        doc.setDrawColor(180, 180, 180);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
        const clausesHeader = renderTurkishText("Maddeler", 12, "800", "#000000");
        if (clausesHeader) {
          doc.addImage(clausesHeader.data, "PNG", margin, y, clausesHeader.width, clausesHeader.height);
          y += clausesHeader.height + 6;
        }
        const paragraphs = [...baseText.split("\n\n"), ...extraClauses];
        for (const para of paragraphs) {
          const lines = doc.splitTextToSize(para, maxWidth);
          doc.setFontSize(11);
          doc.setTextColor(30, 30, 30);
          doc.text(lines, margin, y);
          y += lines.length * 6 + 6;
          if (y > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            y = 30;
          }
        }
        y += 6;
        const officialHeader = renderTurkishText("Resmi Yükümlülükler ve Atıflar", 12, "800", "#000000");
        if (officialHeader) {
          doc.addImage(officialHeader.data, "PNG", margin, y, officialHeader.width, officialHeader.height);
          y += officialHeader.height + 4;
        }
        const officialText = [
          `• Teklif: No ${finalValues.teklif_numarasi || "—"} • Tarih: ${finalValues.teklif_tarihi || "—"} • ${finalValues.teklif_url || ""}`,
          `• KVKK ve Gizlilik: ${finalValues.kvkk_atif_url || "—"} • ${finalValues.gizlilik_atif_url || "—"}`,
          `• Vergi ve Tevkifat: ${finalValues.vergi_tevkifat || "—"}`,
          `• Uygulanacak Hukuk: ${finalValues.uygulanacak_hukuk || "—"} • Yetkili Mahkeme: ${finalValues.yetkili_mahkeme || "—"}`
        ].join("\n");
        const officialLines = doc.splitTextToSize(officialText, maxWidth);
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(officialLines, margin, y);
        y += officialLines.length * 5 + 6;
      } else {
        const titleImg = renderTurkishText(selectedTemplate.name, 16, "800", "#000000");
        if (titleImg) {
          doc.addImage(titleImg.data, "PNG", margin, 25, titleImg.width, titleImg.height);
        }

        const partyName =
          (selectedTemplate.variables.includes("musteri_adi")
            ? (fieldValues.musteri_adi || customers.find((c) => c.id === selectedCustomerId)?.name || "")
            : (selectedEmployee?.name || "")) || "";
        const byImg = renderTurkishText(`Taraf: ${finalValues.firma_adi} / ${partyName}`, 10, "normal", "#666666");
        if (byImg) {
          doc.addImage(byImg.data, "PNG", margin, 25 + (titleImg?.height || 10) + 6, byImg.width, byImg.height);
        }

        const paragraphs = [...baseText.split("\n\n"), ...extraClauses];
        let y = 25 + (titleImg?.height || 10) + (byImg?.height || 6) + 14;
        for (const para of paragraphs) {
          const lines = doc.splitTextToSize(para, maxWidth);
          doc.setFontSize(11);
          doc.setTextColor(30, 30, 30);
          doc.text(lines, margin, y);
          y += lines.length * 6 + 6;
          if (y > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            y = 30;
          }
        }
      }

      const sigHeader = renderTurkishText("İmza", 12, "800", "#000000");
      if (sigHeader) {
        const y0 = doc.internal.pageSize.getHeight() - 60;
        doc.addImage(sigHeader.data, "PNG", margin, y0, sigHeader.width, sigHeader.height);
        const leftBlock = renderTurkishText(`${finalValues.firma_adi}\n${signatures.firma_yetkili_adi || ""}\n${signatures.firma_unvan || ""}\nİmza: ____________________`, 10, "normal", "#000000");
        const rightBlock = renderTurkishText(`${selectedEmployee?.name || ""}\nİmza: ____________________`, 10, "normal", "#000000");
        if (leftBlock) doc.addImage(leftBlock.data, "PNG", margin, y0 + 10, leftBlock.width, leftBlock.height);
        if (rightBlock) doc.addImage(rightBlock.data, "PNG", pageWidth - margin - rightBlock.width, y0 + 10, rightBlock.width, rightBlock.height);
      }

      const footerLine = renderTurkishText(`No: ${docNumber} • Tarih: ${new Date().toLocaleDateString("tr-TR")} • ${tenant?.name || "Ajans"}`, 8, "normal", "#787878");
      if (footerLine) {
        const py = doc.internal.pageSize.getHeight() - 10;
        doc.addImage(footerLine.data, "PNG", margin, py - footerLine.height / 2, footerLine.width, footerLine.height);
      }

      doc.save(`${selectedTemplate.id}-${(selectedEmployee?.name || "personel").toLowerCase().replace(/\s+/g, "-")}.pdf`);
      setSuccessTick(Date.now());
    } finally {
      setGenerating(false);
    }
  };

  const generateBundle = async () => {
    setGenerating(true);
    try {
      const companyName = tenant?.name || "Ajans";
      const finalValues = { ...fieldValues, firma_adi: companyName, personel_imza_adi: selectedEmployee?.name || "" };
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 18;
      const maxWidth = pageWidth - margin * 2;
      const picked = templates.filter((t) => bundleSelections[t.id]);
      let first = true;
      for (const tpl of picked) {
        if (!first) doc.addPage();
        first = false;
        const titleImg = renderTurkishText(tpl.name, 16, "800", "#000000");
        if (titleImg) doc.addImage(titleImg.data, "PNG", margin, 25, titleImg.width, titleImg.height);
        const partyName =
          (tpl.variables.includes("musteri_adi")
            ? (fieldValues.musteri_adi || customers.find((c) => c.id === selectedCustomerId)?.name || "")
            : (selectedEmployee?.name || "")) || "";
        const byImg = renderTurkishText(`Taraf: ${finalValues.firma_adi} / ${partyName}`, 10, "normal", "#666666");
        if (byImg) doc.addImage(byImg.data, "PNG", margin, 25 + (titleImg?.height || 10) + 6, byImg.width, byImg.height);
        let y = 25 + (titleImg?.height || 10) + (byImg?.height || 6) + 14;
        const content = fillTemplate(tpl, finalValues);
        const lines = doc.splitTextToSize(content, maxWidth);
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        for (const ln of lines) {
          doc.text(ln, margin, y);
          y += 6;
          if (y > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            y = 30;
          }
        }
      }
      doc.save(`ise-alim-paketi-${(selectedEmployee?.name || "personel").toLowerCase().replace(/\s+/g, "-")}.pdf`);
      setSuccessTick(Date.now());
    } finally {
      setGenerating(false);
    }
  };

  const addTemplate = () => {
    if (!newTpl.name.trim() || !newTpl.content.trim()) return;
    const id = newTpl.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    const vars = extractVariables(newTpl.content);
    const tpl: Template = { id, name: newTpl.name.trim(), content: newTpl.content.trim(), variables: vars };
    setTemplates((prev) => [...prev, tpl]);
    setNewTpl({ name: "", content: "" });
  };

  const startEditTemplate = (tpl: Template) => {
    setEditingTplId(tpl.id);
    setNewTpl({ name: tpl.name, content: tpl.content });
  };

  const saveTemplateEdit = () => {
    if (!editingTplId) return;
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === editingTplId
          ? { ...t, name: newTpl.name.trim() || t.name, content: newTpl.content.trim() || t.content, variables: extractVariables(newTpl.content.trim() || t.content) }
          : t
      )
    );
    setEditingTplId(null);
    setNewTpl({ name: "", content: "" });
  };

  const removeTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedTemplateId === id) {
      const next = templates.find((t) => t.id !== id);
      if (next) setSelectedTemplateId(next.id);
    }
  };

  const exportTemplates = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(templates));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "sozlesme-sablonlari.json");
    a.click();
  };

  const importTemplates = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: Template[] = JSON.parse(String(reader.result));
        if (Array.isArray(parsed)) {
          setTemplates(mergeTemplates(DEFAULT_TEMPLATES, parsed));
        }
      } catch {}
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <FileText className="h-6 w-6 text-slate-900 dark:text-slate-50" />
            <span>Sözleşme & Evrak</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-300 text-sm mt-2">
            Gelişmiş sözleşme oluşturucu. Şablonları yönetin, maddeleri ekleyin, paket PDF oluşturun.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportTemplates}>
            <Upload className="h-3 w-3 mr-2" />
            Dışa Aktar
          </Button>
          <label className="inline-flex items-center">
            <input type="file" accept="application/json" className="hidden" onChange={importTemplates} />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer px-3 py-2 border rounded bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700">
              İçe Aktar
            </span>
          </label>
          {successTick > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 text-xs inline-flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Oluşturuldu
            </span>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sözleşme Oluşturucu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-500 dark:text-slate-400">Şablon</label>
                <select
                  className="border rounded px-2 py-2 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-500 dark:text-slate-400">Personel</label>
            <select
              className="border rounded px-2 py-2 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">Seçiniz</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-500 dark:text-slate-400">Müşteri</label>
            <select
              className="border rounded px-2 py-2 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">Seçiniz</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">Belge No</label>
                  <input
                    className="border rounded px-2 py-1 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">Firma Yetkili Adı</label>
                  <input
                    className="border rounded px-2 py-1 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                    value={signatures.firma_yetkili_adi || ""}
                    onChange={(e) => setSignatures((s) => ({ ...s, firma_yetkili_adi: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">Yetkili Ünvan</label>
                  <input
                    className="border rounded px-2 py-1 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                    value={signatures.firma_unvan || ""}
                    onChange={(e) => setSignatures((s) => ({ ...s, firma_unvan: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 dark:text-slate-400">Ön İzleme</label>
                <div className="border rounded p-3 text-xs bg-slate-50 max-h-[300px] overflow-auto whitespace-pre-wrap border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
                  {fillTemplate(selectedTemplate, { ...fieldValues, firma_adi: tenant?.name || "Ajans" })}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 dark:text-slate-400">Opsiyonel Maddeler</label>
                <div className="grid grid-cols-2 gap-2">
                  {CLAUSES.map((c) => (
                    <label key={c.id} className="text-xs inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-3 w-3"
                        checked={!!clauseSelections[c.id]}
                        onChange={(e) => setClauseSelections((prev) => ({ ...prev, [c.id]: e.target.checked }))}
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">Alanlar</div>
              <div className="space-y-3">
                {(selectedTemplate.variables.length ? selectedTemplate.variables : extractVariables(selectedTemplate.content)).map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <label className="text-xs w-40 text-slate-500 dark:text-slate-400">{v}</label>
                    <input
                      className="border rounded px-2 py-1 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                      value={fieldValues[v] || ""}
                      onChange={(e) => setFieldValues((vals) => ({ ...vals, [v]: e.target.value }))}
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <Button size="sm" onClick={generatePDF} disabled={generating}>
                  <Download className="h-3 w-3 mr-2" />
                  PDF Oluştur ve İndir
                </Button>
              </div>
              <div className="pt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Paket Seçimi</div>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((t) => (
                    <label key={t.id} className="text-xs inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-3 w-3"
                        checked={!!bundleSelections[t.id]}
                        onChange={(e) => setBundleSelections((prev) => ({ ...prev, [t.id]: e.target.checked }))}
                      />
                      <span>{t.name}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2">
                  <Button size="sm" variant="secondary" onClick={generateBundle} disabled={generating}>
                    İşe Alım Paketi PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg">Şablon Yönetimi</CardTitle>
          {editingTplId ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={saveTemplateEdit}>
                <Save className="h-3 w-3 mr-2" />
                Kaydet
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditingTplId(null); setNewTpl({ name: "", content: "" }); }}>
                İptal
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={addTemplate}>
              <Plus className="h-3 w-3 mr-2" />
              Yeni Şablon Ekle
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-xs w-32 text-slate-500 dark:text-slate-400">Ad</label>
                <input
                  className="border rounded px-2 py-1 text-sm w-full bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                  value={newTpl.name}
                  onChange={(e) => setNewTpl((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Şablon adı"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-500 dark:text-slate-400">İçerik</label>
                <textarea
                  className="border rounded px-2 py-2 text-sm w-full min-h-[160px] bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                  value={newTpl.content}
                  onChange={(e) => setNewTpl((s) => ({ ...s, content: e.target.value }))}
                  placeholder="Değişkenler için {degisken} biçimini kullanın"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">Mevcut Şablonlar</div>
              <div className="space-y-2">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className="border rounded p-3 text-xs bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900 dark:text-slate-50">{t.name}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEditTemplate(t)}>
                          <Edit2 className="h-3 w-3 mr-2" />
                          Düzenle
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => removeTemplate(t.id)}>
                          <Trash2 className="h-3 w-3 mr-2" />
                          Sil
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-slate-600 dark:text-slate-300">
                      Alanlar: {(t.variables.length ? t.variables : extractVariables(t.content)).join(", ") || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
