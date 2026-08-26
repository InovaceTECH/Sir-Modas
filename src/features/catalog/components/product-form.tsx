"use client";

import { ChevronDown, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { createProduct, type ProductFormState, updateProduct } from "../actions/save-product";
import { createSizeGrade, standardSizes } from "../product-variants";

type VariantRow = { key: string; id?: string; color: string; size: string; salePrice: number | null; initialQuantity: number | ""; stockChanged: boolean };
type Option = { id: string; name: string };
const createOptionValue = "__create_new__";
const initialProductFormState: ProductFormState = { status: "idle" };

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
    variants: Array<Omit<VariantRow, "key" | "initialQuantity" | "stockChanged"> & { quantity: number }>;
  };
}>) {
  const action = mode === "create" ? createProduct : updateProduct;
  const [state, formAction, pending] = useActionState(action, initialProductFormState);
  const [variants, setVariants] = useState<VariantRow[]>(initial?.variants.map((variant) => ({ ...variant, key: variant.id ?? crypto.randomUUID(), initialQuantity: variant.quantity, stockChanged: false })) ?? [{ key: "initial", color: "", size: "", salePrice: null, initialQuantity: 0, stockChanged: true }]);
  const [gradeColor, setGradeColor] = useState("");
  const [gradeSizes, setGradeSizes] = useState<string[]>([]);
  const [showOptionalInfo, setShowOptionalInfo] = useState(Boolean(initial?.brand || initial?.description || initial?.notes || initial?.photoUrl || initial?.supplierId));
  const formErrors = Object.values(state.errors ?? {}).flatMap((errors) => errors ?? []);

  function updateVariantText(key: string, field: "color" | "size", value: string) {
    setVariants((current) => current.map((variant) => variant.key === key ? { ...variant, [field]: value } : variant));
  }

  function updateVariantNumber(key: string, field: "salePrice" | "initialQuantity", value: string) {
    setVariants((current) => current.map((variant) => {
      if (variant.key !== key) return variant;
      if (field === "salePrice") return { ...variant, salePrice: value === "" ? null : Number(value) };
      return { ...variant, initialQuantity: value === "" ? "" : Number(value), stockChanged: true };
    }));
  }

  function toggleGradeSize(size: string) {
    setGradeSizes((current) => current.includes(size) ? current.filter((item) => item !== size) : [...current, size]);
  }

  function addSizeGrade() {
    setVariants((current) => {
      const existing = current.filter((variant) => variant.id || variant.color.trim() || variant.size.trim());
      return [
        ...existing,
        ...createSizeGrade(existing, gradeColor, gradeSizes).map((variant) => ({ ...variant, key: crypto.randomUUID(), salePrice: null, initialQuantity: 0, stockChanged: true })),
      ];
    });
    setGradeSizes([]);
  }

  return (
    <form action={formAction} className="space-y-6">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="variants" value={JSON.stringify(variants.map((variant) => ({ id: variant.id, color: variant.color, size: variant.size, salePrice: variant.salePrice, initialQuantity: variant.initialQuantity, adjustStock: variant.stockChanged })))} />

      <section className="ui-card p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Informações do produto</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Modelo / nome da peça" name="name" defaultValue={initial?.name} required placeholder="Ex.: Calça jeans skinny" hint="Modelos diferentes, como skinny e wide leg, devem ser produtos separados." className="sm:col-span-2" />
          <CatalogSelect label="Categoria" id="categoryId" name="categoryName" options={options.categories} initialValue={initial?.categoryId} createLabel="Cadastrar nova categoria" placeholder="Ex.: Feminino" />
          <CatalogSelect label="Tipo de produto" id="productTypeId" name="productTypeName" options={options.productTypes} initialValue={initial?.productTypeId} createLabel="Cadastrar novo tipo" placeholder="Ex.: Camiseta" />
          <Field label="Preço padrão de venda" name="salePrice" defaultValue={initial?.salePrice} required type="number" min="0.01" step="0.01" placeholder="0,00" hint="Será usado em todas as variações que não tiverem um preço específico." />
        </div>
        <button type="button" onClick={() => setShowOptionalInfo((current) => !current)} className="mt-5 flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left text-sm font-semibold text-brand-deep hover:bg-[#fff9f8]" aria-expanded={showOptionalInfo}><span>Adicionar mais informações (opcional)</span><ChevronDown size={18} className={showOptionalInfo ? "rotate-180 transition-transform" : "transition-transform"} /></button>
        {showOptionalInfo ? <div className="mt-5 grid gap-5 rounded-xl bg-background p-4 sm:grid-cols-2"><Field label="Marca" name="brand" defaultValue={initial?.brand} placeholder="Ex.: Sir Modas" /><SupplierSelect options={options.suppliers} initialValue={initial?.supplierId} /><Field label="Estoque mínimo por variação" name="minimumStock" defaultValue={initial?.minimumStock ?? 1} type="number" min="0" /><Field label="Preço de custo" name="costPrice" defaultValue={initial?.costPrice ?? "0"} type="number" min="0" step="0.01" placeholder="0,00" /><Field label="Descrição" name="description" defaultValue={initial?.description} className="sm:col-span-2" /><Field label="URL da foto" name="photoUrl" defaultValue={initial?.photoUrl} type="url" placeholder="https://..." className="sm:col-span-2" /><Field label="Observações" name="notes" defaultValue={initial?.notes} className="sm:col-span-2" /></div> : <><input type="hidden" name="brand" value={initial?.brand ?? ""} /><input type="hidden" name="supplierId" value={initial?.supplierId ?? ""} /><input type="hidden" name="supplierName" value="" /><input type="hidden" name="supplierPhone" value="" /><input type="hidden" name="supplierNotes" value="" /><input type="hidden" name="minimumStock" value={initial?.minimumStock ?? 1} /><input type="hidden" name="costPrice" value={initial?.costPrice ?? "0"} /><input type="hidden" name="description" value={initial?.description ?? ""} /><input type="hidden" name="photoUrl" value={initial?.photoUrl ?? ""} /><input type="hidden" name="notes" value={initial?.notes ?? ""} /></>}
      </section>

      <section className="ui-card p-5 sm:p-7">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row"><div><h2 className="text-lg font-semibold">Variações da peça</h2><p className="mt-1 text-sm text-muted">Cada cor e tamanho possui estoque próprio. Informe outro preço somente quando ele for diferente do preço padrão.</p></div><button type="button" onClick={() => setVariants((current) => [...current, { key: crypto.randomUUID(), color: "", size: "", salePrice: null, initialQuantity: 0, stockChanged: true }])} className="ui-button-secondary min-h-10 shrink-0 px-3"><Plus size={17} /> Adicionar variação</button></div>
        <div className="mt-5 rounded-xl bg-background p-4"><div><h3 className="text-sm font-semibold">Criar grade de tamanhos</h3><p className="mt-1 text-xs text-muted">Informe a cor e selecione os tamanhos para criar várias combinações de uma vez.</p></div><div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,12rem)_1fr_auto] lg:items-end"><label><span className="text-xs font-semibold text-muted">Cor</span><input value={gradeColor} onChange={(event) => setGradeColor(event.target.value)} placeholder="Ex.: Preta" className="ui-input mt-1.5" /></label><div><span className="text-xs font-semibold text-muted">Tamanhos</span><div className="mt-1.5 flex flex-wrap gap-2">{standardSizes.map((size) => <SizeButton key={size} size={size} selected={gradeSizes.includes(size)} onClick={() => toggleGradeSize(size)} />)}</div></div><button type="button" onClick={addSizeGrade} disabled={!gradeColor.trim() || !gradeSizes.length} className="ui-button-secondary disabled:cursor-not-allowed disabled:opacity-45"><Plus size={17} /> Criar grade</button></div></div>
        <div className="mt-5 space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.key} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.35fr_0.9fr_0.75fr_auto] lg:items-end">
              <VariantField label="Cor" value={variant.color} onChange={(value) => updateVariantText(variant.key, "color", value)} placeholder="Preta" />
              <SizePicker value={variant.size} onChange={(value) => updateVariantText(variant.key, "size", value)} />
              <VariantPriceField value={variant.salePrice} onChange={(value) => updateVariantNumber(variant.key, "salePrice", value)} />
              <VariantField label={variant.id ? "Estoque atual" : "Estoque inicial"} hint={variant.id ? "A alteração ficará no histórico." : undefined} value={String(variant.initialQuantity)} onChange={(value) => updateVariantNumber(variant.key, "initialQuantity", value)} type="number" />
              <button type="button" onClick={() => setVariants((current) => current.filter((item) => item.key !== variant.key))} disabled={variants.length === 1} className="grid size-12 place-items-center rounded-xl text-muted transition hover:bg-red-50 hover:text-red-700 disabled:opacity-30 sm:justify-self-end lg:justify-self-auto" aria-label={`Remover variação ${index + 1}`}><Trash2 size={18} /></button>
            </div>
          ))}
        </div>
      </section>

      {state.message ? <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"><p className="font-semibold">{state.message}</p>{formErrors.length ? <ul className="mt-2 list-disc space-y-1 pl-5">{[...new Set(formErrors)].map((error) => <li key={error}>{error}</li>)}</ul> : <p className="mt-1">O que você já preencheu continua nesta tela.</p>}</div> : null}
      <div className="flex flex-wrap justify-end gap-3"><Link href="/produtos" className="ui-button-secondary">Cancelar</Link><button disabled={pending} className="ui-button-primary disabled:opacity-60">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}{pending ? "Salvando..." : "Salvar produto"}</button></div>
    </form>
  );
}

function Field({ label, hint, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <label className={className}><span className="text-sm font-semibold">{label}</span>{hint ? <span className="mt-1 block text-xs leading-relaxed text-muted">{hint}</span> : null}<input {...props} className="ui-input mt-2" /></label>;
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

function VariantField({ label, hint, value, onChange, type = "text", placeholder }: { label: string; hint?: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label><span className="text-xs font-semibold text-muted">{label}</span>{hint ? <span className="mt-0.5 block text-[11px] text-muted">{hint}</span> : null}<input required type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="ui-input mt-1.5" /></label>;
}

function VariantPriceField({ value, onChange }: { value: number | null; onChange: (value: string) => void }) {
  return <label><span className="text-xs font-semibold text-muted">Preço específico</span><span className="mt-0.5 block text-[11px] text-muted">Opcional</span><input type="number" min="0.01" step="0.01" value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder="Usar padrão" className="ui-input mt-1" /></label>;
}
