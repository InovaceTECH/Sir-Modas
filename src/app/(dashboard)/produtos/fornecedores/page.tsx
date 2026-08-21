import { ArrowLeft, Plus, Power, Truck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { createSupplier, toggleSupplierStatus } from "@/features/catalog/actions/supplier-actions";
import { getSuppliers } from "@/features/catalog/queries/catalog";
import { requireStore } from "@/features/catalog/server/store-context";

export default async function SuppliersPage() {
  const { store } = await requireStore();
  if (!store) redirect("/configuracoes");
  const suppliers = await getSuppliers(store.id);

  return <><PageHeader title="Fornecedores" description="Cadastre os contatos usados para abastecer o catálogo." action={<Link href="/produtos" className="ui-button-secondary"><ArrowLeft size={17} /> Produtos</Link>} />
    <section className="ui-card p-5 sm:p-7"><h2 className="text-lg font-semibold">Novo fornecedor</h2><form action={createSupplier} className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Nome" name="name" required placeholder="Ex.: Distribuidora Central" /><Field label="Telefone (opcional)" name="phone" placeholder="(11) 99999-9999" /><label className="sm:col-span-2"><span className="text-sm font-semibold">Observações (opcional)</span><textarea name="notes" rows={3} className="ui-input mt-2 resize-y" placeholder="Prazo de entrega, contato ou condições" /></label><div className="sm:col-span-2"><button className="ui-button-primary"><Plus size={17} /> Cadastrar fornecedor</button></div></form></section>
    <section className="ui-card mt-6 overflow-hidden">{suppliers.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-border bg-background text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Fornecedor</th><th className="px-4 py-4">Telefone</th><th className="px-4 py-4">Observações</th><th className="px-5 py-4 text-right">Status</th></tr></thead><tbody className="divide-y divide-border/80">{suppliers.map((supplier) => <tr key={supplier.id} className={!supplier.active ? "opacity-55" : ""}><td className="px-5 py-4 font-semibold">{supplier.name}</td><td className="px-4 py-4">{supplier.phone ?? "—"}</td><td className="max-w-80 truncate px-4 py-4 text-muted">{supplier.notes ?? "—"}</td><td className="px-5 py-4 text-right"><form action={toggleSupplierStatus}><input type="hidden" name="id" value={supplier.id} /><input type="hidden" name="active" value={String(supplier.active)} /><ConfirmSubmitButton confirmation={supplier.active ? `Deseja inativar ${supplier.name}?` : `Deseja ativar ${supplier.name} novamente?`} className="ui-button-secondary ml-auto min-h-9 px-3 text-xs"><Power size={15} />{supplier.active ? "Inativar" : "Ativar"}</ConfirmSubmitButton></form></td></tr>)}</tbody></table></div> : <div className="px-6 py-16 text-center"><Truck className="mx-auto text-muted-soft" size={32} /><h2 className="mt-4 font-semibold">Nenhum fornecedor cadastrado</h2><p className="mt-1 text-sm text-muted">Cadastre o primeiro contato acima.</p></div>}</section>
  </>;
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label><span className="text-sm font-semibold">{label}</span><input {...props} className="ui-input mt-2" /></label>;
}
