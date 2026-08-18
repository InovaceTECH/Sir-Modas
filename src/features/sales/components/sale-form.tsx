"use client";

import { CreditCard, LoaderCircle, Minus, Plus, Search, ShoppingBag, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { createSale, type SaleActionState } from "../actions/sale-actions";

const initialSaleActionState: SaleActionState = { status: "idle" };

type CatalogItem = { variantId: string; productName: string; color: string; size: string; stock: number; price: string; category: string | null };
type CustomerOption = { id: string; name: string; phone: string };
type CartItem = CatalogItem & { quantity: number };
type PaymentMethod = "cash" | "pix" | "debit_card" | "credit_card" | "on_account";
type Payment = { key: string; method: PaymentMethod; amount: string; installments: number };

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const sources = ["Loja física", "Instagram", "WhatsApp", "Indicação", "Cliente antiga", "Passou em frente à loja", "Outro"];

export function SaleForm({ catalog, customers, cashOpen }: Readonly<{ catalog: CatalogItem[]; customers: CustomerOption[]; cashOpen: boolean }>) {
  const [state, action, pending] = useActionState(createSale, initialSaleActionState);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState("0");
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState(() => { const date = new Date(); date.setDate(date.getDate() + 30); return date.toISOString().slice(0, 10); });
  const [payments, setPayments] = useState<Payment[]>([{ key: "initial", method: "pix", amount: "0", installments: 1 }]);
  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return catalog.slice(0, 12);
    return catalog.filter((item) => `${item.productName} ${item.color} ${item.size} ${item.category ?? ""}`.toLocaleLowerCase("pt-BR").includes(term)).slice(0, 20);
  }, [catalog, search]);
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const paid = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const hasOnAccount = payments.some((payment) => payment.method === "on_account");

  function add(item: CatalogItem) {
    if (item.stock < 1) return;
    setCart((current) => {
      const existing = current.find((entry) => entry.variantId === item.variantId);
      if (existing) return current.map((entry) => entry.variantId === item.variantId ? { ...entry, quantity: Math.min(entry.quantity + 1, entry.stock) } : entry);
      return [...current, { ...item, quantity: 1 }];
    });
  }

  function changeQuantity(variantId: string, quantity: number) {
    setCart((current) => current.map((item) => item.variantId === variantId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) } : item));
  }

  function updatePayment(key: string, field: keyof Omit<Payment, "key">, value: string) {
    setPayments((current) => current.map((payment) => payment.key === key ? { ...payment, [field]: field === "installments" ? Number(value) : value } : payment));
  }

  return <form action={action} className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
    <input type="hidden" name="items" value={JSON.stringify(cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity })))} />
    <input type="hidden" name="payments" value={JSON.stringify(payments.map(({ method, amount, installments }) => ({ method, amount: Number(amount), installments })))} />
    <input type="hidden" name="customerId" value={customerId} />
    <input type="hidden" name="dueDate" value={hasOnAccount ? dueDate : ""} />
    <div className="space-y-6">
      <section className="ui-card p-5"><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="ui-input pl-11" placeholder="Buscar por produto, tamanho ou cor" /></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{visible.map((item) => <button key={item.variantId} type="button" disabled={item.stock < 1} onClick={() => add(item)} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-left transition hover:border-brand hover:bg-[#fff9f8] disabled:cursor-not-allowed disabled:opacity-45"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.productName}</p><p className="mt-0.5 text-xs text-muted">{item.color} · {item.size} · saldo {item.stock}</p></div><span className="shrink-0 text-sm font-semibold">{currency.format(Number(item.price))}</span></button>)}</div>{!catalog.length ? <p className="py-8 text-center text-sm text-muted">Cadastre produtos com estoque antes de vender.</p> : null}</section>
      <section className="ui-card overflow-hidden"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold">Itens da venda</h2><p className="text-xs text-muted">{cart.reduce((sum, item) => sum + item.quantity, 0)} peça(s)</p></div><ShoppingBag size={19} className="text-brand-deep" /></div>{cart.length ? <ul className="divide-y divide-border">{cart.map((item) => <li key={item.variantId} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-medium">{item.productName}</p><p className="text-xs text-muted">{item.color} · {item.size} · {currency.format(Number(item.price))}</p></div><div className="flex items-center rounded-lg border border-border"><button type="button" onClick={() => changeQuantity(item.variantId, item.quantity - 1)} className="grid size-9 place-items-center" aria-label="Diminuir quantidade"><Minus size={15} /></button><input value={item.quantity} onChange={(event) => changeQuantity(item.variantId, Number(event.target.value))} type="number" min="1" max={item.stock} className="w-11 border-x border-border py-2 text-center text-sm outline-none" /><button type="button" onClick={() => changeQuantity(item.variantId, item.quantity + 1)} className="grid size-9 place-items-center" aria-label="Aumentar quantidade"><Plus size={15} /></button></div><div className="flex items-center justify-end gap-2"><span className="min-w-24 text-right text-sm font-semibold">{currency.format(Number(item.price) * item.quantity)}</span><button type="button" onClick={() => setCart((current) => current.filter((entry) => entry.variantId !== item.variantId))} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-700" aria-label={`Remover ${item.productName}`}><Trash2 size={16} /></button></div></li>)}</ul> : <div className="px-5 py-12 text-center"><ShoppingBag className="mx-auto text-muted-soft" size={28} /><p className="mt-3 text-sm text-muted">Selecione os produtos acima.</p></div>}</section>
    </div>

    <div className="space-y-6">
      <section className="ui-card p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Cliente</h2><Link href="/clientes/novo" className="text-xs font-semibold text-brand-deep">+ Cadastrar</Link></div><label className="relative mt-4 block"><UserRound className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} /><select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="ui-input pl-10"><option value="">Venda sem cliente vinculada</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.phone}</option>)}</select></label>{hasOnAccount ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Dados obrigatórios para o fiado</p><label className="mt-3 block"><span className="text-xs font-semibold text-amber-900">Vencimento</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required className="ui-input mt-1.5" /></label>{!customerId ? <p className="mt-2 text-xs text-red-700">Selecione a cliente acima.</p> : null}</div> : <p className="mt-2 text-xs text-muted">Opcional nas vendas pagas na hora.</p>}</section>
      <section className="ui-card p-5"><h2 className="font-semibold">Resumo e pagamento</h2><div className="mt-5 space-y-4"><label><span className="text-xs font-semibold text-muted">Origem da venda</span><select name="source" className="ui-input mt-1.5">{sources.map((source) => <option key={source}>{source}</option>)}</select></label><label><span className="text-xs font-semibold text-muted">Desconto</span><input name="discountAmount" value={discount} onChange={(event) => setDiscount(event.target.value)} type="number" min="0" max={subtotal} step="0.01" className="ui-input mt-1.5" /></label><label><span className="text-xs font-semibold text-muted">Observações (opcional)</span><textarea name="notes" className="ui-input mt-1.5 min-h-20 py-3" /></label></div><div className="my-5 border-y border-border py-4 text-sm"><div className="flex justify-between text-muted"><span>Subtotal</span><span>{currency.format(subtotal)}</span></div><div className="mt-2 flex justify-between text-muted"><span>Desconto</span><span>− {currency.format(Number(discount) || 0)}</span></div><div className="mt-4 flex justify-between text-lg font-bold"><span>Total</span><span>{currency.format(total)}</span></div></div>
        <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold">Formas de pagamento</h3><p className={Math.abs(paid - total) < 0.005 ? "text-xs text-success-strong" : "text-xs text-amber-700"}>{Math.abs(paid - total) < 0.005 ? "Pagamento completo" : `Falta ${currency.format(Math.max(0, total - paid))}`}</p></div><button type="button" onClick={() => setPayments((current) => [...current, { key: crypto.randomUUID(), method: "cash", amount: "0", installments: 1 }])} className="text-xs font-semibold text-brand-deep">+ Pagamento misto</button></div>
        <div className="mt-4 space-y-3">{payments.map((payment, index) => <div key={payment.key} className="grid gap-2 rounded-lg bg-background p-3 sm:grid-cols-[1fr_1fr_auto]"><select value={payment.method} onChange={(event) => updatePayment(payment.key, "method", event.target.value)} className="ui-input"><option value="cash">Dinheiro</option><option value="pix">Pix</option><option value="debit_card">Débito</option><option value="credit_card">Crédito</option><option value="on_account">Fiado</option></select><div><input value={payment.amount} onChange={(event) => updatePayment(payment.key, "amount", event.target.value)} type="number" min="0.01" step="0.01" className="ui-input" aria-label={`Valor do pagamento ${index + 1}`} />{payment.method === "credit_card" ? <select value={payment.installments} onChange={(event) => updatePayment(payment.key, "installments", event.target.value)} className="ui-input mt-2" aria-label="Parcelas">{Array.from({ length: 12 }, (_, value) => <option key={value + 1} value={value + 1}>{value + 1}x</option>)}</select> : null}</div><button type="button" disabled={payments.length === 1} onClick={() => setPayments((current) => current.filter((entry) => entry.key !== payment.key))} className="grid size-11 place-items-center text-muted hover:text-red-700 disabled:opacity-25" aria-label="Remover pagamento"><Trash2 size={16} /></button></div>)}</div><button type="button" onClick={() => setPayments((current) => current.map((payment, index) => index === current.length - 1 ? { ...payment, amount: Math.max(0, total - current.slice(0, -1).reduce((sum, item) => sum + (Number(item.amount) || 0), 0)).toFixed(2) } : payment))} className="mt-3 text-xs font-semibold text-brand-deep">Preencher valor restante</button>
      </section>
      {state.message ? <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.message}</p> : null}
      {!cashOpen ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">O caixa está fechado. <Link href="/caixa" className="font-semibold underline">Abra o caixa</Link> para vender.</p> : null}
      <button disabled={pending || !cashOpen || !cart.length || total <= 0 || Math.abs(paid - total) >= 0.005 || (hasOnAccount && (!customerId || !dueDate))} className="ui-button-primary w-full disabled:cursor-not-allowed disabled:opacity-45">{pending ? <LoaderCircle className="animate-spin" size={18} /> : <CreditCard size={18} />}{pending ? "Finalizando..." : `Finalizar venda · ${currency.format(total)}`}</button>
      <Link href="/vendas" className="block text-center text-sm font-semibold text-muted hover:text-foreground">Consultar vendas anteriores</Link>
    </div>
  </form>;
}
