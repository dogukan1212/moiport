import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";
import ChatDrawer from "@/components/chat-drawer";
import { Toaster } from "@/components/ui/sonner";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ajans Yönetim Sistemi",
  description: "Modern ajanslar için SaaS yönetim platformu",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kolayentegrasyon",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={manrope.className}>
        <AuthProvider>
          {children}
          <ChatDrawer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
