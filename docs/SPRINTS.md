# Plano de desenvolvimento do MVP

## Premissas

- Cadência sugerida: sprints de duas semanas.
- Cada sprint termina com uma demonstração utilizável e revisão com a proprietária.
- Estimativas assumem uma pessoa desenvolvedora full-stack com apoio de validação do negócio.
- Segurança, responsividade, testes e acessibilidade fazem parte de todos os sprints.

## Visão do roadmap

| Sprint | Entrega principal | Dependência |
| --- | --- | --- |
| 1 | Fundação, login e configuração da loja | Projeto Neon criado |
| 2 | Produtos, variações e estoque | Sprint 1 |
| 3 | Venda completa e caixa | Sprint 2 |
| 4 | Clientes, fiado e recebimentos | Sprint 3 |
| 5 | Trocas, dashboard e relatórios | Sprints 3 e 4 |
| 6 | Confiabilidade, carga inicial e implantação | Todos os anteriores |

---

## Sprint 1 — Fundação operacional

**Status:** implementação concluída; provisionamento do Neon e homologação com credenciais reais pendentes.

**Objetivo:** disponibilizar uma aplicação protegida, conectada ao Neon e configurável para uma única loja.

### Entregas

- Projeto e ambientes do Neon.
- Migrations iniciais e dados-base.
- Login/logout da proprietária com Better Auth persistido no Neon.
- Proteção de todas as rotas operacionais.
- Cadastro das configurações da Sir Modas.
- Layout responsivo, navegação e estados de erro/carregamento.
- Pipeline de lint, testes e build.

### Critérios de aceite

- Usuária não autenticada não acessa dados da loja.
- A proprietária consegue entrar e sair do sistema.
- Nome da loja e prazo de troca são persistidos.
- A aplicação funciona nas larguras de celular e desktop.
- Migrations podem ser executadas em um banco vazio.

### Resultado demonstrável

A proprietária entra no sistema e visualiza o dashboard vazio com as configurações reais da loja.

---

## Sprint 2 — Catálogo e estoque

**Status:** núcleo funcional concluído localmente; upload direto para o Vercel Blob aguarda o ambiente publicado.

**Objetivo:** permitir cadastrar o estoque físico com tamanho e cor e acompanhar todas as alterações.

### Entregas

- Categorias, tipos e fornecedores configuráveis.
- Cadastro, edição, inativação e duplicação de produtos.
- Variações por tamanho e cor.
- Upload opcional de foto no Vercel Blob.
- Entrada de mercadorias com vários itens.
- Ajuste de estoque com justificativa.
- Consulta, filtros e histórico de movimentações.
- Indicador de estoque baixo ou esgotado.

### Critérios de aceite

- Um produto pode ter múltiplas combinações de tamanho e cor.
- Cada combinação mantém saldo independente.
- Confirmar uma entrada aumenta exatamente os saldos informados.
- Todo ajuste registra quantidade anterior, posterior, motivo e horário.
- A tela identifica variações no estoque mínimo ou abaixo dele.

### Resultado demonstrável

A proprietária cadastra uma camiseta com seis variações, confirma uma entrada e consulta os saldos resultantes.

---

## Sprint 3 — Vendas e caixa

**Status:** núcleo funcional concluído localmente.

**Objetivo:** registrar uma venda em menos de um minuto, com estoque e financeiro consistentes.

### Entregas

- Abertura de caixa e garantia de apenas um caixa aberto.
- Busca rápida de produtos e seleção da variação.
- Carrinho, quantidade, desconto e origem da venda.
- Dinheiro, Pix, débito, crédito e pagamento misto.
- Confirmação transacional da venda e baixa do estoque.
- Comprovante/resumo e histórico de vendas.
- Sangria, reforço, despesa e fechamento do caixa.
- Cancelamento com estorno de estoque e financeiro.

### Critérios de aceite

- Não é possível vender mais do que o saldo disponível.
- Não é possível vender sem caixa aberto.
- A soma dos pagamentos precisa corresponder ao total da venda.
- Venda, estoque e movimentos financeiros são confirmados ou revertidos juntos.
- O fechamento calcula dinheiro esperado, contado e diferença.
- Uma venda cancelada não aparece como faturamento e restaura o estoque aplicável.

