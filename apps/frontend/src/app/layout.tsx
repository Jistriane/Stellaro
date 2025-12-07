import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import Breadcrumbs from "../components/Breadcrumbs";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SocketProvider } from "@/providers/SocketProvider";
import Toasts from "@/components/Toasts";
import LanguageToggle from "@/components/LanguageToggle";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stellaro",
  description: "Aplicação frontend Stellaro",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Detecta locale do cookie no Server Component
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value as "pt" | "en" | undefined;
  const serverLocale = await getLocale();
  // Preferir o cookie quando existir; caso contrário, usar o locale detectado pelo servidor
  const initialLocale: "pt" | "en" = (cookieLocale === "pt" || cookieLocale === "en")
    ? cookieLocale
    : (serverLocale === "en" ? "en" : "pt");
  // Carregar mensagens do mesmo locale do Provider para evitar mismatch
  const messages = await getMessages({ locale: initialLocale });
  return (
    <html lang={initialLocale === "en" ? "en" : "pt-BR"} className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale={initialLocale} messages={messages} timeZone="UTC">
          <SocketProvider>
            <Suspense fallback={null}>
              <Sidebar />
            </Suspense>
            <div className="min-h-screen pl-60">
              {/* Top bar */}
              <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur border-b border-slate-800">
                <div className="flex items-center justify-between px-4 py-2">
                  <Suspense fallback={null}>
                    <Breadcrumbs />
                  </Suspense>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-slate-700 text-slate-400"
                      title="Locale atual detectado no servidor"
                    >
                      {initialLocale}
                    </span>
                    <Suspense fallback={null}>
                      <LanguageToggle />
                    </Suspense>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                {children}
              </div>
            </div>
            <Suspense fallback={null}>
              <Toasts />
            </Suspense>
          </SocketProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}


