"use client";

import { Banknote, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { type CustomerActionState, receivePayment } from "../actions/customer-actions";

const initialCustomerActionState: CustomerActionState = { status: "idle" };

export function ReceivablePaymentForm({ receivableId, remainingAmount }: Readonly<{ receivableId: string; remainingAmount: string }>) {
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState(receivePayment, initialCustomerActionState);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const idempotencyInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      idempotencyInputRef.current!.value = crypto.randomUUID();
      router.refresh();
    }
  }, [router, state.status]);

  return <form ref={formRef} action={action} className="mt-4 rounded-xl border border-border bg-background p-4">
    <input type="hidden" name="receivableId" value={receivableId} />
    <input ref={idempotencyInputRef} type="hidden" name="idempotencyKey" defaultValue={idempotencyKey} />
    <div className="grid gap-3 sm:grid-cols-2">
      <label><span className="text-xs font-semibold text-muted">Valor recebido</span><input name="amount" type="number" min="0.01" max={remainingAmount} step="0.01" required defaultValue={remainingAmount} className="ui-input mt-1.5" /></label>
      <label><span className="text-xs font-semibold text-muted">Forma de pagamento</span><select name="method" className="ui-input mt-1.5"><option value="cash">Dinheiro</option><option value="pix">Pix</option><option value="debit_card">Débito</option><option value="credit_card">Crédito</option></select></label>
      <label className="sm:col-span-2"><span className="text-xs font-semibold text-muted">Observação (opcional)</span><input name="notes" className="ui-input mt-1.5" placeholder="Ex.: primeira parcela" /></label>
    </div>
    {state.message ? <p role="status" className={state.status === "success" ? "mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800" : "mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"}>{state.message}</p> : null}
    <button disabled={pending} className="ui-button-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-45">{pending ? <LoaderCircle className="animate-spin" size={17} /> : <Banknote size={17} />}{pending ? "Registrando..." : "Registrar pagamento"}</button>
  </form>;
}
