import { fromCents, toCents } from "@/features/sales/domain/money";

export type ReceivableStatus = "open" | "partially_paid" | "paid" | "overdue" | "cancelled";

export function applyReceivablePayment(remainingAmount: string | number, paidAmount: string | number, paymentAmount: string | number) {
  const remainingCents = toCents(remainingAmount);
  const paidCents = toCents(paidAmount);
  const paymentCents = toCents(paymentAmount);
  if (paymentCents <= 0 || paymentCents > remainingCents) throw new Error("INVALID_PAYMENT_AMOUNT");
  return {
    paidAmount: fromCents(paidCents + paymentCents),
    remainingAmount: fromCents(remainingCents - paymentCents),
  };
}

export function getReceivableStatus(remainingAmount: string | number, paidAmount: string | number, dueDate: string, today: string): ReceivableStatus {
  if (toCents(remainingAmount) === 0) return "paid";
  if (dueDate < today) return "overdue";
  if (toCents(paidAmount) > 0) return "partially_paid";
  return "open";
}
