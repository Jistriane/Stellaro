import type { Metadata } from "next";
import { Cormorant_Garamond, JetBrains_Mono, Jost } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { LayoutClient } from "./layout-client";
import enMessages from "../../messages/en.json";

const jost = Jost({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  variable: "--font-sans",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["italic", "normal"],
  variable: "--font-serif",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-mono",
});

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
    <html
      lang={locale}
      className={`${jost.variable} ${cormorant.variable} ${jetbrains.variable} dark notranslate`}
      suppressHydrationWarning
      translate="no"
    >
      <body className="antialiased notranslate" translate="no">
        <NextIntlClientProvider locale={locale} messages={enMessages}>
          <LayoutClient>{children}</LayoutClient>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
