import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function ExchangesPage() {
  return <ModulePlaceholder title="Trocas" description="Trocas vinculadas à venda original, com impacto controlado no estoque." sprint="o Sprint 5" capabilities={["Busca da venda original", "Verificação do prazo da loja", "Entrada e saída dos produtos", "Cálculo da diferença de valor"]} />;
}
