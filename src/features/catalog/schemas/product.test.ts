import { describe, expect, it } from "vitest";

import { productSchema } from "./product";

const validProduct = {
  name: "Camiseta básica",
  categoryId: "11111111-1111-4111-8111-111111111111",
  categoryName: "",
  productTypeId: "22222222-2222-4222-8222-222222222222",
  productTypeName: "",
  supplierId: "",
  supplierName: "",
  supplierPhone: "",
  supplierNotes: "",
  brand: "",
  description: "",
  notes: "",
  photoUrl: "",
  costPrice: 20,
  salePrice: 49.9,
  minimumStock: 2,
  variants: [{ color: "Preta", size: "M", initialQuantity: 3 }],
};

describe("productSchema", () => {
  it("aceita produto com variações válidas", () => {
    const parsed = productSchema.safeParse(validProduct);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.variants[0].salePrice).toBeNull();
      expect(parsed.data.variants[0].adjustStock).toBe(false);
    }
  });

  it("aceita preço específico opcional por variação", () => {
    const parsed = productSchema.safeParse({ ...validProduct, variants: [{ ...validProduct.variants[0], salePrice: "59.90" }] });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.variants[0].salePrice).toBe(59.9);
  });

  it("rejeita preço inválido em uma variação", () => {
    expect(productSchema.safeParse({ ...validProduct, variants: [{ ...validProduct.variants[0], salePrice: 0 }] }).success).toBe(false);
  });

  it("aceita marcar uma alteração intencional de estoque", () => {
    const parsed = productSchema.safeParse({ ...validProduct, variants: [{ ...validProduct.variants[0], initialQuantity: 8, adjustStock: true }] });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.variants[0].adjustStock).toBe(true);
  });

  it("rejeita estoque vazio em vez de convertê-lo para zero", () => {
    const parsed = productSchema.safeParse({ ...validProduct, variants: [{ ...validProduct.variants[0], initialQuantity: "", adjustStock: true }] });
    expect(parsed.success).toBe(false);
  });

  it("não exige código para cadastrar um produto", () => {
    expect(productSchema.safeParse(validProduct).success).toBe(true);
  });

  it("aceita cadastrar uma nova categoria e um novo tipo", () => {
    const parsed = productSchema.safeParse({ ...validProduct, categoryId: "", categoryName: "Feminino", productTypeId: "", productTypeName: "Camiseta" });
    expect(parsed.success).toBe(true);
  });

  it("aceita fornecedor existente ou criado durante o cadastro", () => {
    expect(productSchema.safeParse({ ...validProduct, supplierId: "33333333-3333-4333-8333-333333333333" }).success).toBe(true);
    expect(productSchema.safeParse({ ...validProduct, supplierName: "Distribuidora Central", supplierPhone: "11999999999", supplierNotes: "Entrega semanal" }).success).toBe(true);
  });

  it("exige uma categoria e um tipo", () => {
    const parsed = productSchema.safeParse({ ...validProduct, categoryId: "", productTypeId: "" });
    expect(parsed.success).toBe(false);
  });

  it("rejeita combinações repetidas de cor e tamanho", () => {
    const parsed = productSchema.safeParse({ ...validProduct, variants: [...validProduct.variants, { ...validProduct.variants[0], color: "preta", size: "m" }] });
    expect(parsed.success).toBe(false);
  });
});
