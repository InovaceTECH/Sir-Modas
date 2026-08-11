import { AlertTriangle, CircleDollarSign, PackageCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";

const indicators = [
  { label: "Vendido hoje", value: "R$ 0,00", note: "Nenhuma venda registrada", icon: CircleDollarSign },
  { label: "Vendas", value: "0", note: "0 peças vendidas", icon: ShoppingBag },
  { label: "Estoque baixo", value: "0", note: "Tudo em ordem", icon: AlertTriangle },
  { label: "Fiado em aberto", value: "R$ 0,00", note: "Nenhuma conta vencida", icon: PackageCheck },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Como a loja está hoje?"
        description="Visão rápida das vendas, do caixa, do estoque e dos pagamentos pendentes."
        action={
          <Link href="/vendas/nova" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-strong">
            Registrar venda
          </Link>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores do dia">
        {indicators.map(({ label, value, note, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted">{label}</p>
              <span className="grid size-10 place-items-center rounded-xl bg-[#f8e9ef] text-brand">
                <Icon aria-hidden="true" size={20} />
              </span>
            </div>
            <p className="mt-5 text-2xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-muted">{note}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-semibold">Primeiros passos</h2>
          <p className="mt-2 text-sm leading-6 text-muted">A estrutura está pronta. O próximo sprint conectará o banco e o cadastro real dos produtos.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/produtos" className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-stone-50">Cadastrar produtos</Link>
            <Link href="/estoque" className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-stone-50">Registrar entrada</Link>
          </div>
        </article>
        <article className="rounded-2xl bg-brand p-6 text-white shadow-sm">
          <p className="text-sm font-medium text-white/75">Situação do caixa</p>
          <h2 className="mt-2 text-xl font-semibold">Caixa ainda não aberto</h2>
          <p className="mt-2 text-sm leading-6 text-white/75">Abra o caixa antes de registrar a primeira venda do dia.</p>
          <Link href="/caixa" className="mt-5 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-semibold text-brand">Abrir caixa</Link>
        </article>
      </section>
    </>
  );
}
