# Sprint 5 — Trocas, dashboard e relatórios

## Entregue

- Busca da venda original por número, cliente ou telefone.
- Registro de troca vinculado obrigatoriamente à venda confirmada.
- Controle da quantidade ainda disponível para devolução.
- Alerta e registro de trocas realizadas fora do prazo configurado.
- Produto devolvido em condição de venda retorna ao estoque.
- Produto com defeito fica registrado como indisponível e não retorna ao saldo.
- Novo produto é retirado do estoque com validação de disponibilidade.
- Cálculo da diferença de valor e recebimento no caixa quando positiva.
- Registro de diferenças negativas para aplicação da política comercial da loja.
- Histórico geral de trocas e histórico integrado ao perfil da cliente.
- Dashboard com períodos de hoje, semana e mês.
- Relatórios de vendas, estoque, caixa e fiado por período personalizado.
- Indicadores de vendas, peças, ticket médio, estoque baixo, caixa e recebíveis.
- Rankings de produtos, origens de venda e clientes com maior saldo.
- Exportação CSV dos quatro relatórios principais.

## Regras de consistência

- Troca, entrada do item devolvido, saída do novo item e diferença financeira são confirmadas na mesma transação.
- Não é possível devolver mais unidades do que foram compradas e ainda estão disponíveis.
- Diferença positiva exige caixa aberto e forma de pagamento.
- Produtos com defeito não aumentam o estoque disponível.
- Toda consulta e exportação valida a loja da sessão atual.

## Próxima etapa

O Sprint 6 fará a estabilização final, testes dos fluxos completos, carga inicial assistida e preparação para publicação na Vercel com banco Neon.
