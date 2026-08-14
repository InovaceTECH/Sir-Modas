# Operação, auditoria e recuperação

## Rotina recomendada

### Diariamente

- Abrir o caixa antes da primeira venda.
- Registrar vendas e recebimentos no momento em que acontecerem.
- Conferir alertas de estoque e fiado.
- Fechar e contar o caixa ao terminar o expediente.

### Semanalmente

- Consultar os relatórios da semana.
- Executar `npm run audit:data` com acesso ao banco correto.
- Investigar qualquer divergência antes de continuar correções manuais.

### Antes de migrations ou cargas grandes

- Criar um backup.
- Executar a simulação da importação.
- Confirmar que a conexão aponta para o ambiente desejado.
- Executar a auditoria antes e depois da operação.

## Backup manual

Com as ferramentas cliente do PostgreSQL instaladas e `DATABASE_URL` definida:

```powershell
.\scripts\backup-database.ps1
```

Os arquivos são criados em `backups/`, que não é versionada pelo Git. Copie o backup para um local seguro fora do computador.

No Neon, use também os recursos de **Backup & Restore**, observando a retenção disponível no plano contratado. Antes de uma alteração importante, crie um ponto de recuperação quando o plano permitir.

## Teste de restauração

Nunca teste uma restauração sobre o banco em uso. Crie um banco vazio separado e execute:

```powershell
pg_restore --dbname="CONEXAO_DO_BANCO_VAZIO" --clean --if-exists --no-owner ".\backups\sir-modas-AAAAMMDD-HHMMSS.dump"
```

Depois, aponte uma cópia local da aplicação para esse banco, abra `/api/health`, execute `npm run audit:data` e confira alguns produtos, vendas e clientes.

## Resposta a incidentes

1. Interrompa novas operações no sistema se houver suspeita de divergência.
2. Registre horário, tela e ação que causaram o problema.
3. Execute a auditoria sem alterar dados.
4. Faça um backup do estado atual.
5. Corrija por lançamento de ajuste ou restaure em ambiente separado para comparação.
6. Nunca apague pagamentos, vendas ou movimentos diretamente sem análise.

## Sinais de atenção

- `/api/health` retorna `503`.
- Auditoria encontra estoque negativo ou pagamentos divergentes.
- Existe diferença de caixa sem justificativa.
- A Vercel apresenta muitos erros de função.
- O Neon se aproxima dos limites de armazenamento, computação ou conexões.
