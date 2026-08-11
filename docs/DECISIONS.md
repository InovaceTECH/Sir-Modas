# Decisões iniciais

Estas decisões formam a baseline do MVP e podem ser revisadas com a proprietária antes do sprint afetado.

| ID | Decisão inicial | Motivo |
| --- | --- | --- |
| D-01 | Uma loja e uma proprietária no MVP | Reduz complexidade sem bloquear evolução futura |
| D-02 | Caixa aberto é obrigatório para confirmar vendas | Mantém vendas e fechamento reconciliáveis |
| D-03 | Pix e cartão aparecem no resumo, mas não compõem o dinheiro esperado | Diferencia movimento financeiro de numerário físico |
| D-04 | Pagamento misto pode incluir fiado | Atende entradas parciais e saldo posterior |
| D-05 | Uma conta a receber por componente fiado, com um vencimento | Parcelamento fica fora do MVP até validação |
| D-06 | Registros operacionais são cancelados/estornados, nunca excluídos | Preserva auditoria de estoque e caixa |
| D-07 | Produto devolvido só volta ao estoque quando vendável | Evita estoque disponível incorreto |
| D-08 | Diferença favorável à cliente segue política configurada/observada | A regra comercial ainda precisa de validação |

## Pendências para validação

1. Confirmar se uma venda realizada por WhatsApp também exige caixa aberto.
2. Definir o destino da diferença quando a cliente troca por um item mais barato.
3. Confirmar prazo padrão de troca e exceções para peças promocionais.
4. Definir se cartão de crédito precisa registrar quantidade de parcelas.
5. Confirmar origens de venda que aparecerão na primeira versão.
