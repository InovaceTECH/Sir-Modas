import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/features/catalog/components/product-form";
import { getCatalogOptions } from "@/features/catalog/queries/catalog";
import { requireStore } from "@/features/catalog/server/store-context";

export default async function NewProductPage() {
  const { store } = await requireStore();
  if (!store) redirect("/configuracoes");
  const options = await getCatalogOptions(store.id);
  return <><PageHeader title="Novo produto" description="Cadastre as informações e todas as combinações de tamanho e cor." /><ProductForm mode="create" options={options} /></>;
}
