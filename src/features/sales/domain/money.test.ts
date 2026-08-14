import { describe, expect, it } from "vitest";

import { assertPaymentMatchesTotal, fromCents, toCents } from "./money";

describe("money", () => {
  it("converte valores sem erro de ponto flutuante", () => {
    expect(toCents(19.9)).toBe(1990);
    expect(fromCents(1990)).toBe("19.90");
  });

  it("exige que pagamentos correspondam ao total", () => {
    expect(() => assertPaymentMatchesTotal(1000, 999)).toThrow("PAYMENT_MISMATCH");
    expect(() => assertPaymentMatchesTotal(1000, 1000)).not.toThrow();
  });
});
