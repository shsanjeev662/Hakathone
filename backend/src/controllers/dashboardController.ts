import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../index";
import { computeMemberAnalytics, summarizeLoan } from "../utils/analytics";

export const getDashboardStats = async (_req: AuthRequest, res: Response) => {
  try {
    const members = await prisma.user.findMany({
      where: { role: "MEMBER" },
      include: {
        memberProfile: true,
        contributions: true,
        loans: {
          include: {
            repayments: true,
          },
        },
      },
    });

    const activeLoans = members.flatMap((member) => member.loans.filter((loan) => loan.status === "ACTIVE"));
    const allRepayments = activeLoans.flatMap((loan) => loan.repayments);
    const overdueRepayments = allRepayments.filter((item) => item.status === "OVERDUE");
    const pendingRepayments = allRepayments.filter((item) => item.status === "PENDING");
    const contributions = members.flatMap((member) => member.contributions);
    const paidContributions = contributions.filter((item) => item.status === "PAID");
    const missedContributions = contributions.filter((item) => item.status === "MISSED");

    const memberRisks = members
      .map((member) => {
        const analytics = computeMemberAnalytics({
          contributions: member.contributions,
          repayments: member.loans.flatMap((loan) => loan.repayments),
        });

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          trustScore: analytics.trustScore,
          riskLevel: analytics.riskLevel,
          riskScore: analytics.riskScore,
          missedPayments: analytics.overdueCount,
          contributionConsistency: analytics.contributionConsistency,
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);

    const chartMonthlySavings = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const total = contributions
        .filter((item) => item.month === month && item.year === year && item.status === "PAID")
        .reduce((sum, item) => sum + item.amount, 0);

      return {
        label: date.toLocaleString("en-US", { month: "short" }),
        total,
      };
    });

    res.json({
      totalMembers: members.length,
      totalSavings: paidContributions.reduce((sum, item) => sum + item.amount, 0),
      activeLoans: activeLoans.length,
      totalActiveLoanAmount: activeLoans.reduce((sum, item) => sum + item.amount, 0),
      overduePayments: overdueRepayments.length,
      totalOverdueAmount: overdueRepayments.reduce((sum, item) => sum + item.amount, 0),
      missedContributions: missedContributions.length,
      pendingRepayments: pendingRepayments.length,
      collectionRate: contributions.length
        ? Math.round((paidContributions.length / contributions.length) * 100)
        : 100,
      repaymentRate: allRepayments.length
        ? Math.round(
            (allRepayments.filter((item) => item.status === "PAID").length / allRepayments.length) * 100
          )
        : 100,
      trustScoreAverage: members.length
        ? Math.round(memberRisks.reduce((sum, member) => sum + member.trustScore, 0) / members.length)
        : 0,
      smartAlerts: [
        ...memberRisks
          .filter((member) => member.riskLevel === "HIGH")
          .slice(0, 3)
          .map((member) => ({
            type: "ALERT",
            title: `High-risk borrower: ${member.name}`,
            message: `Trust score ${member.trustScore} with ${member.missedPayments} overdue instalment(s).`,
          })),
        ...pendingRepayments.slice(0, 3).map((repayment) => ({
          type: "WARNING",
          title: "Upcoming due date",
          message: `Instalment of NPR ${repayment.amount} is due on ${repayment.dueDate.toLocaleDateString()}.`,
        })),
      ],
      memberRisks,
      monthlySavings: chartMonthlySavings,
      loanStatusBreakdown: [
        { name: "Active", value: activeLoans.length },
        { name: "Completed", value: members.flatMap((member) => member.loans).filter((loan) => loan.status === "COMPLETED").length },
        { name: "Overdue Instalments", value: overdueRepayments.length },
      ],
      recentLoans: activeLoans.slice(0, 5).map((loan) => ({
        id: loan.id,
        memberId: loan.memberId,
        amount: loan.amount,
        riskLevel: loan.riskLevel,
        ...summarizeLoan(loan),
      })),
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

export const getMemberDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const memberId = req.user!.id;

    const member = await prisma.user.findUnique({
      where: { id: memberId },
      include: {
        memberProfile: true,
        contributions: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
        },
        loans: {
          include: {
            repayments: {
              orderBy: { dueDate: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const analytics = computeMemberAnalytics({
      contributions: member.contributions,
      repayments: member.loans.flatMap((loan) => loan.repayments),
    });

    const activeLoans = member.loans.filter((loan) => loan.status === "ACTIVE");
    const upcomingDues = activeLoans
      .flatMap((loan) => loan.repayments.map((repayment) => ({ ...repayment, loan })))
      .filter((item) => item.status === "PENDING")
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 5);

    const overdueDues = activeLoans
      .flatMap((loan) => loan.repayments.map((repayment) => ({ ...repayment, loan })))
      .filter((item) => item.status === "OVERDUE")
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    const totalSavings = member.contributions
      .filter((item) => item.status === "PAID")
      .reduce((sum, item) => sum + item.amount, 0);

    const totalOutstandingBalance = activeLoans.reduce(
      (sum, loan) => sum + summarizeLoan(loan).outstandingBalance,
      0
    );

    res.json({
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.memberProfile?.phone,
        address: member.memberProfile?.address,
      },
      trust: {
        score: analytics.trustScore,
        riskLevel: analytics.riskLevel,
        contributionConsistency: analytics.contributionConsistency,
      },
      savings: {
        total: totalSavings,
        paid: member.contributions.filter((item) => item.status === "PAID").length,
        missed: member.contributions.filter((item) => item.status === "MISSED").length,
        recent: member.contributions.slice(0, 6),
      },
      loans: {
        active: activeLoans.length,
        totalAmount: activeLoans.reduce((sum, loan) => sum + loan.amount, 0),
        outstandingBalance: totalOutstandingBalance,
        items: activeLoans.map((loan) => ({
          ...loan,
          ...summarizeLoan(loan),
        })),
      },
      dues: {
        upcoming: upcomingDues,
        overdue: overdueDues,
      },
      notifications: member.notifications,
    });
  } catch (error) {
    console.error("Get member dashboard error:", error);
    res.status(500).json({ error: "Failed to fetch member dashboard" });
  }
};
