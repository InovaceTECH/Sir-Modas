import { AlertCircle, ArrowRight, CircleDollarSign, Plus, Search, Users } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { requireStore } from "@/features/catalog/server/store-context";
import { getCustomers, getReceivablesSummary } from "@/features/customers/queries/customers";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ busca?: string; situacao?: string }> }) {
  const { store } = await requireStore();
  const params = await searchParams;
  const query = typeof params.busca === "string" ? params.busca : "";
  const status = typeof params.situacao === "string" ? params.situacao : "all";
  const [rows, summary] = store ? await Promise.all([getCustomers(store.id, query, status), getReceivablesSummary(store.id)]) : [[], { openAmount: "0", overdueAmount: "0", overdueCount: 0 }];

  return <>
    <PageHeader title="Clientes e fiado" description="Acompanhe relacionamento, compras e valores a receber." action={<Link href="/clientes/novo" className="ui-button-primary"><Plus size={18} /> Nova cliente</Link>} />
    <section className="mb-5 grid gap-4 sm:grid-cols-3">
      <article className="ui-card p-5"><span className="grid size-9 place-items-center rounded-lg bg-brand-subtle text-brand-deep"><Users size={18} /></span><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Clientes encontradas</p><strong className="mt-1 block text-2xl">{rows.length}</strong></article>
      <article className="ui-card p-5"><span className="grid size-9 place-items-center rounded-lg bg-background text-muted"><CircleDollarSign size={18} /></span><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Total em aberto</p><strong className="mt-1 block text-2xl">{currency.format(Number(summary.openAmount))}</strong></article>
      <article className="ui-card p-5"><span className="grid size-9 place-items-center rounded-lg bg-red-50 text-red-700"><AlertCircle size={18} /></span><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Total vencido</p><strong className="mt-1 block text-2xl text-red-700">{currency.format(Number(summary.overdueAmount))}</strong><p className="mt-1 text-xs text-muted">{summary.overdueCount} conta(s) vencida(s)</p></article>
    </section>
    <form className="ui-card mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_13rem_auto]">
      <label className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} /><input name="busca" defaultValue={query} className="ui-input pl-10" placeholder="Buscar por nome ou telefone" /></label>
      <select name="situacao" defaultValue={status} className="ui-input"><option value="all">Todas as clientes</option><option value="open">Com saldo aberto</option><option value="overdue">Com conta vencida</option></select>
      <button className="ui-button-secondary">Filtrar</button>
    </form>
    <section className="ui-card overflow-hidden">
      {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Cliente</th><th className="px-4 py-4">Compras</th><th className="px-4 py-4">Última compra</th><th className="px-4 py-4">Saldo fiado</th><th className="px-5 py-4 text-right">Detalhes</th></tr></thead><tbody className="divide-y divide-border/80">{rows.map((row) => <tr key={row.id}><td className="px-5 py-4"><p className="font-semibold">{row.name}</p><p className="mt-0.5 text-xs text-muted">{row.phone}</p></td><td className="px-4 py-4"><p className="font-semibold">{currency.format(Number(row.purchaseTotal))}</p><p className="text-xs text-muted">{row.saleCount} compra(s)</p></td><td className="px-4 py-4 text-muted">{row.lastPurchaseAt ? row.lastPurchaseAt.toLocaleDateString("pt-BR") : "—"}</td><td className="px-4 py-4"><strong className={row.overdueCount ? "text-red-700" : Number(row.openBalance) ? "text-amber-700" : "text-success-strong"}>{currency.format(Number(row.openBalance))}</strong>{row.overdueCount ? <p className="text-xs text-red-700">{row.overdueCount} vencida(s)</p> : null}</td><td className="px-5 py-4"><Link href={`/clientes/${row.id}`} className="ml-auto flex w-fit items-center gap-1 font-semibold text-brand-deep">Abrir <ArrowRight size={16} /></Link></td></tr>)}</tbody></table></div> : <div className="px-6 py-16 text-center"><Users className="mx-auto text-muted-soft" size={32} /><h2 className="mt-4 font-semibold">Nenhuma cliente encontrada</h2><p className="mt-1 text-sm text-muted">Cadastre a primeira cliente ou altere os filtros.</p></div>}
    </section>
  </>;
}
