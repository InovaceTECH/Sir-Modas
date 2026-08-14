import { z } from "zod";

export const exchangeReasons = ["Tamanho incorreto", "Cor", "Defeito", "Cliente desistiu", "Produto diferente do esperado", "Outro"] as const;

export const exchangeSchema = z.object({
  saleId: z.string().uuid(),
  returnedVariantId: z.string().uuid(),
  returnedQuantity: z.coerce.number().int().positive().max(999),
  returnedCondition: z.enum(["sellable", "damaged"]),
  deliveredVariantId: z.string().uuid(),
  deliveredQuantity: z.coerce.number().int().positive().max(999),
  reason: z.enum(exchangeReasons),
  paymentMethod: z.enum(["cash", "pix", "debit_card", "credit_card"]).optional(),
  notes: z.string().trim().max(500).transform((value) => value || null),
});
