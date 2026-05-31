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
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/50 px-4 py-3 text-sm text-muted-foreground backdrop-blur-xl">
      <div>
        Página <span className="font-medium text-foreground">{page}</span> de <span className="font-medium text-foreground">{totalPages}</span>
        <span className="ml-2 text-muted-foreground">({total} itens)</span>
      </div>
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link
            href={buildHref(basePath, page - 1, pageSize, query)}
            className="rounded-full border border-border/60 bg-secondary/20 px-3 py-1.5 text-foreground transition hover:border-primary/40 hover:bg-secondary/40"
          >
            Anterior
          </Link>
        ) : (
          <span className="rounded-full border border-border/40 bg-secondary/10 px-3 py-1.5 text-muted-foreground">Anterior</span>
        )}

        {hasNext ? (
          <Link
            href={buildHref(basePath, page + 1, pageSize, query)}
            className="rounded-full border border-border/60 bg-secondary/20 px-3 py-1.5 text-foreground transition hover:border-primary/40 hover:bg-secondary/40"
          >
            Próxima
          </Link>
        ) : (
          <span className="rounded-full border border-border/40 bg-secondary/10 px-3 py-1.5 text-muted-foreground">Próxima</span>
        )}
      </div>
    </div>
  );
}
