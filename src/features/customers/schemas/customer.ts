import { z } from "zod";

const optionalText = (maximum: number) => z.string().trim().max(maximum).transform((value) => value || null);

export const customerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Informe o nome da cliente.").max(120),
  phone: z.string().trim().min(8, "Informe um telefone válido.").max(24),
  birthDate: z.string().trim().transform((value) => value || null).refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Data de nascimento inválida."),
  address: optionalText(300),
  notes: optionalText(500),
});

export const receivablePaymentSchema = z.object({
  receivableId: z.string().uuid(),
  amount: z.coerce.number().finite().positive("Informe um valor maior que zero.").max(999999.99),
  method: z.enum(["cash", "pix", "debit_card", "credit_card"]),
  idempotencyKey: z.string().uuid(),
  notes: optionalText(300),
});

export type CustomerInput = z.infer<typeof customerSchema>;
