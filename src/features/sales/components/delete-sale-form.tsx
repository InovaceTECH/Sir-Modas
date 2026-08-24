"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useActionState } from "react";

import { deleteCancelledSale, type SaleActionState } from "../actions/sale-actions";

const initialState: SaleActionState = { status: "idle" };

export function DeleteSaleForm({ saleId }: Readonly<{ saleId: string }>) {
  const [state, action, pending] = useActionState(deleteCancelledSale, initialState);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("Excluir esta venda cancelada definitivamente? Ela deixará de aparecer no histórico e nos relatórios.")) event.preventDefault();
      }}
      className="ui-card border-red-100 p-5"
    >
      <input type="hidden" name="saleId" value={saleId} />
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-red-50 text-red-700"><Trash2 size={17} /></span>
        <div><h2 className="font-semibold">Excluir do histórico</h2><p className="text-xs text-muted">Disponível somente porque a venda já foi cancelada.</p></div>
      </div>
      {state.message ? <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p> : null}
      <button disabled={pending} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50">
        {pending ? <LoaderCircle className="animate-spin" size={17} /> : <Trash2 size={17} />}{pending ? "Excluindo..." : "Excluir definitivamente"}
      </button>
    </form>
  );
}
