import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.production.local", quiet: true });
config({ quiet: true });

const required = ["DATABASE_URL", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"];
const errors = required.filter((key) => !process.env[key]).map((key) => `${key} não configurada.`);
if ((process.env.BETTER_AUTH_SECRET ?? "").length < 32) errors.push("BETTER_AUTH_SECRET deve possuir ao menos 32 caracteres.");
if (process.env.BETTER_AUTH_URL && !process.env.BETTER_AUTH_URL.startsWith("https://")) errors.push("BETTER_AUTH_URL deve usar HTTPS em produção.");
if (process.env.AUTH_ALLOW_SIGN_UP !== "false") errors.push("AUTH_ALLOW_SIGN_UP deve ser false após criar a proprietária.");
if (process.env.AUTH_BYPASS_LOCAL === "true") errors.push("AUTH_BYPASS_LOCAL não pode ser true em produção.");
if ((process.env.DATABASE_URL ?? "").includes("localhost")) errors.push("DATABASE_URL ainda aponta para localhost.");
if (errors.length) {
  errors.forEach((error) => console.error(`ERRO: ${error}`));
  process.exit(1);
}

const database = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, connect_timeout: 10 });
try {
  const tables = await database`select table_name from information_schema.tables where table_schema = 'public' and table_name in ('user','stores','products','sales','cash_sessions','customers','receivables','exchanges')`;
  if (tables.length !== 8) throw new Error(`Banco incompleto: ${tables.length} de 8 tabelas essenciais encontradas. Execute as migrations.`);
  const [owner] = await database`select count(*)::int as count from "user" where email = 'sirmodas@gmail.com'`;
  if (owner.count !== 1) throw new Error("O perfil sirmodas@gmail.com não foi encontrado ou está duplicado.");
  console.log("Ambiente de produção validado: configuração, conexão, tabelas e proprietária estão corretos.");
} finally {
  await database.end();
}
