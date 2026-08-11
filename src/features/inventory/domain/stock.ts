export class InsufficientStockError extends Error {
  constructor() {
    super("A quantidade solicitada é maior que o estoque disponível.");
    this.name = "InsufficientStockError";
  }
}

export function calculateStockAfterMovement(current: number, delta: number) {
  if (!Number.isInteger(current) || !Number.isInteger(delta)) {
    throw new TypeError("Quantidades de estoque devem ser números inteiros.");
  }

  const next = current + delta;

  if (next < 0) {
    throw new InsufficientStockError();
  }

  return next;
}
