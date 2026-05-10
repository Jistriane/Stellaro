'use client';

import { ReactNode, useEffect, useState } from "react";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Toasts from "@/components/Toasts";

interface LayoutClientProps {
  children: ReactNode;
}

export function LayoutClient({ children }: LayoutClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and pre-rendering, render only children without layout
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <div className="flex">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <div className="ml-60 min-h-screen w-[calc(100%-15rem)] overflow-x-hidden">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur border-b border-slate-800">
          <div className="flex items-center justify-between px-4 py-2">
            <Suspense fallback={null}>
              <Breadcrumbs />
            </Suspense>
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
