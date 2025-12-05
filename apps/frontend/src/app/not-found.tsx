'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Página não encontrada</p>
      <Link href="/" className="text-blue-500 hover:underline">
        Voltar para home
      </Link>
    </div>
  );
}
