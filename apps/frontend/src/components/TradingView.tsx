"use client";

import { useEffect, useRef, useState } from "react";

interface TradingViewProps {
  symbols?: string[][]; // exemplo: [["XLM", "USD"], ["BTC", "USD"]]
  height?: number;
  theme?: "light" | "dark";
  locale?: "pt" | "en";
}

export default function TradingView({
  symbols = [["XLM", "USD"]],
  height = 380,
  theme = "dark",
  locale = "pt",
}: TradingViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
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
      showMA: true,
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
  }, [mounted, symbols, height, theme, locale]);

  return (
    <div className="w-full">
      <div className="tradingview-widget-container" ref={containerRef} />
    </div>
  );
}

