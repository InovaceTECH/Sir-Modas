"use client";

import { Ban, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { cancelSale, initialSaleActionState } from "../actions/sale-actions";

export function CancelSaleForm({ saleId }: Readonly<{ saleId: string }>) {
  const [state, action, pending] = useActionState(cancelSale, initialSaleActionState);
  const router = useRouter();
  useEffect(() => { if (state.status === "success") router.refresh(); }, [router, state.status]);
  return <form action={action} className="ui-card border-red-100 p-5"><input type="hidden" name="saleId" value={saleId} /><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-red-50 text-red-700"><Ban size={17} /></span><div><h2 className="font-semibold">Cancelar venda</h2><p className="text-xs text-muted">Estorna estoque e financeiro</p></div></div><label className="mt-4 block"><span className="text-xs font-semibold text-muted">Motivo</span><textarea name="reason" required minLength={5} className="ui-input mt-1.5 min-h-24 py-3" placeholder="Explique o motivo do cancelamento" /></label>{state.message ? <p className={state.status === "success" ? "mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800" : "mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"}>{state.message}</p> : null}<button disabled={pending || state.status === "success"} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{pending ? <LoaderCircle className="animate-spin" size={17} /> : <Ban size={17} />}{pending ? "Cancelando..." : "Confirmar cancelamento"}</button></form>;
}
