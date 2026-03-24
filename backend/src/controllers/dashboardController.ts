import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../index";
import { calculateRiskLevel } from "../utils/helpers";

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // Get all users and members
    const totalMembers = await prisma.user.count({
      where: { role: "MEMBER" },
    });

    // Calculate total savings
    const paidContributions = await prisma.contribution.findMany({
      where: { status: "PAID" },
    });
    const totalSavings = paidContributions.reduce((sum, c) => sum + c.amount, 0);

    // Get active loans info
    const activeLoans = await prisma.loan.findMany({
      where: { status: "ACTIVE" },
    });
    const totalActiveLoanAmount = activeLoans.reduce(
      (sum, l) => sum + l.amount,
      0
    );

    // Get overdue payments
    const overdueRepayments = await prisma.repayment.findMany({
      where: { status: "OVERDUE" },
    });
    const totalOverdueAmount = overdueRepayments.reduce(
      (sum, r) => sum + r.amount,
      0
    );

    // Get missed contributions count
    const missedContributions = await prisma.contribution.findMany({
      where: { status: "MISSED" },
    });

    // Get pending repayments count
    const pendingRepayments = await prisma.repayment.findMany({
      where: { status: "PENDING" },
    });

    // Calculate risk levels for each member
    const memberRisks = [];
    const members = await prisma.user.findMany({
      where: { role: "MEMBER" },
      select: { id: true, name: true, email: true },
    });

    for (const member of members) {
      const memberMissedContributions = missedContributions.filter(
        (c) => c.memberId === member.id
      ).length;
      const riskLevel = calculateRiskLevel(memberMissedContributions);

      memberRisks.push({
        ...member,
        riskLevel,
        missedPayments: memberMissedContributions,
      });
    }

    const stats = {
      totalMembers,
      totalSavings: Math.round(totalSavings * 100) / 100,
      activeLoans: activeLoans.length,
      totalActiveLoanAmount: Math.round(totalActiveLoanAmount * 100) / 100,
      overduePayments: overdueRepayments.length,
      totalOverdueAmount: Math.round(totalOverdueAmount * 100) / 100,
      missedContributions: missedContributions.length,
      pendingRepayments: pendingRepayments.length,
      memberRisks: memberRisks.sort((a, b) => {
        const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return riskOrder[a.riskLevel as keyof typeof riskOrder] -
          riskOrder[b.riskLevel as keyof typeof riskOrder]
          ? 1
          : -1;
      }),
    };

    res.json(stats);
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

export const getMemberDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const memberId = req.user!.id;

    // Get member info
    const member = await prisma.user.findUnique({
      where: { id: memberId },
    });

    // Get contributions
    const contributions = await prisma.contribution.findMany({
      where: { memberId },
    });

    const paidContributions = contributions.filter((c) => c.status === "PAID");
    const missedContributions = contributions.filter((c) => c.status === "MISSED");
    const totalSavings = paidContributions.reduce((sum, c) => sum + c.amount, 0);

    // Get loans
    const loans = await prisma.loan.findMany({
      where: { memberId, status: "ACTIVE" },
      include: {
        repayments: true,
      },
    });

    // Get upcoming dues
    const upcomingDues = await prisma.repayment.findMany({
      where: {
        loan: { memberId, status: "ACTIVE" },
        status: "PENDING",
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    // Get overdue
    const overdueDues = await prisma.repayment.findMany({
      where: {
        loan: { memberId },
        status: "OVERDUE",
      },
    });

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: { userId: memberId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json({
      member: {
        id: member?.id,
        name: member?.name,
        email: member?.email,
      },
      savings: {
        total: Math.round(totalSavings * 100) / 100,
        paid: paidContributions.length,
        missed: missedContributions.length,
      },
      loans: {
        active: loans.length,
        totalAmount: Math.round(
          loans.reduce((sum, l) => sum + l.amount, 0) * 100
        ) / 100,
      },
      dues: {
        upcoming: upcomingDues,
        overdue: overdueDues,
      },
      notifications,
    });
  } catch (error) {
    console.error("Get member dashboard error:", error);
    res.status(500).json({ error: "Failed to fetch member dashboard" });
  }
};
