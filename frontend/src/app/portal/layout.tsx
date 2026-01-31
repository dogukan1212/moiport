import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hasta Portalı | Health Tourism",
  description: "Tedavi sürecinizi takip edin",
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-slate-50 ${inter.className}`}>
      <main className="mx-auto max-w-md bg-white min-h-screen shadow-2xl overflow-hidden relative">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
