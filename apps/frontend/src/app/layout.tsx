import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { LayoutClient } from "./layout-client";
import enMessages from "../../messages/en.json";

// Geist fonts commented for build compatibility
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Stellaro",
  description: "Stellaro frontend application",
  other: {
    google: "notranslate",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = "en";

  return (
    <html lang={locale} className="dark notranslate" suppressHydrationWarning translate="no">
      <body className="antialiased notranslate" translate="no">
        <NextIntlClientProvider locale={locale} messages={enMessages}>
          <LayoutClient>{children}</LayoutClient>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}