### Resultado demonstrável

A proprietária abre o caixa, registra uma venda mista, confere a baixa e fecha o caixa.

---

## Sprint 4 — Clientes e fiado

**Status:** núcleo funcional concluído localmente.

**Objetivo:** tornar visível e confiável todo valor que a loja ainda tem a receber.

### Entregas

- Cadastro e pesquisa de clientes.
- Cliente obrigatório quando parte da venda for fiada.
- Criação automática da conta a receber.
- Contas abertas, parcialmente pagas, pagas e atrasadas.
- Pagamentos integrais e parciais.
- Registro idempotente do recebimento no caixa.
- Histórico consolidado do cliente.
- Texto de cobrança para copiar/abrir no WhatsApp.

### Critérios de aceite

- Uma venda fiada sem cliente não pode ser confirmada.
- O sistema impede pagamento superior ao saldo.
- Pagamento parcial atualiza pago, restante e status.
- Conta vencida não paga é exibida como atrasada.
- Repetir acidentalmente uma confirmação não duplica o recebimento.
- O dashboard mostra total aberto e total atrasado.

### Resultado demonstrável

A proprietária registra uma venda parcialmente fiada e recebe parte do saldo em outro dia.

---

## Sprint 5 — Trocas, dashboard e relatórios

**Status:** núcleo funcional concluído localmente.

**Objetivo:** completar o ciclo pós-venda e transformar os registros em informações úteis.

### Entregas

- Busca da venda e seleção dos itens originais.
- Validação do prazo de troca.
- Produto devolvido vendável ou danificado.
- Novo item e diferença de valor.
- Atualização transacional dos estoques envolvidos.
- Dashboard por hoje, semana, mês e período.
- Relatórios de vendas, estoque, caixa e fiado.
- Filtros essenciais e exportação CSV dos relatórios prioritários.

### Critérios de aceite

- Toda troca possui venda original.
- O sistema alerta, sem ocultar, solicitações fora do prazo.
- Item danificado não retorna ao saldo disponível.
- Diferenças financeiras entram no caixa conforme a política definida.
- Indicadores conferem com os registros de origem.
- Relatórios semanais e mensais atendem os critérios do PRD.

### Resultado demonstrável

A proprietária troca um item, confere os dois estoques e visualiza o impacto no relatório.

---

## Sprint 6 — Estabilização e implantação

**Status:** preparação técnica concluída localmente; credenciais, carga real e publicação pendentes.

**Objetivo:** validar o MVP com dados reais e colocá-lo em operação com segurança.

### Entregas

- Testes ponta a ponta dos fluxos críticos.
- Testes de concorrência em venda e estoque.
- Revisão de segurança e tratamento de erros.
- Otimização de consultas e experiência mobile.
- Importação/cadastro assistido do estoque inicial.
- Backup e procedimento de recuperação documentados.
- Treinamento da proprietária.
- Implantação em plano compatível com operação comercial.
- Monitoramento inicial e correções da homologação.

### Critérios de aceite

- Os 15 critérios de aceitação do PRD foram demonstrados.
- Uma venda comum pode ser registrada em menos de um minuto.
- Duas tentativas simultâneas não deixam estoque negativo.
- Fechamento de caixa e total de fiado conferem com cenários de teste.
- A proprietária conclui os fluxos principais sem ajuda da equipe.
- Existe procedimento testado de exportação e restauração dos dados.

### Resultado demonstrável

Operação piloto completa com produtos reais, vendas, caixa e fiado acompanhados durante o período de homologação.

## Definição de pronto para cada história

- Regra de negócio e mensagens de erro implementadas.
- Uso confortável em celular e desktop.
- Permissão validada no servidor.
- Testes proporcionais ao risco aprovados.
- Nenhum dado financeiro ou de estoque fica parcialmente atualizado.
- Demonstração aceita pela responsável do produto.
- Documentação alterada quando a regra mudar.
