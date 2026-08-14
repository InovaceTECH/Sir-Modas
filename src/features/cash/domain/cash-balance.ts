export type CashMovementForBalance = {
  type: string;
  paymentMethod: string | null;
  amount: number;
};

export function calculateExpectedCash(openingAmount: number, movements: CashMovementForBalance[]) {
  return movements.reduce((balance, movement) => {
    if (movement.type === "cash_injection") return balance + movement.amount;
    if (movement.type === "withdrawal" || movement.type === "expense") return balance - movement.amount;
    if (movement.type === "sale" && movement.paymentMethod === "cash") return balance + movement.amount;
    if (movement.type === "receivable_payment" && movement.paymentMethod === "cash") return balance + movement.amount;
    if (movement.type === "adjustment" && movement.paymentMethod === "cash") return balance + movement.amount;
    if (movement.type === "cancellation" && movement.paymentMethod === "cash") return balance - movement.amount;
    return balance;
  }, openingAmount);
}
