import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");

const database = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const checks = [
  {
    name: "Estoque negativo",
    query: database`select pv.id, p.name, pv.color, pv.size, pv.quantity_on_hand from product_variants pv join products p on p.id = pv.product_id where pv.quantity_on_hand < 0`,
  },
  {
    name: "Vendas com pagamentos divergentes",
    query: database`select s.number, s.total_amount, coalesce(sum(sp.amount), 0) as payment_total from sales s left join sale_payments sp on sp.sale_id = s.id where s.status = 'confirmed' group by s.id having s.total_amount <> coalesce(sum(sp.amount), 0)`,
  },
  {
    name: "Contas a receber inconsistentes",
    query: database`select id, original_amount, paid_amount, remaining_amount from receivables where status <> 'cancelled' and original_amount <> paid_amount + remaining_amount`,
  },
  {
    name: "Mais de um caixa aberto por loja",
    query: database`select store_id, count(*)::int as open_count from cash_sessions where status = 'open' group by store_id having count(*) > 1`,
  },
  {
    name: "Movimentos de estoque com sequência inválida",
    query: database`select id, variant_id, quantity_before, quantity_delta, quantity_after from stock_movements where quantity_before + quantity_delta <> quantity_after or quantity_after < 0`,
  },
  {
    name: "Pagamentos de fiado acima do valor pago",
    query: database`select r.id, r.paid_amount, coalesce(sum(rp.amount), 0) as payment_total from receivables r left join receivable_payments rp on rp.receivable_id = r.id group by r.id having r.paid_amount <> coalesce(sum(rp.amount), 0)`,
  },
];

let failures = 0;
try {
  console.log("Auditoria de integridade — Sir Modas\n");
  for (const check of checks) {
    const rows = await check.query;
    if (rows.length) {
      failures += rows.length;
      console.error(`FALHA: ${check.name} (${rows.length})`);
      console.table(rows.slice(0, 10));
    } else {
      console.log(`OK: ${check.name}`);
    }
  }
  if (failures) {
    console.error(`\nAuditoria encontrou ${failures} divergência(s).`);
    process.exitCode = 1;
  } else console.log("\nAuditoria concluída sem divergências.");
} finally {
  await database.end();
}
