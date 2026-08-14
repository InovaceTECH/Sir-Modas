import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { requireStore } from "@/features/catalog/server/store-context";
import { ExchangeForm } from "@/features/exchanges/components/exchange-form";
import { isOutsideExchangeDeadline } from "@/features/exchanges/domain/exchange";
import { findSalesForExchange, getExchangeContext } from "@/features/exchanges/queries/exchanges";

export default async function NewExchangePage({ searchParams }: { searchParams: Promise<{ venda?: string; busca?: string }> }) {
  const { store } = await requireStore();
  if (!store) notFound();
  const params = await searchParams;
  const saleId = typeof params.venda === "string" ? params.venda : "";
  if (saleId) {
    const context = await getExchangeContext(store.id, saleId);
    if (!context) notFound();
    return <><PageHeader title="Registrar troca" description={`${context.sale.number} · ${context.sale.customerName || "Cliente não identificada"} · compra em ${context.sale.soldAt.toLocaleDateString("pt-BR")}`} /><ExchangeForm sale={context.sale} returnableItems={context.returnableItems} catalog={context.catalog} outsideDeadline={isOutsideExchangeDeadline(context.sale.soldAt, store.exchangeDeadlineDays)} /></>;
  }
  const query = typeof params.busca === "string" ? params.busca : "";
  const sales = await findSalesForExchange(store.id, query);
  return <><PageHeader title="Selecionar venda" description="Toda troca precisa estar vinculada à venda original." /><section className="ui-card p-5"><form className="flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} /><input name="busca" defaultValue={query} className="ui-input pl-10" placeholder="Número, cliente ou telefone" /></label><button className="ui-button-secondary">Pesquisar</button></form><div className="mt-5 divide-y divide-border">{sales.map((sale) => <Link key={sale.id} href={`/trocas/nova?venda=${sale.id}`} className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-semibold">{sale.number}</p><p className="text-xs text-muted">{sale.customerName || "Sem cliente"} · {sale.soldAt.toLocaleDateString("pt-BR")}</p></div><ArrowRight size={17} className="text-brand-deep" /></Link>)}</div></section></>;
}
