import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const inputPath = process.argv.find((argument) => argument.toLowerCase().endsWith(".csv"));
const apply = process.argv.includes("--apply");
if (!inputPath) throw new Error("Informe o arquivo CSV. Ex.: npm run import:products -- data/produtos.csv");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') { field += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ";" && !quoted) { row.push(field.trim()); field = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field.trim()); field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else field += character;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function money(value, field, line) {
  const parsed = Number(value.replaceAll(".", "").replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Linha ${line}: ${field} inválido.`);
  return parsed.toFixed(2);
}

const requiredHeaders = ["codigo", "nome", "categoria", "tipo", "custo", "venda", "estoque_minimo", "cor", "tamanho", "quantidade"];
const text = (await readFile(resolve(inputPath), "utf8")).replace(/^\uFEFF/, "");
const [headerRow, ...dataRows] = parseCsv(text);
if (!headerRow) throw new Error("O arquivo CSV está vazio.");
const headers = headerRow.map((header) => header.toLocaleLowerCase("pt-BR"));
for (const header of requiredHeaders) if (!headers.includes(header)) throw new Error(`Coluna obrigatória ausente: ${header}`);

const records = dataRows.map((values, index) => {
  const line = index + 2;
  const raw = Object.fromEntries(headers.map((header, column) => [header, values[column] ?? ""]));
  for (const header of requiredHeaders) if (!raw[header]) throw new Error(`Linha ${line}: ${header} não informado.`);
  const minimumStock = Number(raw.estoque_minimo);
  const quantity = Number(raw.quantidade);
  if (!Number.isInteger(minimumStock) || minimumStock < 0) throw new Error(`Linha ${line}: estoque_minimo inválido.`);
  if (!Number.isInteger(quantity) || quantity < 0) throw new Error(`Linha ${line}: quantidade inválida.`);
  return { line, code: raw.codigo.toUpperCase(), name: raw.nome, category: raw.categoria, type: raw.tipo, brand: raw.marca || null, supplier: raw.fornecedor || null, cost: money(raw.custo, "custo", line), price: money(raw.venda, "venda", line), minimumStock, color: raw.cor, size: raw.tamanho, variantCode: raw.codigo_variacao?.toUpperCase() || null, quantity };
});

const uniqueVariants = new Set();
for (const record of records) {
  const key = `${record.code}|${record.color.toLocaleLowerCase("pt-BR")}|${record.size.toLocaleLowerCase("pt-BR")}`;
  if (uniqueVariants.has(key)) throw new Error(`Linha ${record.line}: variação repetida no arquivo.`);
  uniqueVariants.add(key);
}
console.log(`${records.length} variação(ões) de ${new Set(records.map((record) => record.code)).size} produto(s) validada(s).`);
if (!apply) {
  console.log("Simulação concluída. Revise o arquivo e acrescente --apply para gravar no banco.");
  process.exit(0);
}

const database = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
let createdVariants = 0;
try {
  await database.begin(async (transaction) => {
    const [store] = await transaction`select s.id from stores s join "user" u on u.id = s.owner_auth_id where u.email = 'sirmodas@gmail.com' limit 1`;
    if (!store) throw new Error("Loja da Sir Modas não encontrada.");
    for (const record of records) {
      const [category] = await transaction`insert into categories (store_id, name) values (${store.id}, ${record.category}) on conflict (store_id, name) do update set active = true returning id`;
      const [type] = await transaction`insert into product_types (store_id, name) values (${store.id}, ${record.type}) on conflict (store_id, name) do update set active = true returning id`;
      let supplierId = null;
      if (record.supplier) {
        const [existingSupplier] = await transaction`select id from suppliers where store_id = ${store.id} and lower(name) = lower(${record.supplier}) limit 1`;
        supplierId = existingSupplier?.id ?? (await transaction`insert into suppliers (store_id, name) values (${store.id}, ${record.supplier}) returning id`)[0].id;
      }
      const [product] = await transaction`insert into products (store_id, category_id, product_type_id, supplier_id, internal_code, name, brand, cost_price, sale_price, minimum_stock) values (${store.id}, ${category.id}, ${type.id}, ${supplierId}, ${record.code}, ${record.name}, ${record.brand}, ${record.cost}, ${record.price}, ${record.minimumStock}) on conflict (store_id, internal_code) do update set category_id = excluded.category_id, product_type_id = excluded.product_type_id, supplier_id = excluded.supplier_id, name = excluded.name, brand = excluded.brand, cost_price = excluded.cost_price, sale_price = excluded.sale_price, minimum_stock = excluded.minimum_stock, active = true, updated_at = now() returning id`;
      const inserted = await transaction`insert into product_variants (product_id, color, size, internal_code, quantity_on_hand) values (${product.id}, ${record.color}, ${record.size}, ${record.variantCode}, ${record.quantity}) on conflict (product_id, color, size) do nothing returning id`;
      if (inserted.length) {
        createdVariants += 1;
        if (record.quantity > 0) await transaction`insert into stock_movements (store_id, variant_id, type, quantity_delta, quantity_before, quantity_after, reason) values (${store.id}, ${inserted[0].id}, 'initial', ${record.quantity}, 0, ${record.quantity}, 'Carga inicial por CSV')`;
      }
    }
  });
  console.log(`Importação concluída. ${createdVariants} nova(s) variação(ões) criada(s). Variações existentes mantiveram o saldo atual.`);
} finally {
  await database.end();
}
