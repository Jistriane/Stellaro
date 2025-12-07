import type { NextPageContext } from "next";

function CustomError({ statusCode }: { statusCode?: number }) {
  const code = statusCode ?? 500;
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="text-center space-y-3 px-4">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Erro</p>
        <h1 className="text-3xl font-semibold">Algo deu errado</h1>
        <p className="text-slate-400 max-w-md">Codigo {code}</p>
      </div>
    </main>
  );
}

CustomError.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default CustomError;
