"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
};

type QuickCreateFormProps = {
  title: string;
  description: string;
  endpoint: string;
  fields: Field[];
  submitLabel: string;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function QuickCreateForm({ title, description, endpoint, fields, submitLabel }: QuickCreateFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};

    for (const field of fields) {
      const rawValue = formData.get(field.name);
      if (typeof rawValue !== "string") continue;
      payload[field.name] = field.type === "number" ? Number(rawValue) : rawValue.trim();
    }

    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setMessage("Criado com sucesso. Atualizando a visão do módulo...");
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setMessage("Falha ao criar agora. Verifique o backend e tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
      <div className="text-sm font-medium text-slate-100">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        {fields.map((field) => (
          <label key={field.name} className="grid gap-1 text-sm text-slate-300">
            <span>{field.label}</span>
            <input
              name={field.name}
              type={field.type || "text"}
              placeholder={field.placeholder}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-emerald-400"
              required
            />
          </label>
        ))}
        <button
          type="submit"
          disabled={busy}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Enviando..." : submitLabel}
        </button>
      </form>
      {message ? <div className="mt-3 text-xs text-slate-400">{message}</div> : null}
    </div>
  );
}