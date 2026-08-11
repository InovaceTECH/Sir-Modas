import { CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";

export function ModulePlaceholder({
  title,
  description,
  sprint,
  capabilities,
}: Readonly<{
  title: string;
  description: string;
  sprint: string;
  capabilities: string[];
}>) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
        <span className="inline-flex rounded-full bg-[#f8e9ef] px-3 py-1 text-xs font-semibold text-brand">
          Planejado para {sprint}
        </span>
        <h2 className="mt-5 text-lg font-semibold">Escopo preparado</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {capabilities.map((capability) => (
            <li key={capability} className="flex items-start gap-3 rounded-xl bg-stone-50 p-4 text-sm text-stone-700">
              <CheckCircle2 className="mt-0.5 shrink-0 text-success" aria-hidden="true" size={18} />
              {capability}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
