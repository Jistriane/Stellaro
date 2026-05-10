"use client";

import { useEffect, useRef, useState } from "react";

interface TradingViewProps {
  symbols?: string[][]; // example: [["XLM", "USD"], ["BTC", "USD"]]
  height?: number;
  theme?: "light" | "dark";
  locale?: "pt" | "en";
}

export default function TradingView({
  symbols = [["XLM", "USD"]],
  height = 380,
  theme = "dark",
  locale = "en",
}: TradingViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const isDev = process.env.NODE_ENV !== "production";
  const enableTradingViewInDev = process.env.NEXT_PUBLIC_ENABLE_TRADINGVIEW_DEV === "true";
  const useDevFallback = isDev && !enableTradingViewInDev;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (useDevFallback) return;
    if (!mounted || !containerRef.current) return;

    // Estrutura recomendada: container -> widget
    const root = containerRef.current;
    root.innerHTML = "";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    root.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.crossOrigin = "anonymous";
    const tvLocale = locale === "pt" ? "br" : "en";
    script.textContent = JSON.stringify({
      symbols,
      chartOnly: false,
      width: "100%",
      height,
      locale: tvLocale,
      colorTheme: theme,
      autosize: true,
      showVolume: true,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
      fontSize: "12",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
    });

    root.appendChild(script);

    return () => {
      root.innerHTML = "";
    };
  }, [useDevFallback, mounted, symbols, height, theme, locale]);

  if (useDevFallback) {
    return (
      <div className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 text-sm text-slate-300">
        <p className="font-medium text-slate-100">Real-time Market (dev fallback)</p>
        <p className="mt-2 text-slate-400">
          Widget externo do TradingView desativado em ambiente de desenvolvimento para evitar warnings de preload e erros de script de terceiros. Defina NEXT_PUBLIC_ENABLE_TRADINGVIEW_DEV=true para habilitar.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="tradingview-widget-container" ref={containerRef} />
    </div>
  );
}

