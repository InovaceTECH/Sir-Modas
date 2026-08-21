"use client";

import { LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { createCustomer, type CustomerActionState, updateCustomer } from "../actions/customer-actions";

const initialCustomerActionState: CustomerActionState = { status: "idle" };

type CustomerInitial = { id: string; name: string; phone: string };

export function CustomerForm({ initial }: Readonly<{ initial?: CustomerInitial }>) {
  const [state, action, pending] = useActionState(initial ? updateCustomer : createCustomer, initialCustomerActionState);
  return <form action={action} className="space-y-6">
    {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
    <section className="ui-card p-5 sm:p-7">
      <h2 className="text-lg font-semibold">Dados da cliente</h2>
      <p className="mt-1 text-sm text-muted">Informe apenas o essencial. O telefone será usado para contato pelo WhatsApp.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field label="Nome completo" name="name" required defaultValue={initial?.name} placeholder="Ex.: Maria da Silva" className="sm:col-span-2" error={state.errors?.name?.[0]} />
        <Field label="Telefone / WhatsApp" name="phone" required defaultValue={initial?.phone} placeholder="(11) 99999-9999" error={state.errors?.phone?.[0]} />
      </div>
    </section>
    {state.message ? <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p> : null}
    <div className="flex justify-end gap-3"><Link href={initial ? `/clientes/${initial.id}` : "/clientes"} className="ui-button-secondary">Cancelar</Link><button disabled={pending} className="ui-button-primary disabled:opacity-50">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}{pending ? "Salvando..." : "Salvar cliente"}</button></div>
  </form>;
}

function Field({ label, error, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return <label className={className}><span className="text-sm font-semibold">{label}</span><input {...props} className="ui-input mt-2" />{error ? <span className="mt-1 block text-xs text-red-700">{error}</span> : null}</label>;
}
