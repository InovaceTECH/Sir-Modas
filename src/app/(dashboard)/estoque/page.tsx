import { ArrowDownToLine, History, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { getRecentStockMovements, getStockOverview } from "@/features/catalog/queries/catalog";
import { requireStore } from "@/features/catalog/server/store-context";

const movementLabels: Record<string, string> = { initial: "Estoque inicial", entry: "Entrada", adjustment_in: "Ajuste de entrada", adjustment_out: "Ajuste de saída", sale: "Venda", sale_cancellation: "Cancelamento", exchange_in: "Troca — entrada", exchange_out: "Troca — saída", damaged: "Danificado" };

export default async function InventoryPage({ searchParams }: PageProps<"/estoque">) {
  const { store } = await requireStore();
  const params = await searchParams;
  const query = typeof params.busca === "string" ? params.busca : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const category = typeof params.categoria === "string" ? params.categoria : "";
  const color = typeof params.cor === "string" ? params.cor : "";
  const size = typeof params.tamanho === "string" ? params.tamanho : "";
  const [rows, allRows, movements] = store ? await Promise.all([getStockOverview(store.id, query, status, { category, color, size }), getStockOverview(store.id), getRecentStockMovements(store.id)]) : [[], [], []];
  const lowCount = allRows.filter((row) => row.quantity > 0 && row.quantity <= row.minimumStock).length;
  const outCount = allRows.filter((row) => row.quantity === 0).length;
  const categories = [...new Set(allRows.map((row) => row.categoryName).filter(Boolean))] as string[];
  const colors = [...new Set(allRows.map((row) => row.color))];
  const sizes = [...new Set(allRows.map((row) => row.size))];

  return <><PageHeader title="Estoque" description="Saldos por tamanho e cor, entradas e ajustes registrados." action={<Link href="/estoque/entrada" className="ui-button-primary"><ArrowDownToLine size={18} /> Nova entrada</Link>} />
    {!store ? <section className="ui-card p-6"><p className="text-sm text-muted">Configure a loja para começar a controlar o estoque.</p><Link href="/configuracoes" className="ui-button-primary mt-4">Abrir configurações</Link></section> : <>
      <section className="mb-5 grid gap-4 sm:grid-cols-3"><Summary label="Variações acompanhadas" value={allRows.length} /><Summary label="Estoque baixo" value={lowCount} warning={lowCount > 0} /><Summary label="Esgotadas" value={outCount} warning={outCount > 0} /></section>
      <form className="ui-card mb-5 grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[1fr_repeat(4,10rem)_auto]"><input name="busca" defaultValue={query} className="ui-input" placeholder="Produto ou cor" /><select name="status" defaultValue={status} className="ui-input"><option value="all">Todos os saldos</option><option value="low">Estoque baixo</option><option value="out">Esgotados</option></select><select name="categoria" defaultValue={category} className="ui-input"><option value="">Categorias</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><select name="cor" defaultValue={color} className="ui-input"><option value="">Cores</option>{colors.map((item) => <option key={item}>{item}</option>)}</select><select name="tamanho" defaultValue={size} className="ui-input"><option value="">Tamanhos</option>{sizes.map((item) => <option key={item}>{item}</option>)}</select><button className="ui-button-secondary">Filtrar</button></form>
      <section className="ui-card overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Produto</th><th className="px-4 py-4">Variação</th><th className="px-4 py-4">Categoria</th><th className="px-4 py-4">Saldo</th><th className="px-5 py-4 text-right">Ajuste</th></tr></thead><tbody className="divide-y divide-border/80">{rows.map((row) => { const statusLabel = row.quantity === 0 ? "Esgotado" : row.quantity <= row.minimumStock ? "Baixo" : "Disponível"; return <tr key={row.variantId}><td className="px-5 py-4"><p className="font-semibold">{row.productName}</p></td><td className="px-4 py-4">{row.color} · {row.size}</td><td className="px-4 py-4 text-muted">{row.categoryName ?? "—"}</td><td className="px-4 py-4"><p className="font-semibold">{row.quantity} un.</p><span className={statusLabel === "Disponível" ? "text-xs text-success-strong" : "text-xs font-semibold text-amber-700"}>{statusLabel}</span></td><td className="px-5 py-4 text-right"><Link href={`/estoque/ajuste?variacao=${row.variantId}`} className="inline-grid size-10 place-items-center rounded-lg text-muted hover:bg-brand-subtle hover:text-brand-deep" aria-label={`Ajustar estoque de ${row.productName}`}><SlidersHorizontal size={17} /></Link></td></tr>; })}</tbody></table></div>{!rows.length ? <div className="px-6 py-14 text-center text-sm text-muted">Nenhuma variação encontrada.</div> : null}</section>
      <section className="ui-card mt-6 overflow-hidden"><div className="flex items-center gap-3 border-b border-border px-5 py-4"><History className="text-brand-deep" size={19} /><div><h2 className="font-semibold">Movimentações recentes</h2><p className="text-xs text-muted">Histórico auditável das alterações de saldo</p></div></div>{movements.length ? <ul className="divide-y divide-border/80">{movements.map((movement) => <li key={movement.id} className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-medium">{movement.productName} · {movement.color} · {movement.size}</p><p className="mt-0.5 text-xs text-muted">{movementLabels[movement.type] ?? movement.type}{movement.reason ? ` — ${movement.reason}` : ""}</p></div><span className={movement.delta > 0 ? "font-semibold text-success-strong" : "font-semibold text-red-700"}>{movement.delta > 0 ? "+" : ""}{movement.delta}</span><time className="text-xs text-muted">{movement.occurredAt.toLocaleString("pt-BR")}</time></li>)}</ul> : <p className="px-5 py-10 text-center text-sm text-muted">Nenhuma movimentação registrada.</p>}</section>
    </>}
  </>;
}

function Summary({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) { return <article className="ui-card p-5"><p className="text-sm text-muted">{label}</p><p className={warning ? "mt-2 text-2xl font-bold text-amber-700" : "mt-2 text-2xl font-bold"}>{value}</p></article>; }
