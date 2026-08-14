"use client";

import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { createProduct, initialProductFormState, updateProduct } from "../actions/save-product";

type VariantRow = { key: string; id?: string; color: string; size: string; internalCode: string; initialQuantity: number };
type Option = { id: string; name: string };

export function ProductForm({
  mode,
  options,
  initial,
}: Readonly<{
  mode: "create" | "edit";
  options: { categories: Option[]; productTypes: Option[]; suppliers: Option[] };
  initial?: {
    id: string;
    name: string;
    internalCode: string;
    categoryName: string;
    productTypeName: string;
    supplierName: string;
    brand: string;
    description: string;
    notes: string;
    photoUrl: string;
    costPrice: string;
    salePrice: string;
    minimumStock: number;
    variants: Array<Omit<VariantRow, "key"> & { quantity: number }>;
  };
}>) {
  const action = mode === "create" ? createProduct : updateProduct;
  const [state, formAction, pending] = useActionState(action, initialProductFormState);
  const [variants, setVariants] = useState<VariantRow[]>(initial?.variants.map((variant) => ({ ...variant, key: variant.id ?? crypto.randomUUID(), initialQuantity: variant.quantity })) ?? [{ key: "initial", color: "", size: "", internalCode: "", initialQuantity: 0 }]);

  function updateVariant(key: string, field: keyof Omit<VariantRow, "key" | "id">, value: string) {
    setVariants((current) => current.map((variant) => variant.key === key ? { ...variant, [field]: field === "initialQuantity" ? Number(value) : value } : variant));
  }

  return (
    <form action={formAction} className="space-y-6">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="variants" value={JSON.stringify(variants.map((variant) => ({ id: variant.id, color: variant.color, size: variant.size, internalCode: variant.internalCode, initialQuantity: variant.initialQuantity })))} />

      <section className="ui-card p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Informações do produto</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Nome" name="name" defaultValue={initial?.name} required placeholder="Ex.: Camiseta básica" className="sm:col-span-2" />
          <Field label="Código interno" name="internalCode" defaultValue={initial?.internalCode} required placeholder="EX.: CAM-001" />
          <Field label="Marca (opcional)" name="brand" defaultValue={initial?.brand} placeholder="Ex.: Sir Modas" />
          <Field label="Categoria" name="categoryName" defaultValue={initial?.categoryName} required list="categories" placeholder="Feminino" />
          <Field label="Tipo de produto" name="productTypeName" defaultValue={initial?.productTypeName} required list="product-types" placeholder="Camiseta" />
          <Field label="Fornecedor (opcional)" name="supplierName" defaultValue={initial?.supplierName} list="suppliers" placeholder="Nome do fornecedor" />
          <Field label="Estoque mínimo por variação" name="minimumStock" defaultValue={initial?.minimumStock ?? 1} required type="number" min="0" />
          <Field label="Preço de custo" name="costPrice" defaultValue={initial?.costPrice} required type="number" min="0" step="0.01" placeholder="0,00" />
          <Field label="Preço de venda" name="salePrice" defaultValue={initial?.salePrice} required type="number" min="0.01" step="0.01" placeholder="0,00" />
          <Field label="Descrição (opcional)" name="description" defaultValue={initial?.description} className="sm:col-span-2" />
          <Field label="URL da foto (opcional)" name="photoUrl" defaultValue={initial?.photoUrl} type="url" placeholder="https://..." className="sm:col-span-2" />
          <Field label="Observações (opcional)" name="notes" defaultValue={initial?.notes} className="sm:col-span-2" />
        </div>
        <datalist id="categories">{options.categories.map((item) => <option key={item.id} value={item.name} />)}</datalist>
        <datalist id="product-types">{options.productTypes.map((item) => <option key={item.id} value={item.name} />)}</datalist>
        <datalist id="suppliers">{options.suppliers.map((item) => <option key={item.id} value={item.name} />)}</datalist>
      </section>

      <section className="ui-card p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Tamanhos e cores</h2><p className="mt-1 text-sm text-muted">Cada combinação possui seu próprio saldo.</p></div><button type="button" onClick={() => setVariants((current) => [...current, { key: crypto.randomUUID(), color: "", size: "", internalCode: "", initialQuantity: 0 }])} className="ui-button-secondary min-h-10 px-3"><Plus size={17} /> Adicionar</button></div>
        <div className="mt-5 space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.key} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1fr_0.7fr_1fr_0.65fr_auto] sm:items-end">
              <VariantField label="Cor" value={variant.color} onChange={(value) => updateVariant(variant.key, "color", value)} placeholder="Preta" />
              <VariantField label="Tamanho" value={variant.size} onChange={(value) => updateVariant(variant.key, "size", value)} placeholder="M" />
              <VariantField label="Código (opcional)" value={variant.internalCode} onChange={(value) => updateVariant(variant.key, "internalCode", value)} placeholder="CAM-PRE-M" />
              <VariantField label={variant.id ? "Saldo atual" : "Estoque inicial"} value={String(variant.initialQuantity)} onChange={(value) => updateVariant(variant.key, "initialQuantity", value)} type="number" disabled={Boolean(variant.id)} />
              <button type="button" onClick={() => setVariants((current) => current.filter((item) => item.key !== variant.key))} disabled={variants.length === 1} className="grid size-12 place-items-center rounded-xl text-muted transition hover:bg-red-50 hover:text-red-700 disabled:opacity-30" aria-label={`Remover variação ${index + 1}`}><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
      </section>

      {state.message ? <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p> : null}
      <div className="flex flex-wrap justify-end gap-3"><Link href="/produtos" className="ui-button-secondary">Cancelar</Link><button disabled={pending} className="ui-button-primary disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}{pending ? "Salvando..." : "Salvar produto"}</button></div>
    </form>
  );
}

function Field({ label, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className={className}><span className="text-sm font-semibold">{label}</span><input {...props} className="ui-input mt-2" /></label>;
}

function VariantField({ label, value, onChange, type = "text", disabled = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean; placeholder?: string }) {
  return <label><span className="text-xs font-semibold text-muted">{label}</span><input required={!disabled} disabled={disabled} type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="ui-input mt-1.5 disabled:bg-[#fbf7f4]" /></label>;
}
