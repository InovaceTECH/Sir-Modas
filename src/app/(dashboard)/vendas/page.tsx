import { Eye, Plus, Search, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { requireStore } from "@/features/catalog/server/store-context";
import { getSales, getSalesSummary } from "@/features/sales/queries/sales";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function SalesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { store } = await requireStore();
  const params = await searchParams;
  const query = typeof params.busca === "string" ? params.busca : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const rows = store ? await getSales(store.id, query, status) : [];
  const items = await getSalesSummary(store?.id ?? "", rows.map((row) => row.id));
  const pieceCount = new Map<string, number>();
  items.forEach((item) => pieceCount.set(item.saleId, (pieceCount.get(item.saleId) ?? 0) + item.quantity));
  const hasFilter = Boolean(query || status !== "all");
  return <><PageHeader title="Vendas" description="Histórico das vendas registradas e seus comprovantes." action={<Link href="/vendas/nova" className="ui-button-primary"><Plus size={18} /> Nova venda</Link>} /><form className="ui-card mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto]"><label className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} /><input name="busca" defaultValue={query} className="ui-input pl-10" placeholder="Número, cliente, produto ou origem" /></label><select name="status" defaultValue={status} className="ui-input"><option value="all">Todos os status</option><option value="confirmed">Confirmadas</option><option value="cancelled">Canceladas</option></select><button className="ui-button-secondary">Buscar</button></form><section className="ui-card overflow-hidden">{rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-background text-xs uppercase text-muted"><tr><th className="px-5 py-4">Cliente</th><th className="px-4 py-4">Data</th><th className="px-4 py-4">Origem</th><th className="px-4 py-4">Peças</th><th className="px-4 py-4">Total</th><th className="px-5 py-4 text-right">Detalhes</th></tr></thead><tbody className="divide-y divide-border">{rows.map((sale) => <tr key={sale.id}><td className="px-5 py-4"><p className="font-semibold">{sale.customerName ?? sale.number}</p>{sale.customerName ? <p className="mt-1 text-xs text-muted">{sale.number}</p> : null}<span className={sale.status === "confirmed" ? "mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-800" : "mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[0.65rem] font-semibold text-red-700"}>{sale.status === "confirmed" ? "Confirmada" : "Cancelada"}</span></td><td className="px-4 py-4">{sale.soldAt.toLocaleString("pt-BR")}</td><td className="px-4 py-4">{sale.source}</td><td className="px-4 py-4">{pieceCount.get(sale.id) ?? 0}</td><td className="px-4 py-4 font-semibold">{currency.format(Number(sale.totalAmount))}</td><td className="px-5 py-4 text-right"><Link href={`/vendas/${sale.id}`} className="inline-grid size-10 place-items-center rounded-lg text-muted hover:bg-brand-subtle hover:text-brand-deep" aria-label={`Ver ${sale.customerName ?? sale.number}`}><Eye size={17} /></Link></td></tr>)}</tbody></table></div> : <div className="px-6 py-16 text-center"><ShoppingBag className="mx-auto text-muted-soft" size={30} /><h2 className="mt-4 font-semibold">{hasFilter ? "Nenhuma venda encontrada com essa busca" : "Ainda não há vendas registradas"}</h2><p className="mt-1 text-sm text-muted">{hasFilter ? "Tente outro nome, número, produto ou filtro." : "Quando você finalizar uma venda, ela aparecerá aqui."}</p>{hasFilter ? <Link href="/vendas" className="ui-button-secondary mt-5">Limpar busca</Link> : null}</div>}</section></>;
}
