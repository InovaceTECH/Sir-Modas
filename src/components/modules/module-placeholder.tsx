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
      <section className="ui-card p-5 sm:p-7">
        <span className="inline-flex rounded-lg bg-brand-subtle px-3 py-1.5 text-xs font-semibold text-brand-deep">
          Planejado para {sprint}
        </span>
        <h2 className="mt-5 text-xl font-bold tracking-[-0.02em]">Escopo preparado</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {capabilities.map((capability) => (
            <li key={capability} className="flex items-start gap-3 rounded-lg bg-[#fff9f8] p-4 text-sm text-muted">
              <CheckCircle2 className="mt-0.5 shrink-0 text-success" aria-hidden="true" size={18} />
              {capability}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
