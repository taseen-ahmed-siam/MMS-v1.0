/**
 * Contribution derivation.
 *
 * This is the single rule the whole feature rests on, so it lives on its own as a
 * pure function: paid comes from approved donations, remaining is clamped at
 * zero, and Completed/Incomplete is never stored anywhere.
 *
 * Approved means `status = 'completed'` and not soft-deleted. The query layer
 * already filters to those rows, so callers pass approved amounts only.
 */

export type ContributionStatus = "completed" | "incomplete";
export type PaymentStage = "paid" | "partial" | "unpaid";

export type DerivedContribution = {
  assigned_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: ContributionStatus;
  payment_stage: PaymentStage;
};

export function deriveContribution(
  assignedAmount: number,
  approvedAmounts: number[]
): DerivedContribution {
  const assigned = Number(assignedAmount) || 0;
  const paid = approvedAmounts.reduce((sum, amount) => sum + (Number(amount) || 0), 0);

  // Overpayment is kept in full but never produces a negative balance.
  const remaining = Math.max(assigned - paid, 0);

  // With no assigned amount there is nothing to complete against, so a member is
  // only completed once something has actually been paid.
  const status: ContributionStatus =
    assigned > 0 ? (paid >= assigned ? "completed" : "incomplete") : paid > 0 ? "completed" : "incomplete";

  const payment_stage: PaymentStage =
    paid <= 0 ? "unpaid" : status === "completed" ? "paid" : "partial";

  return {
    assigned_amount: assigned,
    paid_amount: paid,
    remaining_amount: remaining,
    status,
    payment_stage,
  };
}