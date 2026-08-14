"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useActionState } from "react";

import {
  saveStoreSettings,
  type StoreSettingsState,
} from "../actions/save-store-settings";

type StoreSettingsFormProps = Readonly<{
  initialValues: {
    name: string;
    phone: string;
    address: string;
    exchangeDeadlineDays: number;
  };
}>;

const initialState: StoreSettingsState = { status: "idle" };
const inputClassName = "ui-input mt-2";

function FieldError({ messages }: Readonly<{ messages?: string[] }>) {
  return messages?.length ? <p className="mt-1.5 text-xs text-red-700">{messages[0]}</p> : null;
}

export function StoreSettingsForm({ initialValues }: StoreSettingsFormProps) {
  const [state, action, pending] = useActionState(saveStoreSettings, initialState);

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="store-name" className="text-sm font-semibold text-foreground">Nome da loja</label>
          <input id="store-name" name="name" defaultValue={initialValues.name} required minLength={2} className={inputClassName} />
          <FieldError messages={state.errors?.name} />
        </div>
        <div>
          <label htmlFor="store-phone" className="text-sm font-semibold text-foreground">Telefone</label>
          <input id="store-phone" name="phone" type="tel" defaultValue={initialValues.phone} className={inputClassName} placeholder="(14) 99999-9999" />
          <FieldError messages={state.errors?.phone} />
        </div>
        <div>
          <label htmlFor="exchange-deadline" className="text-sm font-semibold text-foreground">Prazo de troca</label>
          <div className="relative">
            <input id="exchange-deadline" name="exchangeDeadlineDays" type="number" min={1} max={365} defaultValue={initialValues.exchangeDeadlineDays} required className={`${inputClassName} pr-16`} />
            <span className="pointer-events-none absolute inset-y-2 right-4 flex items-center pt-2 text-sm text-muted">dias</span>
          </div>
          <FieldError messages={state.errors?.exchangeDeadlineDays} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="store-address" className="text-sm font-semibold text-foreground">Endereço</label>
          <textarea id="store-address" name="address" defaultValue={initialValues.address} rows={3} className="ui-input mt-2 min-h-24 resize-y py-3" placeholder="Endereço da loja" />
          <FieldError messages={state.errors?.address} />
        </div>
      </div>

      {state.message ? <p role="status" className={state.status === "success" ? "rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" : "rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"}>{state.message}</p> : null}

      <button disabled={pending} className="ui-button-primary disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? <LoaderCircle className="animate-spin" aria-hidden="true" size={19} /> : <Save aria-hidden="true" size={19} />}
        {pending ? "Salvando..." : "Salvar configurações"}
      </button>
    </form>
  );
}
