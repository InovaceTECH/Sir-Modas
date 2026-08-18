import { describe, expect, it } from "vitest";

import { generateProductCode } from "./product-code";

describe("generateProductCode", () => {
  it("gera um código interno único para novos produtos", () => {
    const first = generateProductCode();
    const second = generateProductCode();

    expect(first).toMatch(/^PRD-[A-F0-9]{12}$/);
    expect(second).toMatch(/^PRD-[A-F0-9]{12}$/);
    expect(first).not.toBe(second);
  });
});
