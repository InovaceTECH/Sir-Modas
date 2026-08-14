import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const categories = ["Feminino", "Masculino", "Infantil", "Acessórios"];
const productTypes = ["Camiseta", "Camisa", "Calça", "Vestido", "Saia", "Shorts", "Conjunto", "Jaqueta", "Bolsa", "Calçado", "Acessório"];

try {
  await sql.begin(async (transaction) => {
    const [owner] = await transaction`select id from "user" where email = 'sirmodas@gmail.com' limit 1`;
    if (!owner) throw new Error("Crie o perfil local sirmodas@gmail.com antes de executar a carga inicial.");
    const [store] = await transaction`insert into stores (name, owner_auth_id) values ('Sir Modas Store', ${owner.id}) on conflict (owner_auth_id) do update set updated_at = now() returning id`;
    for (const name of categories) await transaction`insert into categories (store_id, name) values (${store.id}, ${name}) on conflict (store_id, name) do nothing`;
    for (const name of productTypes) await transaction`insert into product_types (store_id, name) values (${store.id}, ${name}) on conflict (store_id, name) do nothing`;
  });
  console.log("Dados iniciais locais preparados.");
} finally {
  await sql.end();
}
