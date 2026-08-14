import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/features/customers/components/customer-form";

export default function NewCustomerPage() {
  return <><PageHeader title="Nova cliente" description="Cadastre os dados básicos para vincular compras e vendas no fiado." /><CustomerForm /></>;
}
