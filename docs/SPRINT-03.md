# Sprint 3 — Vendas e caixa

## Entregue

- Abertura de caixa com valor inicial e garantia de apenas um caixa aberto por loja.
- Reforço, sangria e despesa com motivo e histórico.
- Conferência e fechamento com dinheiro esperado, contado e diferença.
- Busca de produtos por nome, código, tamanho, cor e categoria.
- Carrinho com limite pela quantidade disponível.
- Desconto separado do subtotal e do total.
- Origem da venda e observações.
- Pagamento em dinheiro, Pix, débito, crédito ou combinação de vários meios.
- Validação exata da soma dos pagamentos em centavos.
- Confirmação transacional de venda, pagamentos, financeiro e baixa de estoque.
- Histórico de vendas e comprovante detalhado.
- Cancelamento enquanto o caixa da venda estiver aberto, com restauração de estoque e estorno financeiro.
- Dashboard conectado às vendas, ao estoque e à situação real do caixa.

## Regras de consistência

- Nenhuma venda é aceita sem caixa aberto.
- Variações são bloqueadas durante a venda e nunca ficam negativas.
- Venda, pagamentos, estoque e caixa são confirmados juntos ou totalmente desfeitos.
- Caixa fechado não recebe novas movimentações.
- Cancelamento após fechamento exige um fluxo posterior de correção e não é permitido silenciosamente.

## Próxima etapa

O Sprint 4 adicionará clientes, fiado, vencimentos e recebimentos parciais. O tipo `on_account` já existe no banco, mas permanece indisponível na tela de venda até esse fluxo garantir cliente e conta a receber.
