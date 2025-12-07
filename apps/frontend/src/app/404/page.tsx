export const dynamic = "force-dynamic";

export default function Custom404() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center space-y-3 px-4">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">404</p>
        <h1 className="text-3xl font-semibold">Pagina nao encontrada</h1>
        <p className="text-slate-400 max-w-md">
          Volte para a pagina inicial ou verifique o endereco digitado.
        </p>
      </div>
    </main>
  );
}
