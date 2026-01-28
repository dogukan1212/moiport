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
