import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length ? value : null));

export const storeSettingsSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da loja.").max(120),
  phone: optionalText,
  address: optionalText,
  exchangeDeadlineDays: z.coerce
    .number()
    .int("O prazo deve ser um número inteiro.")
    .min(1, "O prazo mínimo é de 1 dia.")
    .max(365, "O prazo máximo é de 365 dias."),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;
