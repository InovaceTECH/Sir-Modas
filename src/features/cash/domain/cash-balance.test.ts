import { describe, expect, it } from "vitest";

import { calculateExpectedCash } from "./cash-balance";

describe("calculateExpectedCash", () => {
  it("considera apenas movimentos que alteram dinheiro físico", () => {
    expect(calculateExpectedCash(100, [
      { type: "sale", paymentMethod: "cash", amount: 80 },
      { type: "sale", paymentMethod: "pix", amount: 200 },
      { type: "cash_injection", paymentMethod: null, amount: 20 },
      { type: "expense", paymentMethod: null, amount: 15 },
      { type: "withdrawal", paymentMethod: null, amount: 30 },
      { type: "cancellation", paymentMethod: "cash", amount: 10 },
      { type: "adjustment", paymentMethod: "cash", amount: 5 },
      { type: "adjustment", paymentMethod: "pix", amount: 50 },
    ])).toBe(150);
  });
});
