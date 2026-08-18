"use client";

import { ArrowLeftRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { createExchange, type ExchangeActionState } from "../actions/exchange-actions";
import { exchangeReasons } from "../schemas/exchange";

const initialExchangeActionState: ExchangeActionState = { status: "idle" };

type ReturnableItem = { variantId: string; productName: string; variant: string; unitPrice: string; availableQuantity: number };
type CatalogItem = { variantId: string; productName: string; color: string; size: string; stock: number; price: string };
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function ExchangeForm({ sale, returnableItems, catalog, outsideDeadline }: Readonly<{ sale: { id: string; number: string }; returnableItems: ReturnableItem[]; catalog: CatalogItem[]; outsideDeadline: boolean }>) {
  const [state, action, pending] = useActionState(createExchange, initialExchangeActionState);
  const [returnedVariantId, setReturnedVariantId] = useState(returnableItems[0]?.variantId ?? "");
  const [returnedQuantity, setReturnedQuantity] = useState(1);
  const [deliveredVariantId, setDeliveredVariantId] = useState(catalog.find((item) => item.stock > 0)?.variantId ?? "");
  const [deliveredQuantity, setDeliveredQuantity] = useState(1);
  const returned = useMemo(() => returnableItems.find((item) => item.variantId === returnedVariantId), [returnableItems, returnedVariantId]);
  const delivered = useMemo(() => catalog.find((item) => item.variantId === deliveredVariantId), [catalog, deliveredVariantId]);
  const difference = (Number(delivered?.price ?? 0) * deliveredQuantity) - (Number(returned?.unitPrice ?? 0) * returnedQuantity);

  return <form action={action} className="space-y-6">
    <input type="hidden" name="saleId" value={sale.id} />
    {outsideDeadline ? <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">A venda está fora do prazo configurado. A troca ainda pode ser registrada, mas ficará sinalizada no histórico.</p> : null}
    <section className="grid gap-6 xl:grid-cols-2">
      <article className="ui-card p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wide text-muted">1. Produto devolvido</p><h2 className="mt-2 text-lg font-semibold">Item da venda {sale.number}</h2><div className="mt-5 space-y-4"><label><span className="text-sm font-semibold">Produto</span><select name="returnedVariantId" value={returnedVariantId} onChange={(event) => setReturnedVariantId(event.target.value)} className="ui-input mt-2">{returnableItems.map((item) => <option key={item.variantId} value={item.variantId}>{item.productName} · {item.variant} · {currency.format(Number(item.unitPrice))}</option>)}</select></label><label><span className="text-sm font-semibold">Quantidade</span><input name="returnedQuantity" type="number" min="1" max={returned?.availableQuantity ?? 1} value={returnedQuantity} onChange={(event) => setReturnedQuantity(Number(event.target.value))} required className="ui-input mt-2" /><span className="mt-1 block text-xs text-muted">Até {returned?.availableQuantity ?? 0} peça(s) disponível(is) para troca.</span></label><label><span className="text-sm font-semibold">Condição do produto</span><select name="returnedCondition" className="ui-input mt-2"><option value="sellable">Em condição de venda — volta ao estoque</option><option value="damaged">Com defeito/danificado — não volta ao estoque</option></select></label></div></article>
      <article className="ui-card p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wide text-muted">2. Novo produto</p><h2 className="mt-2 text-lg font-semibold">Item entregue à cliente</h2><div className="mt-5 space-y-4"><label><span className="text-sm font-semibold">Produto e variação</span><select name="deliveredVariantId" value={deliveredVariantId} onChange={(event) => setDeliveredVariantId(event.target.value)} className="ui-input mt-2">{catalog.filter((item) => item.stock > 0).map((item) => <option key={item.variantId} value={item.variantId}>{item.productName} · {item.color} · {item.size} · saldo {item.stock}</option>)}</select></label><label><span className="text-sm font-semibold">Quantidade</span><input name="deliveredQuantity" type="number" min="1" max={delivered?.stock ?? 1} value={deliveredQuantity} onChange={(event) => setDeliveredQuantity(Number(event.target.value))} required className="ui-input mt-2" /></label><div className="rounded-xl bg-background p-4"><div className="flex justify-between text-sm text-muted"><span>Valor devolvido</span><span>{currency.format(Number(returned?.unitPrice ?? 0) * returnedQuantity)}</span></div><div className="mt-2 flex justify-between text-sm text-muted"><span>Novo produto</span><span>{currency.format(Number(delivered?.price ?? 0) * deliveredQuantity)}</span></div><div className="mt-3 flex justify-between border-t border-border pt-3 font-bold"><span>{difference > 0 ? "Diferença a receber" : difference < 0 ? "Crédito/ajuste da loja" : "Sem diferença"}</span><span className={difference > 0 ? "text-success-strong" : difference < 0 ? "text-amber-700" : ""}>{currency.format(Math.abs(difference))}</span></div></div>{difference > 0 ? <label><span className="text-sm font-semibold">Pagamento da diferença</span><select name="paymentMethod" className="ui-input mt-2"><option value="cash">Dinheiro</option><option value="pix">Pix</option><option value="debit_card">Débito</option><option value="credit_card">Crédito</option></select></label> : null}{difference < 0 ? <p className="text-xs leading-5 text-amber-800">O valor ficará registrado como diferença negativa. O crédito ou reembolso deverá seguir a política combinada com a cliente.</p> : null}</div></article>
    </section>
    <section className="ui-card p-5 sm:p-6"><h2 className="font-semibold">Motivo e observações</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="text-sm font-semibold">Motivo</span><select name="reason" className="ui-input mt-2">{exchangeReasons.map((reason) => <option key={reason}>{reason}</option>)}</select></label><label><span className="text-sm font-semibold">Observações (opcional)</span><input name="notes" className="ui-input mt-2" placeholder="Detalhes da solicitação" /></label></div></section>
    {state.message ? <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p> : null}
    <div className="flex justify-end gap-3"><Link href="/trocas" className="ui-button-secondary">Cancelar</Link><button disabled={pending || !returnableItems.length || !deliveredVariantId} className="ui-button-primary disabled:opacity-45">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowLeftRight size={18} />}{pending ? "Confirmando..." : "Confirmar troca"}</button></div>
  </form>;
}
