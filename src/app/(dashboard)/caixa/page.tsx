import { ModulePlaceholder } from "@/components/modules/module-placeholder";

export default function CashPage() {
  return <ModulePlaceholder title="Caixa" description="Abertura, movimentações e conferência diária da loja." sprint="o Sprint 3" capabilities={["Abertura e fechamento", "Entradas, retiradas e despesas", "Resumo por forma de pagamento", "Conferência e diferença de caixa"]} />;
}
