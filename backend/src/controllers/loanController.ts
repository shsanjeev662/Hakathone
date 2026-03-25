import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../index";
import {
  computeMemberAnalytics,
  summarizeLoan,
} from "../utils/analytics";
import { calculateEMI } from "../utils/helpers";

const buildSchedule = ({
  amount,
  annualRate,
  months,
  startDate,
}: {
  amount: number;
  annualRate: number;
  months: number;
  startDate: Date;
}) => {
  const monthlyRate = annualRate / 100 / 12;
  const emiAmount = calculateEMI(amount, annualRate, months);
  let balance = amount;

  return Array.from({ length: months }, (_, index) => {
    const interestAmount = monthlyRate === 0 ? 0 : Math.round(balance * monthlyRate * 100) / 100;
    const principalAmount =
      index === months - 1
        ? Math.round(balance * 100) / 100
        : Math.round((emiAmount - interestAmount) * 100) / 100;

    balance = Math.max(0, Math.round((balance - principalAmount) * 100) / 100);

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + index + 1);

    return {
      installmentNumber: index + 1,
      amount: emiAmount,
      principalAmount,
      interestAmount,
      dueDate,
      status: "PENDING" as const,
    };
  });
};

export const issueLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId, amount, interestRate, durationMonths, startDate } = req.body;

    if (!memberId || !amount || interestRate === undefined || !durationMonths) {
      return res.status(400).json({
        error: "memberId, amount, interestRate, and durationMonths are required",
      });
    }

    const member = await prisma.user.findUnique({
      where: { id: memberId },
      include: {
        contributions: true,
        loans: {
          include: {
            repayments: true,
          },
        },
        memberProfile: true,
      },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const analytics = computeMemberAnalytics({
      contributions: member.contributions,
      repayments: member.loans.flatMap((loan) => loan.repayments),
    });

    const approvalWarnings = analytics.alerts.map((item) => item.message);
    const emiAmount = calculateEMI(amount, interestRate, durationMonths);
    const loanStartDate = startDate ? new Date(startDate) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          memberId,
          amount,
          interestRate,
          durationMonths,
          emiAmount,
          startDate: loanStartDate,
          status: "ACTIVE",
          riskLevel: analytics.riskLevel,
          riskScore: analytics.riskScore,
        },
      });

      await tx.repayment.createMany({
        data: buildSchedule({
          amount,
          annualRate: interestRate,
          months: durationMonths,
          startDate: loanStartDate,
        }).map((repayment) => ({
          ...repayment,
          loanId: loan.id,
        })),
      });

      await tx.notification.createMany({
        data: [
          {
            userId: memberId,
            message: `Loan approved for NPR ${amount}. First instalment is due next month.`,
            type: analytics.riskLevel === "HIGH" ? "WARNING" : "INFO",
          },
          {
            userId: req.user!.id,
            message: `Loan issued to ${member.name} with ${analytics.riskLevel.toLowerCase()} risk profile.`,
            type: analytics.riskLevel === "HIGH" ? "ALERT" : "INFO",
          },
        ],
      });

      return loan;
    });

    res.status(201).json({
      loan: result,
      emiAmount,
      totalRepayments: durationMonths,
      approvalInsights: {
        trustScore: analytics.trustScore,
        contributionConsistency: analytics.contributionConsistency,
        riskLevel: analytics.riskLevel,
        riskScore: analytics.riskScore,
        warnings: approvalWarnings,
      },
    });
  } catch (error) {
    console.error("Issue loan error:", error);
    res.status(500).json({ error: "Failed to issue loan" });
  }
};

export const getAllLoans = async (_req: AuthRequest, res: Response) => {
  try {
    const loans = await prisma.loan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            memberProfile: {
              select: {
                trustScore: true,
              },
            },
          },
        },
        repayments: true,
      },
    });

    res.json(
      loans.map((loan) => ({
        ...loan,
        overdueCount: loan.repayments.filter((item) => item.status === "OVERDUE").length,
        ...summarizeLoan(loan),
      }))
    );
  } catch (error) {
    console.error("Get all loans error:", error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
};

export const getMemberLoans = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;

    if (req.user?.role !== "ADMIN" && req.user?.id !== memberId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const loans = await prisma.loan.findMany({
      where: { memberId },
      include: {
        repayments: {
          orderBy: { dueDate: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      loans.map((loan) => ({
        ...loan,
        ...summarizeLoan(loan),
      }))
    );
  } catch (error) {
    console.error("Get member loans error:", error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
};

export const getLoanDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            memberProfile: {
              select: {
                trustScore: true,
              },
            },
          },
        },
        repayments: {
          orderBy: { dueDate: "asc" },
        },
      },
    });

    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    if (req.user?.role !== "ADMIN" && req.user?.id !== loan.member.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      ...loan,
      ...summarizeLoan(loan),
    });
  } catch (error) {
    console.error("Get loan details error:", error);
    res.status(500).json({ error: "Failed to fetch loan details" });
  }
};

export const closeLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const loan = await prisma.loan.update({
      where: { id },
      data: { status: "COMPLETED" },
    });

    await prisma.notification.create({
      data: {
        userId: loan.memberId,
        message: `Loan of NPR ${loan.amount} has been marked complete.`,
        type: "INFO",
      },
    });

    res.json(loan);
  } catch (error) {
    console.error("Close loan error:", error);
    res.status(500).json({ error: "Failed to close loan" });
  }
};
