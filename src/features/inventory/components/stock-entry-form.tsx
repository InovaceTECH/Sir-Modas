"use client";

import { LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { createStockEntry, type StockActionState } from "../actions/stock-actions";

const initialStockActionState: StockActionState = { status: "idle" };

type StockOption = { variantId: string; productName: string; color: string; size: string; quantity: number; salePrice: string };
type Item = { key: string; variantId: string; quantity: number; unitCost: number; salePrice: number; salePriceChanged: boolean };

export function StockEntryForm({ options, suppliers }: Readonly<{ options: StockOption[]; suppliers: string[] }>) {
  const [state, action, pending] = useActionState(createStockEntry, initialStockActionState);
  const [items, setItems] = useState<Item[]>([{ key: "initial", variantId: "", quantity: 1, unitCost: 0, salePrice: 0, salePriceChanged: false }]);

  function update(key: string, field: "variantId" | "quantity" | "unitCost" | "salePrice", value: string) {
    setItems((current) => current.map((item) => {
      if (item.key !== key) return item;
      if (field === "variantId") {
        const selected = options.find((option) => option.variantId === value);
        return { ...item, variantId: value, salePrice: Number(selected?.salePrice ?? item.salePrice), salePriceChanged: false };
      }
      return { ...item, [field]: Number(value), ...(field === "salePrice" ? { salePriceChanged: true } : {}) };
    }));
  }

  return <form action={action} className="space-y-6">
    <input type="hidden" name="items" value={JSON.stringify(items.map((item) => ({ variantId: item.variantId, quantity: item.quantity, unitCost: item.unitCost, salePrice: item.salePrice, updateSalePrice: item.salePriceChanged })))} />
    <section className="ui-card p-5 sm:p-7"><h2 className="text-lg font-semibold">Dados da entrada</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><label><span className="text-sm font-semibold">Fornecedor</span><input name="supplierName" list="supplier-list" className="ui-input mt-2" placeholder="Opcional" /></label><label><span className="text-sm font-semibold">Nota ou pedido</span><input name="documentNumber" className="ui-input mt-2" placeholder="Opcional" /></label><label className="sm:col-span-2"><span className="text-sm font-semibold">Observações</span><textarea name="notes" className="ui-input mt-2 min-h-24 py-3" /></label></div><datalist id="supplier-list">{suppliers.map((name) => <option key={name} value={name} />)}</datalist></section>
    <section className="ui-card p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Itens recebidos</h2><p className="mt-1 text-sm text-muted">A confirmação atualiza todos os saldos. O preço da variação só muda quando você altera o campo.</p></div><button type="button" onClick={() => setItems((current) => [...current, { key: crypto.randomUUID(), variantId: "", quantity: 1, unitCost: 0, salePrice: 0, salePriceChanged: false }])} className="ui-button-secondary min-h-10 px-3"><Plus size={17} /> Item</button></div>
      <div className="mt-5 space-y-3">{items.map((item, index) => <div key={item.key} className="grid gap-3 rounded-xl border border-border p-4 lg:grid-cols-[2fr_0.55fr_0.75fr_0.75fr_auto] lg:items-end"><label><span className="text-xs font-semibold text-muted">Produto e variação</span><select required value={item.variantId} onChange={(event) => update(item.key, "variantId", event.target.value)} className="ui-input mt-1.5"><option value="">Selecione...</option>{options.map((option) => <option key={option.variantId} value={option.variantId}>{option.productName} · {option.color} · {option.size} (saldo {option.quantity})</option>)}</select></label><NumberField label="Quantidade" value={item.quantity} onChange={(value) => update(item.key, "quantity", value)} min="1" /><NumberField label="Custo unitário" value={item.unitCost} onChange={(value) => update(item.key, "unitCost", value)} step="0.01" /><NumberField label="Preço da variação" value={item.salePrice} onChange={(value) => update(item.key, "salePrice", value)} step="0.01" min="0.01" /><button type="button" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((currentItem) => currentItem.key !== item.key))} className="grid size-12 place-items-center rounded-xl text-muted hover:bg-red-50 hover:text-red-700 disabled:opacity-30" aria-label={`Remover item ${index + 1}`}><Trash2 size={18} /></button></div>)}</div>
    </section>
    {state.message ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{state.message}</p> : null}
    <div className="flex justify-end gap-3"><Link href="/estoque" className="ui-button-secondary">Cancelar</Link><button disabled={pending || !options.length} className="ui-button-primary disabled:opacity-50">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}{pending ? "Confirmando..." : "Confirmar entrada"}</button></div>
  </form>;
}

function NumberField({ label, value, onChange, min = "0", step = "1" }: { label: string; value: number; onChange: (value: string) => void; min?: string; step?: string }) {
  return <label><span className="text-xs font-semibold text-muted">{label}</span><input required type="number" min={min} step={step} value={value} onChange={(event) => onChange(event.target.value)} className="ui-input mt-1.5" /></label>;
}
