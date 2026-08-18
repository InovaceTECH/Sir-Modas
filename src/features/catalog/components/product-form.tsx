"use client";

import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { createProduct, initialProductFormState, updateProduct } from "../actions/save-product";
import { createSizeGrade, standardSizes } from "../product-variants";

type VariantRow = { key: string; id?: string; color: string; size: string; initialQuantity: number };
type Option = { id: string; name: string };
const createOptionValue = "__create_new__";

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
    categoryId: string;
    productTypeId: string;
    supplierId: string;
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
  const [variants, setVariants] = useState<VariantRow[]>(initial?.variants.map((variant) => ({ ...variant, key: variant.id ?? crypto.randomUUID(), initialQuantity: variant.quantity })) ?? [{ key: "initial", color: "", size: "", initialQuantity: 0 }]);
  const [gradeColor, setGradeColor] = useState("");
  const [gradeSizes, setGradeSizes] = useState<string[]>([]);

  function updateVariant(key: string, field: keyof Omit<VariantRow, "key" | "id">, value: string) {
    setVariants((current) => current.map((variant) => variant.key === key ? { ...variant, [field]: field === "initialQuantity" ? Number(value) : value } : variant));
  }

  function toggleGradeSize(size: string) {
    setGradeSizes((current) => current.includes(size) ? current.filter((item) => item !== size) : [...current, size]);
  }

  function addSizeGrade() {
    setVariants((current) => {
      const existing = current.filter((variant) => variant.id || variant.color.trim() || variant.size.trim());
      return [
        ...existing,
        ...createSizeGrade(existing, gradeColor, gradeSizes).map((variant) => ({ ...variant, key: crypto.randomUUID(), initialQuantity: 0 })),
      ];
    });
    setGradeSizes([]);
  }

  return (
    <form action={formAction} className="space-y-6">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="variants" value={JSON.stringify(variants.map((variant) => ({ id: variant.id, color: variant.color, size: variant.size, initialQuantity: variant.initialQuantity })))} />

      <section className="ui-card p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Informações do produto</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Nome" name="name" defaultValue={initial?.name} required placeholder="Ex.: Camiseta básica" className="sm:col-span-2" />
          <CatalogSelect label="Categoria" id="categoryId" name="categoryName" options={options.categories} initialValue={initial?.categoryId} createLabel="Cadastrar nova categoria" placeholder="Ex.: Feminino" />
          <CatalogSelect label="Tipo de produto" id="productTypeId" name="productTypeName" options={options.productTypes} initialValue={initial?.productTypeId} createLabel="Cadastrar novo tipo" placeholder="Ex.: Camiseta" />
          <Field label="Marca (opcional)" name="brand" defaultValue={initial?.brand} placeholder="Ex.: Sir Modas" />
          <SupplierSelect options={options.suppliers} initialValue={initial?.supplierId} />
          <Field label="Estoque mínimo por variação" name="minimumStock" defaultValue={initial?.minimumStock ?? 1} required type="number" min="0" />
          <Field label="Preço de custo" name="costPrice" defaultValue={initial?.costPrice} required type="number" min="0" step="0.01" placeholder="0,00" />
          <Field label="Preço de venda" name="salePrice" defaultValue={initial?.salePrice} required type="number" min="0.01" step="0.01" placeholder="0,00" />
          <Field label="Descrição (opcional)" name="description" defaultValue={initial?.description} className="sm:col-span-2" />
          <Field label="URL da foto (opcional)" name="photoUrl" defaultValue={initial?.photoUrl} type="url" placeholder="https://..." className="sm:col-span-2" />
          <Field label="Observações (opcional)" name="notes" defaultValue={initial?.notes} className="sm:col-span-2" />
        </div>
      </section>

      <section className="ui-card p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Tamanhos e cores</h2><p className="mt-1 text-sm text-muted">Cada combinação possui seu próprio saldo.</p></div><button type="button" onClick={() => setVariants((current) => [...current, { key: crypto.randomUUID(), color: "", size: "", initialQuantity: 0 }])} className="ui-button-secondary min-h-10 px-3"><Plus size={17} /> Adicionar manualmente</button></div>
        <div className="mt-5 rounded-xl bg-background p-4"><div><h3 className="text-sm font-semibold">Criar grade de tamanhos</h3><p className="mt-1 text-xs text-muted">Informe a cor e selecione os tamanhos para criar várias combinações de uma vez.</p></div><div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,12rem)_1fr_auto] lg:items-end"><label><span className="text-xs font-semibold text-muted">Cor</span><input value={gradeColor} onChange={(event) => setGradeColor(event.target.value)} placeholder="Ex.: Preta" className="ui-input mt-1.5" /></label><div><span className="text-xs font-semibold text-muted">Tamanhos</span><div className="mt-1.5 flex flex-wrap gap-2">{standardSizes.map((size) => <SizeButton key={size} size={size} selected={gradeSizes.includes(size)} onClick={() => toggleGradeSize(size)} />)}</div></div><button type="button" onClick={addSizeGrade} disabled={!gradeColor.trim() || !gradeSizes.length} className="ui-button-secondary disabled:cursor-not-allowed disabled:opacity-45"><Plus size={17} /> Criar grade</button></div></div>
        <div className="mt-5 space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.key} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-[1fr_1.5fr_0.65fr_auto] sm:items-end">
              <VariantField label="Cor" value={variant.color} onChange={(value) => updateVariant(variant.key, "color", value)} placeholder="Preta" />
              <SizePicker value={variant.size} onChange={(value) => updateVariant(variant.key, "size", value)} />
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

