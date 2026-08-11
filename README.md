# Sir Modas

Sistema web de gestão operacional e vendas da Sir Modas Store.

## Stack

- Next.js com App Router e TypeScript
- Tailwind CSS
- PostgreSQL no Neon
- Drizzle ORM e Drizzle Kit
- Neon Auth (integração prevista no Sprint 1)
- Vercel Blob para fotos (integração prevista no Sprint 2)
- Vitest e Testing Library

## Desenvolvimento local

1. Copie `.env.example` para `.env.local`.
2. Configure `DATABASE_URL` com a conexão do Neon.
3. Instale as dependências com `npm install`.
4. Execute `npm run dev`.

O dashboard estrutural funciona sem banco. Operações persistentes serão implementadas por sprint.

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

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Plano de sprints](docs/SPRINTS.md)
- [Decisões do produto](docs/DECISIONS.md)
