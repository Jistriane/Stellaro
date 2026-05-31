"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app";
import { useTranslations } from "next-intl";

export default function Toasts() {
  const events = useAppStore((s) => s.lastEvents);
  const clear = useAppStore((s) => s.clearEvents);
  const t = useTranslations("events");

  const [visible, setVisible] = useState<string[]>([]);

  useEffect(() => {
    if (!events.length) return;
    // Show the most recent
    const [latest] = events;
    setVisible((v) => [latest, ...v].slice(0, 3));
    // Clear global queue (optional to avoid duplication)
    clear();
  }, [events, clear]);

  useEffect(() => {
    // Auto-hide
    if (!visible.length) return;
    const timers = visible.map((id) =>
      setTimeout(() => {
        setVisible((v) => v.filter((x) => x !== id));
      }, 3500)
    );
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  if (!visible.length) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {visible.map((code) => (
        <div key={code} className="min-w-64 max-w-96 rounded-xl border border-border/60 bg-card/70 shadow px-3 py-2 text-sm backdrop-blur-xl">
          <div className="text-foreground">{t(code, { default: code })}</div>
        </div>
      ))}
    </div>
  );
}
