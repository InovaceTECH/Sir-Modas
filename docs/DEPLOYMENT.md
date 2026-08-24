# Implantação temporária — Vercel e Neon

## Antes de começar

- Tenha um projeto Neon vazio e um projeto Vercel ligado ao repositório.
- Use bancos ou branches diferentes para Preview e Production.
- Nunca copie `.env.local` para o repositório.
- Faça a primeira publicação em um endereço de teste e valide os fluxos antes de usar dados reais.

## 1. Preparar o Neon

1. Crie o projeto e o banco da Sir Modas.
2. Copie duas conexões no painel **Connect**:
   - conexão **pooled**, usada pela aplicação em `DATABASE_URL`;
   - conexão direta, usada pelas migrations em `DATABASE_URL_UNPOOLED`.
3. Em um terminal administrativo, defina temporariamente essas variáveis e execute `npm run db:migrate` na primeira publicação.
4. Nos deploys seguintes, o comando de build aplica as migrations pendentes somente no ambiente de produção da Vercel. Builds de Preview não alteram o banco.

## 2. Configurar a Vercel

Cadastre em **Settings → Environment Variables**:

| Variável | Valor de produção |
| --- | --- |
| `DATABASE_URL` | Conexão pooled do Neon |
| `DATABASE_URL_UNPOOLED` | Conexão direta do Neon, usada durante o build para aplicar migrations |
| `BETTER_AUTH_SECRET` | Segredo aleatório com pelo menos 32 caracteres |
| `BETTER_AUTH_URL` | URL HTTPS final da aplicação |
| `AUTH_ALLOW_SIGN_UP` | `true` somente no primeiro cadastro |
| `AUTH_BYPASS_LOCAL` | `false` |

Restrinja `DATABASE_URL_UNPOOLED` ao ambiente **Production**. Ela é usada durante o build e não pela aplicação em execução.

## 3. Criar a proprietária

1. Faça o primeiro deploy com `AUTH_ALLOW_SIGN_UP=true`.
2. Abra `/primeiro-acesso` e crie `sirmodas@gmail.com` com uma senha definitiva exclusiva para produção.
3. Altere imediatamente `AUTH_ALLOW_SIGN_UP=false` na Vercel.
4. Faça um novo deploy e confirme que novos cadastros foram bloqueados.

Não reutilize a senha simples de desenvolvimento em produção.

## 4. Validar antes da operação

1. Execute `npm run verify:production` em um terminal com as variáveis de produção.
2. Consulte `/api/health` e confirme retorno `200` com banco conectado.
3. Teste abertura de caixa, venda, fiado, recebimento, troca e fechamento.
4. Execute `npm run audit:data` contra o banco de produção.
5. Faça um backup antes da carga inicial e outro após a homologação.

## 5. Carga inicial

1. Copie `data/templates/produtos.csv` para outro arquivo.
2. Preencha os produtos reais sem alterar os cabeçalhos.
3. Rode primeiro a simulação: `npm run import:products -- caminho/arquivo.csv`.
4. Após revisar o resumo, execute novamente acrescentando `--apply`.
5. Rode `npm run audit:data` e confira a tela de estoque.

O importador é repetível: atualiza os dados comerciais do produto, cria somente variações novas e preserva o saldo de variações que já existem.

## Checklist de liberação

- [ ] Banco de produção separado do banco local.
- [ ] `DATABASE_URL_UNPOOLED` configurada somente em Production e migrations aplicadas.
- [ ] Proprietária criada e cadastro público desativado.
- [ ] Bypass local desativado.
- [ ] Todos os fluxos críticos testados.
- [ ] Auditoria sem divergências.
- [ ] Backup de homologação armazenado fora do computador da loja.
- [ ] URL HTTPS salva nos dispositivos autorizados.

## Referências oficiais

- [Conectar Vercel e Neon manualmente](https://neon.com/docs/guides/vercel-manual)
- [Usar conexão pooled no Neon](https://neon.com/docs/connect/connection-pooling)
- [Variáveis de ambiente na Vercel](https://vercel.com/docs/environment-variables)
