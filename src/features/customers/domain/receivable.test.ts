import { describe, expect, it } from "vitest";

import { applyReceivablePayment, getReceivableStatus } from "./receivable";

describe("recebimentos", () => {
  it("calcula uma baixa parcial sem erro de centavos", () => {
    expect(applyReceivablePayment("100.00", "0.00", "35.90")).toEqual({ paidAmount: "35.90", remainingAmount: "64.10" });
  });

  it("impede pagamento acima do saldo", () => {
    expect(() => applyReceivablePayment("20.00", "0.00", "20.01")).toThrow("INVALID_PAYMENT_AMOUNT");
  });

  it("prioriza quitada e identifica vencida", () => {
    expect(getReceivableStatus("0", "50", "2026-08-01", "2026-08-12")).toBe("paid");
    expect(getReceivableStatus("50", "0", "2026-08-01", "2026-08-12")).toBe("overdue");
  });
});
