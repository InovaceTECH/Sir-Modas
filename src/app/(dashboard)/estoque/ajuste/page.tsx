import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { getStockOverview } from "@/features/catalog/queries/catalog";
import { requireStore } from "@/features/catalog/server/store-context";
import { StockAdjustmentForm } from "@/features/inventory/components/stock-adjustment-form";

export default async function StockAdjustmentPage({ searchParams }: PageProps<"/estoque/ajuste">) {
  const { store } = await requireStore();
  if (!store) redirect("/configuracoes");
  const params = await searchParams;
  const variantId = typeof params.variacao === "string" ? params.variacao : "";
  const rows = await getStockOverview(store.id);
  const variant = rows.find((item) => item.variantId === variantId);
  if (!variant) notFound();
  return <><PageHeader title="Ajustar estoque" description="Informe a quantidade física contada. O sistema guardará o saldo anterior, o novo saldo e o motivo." /><StockAdjustmentForm variant={variant} /></>;
}
