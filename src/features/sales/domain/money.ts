export function toCents(value: number | string) {
  const number = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(number)) throw new TypeError("Valor monetário inválido.");
  return Math.round(number * 100);
}

export function fromCents(value: number) {
  return (value / 100).toFixed(2);
}

export function assertPaymentMatchesTotal(totalCents: number, paymentCents: number) {
  if (totalCents !== paymentCents) {
    throw new Error("PAYMENT_MISMATCH");
  }
}
