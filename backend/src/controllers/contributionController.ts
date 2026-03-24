import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../index";

export const addContribution = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId, amount, month, year, status = "PAID" } = req.body;

    if (!memberId || !amount || month === undefined || year === undefined) {
      return res.status(400).json({
        error: "memberId, amount, month, and year are required",
      });
    }

    // Check if contribution already exists for this month
    const existing = await prisma.contribution.findUnique({
      where: {
        memberId_month_year: {
          memberId,
          month,
          year,
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        error: "Contribution already exists for this month",
      });
    }

    const contribution = await prisma.contribution.create({
      data: {
        memberId,
        amount,
        month,
        year,
        status,
      },
    });

    // Create notification
    if (status === "PAID") {
      await prisma.notification.create({
        data: {
          userId: memberId,
          message: `Contribution of ${amount} recorded for ${month}/${year}`,
          type: "INFO",
        },
      });
    }

    res.status(201).json(contribution);
  } catch (error) {
    console.error("Add contribution error:", error);
    res.status(500).json({ error: "Failed to add contribution" });
  }
};

export const getMemberContributions = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { memberId } = req.params;

    const contributions = await prisma.contribution.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
    });

    res.json(contributions);
  } catch (error) {
    console.error("Get member contributions error:", error);
    res.status(500).json({ error: "Failed to fetch contributions" });
  }
};

export const getAllContributions = async (req: AuthRequest, res: Response) => {
  try {
    const contributions = await prisma.contribution.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
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

export const updateContributionStatus = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const contribution = await prisma.contribution.update({
      where: { id },
      data: { status },
    });

    res.json(contribution);
  } catch (error) {
    console.error("Update contribution status error:", error);
    res.status(500).json({ error: "Failed to update contribution" });
  }
};
