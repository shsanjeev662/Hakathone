import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../index";
import { computeMemberAnalytics } from "../utils/analytics";

const canAccessMember = (req: AuthRequest, memberId: string) =>
  req.user?.role === "ADMIN" || req.user?.id === memberId;

const refreshTrustScore = async (memberId: string) => {
  const [contributions, loans] = await Promise.all([
    prisma.contribution.findMany({ where: { memberId } }),
    prisma.loan.findMany({
      where: { memberId },
      include: { repayments: true },
    }),
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

export const addContribution = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId, amount, month, year, status = "PAID" } = req.body;

    if (!memberId || amount === undefined || month === undefined || year === undefined) {
      return res.status(400).json({
        error: "memberId, amount, month, and year are required",
      });
    }

    const existing = await prisma.contribution.findUnique({
      where: {
        memberId_month_year: { memberId, month, year },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Contribution already exists for this month" });
    }

    const contribution = await prisma.contribution.create({
      data: {
        memberId,
        amount,
        month,
        year,
        status,
      },
      include: {
        member: {
          select: { name: true, email: true },
        },
      },
    });

    const analytics = await refreshTrustScore(memberId);

    await prisma.notification.create({
      data: {
        userId: memberId,
        message:
          status === "PAID"
            ? `Monthly contribution of NPR ${amount} recorded successfully.`
            : `Contribution for ${month}/${year} is marked ${status.toLowerCase()}.`,
        type: status === "PAID" ? "INFO" : "WARNING",
      },
    });

    res.status(201).json({
      ...contribution,
      trustScore: analytics.trustScore,
    });
  } catch (error) {
    console.error("Add contribution error:", error);
    res.status(500).json({ error: "Failed to add contribution" });
  }
};

export const getMemberContributions = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;

    if (!canAccessMember(req, memberId)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const contributions = await prisma.contribution.findMany({
      where: { memberId },
      include: {
        member: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    res.json(contributions);
  } catch (error) {
    console.error("Get member contributions error:", error);
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
};

export const getAllContributions = async (_req: AuthRequest, res: Response) => {
  try {
    const contributions = await prisma.contribution.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
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
    });

    res.json(contributions);
  } catch (error) {
    console.error("Get all contributions error:", error);
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
};

export const updateContributionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const contribution = await prisma.contribution.update({
      where: { id },
      data: { status },
    });

    const analytics = await refreshTrustScore(contribution.memberId);

    res.json({
      ...contribution,
      trustScore: analytics.trustScore,
    });
  } catch (error) {
    console.error("Update contribution status error:", error);
    res.status(500).json({ error: "Failed to update contribution" });
  }
};
