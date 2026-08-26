import { describe, expect, it } from "vitest";

import { stockEntrySchema } from "./stock-operation";

const validEntry = {
  supplierName: "",
  documentNumber: "",
  notes: "",
  items: [{
    variantId: "11111111-1111-4111-8111-111111111111",
    quantity: 2,
    unitCost: 30,
    salePrice: 59.9,
  }],
};

describe("stockEntrySchema", () => {
  it("preserva o preço atual quando ele não foi alterado na entrada", () => {
    const parsed = stockEntrySchema.parse(validEntry);
    expect(parsed.items[0].updateSalePrice).toBe(false);
  });

  it("aceita uma alteração intencional do preço da variação", () => {
    const parsed = stockEntrySchema.parse({
      ...validEntry,
      items: [{ ...validEntry.items[0], salePrice: 69.9, updateSalePrice: true }],
    });
    expect(parsed.items[0].updateSalePrice).toBe(true);
  });
});
