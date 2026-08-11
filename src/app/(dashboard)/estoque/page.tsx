import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function InventoryPage() {
  return <ModulePlaceholder title="Estoque" description="Saldos por variação e histórico completo das movimentações." sprint="o Sprint 2" capabilities={["Consulta por tamanho e cor", "Entrada de mercadorias", "Ajustes com justificativa", "Alertas de estoque baixo"]} />;
}
