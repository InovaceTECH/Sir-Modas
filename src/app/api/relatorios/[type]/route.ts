import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { getDb } from "@/db";
import { stores } from "@/db/schema";
import { getReportExportData, normalizeReportRange, type ReportType } from "@/features/reports/queries/reports";
import { getCurrentSession } from "@/lib/auth/session";

const validTypes: ReportType[] = ["sales", "inventory", "cash", "receivables"];

function csvCell(value: unknown) {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}

function makeCsv(rows: unknown[][]) {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const session = await getCurrentSession();
  if (!session) return new Response("Não autorizado", { status: 401 });
  const { type: rawType } = await params;
  if (!validTypes.includes(rawType as ReportType)) return new Response("Relatório inválido", { status: 404 });
  const type = rawType as ReportType;
  const [store] = await getDb().select({ id: stores.id }).from(stores).where(eq(stores.ownerAuthId, session.user.id)).limit(1);
  if (!store) return new Response("Loja não configurada", { status: 400 });
  const range = normalizeReportRange(request.nextUrl.searchParams.get("inicio") ?? undefined, request.nextUrl.searchParams.get("fim") ?? undefined);
  const data = await getReportExportData(store.id, range.from, range.to);
  let rows: unknown[][];
  if (type === "sales") rows = [["Produto", "Peças vendidas", "Receita"], ...data.salesProducts.map((row) => [row.name, row.pieces, row.revenue])];
  else if (type === "inventory") rows = [["Produto", "Categoria", "Saldo atual", "Estoque mínimo"], ...data.inventoryProducts.map((row) => [row.name, row.category, row.units, row.minimum])];
  else if (type === "cash") rows = [["Forma de pagamento", "Total recebido"], ...data.cashPayments.map((row) => [row.label, row.value])];
  else rows = [["Cliente", "Telefone", "Saldo em aberto"], ...data.customerBalances.map((row) => [row.name, row.phone, row.balance])];
  const filename = `sir-modas-${type}-${range.from}-a-${range.to}.csv`;
  return new Response(makeCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" } });
}
