import { fromCents, toCents } from "@/features/sales/domain/money";

export function calculateExchangeDifference(returnedUnitPrice: string | number, returnedQuantity: number, deliveredUnitPrice: string | number, deliveredQuantity: number) {
  return fromCents(toCents(deliveredUnitPrice) * deliveredQuantity - toCents(returnedUnitPrice) * returnedQuantity);
}

export function isOutsideExchangeDeadline(soldAt: Date, deadlineDays: number, requestedAt = new Date()) {
  const deadline = new Date(soldAt);
  deadline.setDate(deadline.getDate() + deadlineDays);
  return requestedAt > deadline;
}
