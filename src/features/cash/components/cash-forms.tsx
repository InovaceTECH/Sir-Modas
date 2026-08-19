"use client";

import { ArrowDownCircle, LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { addCashMovement, type CashActionState } from "../actions/cash-actions";

const initialCashActionState: CashActionState = { status: "idle" };

export function CashMovementForm() {
  const [state, action, pending] = useActionState(addCashMovement, initialCashActionState);
  const router = useRouter();
  useEffect(() => { if (state.status === "success") router.refresh(); }, [router, state.status]);

  return <form action={action} className="ui-card p-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-brand-subtle text-brand-deep"><ArrowDownCircle size={18} /></span><div><h2 className="font-semibold">Nova movimentação</h2><p className="text-xs text-muted">Registre uma despesa, retirada ou reforço.</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="text-xs font-semibold text-muted">Tipo</span><select name="type" className="ui-input mt-1.5"><option value="cash_injection">Reforço</option><option value="withdrawal">Retirada</option><option value="expense">Despesa</option></select></label><label><span className="text-xs font-semibold text-muted">Valor</span><input name="amount" type="number" min="0.01" step="0.01" required className="ui-input mt-1.5" /></label><label className="sm:col-span-2"><span className="text-xs font-semibold text-muted">Motivo</span><input name="reason" required minLength={3} className="ui-input mt-1.5" placeholder="Ex.: pagamento de entrega" /></label><label className="sm:col-span-2"><span className="text-xs font-semibold text-muted">Observações (opcional)</span><input name="notes" className="ui-input mt-1.5" /></label></div>{state.message ? <p role="status" className={state.status === "success" ? "mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800" : "mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"}>{state.message}</p> : null}<button disabled={pending} className="ui-button-primary mt-5 disabled:opacity-50">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}{pending ? "Registrando..." : "Registrar"}</button></form>;
}
