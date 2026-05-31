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
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-3 px-4">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground font-mono">Error</p>
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md">Try again or go back to the homepage.</p>
        <button
          type="button"
          className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={reset}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
