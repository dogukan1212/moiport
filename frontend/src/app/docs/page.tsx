"use client";

import { LandingHeader, LandingFooter } from "@/components/landing-layout";

export default function DocsPage() {
  return (
    <div className="bg-[#050505] text-white min-h-screen font-sans selection:bg-[#00e676] selection:text-black">
      <LandingHeader />
      <main className="pt-32 pb-20 lg:pt-40">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
            Dokümanlar
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed mb-4">
            MOI Port&apos;un kullanım kılavuzları, entegrasyon örnekleri ve en
            iyi pratikleri için merkezi bir dokümantasyon alanı planlıyoruz.
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Şimdilik genel ürün tanıtımını inceleyebilirsiniz. Detaylı
            dokümantasyon, beta süreciyle birlikte burada yayınlanacak.
          </p>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

