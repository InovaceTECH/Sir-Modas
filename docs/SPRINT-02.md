# Sprint 2 — Catálogo e estoque

## Entregue

- Cadastro e edição de produtos com categoria, tipo, fornecedor, marca, custos, preço, foto por URL e estoque mínimo.
- Variações independentes por tamanho e cor, com validação contra combinações repetidas.
- Estoque inicial registrado como movimentação auditável.
- Lista de produtos com busca, status, duplicação, ativação e inativação.
- Consulta de estoque por variação, com filtros de situação, categoria, cor e tamanho.
- Indicadores de estoque baixo e esgotado.
- Entrada de mercadorias com vários itens e atualização transacional dos saldos e preços.
- Ajuste por contagem física com justificativa, saldo anterior e saldo posterior.
- Histórico das movimentações de estoque.
- Categorias e tipos iniciais idempotentes para o ambiente local.

## Regra de consistência

Entradas e ajustes usam transação serializável e bloqueio das variações alteradas. Se qualquer item falhar, nenhum saldo da operação é persistido.

## Pendente para publicação

- Upload direto de arquivos no Vercel Blob. O cadastro já aceita uma URL de foto e poderá receber o upload quando o token do ambiente publicado estiver disponível.