function CatalogSelect({ label, id, name, options, initialValue, createLabel, placeholder }: { label: string; id: "categoryId" | "productTypeId"; name: "categoryName" | "productTypeName"; options: Option[]; initialValue?: string; createLabel: string; placeholder: string }) {
  const [value, setValue] = useState(initialValue ?? "");
  const creating = value === createOptionValue;

  return <div><label><span className="text-sm font-semibold">{label}</span><select name={creating ? undefined : id} value={value} onChange={(event) => setValue(event.target.value)} required className="ui-input mt-2"><option value="">Selecione...</option>{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}<option value={createOptionValue}>+ {createLabel}</option></select></label>{creating ? <><input type="hidden" name={id} value="" /><Field label={`Novo(a) ${label.toLowerCase()}`} name={name} required placeholder={placeholder} className="mt-3 block" /></> : <input type="hidden" name={name} value="" />}</div>;
}

function SupplierSelect({ options, initialValue }: { options: Option[]; initialValue?: string }) {
  const [value, setValue] = useState(initialValue ?? "");
  const creating = value === createOptionValue;

  return <div className="sm:col-span-2"><label><span className="text-sm font-semibold">Fornecedor (opcional)</span><select name={creating ? undefined : "supplierId"} value={value} onChange={(event) => setValue(event.target.value)} className="ui-input mt-2"><option value="">Não vincular agora</option>{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}<option value={createOptionValue}>+ Cadastrar novo fornecedor</option></select></label>{creating ? <><input type="hidden" name="supplierId" value="" /><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Nome do fornecedor" name="supplierName" required placeholder="Ex.: Distribuidora Central" /><Field label="Telefone (opcional)" name="supplierPhone" placeholder="(11) 99999-9999" /><label className="sm:col-span-2"><span className="text-sm font-semibold">Observações (opcional)</span><textarea name="supplierNotes" rows={3} placeholder="Ex.: prazo de entrega ou contato" className="ui-input mt-2 resize-y" /></label></div></> : <><input type="hidden" name="supplierName" value="" /><input type="hidden" name="supplierPhone" value="" /><input type="hidden" name="supplierNotes" value="" /></>}</div>;
}

function SizePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [custom, setCustom] = useState(() => Boolean(value) && !standardSizes.includes(value as (typeof standardSizes)[number]));

  function selectSize(size: string) {
    setCustom(false);
    onChange(size);
  }

  function enableCustomSize() {
    setCustom(true);
    if (standardSizes.includes(value as (typeof standardSizes)[number])) onChange("");
  }

  return <div><span className="text-xs font-semibold text-muted">Tamanho</span><div className="mt-1.5 flex flex-wrap gap-2">{standardSizes.map((size) => <SizeButton key={size} size={size} selected={!custom && value === size} onClick={() => selectSize(size)} />)}<button type="button" onClick={enableCustomSize} className={custom ? "rounded-lg border border-brand bg-brand-subtle px-3 py-2 text-xs font-semibold text-brand-deep" : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted hover:border-brand"}>Outro</button></div>{custom ? <input required value={value} onChange={(event) => onChange(event.target.value)} placeholder="Ex.: 42 ou 2 anos" className="ui-input mt-2" /> : null}</div>;
}

function SizeButton({ size, selected, onClick }: { size: string; selected: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={selected ? "rounded-lg border border-brand bg-brand-subtle px-3 py-2 text-xs font-semibold text-brand-deep" : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted hover:border-brand"}>{size}</button>;
}

function VariantField({ label, value, onChange, type = "text", disabled = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean; placeholder?: string }) {
  return <label><span className="text-xs font-semibold text-muted">{label}</span><input required={!disabled} disabled={disabled} type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="ui-input mt-1.5 disabled:bg-[#fbf7f4]" /></label>;
}
