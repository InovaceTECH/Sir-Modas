import { z } from "zod";

const money = z.coerce.number().finite().min(0).max(999999.99);

export const openCashSchema = z.object({
  openingAmount: money,
  openingNotes: z.string().trim().max(500).transform((value) => value || null),
});

export const cashMovementSchema = z.object({
  type: z.enum(["cash_injection", "withdrawal", "expense"]),
  amount: money.positive("Informe um valor maior que zero."),
  reason: z.string().trim().min(3, "Informe o motivo.").max(160),
  notes: z.string().trim().max(500).transform((value) => value || null),
});

export const closeCashSchema = z.object({
  countedAmount: money,
  closingNotes: z.string().trim().max(500).transform((value) => value || null),
});
