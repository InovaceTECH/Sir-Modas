import { ArrowLeft, CheckCircle2, UserRound, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { requireStore } from "@/features/catalog/server/store-context";
import { CancelSaleForm } from "@/features/sales/components/cancel-sale-form";
import { getSaleDetails } from "@/features/sales/queries/sales";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const paymentLabels: Record<string, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  debit_card: "Cartão de débito",
  credit_card: "Cartão de crédito",
  on_account: "Fiado",
};

export default async function SaleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { store } = await requireStore();
  if (!store) notFound();

  const { id } = await params;
  const result = await getSaleDetails(store.id, id);
  if (!result) notFound();

  const { sale, items, payments, customer } = result;
  const cancelled = sale.status === "cancelled";

  return <>
    <PageHeader
      title={`Venda ${sale.number}`}
      description={`Registrada em ${sale.soldAt.toLocaleString("pt-BR")} · ${sale.source}`}
      action={<Link href="/vendas" className="ui-button-secondary"><ArrowLeft size={17} /> Vendas</Link>}
    />
    <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <div className="space-y-6">
        <article className="ui-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Itens</h2>
            <span className={cancelled ? "flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700" : "flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"}>
              {cancelled ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
              {cancelled ? "Cancelada" : "Confirmada"}
            </span>
          </div>
          <ul className="divide-y divide-border">
            {items.map((item) => <li key={item.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div><p className="text-sm font-semibold">{item.productNameSnapshot}</p><p className="text-xs text-muted">{item.variantSnapshot}</p></div>
              <span className="text-sm text-muted">{item.quantity} × {currency.format(Number(item.unitPrice))}</span>
              <span className="text-sm font-semibold">{currency.format(Number(item.totalAmount))}</span>
            </li>)}
          </ul>
        </article>
        <article className="ui-card p-5">
          <h2 className="font-semibold">Observações</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{sale.notes || "Nenhuma observação registrada."}</p>
          {sale.cancellationReason ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800"><strong>Cancelamento:</strong> {sale.cancellationReason}</p> : null}
        </article>
      </div>
      <div className="space-y-6">
        <article className="ui-card p-5">
          <h2 className="font-semibold">Resumo</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd>{currency.format(Number(sale.subtotal))}</dd></div>
            <div className="flex justify-between text-muted"><dt>Desconto</dt><dd>− {currency.format(Number(sale.discountAmount))}</dd></div>
            <div className="flex justify-between border-t border-border pt-4 text-lg font-bold"><dt>Total</dt><dd>{currency.format(Number(sale.totalAmount))}</dd></div>
          </dl>
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pagamento</p>
            {payments.map((payment) => <div key={payment.id} className="mt-2 flex justify-between text-sm"><span>{paymentLabels[payment.method]}{payment.installments && payment.installments > 1 ? ` · ${payment.installments}x` : ""}</span><strong>{currency.format(Number(payment.amount))}</strong></div>)}
          </div>
        </article>
        <article className="ui-card p-5">
          <div className="flex items-center gap-2"><UserRound size={18} className="text-brand-deep" /><h2 className="font-semibold">Cliente</h2></div>
          {customer ? <div className="mt-4"><Link href={`/clientes/${customer.id}`} className="font-semibold text-brand-deep hover:underline">{customer.name}</Link><p className="mt-1 text-sm text-muted">{customer.phone}</p></div> : <p className="mt-4 text-sm text-muted">Venda sem cliente vinculada.</p>}
        </article>
        {!cancelled ? <CancelSaleForm saleId={sale.id} /> : null}
      </div>
    </section>
  </>;
}
