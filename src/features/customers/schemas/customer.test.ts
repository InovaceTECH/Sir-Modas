import { describe, expect, it } from "vitest";

import { customerSchema, receivablePaymentSchema } from "./customer";

describe("customerSchema", () => {
  it("normaliza campos opcionais vazios", () => {
    const result = customerSchema.parse({ name: "Maria Silva", phone: "11999999999", birthDate: "", address: "", notes: "" });
    expect(result).toMatchObject({ birthDate: null, address: null, notes: null });
  });

  it("rejeita cliente sem telefone", () => {
    expect(customerSchema.safeParse({ name: "Maria", phone: "", birthDate: "", address: "", notes: "" }).success).toBe(false);
  });
});

describe("receivablePaymentSchema", () => {
  it("não permite usar fiado para pagar uma conta", () => {
    const result = receivablePaymentSchema.safeParse({ receivableId: crypto.randomUUID(), amount: 10, method: "on_account", idempotencyKey: crypto.randomUUID(), notes: "" });
    expect(result.success).toBe(false);
  });
});
