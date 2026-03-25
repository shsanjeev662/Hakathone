import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../index";
import { computeMemberAnalytics, isRepaymentLate } from "../utils/analytics";

const refreshTrustScore = async (memberId: string) => {
  const [contributions, loans] = await Promise.all([
    prisma.contribution.findMany({ where: { memberId } }),
    prisma.loan.findMany({ where: { memberId }, include: { repayments: true } }),
  ]);

  const analytics = computeMemberAnalytics({
    contributions,
    repayments: loans.flatMap((loan) => loan.repayments),
  });

  await prisma.memberProfile.upsert({
    where: { userId: memberId },
    create: { userId: memberId, trustScore: analytics.trustScore },
    update: { trustScore: analytics.trustScore },
  });

  return analytics;
};

export const recordRepayment = async (req: AuthRequest, res: Response) => {
  try {
    const { loanId, amount, repaymentId, paidDate } = req.body;

    if ((!loanId && !repaymentId) || !amount) {
      return res.status(400).json({ error: "repaymentId or loanId and amount are required" });
    }

    const repayment = repaymentId
      ? await prisma.repayment.findUnique({ where: { id: repaymentId } })
      : await prisma.repayment.findFirst({
          where: {
            loanId,
            status: { in: ["PENDING", "OVERDUE"] },
          },
          orderBy: { dueDate: "asc" },
        });

    if (!repayment) {
      return res.status(404).json({ error: "No pending repayment found" });
    }

    if (amount < repayment.amount) {
      return res.status(400).json({ error: `Amount should be at least NPR ${repayment.amount}` });
    }

    const actualPaidDate = paidDate ? new Date(paidDate) : new Date();

    const updatedRepayment = await prisma.repayment.update({
      where: { id: repayment.id },
      data: {
        status: "PAID",
        paidDate: actualPaidDate,
      },
      include: {
        loan: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const remaining = await prisma.repayment.count({
      where: {
        loanId: updatedRepayment.loanId,
        status: { in: ["PENDING", "OVERDUE"] },
      },
    });

    if (remaining === 0) {
      await prisma.loan.update({
        where: { id: updatedRepayment.loanId },
        data: { status: "COMPLETED" },
      });
    }

    const analytics = await refreshTrustScore(updatedRepayment.loan.member.id);
    const late = isRepaymentLate({
      dueDate: updatedRepayment.dueDate,
      paidDate: actualPaidDate,
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: updatedRepayment.loan.member.id,
          message: late
            ? "Repayment recorded, but it was paid after the due date."
            : "Repayment recorded successfully. Great job staying on time.",
          type: late ? "WARNING" : "INFO",
        },
        {
          userId: req.user!.id,
          message: `Repayment collected from ${updatedRepayment.loan.member.name}.`,
          type: "INFO",
        },
      ],
    });

    res.json({
      ...updatedRepayment,
      trustScore: analytics.trustScore,
      riskLevel: analytics.riskLevel,
      message: "Repayment recorded successfully",
    });
  } catch (error) {
    console.error("Record repayment error:", error);
    res.status(500).json({ error: "Failed to record repayment" });
  }
};

export const getLoanRepayments = async (req: AuthRequest, res: Response) => {
  try {
    const { loanId } = req.params;

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        member: true,
      },
    });

    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    if (req.user?.role !== "ADMIN" && req.user?.id !== loan.memberId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const repayments = await prisma.repayment.findMany({
      where: { loanId },
      orderBy: { dueDate: "asc" },
    });

    res.json({
      repayments,
      stats: {
        total: repayments.length,
        paid: repayments.filter((item) => item.status === "PAID").length,
        pending: repayments.filter((item) => item.status === "PENDING").length,
        overdue: repayments.filter((item) => item.status === "OVERDUE").length,
      },
    });
  } catch (error) {
    console.error("Get loan repayments error:", error);
    res.status(500).json({ error: "Failed to fetch repayments" });
  }
};

export const checkAndUpdateOverdue = async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();

    const overdueRepayments = await prisma.repayment.findMany({
      where: {
        status: "PENDING",
        dueDate: { lt: now },
      },
      include: {
        loan: {
          include: {
            member: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    for (const repayment of overdueRepayments) {
      await prisma.repayment.update({
        where: { id: repayment.id },
        data: { status: "OVERDUE" },
      });

      await prisma.notification.createMany({
        data: [
          {
            userId: repayment.loan.member.id,
            message: `Payment overdue for instalment ${repayment.installmentNumber}. Please contact the cooperative office.`,
            type: "ALERT",
          },
        ],
      });

      await refreshTrustScore(repayment.loan.member.id);
    }

    res.json({
      message: `Updated ${overdueRepayments.length} repayments to overdue`,
      count: overdueRepayments.length,
    });
  } catch (error) {
    console.error("Check overdue error:", error);
    res.status(500).json({ error: "Failed to check overdue payments" });
  }
};

export const getAllRepayments = async (_req: AuthRequest, res: Response) => {
  try {
    const repayments = await prisma.repayment.findMany({
      orderBy: { dueDate: "asc" },
      include: {
        loan: {
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
          },
        },
      },
    });

    res.json(repayments);
  } catch (error) {
    console.error("Get all repayments error:", error);
    res.status(500).json({ error: "Failed to fetch repayments" });
  }
};
