import {
  Contribution,
  ContributionStatus,
  Loan,
  NotificationType,
  Repayment,
  RepaymentStatus,
} from "@prisma/client";

export type TrustRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface MemberAnalytics {
  trustScore: number;
  riskLevel: TrustRiskLevel;
  riskScore: number;
  contributionConsistency: number;
  overdueCount: number;
  onTimeRepaymentCount: number;
  delayedRepaymentCount: number;
  alerts: Array<{
    type: NotificationType;
    message: string;
  }>;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const isRepaymentLate = (repayment: Pick<Repayment, "dueDate" | "paidDate">) => {
  if (!repayment.paidDate) return false;
  return new Date(repayment.paidDate).getTime() > new Date(repayment.dueDate).getTime();
};

export const computeMemberAnalytics = ({
  contributions,
  repayments,
}: {
  contributions: Contribution[];
  repayments: Repayment[];
}): MemberAnalytics => {
  const paidContributions = contributions.filter((item) => item.status === ContributionStatus.PAID);
  const missedContributions = contributions.filter((item) => item.status === ContributionStatus.MISSED);
  const pendingContributions = contributions.filter((item) => item.status === ContributionStatus.PENDING);

  const paidRepayments = repayments.filter((item) => item.status === RepaymentStatus.PAID);
  const overdueRepayments = repayments.filter((item) => item.status === RepaymentStatus.OVERDUE);
  const delayedRepayments = paidRepayments.filter(isRepaymentLate);
  const onTimeRepayments = paidRepayments.length - delayedRepayments.length;

  const contributionConsistency = contributions.length
    ? Math.round((paidContributions.length / contributions.length) * 100)
    : 100;

  const scoreRaw =
    55 +
    paidContributions.length * 4 +
    onTimeRepayments * 6 -
    missedContributions.length * 10 -
    overdueRepayments.length * 12 -
    delayedRepayments.length * 5 -
    pendingContributions.length * 2;

  const trustScore = clamp(Math.round(scoreRaw), 0, 100);

  const riskScore = clamp(
    Math.round(
      overdueRepayments.length * 22 +
        delayedRepayments.length * 10 +
        missedContributions.length * 12 +
        (100 - contributionConsistency) * 0.35
    ),
    0,
    100
  );

  let riskLevel: TrustRiskLevel = "LOW";
  if (riskScore >= 70) {
    riskLevel = "HIGH";
  } else if (riskScore >= 35) {
    riskLevel = "MEDIUM";
  }

  const alerts: MemberAnalytics["alerts"] = [];
  if (overdueRepayments.length > 0) {
    alerts.push({
      type: "ALERT",
      message: `${overdueRepayments.length} instalment(s) are overdue and need action.`,
    });
  }
  if (riskLevel === "HIGH") {
    alerts.push({
      type: "WARNING",
      message: "Borrower is high risk based on repayment behavior and contribution consistency.",
    });
  }
  if (trustScore >= 80) {
    alerts.push({
      type: "INFO",
      message: "Strong trust score backed by regular savings and timely payments.",
    });
  }

  return {
    trustScore,
    riskLevel,
    riskScore,
    contributionConsistency,
    overdueCount: overdueRepayments.length,
    onTimeRepaymentCount: onTimeRepayments,
    delayedRepaymentCount: delayedRepayments.length,
    alerts,
  };
};

export const summarizeLoan = (
  loan: Loan & { repayments: Repayment[] }
) => {
  const paidAmount = loan.repayments
    .filter((item) => item.status === RepaymentStatus.PAID)
    .reduce((sum, item) => sum + item.amount, 0);
  const overdueAmount = loan.repayments
    .filter((item) => item.status === RepaymentStatus.OVERDUE)
    .reduce((sum, item) => sum + item.amount, 0);
  const upcoming = loan.repayments
    .filter((item) => item.status === RepaymentStatus.PENDING)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

  return {
    paidAmount: Math.round(paidAmount * 100) / 100,
    outstandingBalance: Math.max(0, Math.round((loan.emiAmount * loan.durationMonths - paidAmount) * 100) / 100),
    overdueAmount: Math.round(overdueAmount * 100) / 100,
    nextDueDate: upcoming?.dueDate ?? null,
  };
};
