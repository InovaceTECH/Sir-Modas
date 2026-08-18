"use client";

import { ArrowDownCircle, ArrowUpCircle, LoaderCircle, LockKeyhole, Play, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { addCashMovement, type CashActionState, closeCash, openCash } from "../actions/cash-actions";

const initialCashActionState: CashActionState = { status: "idle" };

function Feedback({ state }: { state: { status: string; message?: string } }) {
  return state.message ? <p role="status" className={state.status === "success" ? "mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800" : "mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"}>{state.message}</p> : null;
}

function useRefreshOnSuccess(status: string) {
  const router = useRouter();
  useEffect(() => { if (status === "success") router.refresh(); }, [router, status]);
}

export function OpenCashForm() {
  const [state, action, pending] = useActionState(openCash, initialCashActionState);
  useRefreshOnSuccess(state.status);
  return <form action={action} className="ui-card max-w-2xl p-5 sm:p-7"><span className="grid size-10 place-items-center rounded-lg bg-brand text-black"><Play size={19} /></span><h2 className="mt-5 text-lg font-semibold">Abrir o caixa de hoje</h2><p className="mt-1 text-sm leading-6 text-muted">Informe quanto há em dinheiro físico antes da primeira venda.</p><label className="mt-6 block"><span className="text-sm font-semibold">Valor inicial em dinheiro</span><input name="openingAmount" type="number" min="0" step="0.01" required defaultValue="0.00" className="ui-input mt-2" /></label><label className="mt-5 block"><span className="text-sm font-semibold">Observações (opcional)</span><textarea name="openingNotes" className="ui-input mt-2 min-h-24 py-3" /></label><Feedback state={state} /><button disabled={pending} className="ui-button-primary mt-6 disabled:opacity-50">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <Play size={18} />}{pending ? "Abrindo..." : "Abrir caixa"}</button></form>;
}

export function CashMovementForm() {
  const [state, action, pending] = useActionState(addCashMovement, initialCashActionState);
  useRefreshOnSuccess(state.status);
  return <form action={action} className="ui-card p-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-brand-subtle text-brand-deep"><ArrowDownCircle size={18} /></span><div><h2 className="font-semibold">Nova movimentação</h2><p className="text-xs text-muted">Reforço, retirada ou despesa</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="text-xs font-semibold text-muted">Tipo</span><select name="type" className="ui-input mt-1.5"><option value="cash_injection">Reforço de caixa</option><option value="withdrawal">Sangria / retirada</option><option value="expense">Despesa</option></select></label><label><span className="text-xs font-semibold text-muted">Valor</span><input name="amount" type="number" min="0.01" step="0.01" required className="ui-input mt-1.5" /></label><label className="sm:col-span-2"><span className="text-xs font-semibold text-muted">Motivo</span><input name="reason" required minLength={3} className="ui-input mt-1.5" placeholder="Ex.: pagamento de entrega" /></label><label className="sm:col-span-2"><span className="text-xs font-semibold text-muted">Observações (opcional)</span><input name="notes" className="ui-input mt-1.5" /></label></div><Feedback state={state} /><button disabled={pending} className="ui-button-primary mt-5 disabled:opacity-50">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}Registrar</button></form>;
}

export function CloseCashForm({ expectedCash }: Readonly<{ expectedCash: number }>) {
  const [state, action, pending] = useActionState(closeCash, initialCashActionState);
  useRefreshOnSuccess(state.status);
  return <form action={action} className="ui-card p-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-black text-brand"><LockKeyhole size={18} /></span><div><h2 className="font-semibold">Fechar caixa</h2><p className="text-xs text-muted">Dinheiro esperado: {expectedCash.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div></div><label className="mt-5 block"><span className="text-xs font-semibold text-muted">Valor contado em dinheiro</span><input name="countedAmount" type="number" min="0" step="0.01" required className="ui-input mt-1.5" /></label><label className="mt-4 block"><span className="text-xs font-semibold text-muted">Observações (opcional)</span><textarea name="closingNotes" className="ui-input mt-1.5 min-h-20 py-3" /></label><Feedback state={state} /><button disabled={pending} className="ui-button-secondary mt-5 w-full disabled:opacity-50">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <ArrowUpCircle size={18} />}Conferir e fechar</button></form>;
}
