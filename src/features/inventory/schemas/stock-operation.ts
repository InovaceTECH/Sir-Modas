import { z } from "zod";

export const stockEntrySchema = z.object({
  supplierName: z.string().trim().max(120).transform((value) => value || null),
  documentNumber: z.string().trim().max(80).transform((value) => value || null),
  notes: z.string().trim().max(500).transform((value) => value || null),
  items: z.array(z.object({
    variantId: z.string().uuid(),
    quantity: z.coerce.number().int().positive().max(999999),
    unitCost: z.coerce.number().min(0).max(999999.99),
    salePrice: z.coerce.number().positive().max(999999.99).optional(),
    updateSalePrice: z.boolean().optional().default(false),
  })).min(1).max(100),
});

export const stockAdjustmentSchema = z.object({
  variantId: z.string().uuid(),
  countedQuantity: z.coerce.number().int().min(0).max(999999),
  reason: z.string().trim().min(5, "Explique o motivo do ajuste.").max(300),
});
