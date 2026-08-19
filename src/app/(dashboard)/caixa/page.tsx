import { CircleDollarSign, Clock3, WalletCards } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { CashMovementForm } from "@/features/cash/components/cash-forms";
import { getFinancialMovements } from "@/features/cash/queries/cash";
import { requireStore } from "@/features/catalog/server/store-context";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const paymentLabels: Record<string, string> = { cash: "Dinheiro", pix: "Pix", debit_card: "Débito", credit_card: "Crédito" };
const movementLabels: Record<string, string> = { sale: "Venda", cash_injection: "Reforço", withdrawal: "Retirada", expense: "Despesa", cancellation: "Cancelamento", receivable_payment: "Recebimento de fiado", adjustment: "Ajuste" };

export default async function CashPage() {
  const { store } = await requireStore();
  if (!store) return <><PageHeader title="Movimentações financeiras" description="Vendas e lançamentos ficam registrados automaticamente." /><p className="ui-card p-6 text-sm text-muted">Configure a loja antes de usar o financeiro.</p></>;
  const movements = await getFinancialMovements(store.id);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const todayMovements = movements.filter((movement) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(movement.occurredAt) === today);
  const salesToday = todayMovements.filter((movement) => movement.type === "sale").reduce((total, movement) => total + Number(movement.amount), 0);
  const receivedToday = todayMovements.filter((movement) => ["sale", "receivable_payment", "cash_injection", "adjustment"].includes(movement.type)).reduce((total, movement) => total + Number(movement.amount), 0) - todayMovements.filter((movement) => ["withdrawal", "expense", "cancellation"].includes(movement.type)).reduce((total, movement) => total + Number(movement.amount), 0);

  return <><PageHeader title="Movimentações financeiras" description="Cada venda, recebimento e lançamento registra data e hora automaticamente." action={<Link href="/vendas/nova" className="ui-button-primary">Registrar venda</Link>} />
    <section className="grid gap-4 sm:grid-cols-3"><Stat label="Vendas hoje" value={currency.format(salesToday)} icon={CircleDollarSign} /><Stat label="Saldo movimentado hoje" value={currency.format(receivedToday)} icon={WalletCards} /><Stat label="Lançamentos hoje" value={String(todayMovements.length)} icon={Clock3} /></section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.8fr]"><article className="ui-card overflow-hidden"><div className="border-b border-border px-5 py-4"><h2 className="font-semibold">Histórico financeiro</h2><p className="mt-1 text-xs text-muted">Últimos registros da loja, em ordem de data e hora.</p></div>{movements.length ? <ul className="divide-y divide-border">{movements.map((movement) => { const negative = ["withdrawal", "expense", "cancellation"].includes(movement.type); return <li key={movement.id} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-medium">{movementLabels[movement.type] ?? movement.type}</p><p className="text-xs text-muted">{movement.paymentMethod ? paymentLabels[movement.paymentMethod] : movement.reason}</p></div><span className={negative ? "font-semibold text-red-700" : "font-semibold text-success-strong"}>{negative ? "−" : "+"}{currency.format(Number(movement.amount))}</span><time className="text-xs text-muted">{movement.occurredAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</time></li>; })}</ul> : <p className="px-5 py-12 text-center text-sm text-muted">Nenhuma movimentação registrada ainda.</p>}</article><CashMovementForm /></section>
  </>;
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof WalletCards }) { return <article className="ui-card p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted">{label}</p><Icon size={18} className="text-brand-deep" /></div><p className="mt-3 text-xl font-bold">{value}</p></article>; }
