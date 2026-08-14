import { z } from "zod";

export const saleSources = ["Loja física", "Instagram", "WhatsApp", "Indicação", "Cliente antiga", "Passou em frente à loja", "Outro"] as const;

export const saleSchema = z.object({
  source: z.enum(saleSources),
  customerId: z.string().trim().transform((value) => value || null).refine((value) => !value || z.uuid().safeParse(value).success, "Cliente inválida."),
  dueDate: z.string().trim().transform((value) => value || null).refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Vencimento inválido."),
  discountAmount: z.coerce.number().finite().min(0).max(999999.99),
  notes: z.string().trim().max(500).transform((value) => value || null),
  items: z.array(z.object({
    variantId: z.string().uuid(),
    quantity: z.coerce.number().int().positive().max(9999),
  })).min(1, "Adicione ao menos um produto.").max(100),
  payments: z.array(z.object({
    method: z.enum(["cash", "pix", "debit_card", "credit_card", "on_account"]),
    amount: z.coerce.number().finite().positive().max(999999.99),
    installments: z.coerce.number().int().min(1).max(24).optional(),
  })).min(1, "Informe o pagamento.").max(10),
}).superRefine((value, context) => {
  const ids = new Set<string>();
  value.items.forEach((item, index) => {
    if (ids.has(item.variantId)) context.addIssue({ code: "custom", path: ["items", index], message: "Produto repetido no carrinho." });
    ids.add(item.variantId);
  });
  if (value.payments.some((payment) => payment.method === "on_account")) {
    if (!value.customerId) context.addIssue({ code: "custom", path: ["customerId"], message: "Selecione a cliente para vender no fiado." });
    if (!value.dueDate) context.addIssue({ code: "custom", path: ["dueDate"], message: "Informe o vencimento da conta." });
  }
});

export const cancelSaleSchema = z.object({
  saleId: z.string().uuid(),
  reason: z.string().trim().min(5, "Informe o motivo do cancelamento.").max(300),
});
