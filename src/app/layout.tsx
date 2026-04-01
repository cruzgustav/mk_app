import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export const metadata: Metadata = {
  title: "Base Perfeita — Encontre sua cor ideal de base de maquiagem",
  description: "Análise facial inteligente que detecta seu tom de pele e recomenda a cor ideal de base de maquiagem. 100% gratuito e offline.",
  keywords: ["base de maquiagem", "tom de pele", "undertone", "análise facial", "maquiagem", "beleza", "cor de base"],
  authors: [{ name: "Base Perfeita" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Base Perfeita — Encontre sua cor ideal de base",
    description: "Análise facial inteligente que detecta seu tom de pele e recomenda a cor ideal de base de maquiagem.",
    siteName: "Base Perfeita",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Base Perfeita — Encontre sua cor ideal de base",
    description: "Análise facial inteligente que detecta seu tom de pele e recomenda a cor ideal de base de maquiagem.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
