"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Target,
  Users,
  Wallet,
  Briefcase,
  MessageCircle,
  Sparkles,
  FileText,
  ChevronDown,
  Layers,
  Menu,
  X,
} from "lucide-react";

export const primaryColor = "#00e676";

function MenuLink({
  icon,
  title,
  desc,
  href = "#",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-all group cursor-pointer border border-transparent hover:border-white/5"
    >
      <div className="size-10 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-[#00e676] group-hover:bg-[#00e676]/10 transition-colors">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
          {title}
        </div>
        <p className="text-[11px] text-zinc-500 font-medium">{desc}</p>
      </div>
    </Link>
  );
}

export function LandingHeader() {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  const featuresHref = "/features";
  const modulesHref = "/modules";
  const pricingHref = "/pricing";
  const workflowHref = isHome ? "#workflow" : "/#workflow";

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex size-8 items-center justify-center rounded"
              style={{ backgroundColor: primaryColor }}
            >
              <LayoutDashboard size={20} strokeWidth={2} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              MOI PORT
            </span>
          </Link>
          <div className="ml-auto flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileOpen((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white"
            >
              {isMobileOpen ? (
                <X size={18} />
              ) : (
                <Menu size={18} />
              )}
            </button>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <div
              className="relative group py-4"
              onMouseEnter={() => setIsToolsOpen(true)}
              onMouseLeave={() => setIsToolsOpen(false)}
            >
              <button className="flex items-center gap-1 text-sm font-medium text-white transition-colors">
                Araçlar
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    isToolsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isToolsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 w-[800px] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl p-10 mt-2"
                  >
                    <div className="grid grid-cols-3 gap-12">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">
                          Yönetim
                        </h4>
                        <div className="space-y-1">
                          <MenuLink
                            icon={<LayoutDashboard size={18} />}
                            title="Genel Bakış"
                            desc="Operasyon özeti"
                            href="/overview"
                          />
                          <MenuLink
                            icon={<Target size={18} />}
                            title="CRM Yönetimi"
                            desc="Müşteri yönetimi"
                            href="/crm-board"
                          />
                          <MenuLink
                            icon={<Users size={18} />}
                            title="Müşteriler"
                            desc="Kişi rehberi"
                            href="/customers"
                          />
                          <MenuLink
                            icon={<Wallet size={18} />}
                            title="Finans"
                            desc="Ödemeler & Faturalar"
                            href="/finance"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">
                          İş Akışı
                        </h4>
                        <div className="space-y-1">
                          <MenuLink
                            icon={<Briefcase size={18} />}
                            title="Projeler"
                            desc="Aktif çalışmalar"
                            href="/projects"
                          />
                          <MenuLink
                            icon={<Layers size={18} />}
                            title="Görevler"
                            desc="İş listeleri"
                            href="/tasks"
                          />
                          <MenuLink
                            icon={<MessageCircle size={18} />}
                            title="Sohbet"
                            desc="Ekip iletişimi"
                            href="/chat"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">
                          MOI PORT AI
                        </h4>
                        <div className="space-y-1">
                          <MenuLink
                            icon={<Sparkles size={18} />}
                            title="AI İçerik"
                            desc="Otomatik metinler"
                            href="/ai-content"
                          />
                          <MenuLink
                            icon={<FileText size={18} />}
                            title="AI Teklifler"
                            desc="Akıllı dökümanlar"
                            href="/ai-proposals"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[10px] text-zinc-600 font-medium">
                        MOI Port v2.0 • Hepsi bir arada ajans çözümü
                      </span>
                      <div className="flex gap-4">
                        <span className="text-[10px] text-[#00e676] cursor-pointer hover:underline font-bold uppercase tracking-wider">
                          Destek
                        </span>
                        <span className="text-[10px] text-[#00e676] cursor-pointer hover:underline font-bold uppercase tracking-wider">
                          Dokümantasyon
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {isHome ? (
              <>
                <a
                  className="text-sm font-medium text-white transition-colors"
                  href={featuresHref}
                >
                  Özellikler
                </a>
                <a
                  className="text-sm font-medium text-white transition-colors"
                  href={modulesHref}
                >
                  Modüller
                </a>
                <a
                  className="text-sm font-medium text-white transition-colors"
                  href={workflowHref}
                >
                  İş Akışı
                </a>
                <a
                  className="text-sm font-medium text-white transition-colors"
                  href={pricingHref}
                >
                  Fiyatlandırma
                </a>
              </>
            ) : (
              <>
                <Link
                  className="text-sm font-medium text-white transition-colors"
                  href={featuresHref}
                >
                  Özellikler
                </Link>
                <Link
                  className="text-sm font-medium text-white transition-colors"
                  href={modulesHref}
                >
                  Modüller
                </Link>
                <Link
                  className="text-sm font-medium text-white transition-colors"
                  href={workflowHref}
                >
                  İş Akışı
                </Link>
                <Link
                  className="text-sm font-medium text-white transition-colors"
                  href={pricingHref}
                >
                  Fiyatlandırma
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Link
              className="hidden md:block text-sm font-medium text-white hover:text-[#00e676] transition-colors"
              href="/login"
            >
              Giriş Yap
            </Link>
            <Link
              className="hidden md:inline-flex rounded px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
              href="/register"
            >
              Başlayın
            </Link>
          </div>
        </div>
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden mt-2 rounded-2xl border border-white/10 bg-black/90 backdrop-blur px-4 py-4"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setIsMobileToolsOpen((prev) => !prev)}
                    className="flex items-center justify-between w-full text-sm font-medium text-white"
                  >
                    <span>Araçlar</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${
                        isMobileToolsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isMobileToolsOpen && (
                    <div className="mt-1 flex flex-col gap-1.5 pl-3 border-l border-white/10">
                      <Link
                        href="/overview"
                        onClick={() => setIsMobileOpen(false)}
                        className="text-sm text-white/90 hover:text-white py-0.5"
                      >
                        Genel Bakış
                      </Link>
                      <Link
                        href="/crm-board"
                        onClick={() => setIsMobileOpen(false)}
                        className="text-sm text-white/90 hover:text-white py-0.5"
                      >
                        CRM Yönetimi
                      </Link>
                      <Link
                        href="/projects"
                        onClick={() => setIsMobileOpen(false)}
                        className="text-sm text-white/90 hover:text-white py-0.5"
                      >
                        Projeler
                      </Link>
                      <Link
                        href="/tasks"
                        onClick={() => setIsMobileOpen(false)}
                        className="text-sm text-white/90 hover:text-white py-0.5"
                      >
                        Görevler
                      </Link>
                      <Link
                        href="/finance"
                        onClick={() => setIsMobileOpen(false)}
                        className="text-sm text-white/90 hover:text-white py-0.5"
                      >
                        Finans
                      </Link>
                      <Link
                        href="/chat"
                        onClick={() => setIsMobileOpen(false)}
                        className="text-sm text-white/90 hover:text-white py-0.5"
                      >
                        Sohbet
                      </Link>
                      <Link
                        href="/ai-content"
                        onClick={() => setIsMobileOpen(false)}
                        className="text-sm text-white/90 hover:text-white py-0.5"
                      >
                        AI İçerik
                      </Link>
                      <Link
                        href="/ai-proposals"
                        onClick={() => setIsMobileOpen(false)}
                        className="text-sm text-white/90 hover:text-white py-0.5"
                      >
                        AI Teklifler
                      </Link>
                    </div>
                  )}
                </div>
                {isHome ? (
                  <>
                    <a
                      className="text-sm font-medium text-white"
                      href={featuresHref}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      Özellikler
                    </a>
                    <a
                      className="text-sm font-medium text-white"
                      href={modulesHref}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      Modüller
                    </a>
                    <a
                      className="text-sm font-medium text-white"
                      href={workflowHref}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      İş Akışı
                    </a>
                    <a
                      className="text-sm font-medium text-white"
                      href={pricingHref}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      Fiyatlandırma
                    </a>
                  </>
                ) : (
                  <>
                    <Link
                      className="text-sm font-medium text-white"
                      href={featuresHref}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      Özellikler
                    </Link>
                    <Link
                      className="text-sm font-medium text-white"
                      href={modulesHref}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      Modüller
                    </Link>
                    <Link
                      className="text-sm font-medium text-white"
                      href={workflowHref}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      İş Akışı
                    </Link>
                    <Link
                      className="text-sm font-medium text-white"
                      href={pricingHref}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      Fiyatlandırma
                    </Link>
                  </>
                )}
                <div className="pt-3 mt-2 border-t border-white/10 flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white text-center"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full rounded-full px-4 py-2 text-sm font-bold text-black text-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Başlayın
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-sm font-bold text-white uppercase tracking-wider">
        {title}
      </h4>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              className="text-zinc-500 text-sm hover:text-white transition-colors"
              href={link.href}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="py-20 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-start justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-6">
              <div
                className="flex size-8 items-center justify-center rounded"
                style={{ backgroundColor: primaryColor }}
              >
                <LayoutDashboard size={20} strokeWidth={2} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                MOI PORT
              </span>
            </div>
            <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
              Ajans yönetiminde yeni nesil standart. Yapay zeka ile güçlendirilmiş,
              uçtan uca operasyonel mükemmellik.
            </p>
            <div className="flex gap-2 max-w-sm">
              <input
                className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-[#00e676] text-sm"
                placeholder="E-posta adresiniz"
                type="email"
              />
              <button className="bg-white text-black px-4 py-2 rounded text-sm font-bold hover:bg-zinc-200 transition-colors whitespace-nowrap">
                Abone Ol
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <FooterLinks
              title="Ürün"
              links={[
                { label: "Özellikler", href: "/features" },
                { label: "Fiyatlandırma", href: "/pricing" },
                { label: "Yenilikler", href: "/updates" },
                { label: "Dokümanlar", href: "/docs" },
              ]}
            />
            <FooterLinks
              title="Şirket"
              links={[
                { label: "Hakkımızda", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Kariyer", href: "/careers" },
                { label: "İletişim", href: "/contact" },
              ]}
            />
            <FooterLinks
              title="Yasal"
              links={[
                { label: "Gizlilik", href: "/privacy" },
                { label: "Şartlar", href: "/terms" },
                { label: "Çerezler", href: "/cookies" },
              ]}
            />
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/5 text-center text-zinc-500 text-xs">
          © 2026 MOI Port Agency OS. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
