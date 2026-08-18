import { describe, expect, it } from "vitest";

import { productSchema } from "./product";

const validProduct = {
  name: "Camiseta básica",
  categoryName: "Feminino",
  productTypeName: "Camiseta",
  supplierName: "",
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
    expect(productSchema.safeParse(validProduct).success).toBe(true);
  });

  it("não exige código para cadastrar um produto", () => {
    expect(productSchema.safeParse(validProduct).success).toBe(true);
  });

  it("rejeita combinações repetidas de cor e tamanho", () => {
    const parsed = productSchema.safeParse({ ...validProduct, variants: [...validProduct.variants, { ...validProduct.variants[0], color: "preta", size: "m" }] });
    expect(parsed.success).toBe(false);
  });
});
