import { describe, expect, it } from "vitest";

import { customerSchema, receivablePaymentSchema } from "./customer";

describe("customerSchema", () => {
  it("aceita o cadastro simplificado com nome e celular", () => {
    const result = customerSchema.parse({ name: " Maria Silva ", phone: " 11999999999 " });
    expect(result).toEqual({ name: "Maria Silva", phone: "11999999999" });
  });

  it("rejeita cliente sem telefone", () => {
    expect(customerSchema.safeParse({ name: "Maria", phone: "" }).success).toBe(false);
  });
});

describe("receivablePaymentSchema", () => {
  it("não permite usar fiado para pagar uma conta", () => {
    const result = receivablePaymentSchema.safeParse({ receivableId: crypto.randomUUID(), amount: 10, method: "on_account", idempotencyKey: crypto.randomUUID(), notes: "" });
    expect(result.success).toBe(false);
  });
});
