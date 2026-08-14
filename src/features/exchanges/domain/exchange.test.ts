import { describe, expect, it } from "vitest";

import { calculateExchangeDifference, isOutsideExchangeDeadline } from "./exchange";

describe("trocas", () => {
  it("calcula diferença positiva e negativa em centavos", () => {
    expect(calculateExchangeDifference("59.90", 1, "79.90", 1)).toBe("20.00");
    expect(calculateExchangeDifference("100.00", 1, "70.00", 1)).toBe("-30.00");
  });

  it("identifica solicitação fora do prazo", () => {
    const soldAt = new Date("2026-08-01T12:00:00-03:00");
    expect(isOutsideExchangeDeadline(soldAt, 7, new Date("2026-08-08T11:00:00-03:00"))).toBe(false);
    expect(isOutsideExchangeDeadline(soldAt, 7, new Date("2026-08-09T12:00:00-03:00"))).toBe(true);
  });
});
