import Link from "next/link";

type ModulePaginationProps = {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  query?: Record<string, string | number | undefined>;
};

function buildHref(
  basePath: string,
  page: number,
  pageSize: number,
  query?: Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams();

  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }

  return `${basePath}?${params.toString()}`;
}

export default function ModulePagination({ basePath, page, pageSize, total, query }: ModulePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
      <div>
        Página <span className="font-medium text-slate-100">{page}</span> de <span className="font-medium text-slate-100">{totalPages}</span>
        <span className="ml-2 text-slate-500">({total} itens)</span>
      </div>
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link
            href={buildHref(basePath, page - 1, pageSize, query)}
            className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-emerald-400/40 hover:bg-slate-900"
          >
            Anterior
          </Link>
        ) : (
          <span className="rounded-full border border-slate-800 px-3 py-1.5 text-slate-600">Anterior</span>
        )}

        {hasNext ? (
          <Link
            href={buildHref(basePath, page + 1, pageSize, query)}
            className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-emerald-400/40 hover:bg-slate-900"
          >
            Próxima
          </Link>
        ) : (
          <span className="rounded-full border border-slate-800 px-3 py-1.5 text-slate-600">Próxima</span>
        )}
      </div>
    </div>
  );
}
