import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function CustomersPage() {
  return <ModulePlaceholder title="Clientes e fiado" description="Cadastro, histórico e acompanhamento dos valores a receber." sprint="o Sprint 4" capabilities={["Cadastro rápido de clientes", "Contas abertas e vencidas", "Pagamentos integrais ou parciais", "Mensagem de cobrança para WhatsApp"]} />;
}
