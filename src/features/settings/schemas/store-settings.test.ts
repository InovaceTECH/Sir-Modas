import { describe, expect, it } from "vitest";

import { storeSettingsSchema } from "./store-settings";

describe("storeSettingsSchema", () => {
  it("normaliza campos opcionais vazios", () => {
    const result = storeSettingsSchema.parse({
      name: "Sir Modas",
      phone: "",
      address: "  ",
      exchangeDeadlineDays: "30",
    });

    expect(result).toEqual({
      name: "Sir Modas",
      phone: null,
      address: null,
      exchangeDeadlineDays: 30,
    });
  });

  it("rejeita prazo de troca inválido", () => {
    const result = storeSettingsSchema.safeParse({
      name: "Sir Modas",
      phone: "",
      address: "",
      exchangeDeadlineDays: 0,
    });

    expect(result.success).toBe(false);
  });
});
