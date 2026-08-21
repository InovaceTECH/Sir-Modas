import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { requireStore } from "@/features/catalog/server/store-context";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { getCustomerDetails } from "@/features/customers/queries/customers";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { store } = await requireStore();
  if (!store) notFound();
  const { id } = await params;
  const result = await getCustomerDetails(store.id, id);
  if (!result) notFound();
  const { customer } = result;
  return <><PageHeader title="Editar cliente" description="Mantenha o nome e o telefone atualizados." /><CustomerForm initial={{ id: customer.id, name: customer.name, phone: customer.phone }} /></>;
}
