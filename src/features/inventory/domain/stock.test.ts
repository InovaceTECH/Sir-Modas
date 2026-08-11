import { describe, expect, it } from "vitest";

import { calculateStockAfterMovement, InsufficientStockError } from "./stock";

describe("calculateStockAfterMovement", () => {
  it("aplica entradas e saídas inteiras", () => {
    expect(calculateStockAfterMovement(3, 5)).toBe(8);
    expect(calculateStockAfterMovement(8, -2)).toBe(6);
  });

  it("impede que o estoque fique negativo", () => {
    expect(() => calculateStockAfterMovement(1, -2)).toThrow(InsufficientStockError);
  });

  it("rejeita quantidades fracionadas", () => {
    expect(() => calculateStockAfterMovement(1.5, 1)).toThrow(TypeError);
  });
});
