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
    // Mostra o mais recente
    const [latest] = events;
    setVisible((v) => [latest, ...v].slice(0, 3));
    // Limpa fila global (opcional para evitar duplicação)
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
        <div key={code} className="min-w-64 max-w-96 rounded border border-slate-700 bg-slate-900/90 shadow px-3 py-2 text-sm">
          <div className="text-slate-200">{t(code, { default: code })}</div>
        </div>
      ))}
    </div>
  );
}
