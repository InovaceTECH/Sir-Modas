import { z } from "zod";

export const customerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Informe o nome da cliente.").max(120),
  phone: z.string().trim().min(8, "Informe um telefone válido.").max(24),
});

export const receivablePaymentSchema = z.object({
  receivableId: z.string().uuid(),
  amount: z.coerce.number().finite().positive("Informe um valor maior que zero.").max(999999.99),
  method: z.enum(["cash", "pix", "debit_card", "credit_card"]),
  idempotencyKey: z.string().uuid(),
  notes: z.string().trim().max(300).transform((value) => value || null),
});

export type CustomerInput = z.infer<typeof customerSchema>;
