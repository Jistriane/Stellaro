'use client';

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("GlobalError boundary:", error);
  }, [error]);

  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-3 px-4">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Erro</p>
          <h1 className="text-3xl font-semibold">Algo deu errado</h1>
          <p className="text-slate-400 max-w-md">Tente novamente ou volte para a pagina inicial.</p>
          <button
            type="button"
            className="mt-4 rounded bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900"
            onClick={reset}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
