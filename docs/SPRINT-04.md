# Sprint 4 — Clientes e fiado

## Entregue

- Cadastro, edição, busca e perfil consolidado da cliente.
- Totais de compras, última compra, saldo aberto e contas vencidas.
- Cliente opcional em vendas pagas e obrigatório em qualquer parcela fiada.
- Vencimento obrigatório e criação automática da conta a receber.
- Venda mista, com apenas a parte fiada compondo o saldo a receber.
- Baixas integrais e parciais em dinheiro, Pix, débito ou crédito.
- Recebimento lançado no caixa aberto somente quando o valor é efetivamente pago.
- Proteção por chave de idempotência contra confirmação repetida.
- Histórico de compras, contas e pagamentos no perfil da cliente.
- Identificação de contas vencidas e atalho de cobrança pelo WhatsApp.
- Indicadores de fiado aberto e vencido no dashboard.

## Regras de consistência

- Venda fiada não entra no caixa no momento da venda.
- O valor recebido nunca pode superar o saldo restante.
- Conta, pagamento e movimento de caixa são atualizados na mesma transação.
- Um recebimento exige caixa aberto.
- Venda fiada com recebimentos já registrados não pode ser cancelada silenciosamente.
- Contas vencidas são determinadas pela data local de São Paulo.

## Próxima etapa

O Sprint 5 implementará trocas, filtros por período, relatórios operacionais e exportação dos dados prioritários.
