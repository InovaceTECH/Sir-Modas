import { z } from "zod";

const optionalText = z.string().trim().transform((value) => value || null);
const money = z.coerce.number().min(0, "Informe um valor válido.").max(999999.99);

export const productVariantSchema = z.object({
  id: z.string().uuid().optional(),
  color: z.string().trim().min(1, "Informe a cor.").max(60),
  size: z.string().trim().min(1, "Informe o tamanho.").max(30),
  initialQuantity: z.coerce.number().int().min(0).max(999999),
});

export const productSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(2, "Informe o nome do produto.").max(160),
    categoryName: z.string().trim().min(1, "Informe a categoria.").max(80),
    productTypeName: z.string().trim().min(1, "Informe o tipo.").max(80),
    supplierName: optionalText,
    brand: optionalText,
    description: optionalText,
    notes: optionalText,
    photoUrl: z.string().trim().refine((value) => !value || URL.canParse(value), "Informe uma URL válida.").transform((value) => value || null),
    costPrice: money,
    salePrice: money.positive("O preço de venda deve ser maior que zero."),
    minimumStock: z.coerce.number().int().min(0).max(999999),
    variants: z.array(productVariantSchema).min(1, "Adicione ao menos uma variação.").max(100),
  })
  .superRefine((value, context) => {
    const combinations = new Set<string>();

    value.variants.forEach((variant, index) => {
      const key = `${variant.color.toLocaleLowerCase("pt-BR")}|${variant.size.toLocaleLowerCase("pt-BR")}`;
      if (combinations.has(key)) {
        context.addIssue({ code: "custom", path: ["variants", index], message: "Cor e tamanho repetidos." });
      }
      combinations.add(key);
    });
  });

export type ProductInput = z.infer<typeof productSchema>;
