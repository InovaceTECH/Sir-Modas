# Sir Modas

Sistema web de gestão operacional e vendas da Sir Modas Store.

## Stack

- Next.js com App Router e TypeScript
- Tailwind CSS
- PostgreSQL local com Docker e Neon na publicação
- Drizzle ORM e Drizzle Kit
- Better Auth com sessões armazenadas no PostgreSQL do Neon
- Vercel Blob para fotos (integração prevista no Sprint 2)
- Vitest e Testing Library

## Desenvolvimento local

1. Inicie o banco com `docker compose up -d`.
2. Execute `npm run db:migrate`.
3. Execute `npm run db:seed:local` após criar o perfil local.
4. Execute `npm run dev`.

Com `AUTH_BYPASS_LOCAL=true`, o perfil da Sir Modas é carregado automaticamente apenas em desenvolvimento e no endereço local.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o ambiente local |
| `npm run lint` | Verifica padrões do código |
| `npm run test` | Executa os testes unitários |
| `npm run build` | Gera a aplicação de produção |
| `npm run check` | Executa lint, testes e build |
| `npm run db:generate` | Gera migrations a partir do schema |
| `npm run db:migrate` | Aplica migrations no banco configurado |
| `npm run db:studio` | Abre o explorador de dados do Drizzle |
| `npm run db:seed:local` | Prepara loja, categorias e tipos no banco local |
| `npm run import:products -- arquivo.csv` | Valida uma carga inicial sem gravar |
| `npm run import:products -- arquivo.csv --apply` | Importa produtos e novas variações |
| `npm run audit:data` | Procura divergências operacionais no banco |
| `npm run verify:production` | Confere o ambiente antes da publicação |
| `npm run auth:secret` | Gera um segredo seguro para as sessões |

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Plano de sprints](docs/SPRINTS.md)
- [Decisões do produto](docs/DECISIONS.md)
- [Implantação na Vercel e Neon](docs/DEPLOYMENT.md)
- [Operação, auditoria e backup](docs/OPERATIONS.md)
