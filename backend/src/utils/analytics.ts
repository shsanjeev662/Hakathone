import {
  Contribution,
  ContributionStatus,
  Loan,
  NotificationType,
  Repayment,
  RepaymentStatus,
} from "@prisma/client";
import {
  calculateOverdueContributions,
  getOverdueMonthsCount,
  calculateOverdueRepayments,
  getOverdueRepaymentCount,
} from "./helpers";

export type TrustRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface MemberAnalytics {
  trustScore: number;
  riskLevel: TrustRiskLevel;
  riskScore: number;
  contributionConsistency: number;
  overdueContributionAmount: number;
  overdueContributionCount: number;
  overdueRepaymentAmount: number;
  overdueRepaymentCount: number;
  overdueCount: number;
  onTimeRepaymentCount: number;
  delayedRepaymentCount: number;
  totalOverdueAmount: number;
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
  const overdueRepaymentTransactions = repayments.filter((item) => item.status === RepaymentStatus.OVERDUE);
  const delayedRepayments = paidRepayments.filter(isRepaymentLate);
  const onTimeRepayments = paidRepayments.length - delayedRepayments.length;

  // Calculate overdue contributions
  const overdueContributionAmount = calculateOverdueContributions(
    contributions.map((c) => ({
      month: c.month,
      year: c.year,
      amount: c.amount,
      status: c.status,
    }))
  );
  const overdueContributionCount = getOverdueMonthsCount(
    contributions.map((c) => ({
      month: c.month,
      year: c.year,
      status: c.status,
    }))
  );

  // Calculate overdue repayments (including missed payments)
  const overdueRepaymentAmount = calculateOverdueRepayments(
    repayments.map((r) => ({
      amount: r.amount,
      dueDate: r.dueDate,
      status: r.status,
    }))
  );
  const overdueRepaymentCount = getOverdueRepaymentCount(
    repayments.map((r) => ({
      dueDate: r.dueDate,
      status: r.status,
    }))
  );

  const totalOverdueAmount = overdueContributionAmount + overdueRepaymentAmount;

  const contributionConsistency = contributions.length
    ? Math.round((paidContributions.length / contributions.length) * 100)
    : 100;

  const scoreRaw =
    55 +
    paidContributions.length * 4 +
    onTimeRepayments * 6 -
    missedContributions.length * 10 -
    overdueRepaymentTransactions.length * 12 -
    delayedRepayments.length * 5 -
    pendingContributions.length * 2 -
    overdueContributionCount * 5 -
    overdueRepaymentCount * 5;

  const trustScore = clamp(Math.round(scoreRaw), 0, 100);

  const riskScore = clamp(
    Math.round(
      overdueRepaymentTransactions.length * 22 +
        overdueRepaymentCount * 15 +
        delayedRepayments.length * 10 +
        missedContributions.length * 12 +
        overdueContributionCount * 8 +
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
  if (overdueRepaymentCount > 0) {
    alerts.push({
      type: "ALERT",
      message: `${overdueRepaymentCount} loan instalment(s) totaling NPR ${Math.round(overdueRepaymentAmount)} are overdue. Immediate payment required.`,
    });
  }
  if (overdueContributionCount > 0) {
    alerts.push({
      type: "ALERT",
      message: `${overdueContributionCount} monthly deposit(s) totaling NPR ${Math.round(overdueContributionAmount)} are overdue.`,
    });
  }
  if (totalOverdueAmount > 0) {
    alerts.push({
      type: "ALERT",
      message: `Total overdue amount: NPR ${Math.round(totalOverdueAmount)} (Contributions: NPR ${Math.round(overdueContributionAmount)}, Loan Payments: NPR ${Math.round(overdueRepaymentAmount)}).`,
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
    overdueContributionAmount: Math.round(overdueContributionAmount * 100) / 100,
    overdueContributionCount,
    overdueRepaymentAmount: Math.round(overdueRepaymentAmount * 100) / 100,
    overdueRepaymentCount,
    totalOverdueAmount: Math.round(totalOverdueAmount * 100) / 100,
    overdueCount: overdueRepaymentTransactions.length + overdueRepaymentCount,
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
