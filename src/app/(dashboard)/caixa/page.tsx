import { CircleDollarSign, Clock3, WalletCards } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { CashMovementForm, CloseCashForm, OpenCashForm } from "@/features/cash/components/cash-forms";
import { getCashHistory, getOpenCashSession } from "@/features/cash/queries/cash";
import { requireStore } from "@/features/catalog/server/store-context";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const paymentLabels: Record<string, string> = { cash: "Dinheiro", pix: "Pix", debit_card: "Débito", credit_card: "Crédito" };
const movementLabels: Record<string, string> = { sale: "Venda", cash_injection: "Reforço", withdrawal: "Sangria", expense: "Despesa", cancellation: "Cancelamento", receivable_payment: "Recebimento de fiado", adjustment: "Ajuste" };

export default async function CashPage() {
  const { store } = await requireStore();
  if (!store) return <><PageHeader title="Caixa" description="Abertura, movimentações e conferência diária da loja." /><p className="ui-card p-6 text-sm text-muted">Configure a loja antes de usar o caixa.</p></>;
  const [open, history] = await Promise.all([getOpenCashSession(store.id), getCashHistory(store.id)]);

  return <><PageHeader title="Caixa" description="Abertura, movimentações e conferência diária da loja." action={open ? <Link href="/vendas/nova" className="ui-button-primary">Registrar venda</Link> : undefined} />
    {!open ? <OpenCashForm /> : <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Aberto com" value={currency.format(Number(open.session.openingAmount))} icon={WalletCards} /><Stat label="Dinheiro esperado" value={currency.format(open.expectedCash)} icon={CircleDollarSign} /><Stat label="Vendas registradas" value={String(open.movements.filter((item) => item.type === "sale").length)} icon={Clock3} /><Stat label="Total em vendas" value={currency.format(open.movements.filter((item) => item.type === "sale").reduce((sum, item) => sum + Number(item.amount), 0))} icon={CircleDollarSign} /></section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.8fr]"><article className="ui-card overflow-hidden"><div className="border-b border-border px-5 py-4"><h2 className="font-semibold">Movimentações do caixa</h2><p className="mt-1 text-xs text-muted">Aberto em {open.session.openedAt.toLocaleString("pt-BR")}</p></div>{open.movements.length ? <ul className="divide-y divide-border">{open.movements.map((movement) => { const negative = ["withdrawal", "expense", "cancellation"].includes(movement.type); return <li key={movement.id} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-medium">{movementLabels[movement.type] ?? movement.type}</p><p className="text-xs text-muted">{movement.paymentMethod ? paymentLabels[movement.paymentMethod] : movement.reason}</p></div><span className={negative ? "font-semibold text-red-700" : "font-semibold text-success-strong"}>{negative ? "−" : "+"}{currency.format(Number(movement.amount))}</span><time className="text-xs text-muted">{movement.occurredAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time></li>; })}</ul> : <p className="px-5 py-12 text-center text-sm text-muted">Nenhuma movimentação registrada.</p>}</article><div className="space-y-6"><CashMovementForm /><CloseCashForm expectedCash={open.expectedCash} /></div></section>
    </>}
    {history.length ? <section className="ui-card mt-6 overflow-hidden"><div className="border-b border-border px-5 py-4"><h2 className="font-semibold">Caixas anteriores</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-background text-xs uppercase text-muted"><tr><th className="px-5 py-3">Abertura</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Esperado</th><th className="px-4 py-3">Contado</th><th className="px-5 py-3">Diferença</th></tr></thead><tbody className="divide-y divide-border">{history.map((session) => <tr key={session.id}><td className="px-5 py-4">{session.openedAt.toLocaleString("pt-BR")}</td><td className="px-4 py-4">{session.status === "open" ? "Aberto" : "Fechado"}</td><td className="px-4 py-4">{session.expectedCashAmount ? currency.format(Number(session.expectedCashAmount)) : "—"}</td><td className="px-4 py-4">{session.countedAmount ? currency.format(Number(session.countedAmount)) : "—"}</td><td className="px-5 py-4">{session.differenceAmount ? currency.format(Number(session.differenceAmount)) : "—"}</td></tr>)}</tbody></table></div></section> : null}
  </>;
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof WalletCards }) { return <article className="ui-card p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted">{label}</p><Icon size={18} className="text-brand-deep" /></div><p className="mt-3 text-xl font-bold">{value}</p></article>; }
