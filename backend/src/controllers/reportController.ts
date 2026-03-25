import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../index";
import { computeMemberAnalytics, summarizeLoan } from "../utils/analytics";

const canAccessMember = (req: AuthRequest, memberId: string) =>
  req.user?.role === "ADMIN" || req.user?.id === memberId;

export const getMemberStatement = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;

    if (!canAccessMember(req, memberId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const member = await prisma.user.findUnique({
      where: { id: memberId },
      include: {
        memberProfile: true,
        contributions: { orderBy: [{ year: "desc" }, { month: "desc" }] },
        loans: {
          include: {
            repayments: { orderBy: { dueDate: "asc" } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const repayments = member.loans.flatMap((loan) => loan.repayments);
    const analytics = computeMemberAnalytics({
      contributions: member.contributions,
      repayments,
    });

    res.json({
      generatedAt: new Date().toISOString(),
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.memberProfile?.phone,
        address: member.memberProfile?.address,
        occupation: member.memberProfile?.occupation,
      },
      trustScore: analytics.trustScore,
      contributionHistory: member.contributions,
      loans: member.loans.map((loan) => ({
        ...loan,
        ...summarizeLoan(loan),
      })),
    });
  } catch (error) {
    console.error("Get member statement error:", error);
    res.status(500).json({ error: "Failed to generate member statement" });
  }
};

export const getMonthlyReport = async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const contributions = await prisma.contribution.findMany({
      where: { month, year },
      include: { member: { select: { name: true } } },
    });

    const repayments = await prisma.repayment.findMany({
      where: {
        dueDate: {
          gte: new Date(year, now.getMonth(), 1),
          lt: new Date(year, now.getMonth() + 1, 1),
        },
      },
      include: {
        loan: { include: { member: { select: { name: true } } } },
      },
    });

    res.json({
      generatedAt: new Date().toISOString(),
      month,
      year,
      savingsCollected: contributions
        .filter((item) => item.status === "PAID")
        .reduce((sum, item) => sum + item.amount, 0),
      contributions,
      repayments,
      missedContributions: contributions.filter((item) => item.status === "MISSED").length,
      overdueRepayments: repayments.filter((item) => item.status === "OVERDUE").length,
    });
  } catch (error) {
    console.error("Get monthly report error:", error);
    res.status(500).json({ error: "Failed to generate monthly report" });
  }
};

export const getLoanSummaryReport = async (_req: AuthRequest, res: Response) => {
  try {
    const loans = await prisma.loan.findMany({
      include: {
        member: {
          select: {
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
      orderBy: { createdAt: "desc" },
    });

    res.json({
      generatedAt: new Date().toISOString(),
      totals: {
        totalLoans: loans.length,
        activeLoans: loans.filter((loan) => loan.status === "ACTIVE").length,
        disbursedAmount: loans.reduce((sum, loan) => sum + loan.amount, 0),
      },
      loans: loans.map((loan) => ({
        id: loan.id,
        memberName: loan.member.name,
        memberEmail: loan.member.email,
        trustScore: loan.member.memberProfile?.trustScore ?? 0,
        amount: loan.amount,
        emiAmount: loan.emiAmount,
        durationMonths: loan.durationMonths,
        riskLevel: loan.riskLevel,
        status: loan.status,
        ...summarizeLoan(loan),
      })),
    });
  } catch (error) {
    console.error("Get loan summary report error:", error);
    res.status(500).json({ error: "Failed to generate loan summary" });
  }
};
