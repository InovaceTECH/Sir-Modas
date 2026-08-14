import { PageHeader } from "@/components/layout/page-header";
import { getOpenCashSession } from "@/features/cash/queries/cash";
import { requireStore } from "@/features/catalog/server/store-context";
import { getCustomerOptions } from "@/features/customers/queries/customers";
import { SaleForm } from "@/features/sales/components/sale-form";
import { getSaleCatalog } from "@/features/sales/queries/sales";

export default async function NewSalePage() {
  const { store } = await requireStore();
  if (!store) return <><PageHeader title="Nova venda" description="Configure a loja antes de registrar vendas." /></>;
  const [catalog, customers, cash] = await Promise.all([getSaleCatalog(store.id), getCustomerOptions(store.id), getOpenCashSession(store.id)]);
  return <><PageHeader title="Nova venda" description="Selecione os produtos, vincule a cliente quando necessário e finalize a venda." /><SaleForm catalog={catalog} customers={customers} cashOpen={Boolean(cash)} /></>;
}
