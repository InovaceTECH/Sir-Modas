"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="ui-card mx-auto max-w-xl p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-red-700"><AlertTriangle aria-hidden="true" size={24} /></span>
      <h1 className="mt-5 text-xl font-bold tracking-[-0.02em]">Não foi possível carregar esta área</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Confira a conexão e tente novamente. Nenhuma alteração incompleta foi salva.</p>
      <button onClick={retry} className="ui-button-primary mx-auto mt-6"><RefreshCw aria-hidden="true" size={18} />Tentar novamente</button>
    </section>
  );
}
