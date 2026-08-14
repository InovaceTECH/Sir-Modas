# Sprint 1 — Fundação operacional

## Entregue

- Autenticação por e-mail e senha com sessão no PostgreSQL.
- Primeiro cadastro controlado por variável de ambiente e limitado à proprietária inicial.
- Proteção das rotas no Proxy do Next.js e nova validação no layout do servidor.
- Login, primeiro acesso, logout e redirecionamento seguro.
- Configuração persistente do nome, telefone, endereço e prazo de troca.
- Menu responsivo com navegação ativa e gaveta mobile funcional.
- Estados de carregamento, erro e página não encontrada.
- Schema de autenticação incorporado à migration inicial.
- Testes unitários das configurações e da regra de estoque.

## Ativação local

1. Crie um projeto PostgreSQL no Neon.
2. Copie `.env.example` para `.env.local`.
3. Preencha `DATABASE_URL` com a conexão agrupada fornecida pelo Neon.
4. Gere um segredo com `npm run auth:secret` e coloque o resultado em `BETTER_AUTH_SECRET`.
5. Mantenha `BETTER_AUTH_URL=http://localhost:3000` durante o desenvolvimento.
6. Defina `AUTH_ALLOW_SIGN_UP=true`.
7. Execute `npm run db:migrate` e depois `npm run dev`.
8. Acesse `/primeiro-acesso` e crie a proprietária.
9. Volte `AUTH_ALLOW_SIGN_UP` para `false` e reinicie o servidor.

Não envie `.env.local` para o Git ou em mensagens. Na Vercel, configure as mesmas variáveis separadamente e use a URL definitiva em `BETTER_AUTH_URL`.

## Decisão de segurança

O pacote beta do Neon Auth disponível durante o sprint fixava uma versão do seu mecanismo-base com alertas críticos publicados. Foi adotado Better Auth corrigido diretamente, mantendo usuários e sessões no banco Neon e evitando a dependência vulnerável. Essa escolha pode ser reavaliada quando o pacote do Neon atualizar sua cadeia de dependências.
