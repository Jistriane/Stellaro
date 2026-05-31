import Link from "next/link";

type FilterOption = {
  value: string;
  label: string;
};

type FilterField = {
  name: string;
  label: string;
  placeholder?: string;
  options?: FilterOption[];
};

type ModuleFiltersProps = {
  basePath: string;
  fields: FilterField[];
  values: Record<string, string | undefined>;
  pageSize: number;
};

export default function ModuleFilters({ basePath, fields, values, pageSize }: ModuleFiltersProps) {
  return (
    <form
      action={basePath}
      method="get"
      className="mt-4 grid gap-3 rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur-xl md:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="pageSize" value={String(pageSize)} />

      {fields.map((field) => {
        const value = values[field.name] ?? "";

        if (field.options) {
          return (
            <label key={field.name} className="grid gap-1 text-sm text-muted-foreground">
              <span className="text-foreground">{field.label}</span>
              <select
                name={field.name}
                defaultValue={value}
                className="rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground outline-none transition focus:border-primary/60"
              >
                <option value="">Todos</option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        return (
          <label key={field.name} className="grid gap-1 text-sm text-muted-foreground">
            <span className="text-foreground">{field.label}</span>
            <input
              name={field.name}
              defaultValue={value}
              placeholder={field.placeholder}
              className="rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/60"
            />
          </label>
        );
      })}

      <div className="flex items-end gap-2 md:col-span-2 lg:col-span-4">
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Aplicar filtros
        </button>
        <Link
          href={`${basePath}?page=1&pageSize=${pageSize}`}
          className="rounded-full border border-border/60 bg-secondary/20 px-4 py-2 text-sm text-foreground transition hover:bg-secondary/40"
        >
          Limpar
        </Link>
      </div>
    </form>
  );
}
