import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SocketProvider } from "@/providers/SocketProvider";
import { LayoutClient } from "./layout-client";

// Desabilitar pré-render estático para evitar erro de React #31 em /404
export const dynamic = 'force-dynamic';

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
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value as "pt" | "en" | undefined;
  const serverLocale = await getLocale();
  const initialLocale: "pt" | "en" = (cookieLocale === "pt" || cookieLocale === "en")
    ? cookieLocale
    : (serverLocale === "en" ? "en" : "pt");
  const messages = await getMessages({ locale: initialLocale });

  return (
    <html lang={initialLocale === "en" ? "en" : "pt-BR"} className="dark" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider locale={initialLocale} messages={messages} timeZone="UTC">
          <SocketProvider>
            <LayoutClient locale={initialLocale}>
              {children}
            </LayoutClient>
          </SocketProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}