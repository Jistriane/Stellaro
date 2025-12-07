'use client';

import { ReactNode, useEffect, useState } from "react";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import LanguageToggle from "@/components/LanguageToggle";
import Toasts from "@/components/Toasts";

interface LayoutClientProps {
  children: ReactNode;
  locale: "pt" | "en";
}

export function LayoutClient({ children, locale }: LayoutClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Durante SSR e pré-renderização, renderizar apenas children sem layout
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <div className="min-h-screen pl-60 flex-1">
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
                {locale}
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
    </div>
  );
}
