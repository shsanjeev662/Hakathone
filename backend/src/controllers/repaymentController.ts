import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../index";

export const recordRepayment = async (req: AuthRequest, res: Response) => {
  try {
    const { loanId, amount } = req.body;

    if (!loanId || !amount) {
      return res.status(400).json({ error: "loanId and amount are required" });
    }

    // Find the first pending/overdue repayment for the loan
    const repayment = await prisma.repayment.findFirst({
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
      return res.status(400).json({
        error: `Amount should be at least ₹${repayment.amount}`,
      });
    }

    // Update repayment
    const updatedRepayment = await prisma.repayment.update({
      where: { id: repayment.id },
      data: {
        status: "PAID",
        paidDate: new Date(),
      },
    });

    // Get associated loan
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
    });

    if (loan) {
      // Create notification
      await prisma.notification.create({
        data: {
          userId: loan.memberId,
          message: `Repayment of ₹${amount} recorded successfully`,
          type: "INFO",
        },
      });
    }

    res.json({
      ...updatedRepayment,
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

    const repayments = await prisma.repayment.findMany({
      where: { loanId },
      orderBy: { dueDate: "asc" },
    });

    const stats = {
      total: repayments.length,
      paid: repayments.filter((r) => r.status === "PAID").length,
      pending: repayments.filter((r) => r.status === "PENDING").length,
      overdue: repayments.filter((r) => r.status === "OVERDUE").length,
    };

    res.json({ repayments, stats });
  } catch (error) {
    console.error("Get loan repayments error:", error);
    res.status(500).json({ error: "Failed to fetch repayments" });
  }
};

export const checkAndUpdateOverdue = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const now = new Date();

    // Find all pending repayments that are overdue
    const overdueRepayments = await prisma.repayment.findMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: now,
        },
      },
    });

    // Update overdue repayments
    for (const repayment of overdueRepayments) {
      await prisma.repayment.update({
        where: { id: repayment.id },
        data: { status: "OVERDUE" },
      });

      // Get loan and member info
      const loan = await prisma.loan.findUnique({
        where: { id: repayment.loanId },
      });

      if (loan) {
        // Create alert notification
        await prisma.notification.create({
          data: {
            userId: loan.memberId,
            message: `Payment overdue! Amount ₹${repayment.amount} was due on ${repayment.dueDate.toLocaleDateString()}`,
            type: "ALERT",
          },
        });
      }
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

export const getAllRepayments = async (req: AuthRequest, res: Response) => {
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
