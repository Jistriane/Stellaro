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
      className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 md:grid-cols-2 lg:grid-cols-4"
    >
      <input type="hidden" name="page" value="1" />
      <input type="hidden" name="pageSize" value={String(pageSize)} />

      {fields.map((field) => {
        const value = values[field.name] ?? "";

        if (field.options) {
          return (
            <label key={field.name} className="grid gap-1 text-sm text-slate-300">
              <span>{field.label}</span>
              <select
                name={field.name}
                defaultValue={value}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-emerald-400"
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
          <label key={field.name} className="grid gap-1 text-sm text-slate-300">
            <span>{field.label}</span>
            <input
              name={field.name}
              defaultValue={value}
              placeholder={field.placeholder}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-emerald-400"
            />
          </label>
        );
      })}

      <div className="flex items-end gap-2 md:col-span-2 lg:col-span-4">
        <button
          type="submit"
          className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-300"
        >
          Aplicar filtros
        </button>
        <Link
          href={`${basePath}?page=1&pageSize=${pageSize}`}
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
        >
          Limpar
        </Link>
      </div>
    </form>
  );
}
