import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/features/catalog/components/product-form";
import { getProduct } from "@/features/catalog/queries/catalog";
import { requireStore } from "@/features/catalog/server/store-context";

export default async function EditProductPage({ params }: PageProps<"/produtos/[id]/editar">) {
  const { store } = await requireStore();
  if (!store) redirect("/configuracoes");
  const { id } = await params;
  const result = await getProduct(store.id, id);
  if (!result) notFound();
  const { product, variants, options } = result;
  return <><PageHeader title="Editar produto" description="Altere os dados comerciais e mantenha as variações organizadas." /><ProductForm mode="edit" options={options} initial={{ id: product.id, name: product.name, categoryId: product.categoryId ?? "", productTypeId: product.productTypeId ?? "", supplierId: product.supplierId ?? "", brand: product.brand ?? "", description: product.description ?? "", notes: product.notes ?? "", photoUrl: product.photoUrl ?? "", costPrice: product.costPrice, salePrice: product.salePrice, minimumStock: product.minimumStock, variants: variants.filter((item) => item.active).map((item) => ({ id: item.id, color: item.color, size: item.size, initialQuantity: item.quantityOnHand, quantity: item.quantityOnHand })) }} /></>;
}
