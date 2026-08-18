import { describe, expect, it } from "vitest";

import { createSizeGrade, standardSizes } from "./product-variants";

describe("createSizeGrade", () => {
  it("cria uma variação para cada tamanho selecionado", () => {
    expect(createSizeGrade([], "Preta", ["P", "M", "G"]))
      .toEqual([{ color: "Preta", size: "P" }, { color: "Preta", size: "M" }, { color: "Preta", size: "G" }]);
  });

  it("não cria combinações repetidas", () => {
    expect(createSizeGrade([{ color: "preta", size: "M" }], "Preta", ["P", "M", "M"]))
      .toEqual([{ color: "Preta", size: "P" }]);
  });

  it("oferece os tamanhos mais usados", () => {
    expect(standardSizes).toEqual(["PP", "P", "M", "G", "GG", "XG", "U"]);
  });
});
