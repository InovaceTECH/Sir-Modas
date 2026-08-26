import { Copy, PackagePlus, Pencil, Power, Search, Truck } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { duplicateProduct, toggleProductStatus } from "@/features/catalog/actions/product-list-actions";
import { getProducts } from "@/features/catalog/queries/catalog";
import { requireStore } from "@/features/catalog/server/store-context";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatPriceRange(minimum: string, maximum: string) {
  const minimumValue = Number(minimum);
  const maximumValue = Number(maximum);
  return minimumValue === maximumValue
    ? currency.format(minimumValue)
    : `${currency.format(minimumValue)} – ${currency.format(maximumValue)}`;
}

export default async function ProductsPage({ searchParams }: PageProps<"/produtos">) {
  const { store } = await requireStore();
  const params = await searchParams;
  const query = typeof params.busca === "string" ? params.busca : "";
  const status = typeof params.status === "string" ? params.status : "all";
  const rows = store ? await getProducts(store.id, query, status) : [];

  return <>
    <PageHeader title="Produtos" description="Catálogo, preços e variações disponíveis." action={<div className="flex flex-wrap gap-2"><Link href="/produtos/fornecedores" className="ui-button-secondary"><Truck size={18} /> Fornecedores</Link><Link href="/produtos/novo" className="ui-button-primary"><PackagePlus size={18} /> Novo produto</Link></div>} />
    {!store ? <section className="ui-card p-6"><h2 className="font-semibold">Configure a loja primeiro</h2><p className="mt-2 text-sm text-muted">Os produtos precisam estar vinculados aos dados da Sir Modas.</p><Link href="/configuracoes" className="ui-button-primary mt-5">Abrir configurações</Link></section> : <>
      <form className="ui-card mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_12rem_auto]">
        <label className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} /><input name="busca" defaultValue={query} className="ui-input pl-10" placeholder="Nome, categoria ou tipo" /></label>
        <select name="status" defaultValue={status} className="ui-input"><option value="all">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select>
        <button className="ui-button-secondary">Filtrar</button>
      </form>
      <section className="ui-card overflow-hidden">
        {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Produto</th><th className="px-4 py-4">Categoria</th><th className="px-4 py-4">Variações</th><th className="px-4 py-4">Estoque</th><th className="px-4 py-4">Venda</th><th className="px-5 py-4 text-right">Ações</th></tr></thead><tbody className="divide-y divide-border/80">{rows.map((row) => <tr key={row.id} className={!row.active ? "opacity-55" : ""}><td className="px-5 py-4"><p className="font-semibold">{row.name}</p></td><td className="px-4 py-4"><p>{row.categoryName ?? "—"}</p><p className="text-xs text-muted">{row.typeName ?? "—"}</p></td><td className="px-4 py-4">{row.variantCount}</td><td className="px-4 py-4"><span className={row.totalStock <= row.minimumStock ? "font-semibold text-amber-700" : "font-semibold text-success-strong"}>{row.totalStock} un.</span></td><td className="px-4 py-4 font-semibold">{formatPriceRange(row.minimumSalePrice, row.maximumSalePrice)}</td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Link href={`/produtos/${row.id}/editar`} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-brand-subtle hover:text-brand-deep" aria-label={`Editar ${row.name}`}><Pencil size={17} /></Link><form action={duplicateProduct}><input type="hidden" name="id" value={row.id} /><button className="grid size-10 place-items-center rounded-lg text-muted hover:bg-background" aria-label={`Duplicar ${row.name}`}><Copy size={17} /></button></form><form action={toggleProductStatus}><input type="hidden" name="id" value={row.id} /><input type="hidden" name="active" value={String(row.active)} /><ConfirmSubmitButton confirmation={row.active ? `Deseja inativar ${row.name}? Ele não aparecerá nas vendas até ser ativado novamente.` : `Deseja ativar ${row.name} novamente?`} className="grid size-10 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-700" aria-label={row.active ? `Inativar ${row.name}` : `Ativar ${row.name}`}><Power size={17} /></ConfirmSubmitButton></form></div></td></tr>)}</tbody></table></div> : <div className="px-6 py-16 text-center"><PackagePlus className="mx-auto text-muted-soft" size={32} /><h2 className="mt-4 font-semibold">Nenhum produto encontrado</h2><p className="mt-1 text-sm text-muted">Cadastre o primeiro produto ou altere os filtros.</p></div>}
      </section>
    </>}
  </>;
}
