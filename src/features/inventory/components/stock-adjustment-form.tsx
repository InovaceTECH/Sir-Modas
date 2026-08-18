"use client";

import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { adjustStock, type StockActionState } from "../actions/stock-actions";

const initialStockActionState: StockActionState = { status: "idle" };

export function StockAdjustmentForm({ variant }: Readonly<{ variant: { variantId: string; productName: string; color: string; size: string; quantity: number } }>) {
  const [state, action, pending] = useActionState(adjustStock, initialStockActionState);
  return <form action={action} className="ui-card max-w-2xl p-5 sm:p-7"><input type="hidden" name="variantId" value={variant.variantId} /><div className="rounded-lg bg-[#fff9f8] p-4"><p className="font-semibold">{variant.productName}</p><p className="mt-1 text-sm text-muted">{variant.color} · tamanho {variant.size} · saldo no sistema: <strong>{variant.quantity}</strong></p></div><label className="mt-6 block"><span className="text-sm font-semibold">Quantidade contada fisicamente</span><input name="countedQuantity" type="number" min="0" required defaultValue={variant.quantity} className="ui-input mt-2" /></label><label className="mt-5 block"><span className="text-sm font-semibold">Motivo do ajuste</span><textarea name="reason" required minLength={5} className="ui-input mt-2 min-h-28 py-3" placeholder="Ex.: contagem física realizada na loja" /></label>{state.message ? <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p> : null}<div className="mt-6 flex justify-end gap-3"><Link href="/estoque" className="ui-button-secondary">Cancelar</Link><button disabled={pending} className="ui-button-primary disabled:opacity-50">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}{pending ? "Salvando..." : "Registrar ajuste"}</button></div></form>;
}
