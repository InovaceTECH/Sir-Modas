export const standardSizes = ["PP", "P", "M", "G", "GG", "XG", "U"] as const;

type VariantIdentity = { color: string; size: string };

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function createSizeGrade(existing: VariantIdentity[], color: string, sizes: string[]) {
  const normalizedColor = color.trim();
  if (!normalizedColor) return [];

  const known = new Set(existing.map((variant) => `${normalize(variant.color)}|${normalize(variant.size)}`));
  const added = new Set<string>();

  return sizes.flatMap((size) => {
    const normalizedSize = size.trim();
    const key = `${normalize(normalizedColor)}|${normalize(normalizedSize)}`;
    if (!normalizedSize || known.has(key) || added.has(key)) return [];
    added.add(key);
    return [{ color: normalizedColor, size: normalizedSize }];
  });
}
