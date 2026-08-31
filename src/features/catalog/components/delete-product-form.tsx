"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useActionState } from "react";

import {
  deleteProduct,
  type ProductListActionState,
} from "../actions/product-list-actions";

const initialState: ProductListActionState = { status: "idle" };

export function DeleteProductForm({
  productId,
  productName,
}: Readonly<{
  productId: string;
  productName: string;
}>) {
  const [state, action, pending] = useActionState(deleteProduct, initialState);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Excluir ${productName} permanentemente? Esta ação não pode ser desfeita.`,
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <button
        type="submit"
        disabled={pending}
        className="grid size-10 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
        aria-label={`Excluir ${productName}`}
        title={`Excluir ${productName}`}
      >
        {pending ? <LoaderCircle className="animate-spin" size={17} /> : <Trash2 size={17} />}
      </button>
      {state.status === "error" && state.message ? (
        <p className="mt-1 max-w-72 text-right text-xs leading-relaxed text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
