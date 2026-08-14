import { AlertTriangle, ArrowLeft, ArrowRight, PackageCheck, PackageX } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { requireStore } from "@/features/catalog/server/store-context";
import { getExchangeDetails } from "@/features/exchanges/queries/exchanges";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function ExchangeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { store } = await requireStore();
  if (!store) notFound();
  const { id } = await params;
  const result = await getExchangeDetails(store.id, id);
  if (!result) notFound();
  const { exchange, items } = result;
  const returned = items.find((item) => item.direction === "returned");
  const delivered = items.find((item) => item.direction === "delivered");
  return <><PageHeader title="Troca registrada" description={`${exchange.exchangedAt.toLocaleString("pt-BR")} · motivo: ${exchange.reason}`} action={<Link href="/trocas" className="ui-button-secondary"><ArrowLeft size={17} /> Trocas</Link>} />
    {exchange.outsideDeadline ? <p className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"><AlertTriangle size={17} /> Esta troca foi autorizada fora do prazo configurado.</p> : null}
    <section className="grid gap-6 xl:grid-cols-[1fr_auto_1fr]"><ExchangeItem title="Produto devolvido" item={returned} returned /><div className="hidden items-center xl:flex"><ArrowRight className="text-brand-deep" /></div><ExchangeItem title="Produto entregue" item={delivered} /></section>
    <section className="mt-6 grid gap-6 lg:grid-cols-2"><article className="ui-card p-5"><h2 className="font-semibold">Venda original</h2><p className="mt-4 text-sm text-muted">Número</p><Link href={`/vendas/${exchange.saleId}`} className="mt-1 inline-flex items-center gap-1 font-semibold text-brand-deep">{exchange.saleNumber} <ArrowRight size={15} /></Link><p className="mt-4 text-sm text-muted">Cliente</p><p className="mt-1 font-semibold">{exchange.customerName || "Não identificada"}</p><p className="mt-4 text-sm text-muted">Compra realizada em</p><p className="mt-1 font-semibold">{exchange.soldAt.toLocaleDateString("pt-BR")}</p></article><article className="rounded-xl bg-black p-6 text-white"><p className="text-sm text-white/60">Diferença registrada</p><strong className="mt-2 block text-3xl text-brand">{currency.format(Number(exchange.differenceAmount))}</strong><p className="mt-4 text-sm leading-6 text-white/65">{Number(exchange.differenceAmount) > 0 ? "Valor recebido da cliente e lançado no caixa." : Number(exchange.differenceAmount) < 0 ? "Crédito ou ajuste da loja registrado para conferência." : "Troca realizada sem diferença de valor."}</p><p className="mt-5 border-t border-white/10 pt-4 text-sm text-white/70">{exchange.notes || "Nenhuma observação."}</p></article></section>
  </>;
}

function ExchangeItem({ title, item, returned = false }: { title: string; item?: { productName: string; color: string; size: string; quantity: number; unitPrice: string; returnedToStock: boolean }; returned?: boolean }) {
  if (!item) return <article className="ui-card p-5">Item não encontrado.</article>;
  const Icon = returned && !item.returnedToStock ? PackageX : PackageCheck;
  return <article className="ui-card p-6"><span className={returned && !item.returnedToStock ? "grid size-10 place-items-center rounded-lg bg-red-50 text-red-700" : "grid size-10 place-items-center rounded-lg bg-brand-subtle text-brand-deep"}><Icon size={20} /></span><p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p><h2 className="mt-2 text-lg font-semibold">{item.productName}</h2><p className="mt-1 text-sm text-muted">{item.color} · {item.size} · {item.quantity} peça(s)</p><strong className="mt-4 block">{currency.format(Number(item.unitPrice))} por peça</strong>{returned ? <p className={item.returnedToStock ? "mt-4 text-sm font-semibold text-success-strong" : "mt-4 text-sm font-semibold text-red-700"}>{item.returnedToStock ? "Retornou ao estoque" : "Registrado como indisponível"}</p> : <p className="mt-4 text-sm font-semibold text-brand-deep">Retirado do estoque</p>}</article>;
}
