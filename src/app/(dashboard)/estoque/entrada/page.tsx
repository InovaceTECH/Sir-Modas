import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { getCatalogOptions, getStockOverview } from "@/features/catalog/queries/catalog";
import { requireStore } from "@/features/catalog/server/store-context";
import { StockEntryForm } from "@/features/inventory/components/stock-entry-form";

export default async function StockEntryPage() {
  const { store } = await requireStore();
  if (!store) redirect("/configuracoes");
  const [options, catalog] = await Promise.all([getStockOverview(store.id), getCatalogOptions(store.id)]);
  return <><PageHeader title="Nova entrada" description="Registre os itens recebidos. Todos os saldos serão atualizados juntos na confirmação." /><StockEntryForm options={options.map((item) => ({ variantId: item.variantId, productName: item.productName, productCode: item.productCode, color: item.color, size: item.size, quantity: item.quantity, salePrice: item.salePrice }))} suppliers={catalog.suppliers.map((item) => item.name)} /></>;
}
