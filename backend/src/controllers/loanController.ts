import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../index";
import { calculateEMI } from "../utils/helpers";

export const issueLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId, amount, interestRate, durationMonths } = req.body;

    if (!memberId || !amount || interestRate === undefined || !durationMonths) {
      return res.status(400).json({
        error:
          "memberId, amount, interestRate, and durationMonths are required",
      });
    }

    const emiAmount = calculateEMI(amount, interestRate, durationMonths);

    const loan = await prisma.loan.create({
      data: {
        memberId,
        amount,
        interestRate,
        durationMonths,
        emiAmount,
        startDate: new Date(),
        status: "ACTIVE",
      },
    });

    // Create repayment schedule
    const repaymentSchedule = [];
    for (let i = 1; i <= durationMonths; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);

      repaymentSchedule.push({
        loanId: loan.id,
        amount: emiAmount,
        dueDate,
        status: "PENDING",
      });
    }

    await prisma.repayment.createMany({
      data: repaymentSchedule,
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: memberId,
        message: `Loan approved: ₹${amount} with EMI of ₹${emiAmount.toFixed(2)}`,
        type: "INFO",
      },
    });

    res.status(201).json({
      loan,
      emiAmount,
      totalRepayments: durationMonths,
    });
  } catch (error) {
    console.error("Issue loan error:", error);
    res.status(500).json({ error: "Failed to issue loan" });
  }
};

export const getAllLoans = async (req: AuthRequest, res: Response) => {
  try {
    const loans = await prisma.loan.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        repayments: {
          where: { status: "OVERDUE" },
        },
      },
    });

    const loansWithStats = loans.map((loan) => ({
      ...loan,
      overdueCount: loan.repayments.length,
    }));

    res.json(loansWithStats);
  } catch (error) {
    console.error("Get all loans error:", error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
};

export const getMemberLoans = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;

    const loans = await prisma.loan.findMany({
      where: { memberId },
      include: {
        repayments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(loans);
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

    const paidRepayments = loan.repayments.filter((r) => r.status === "PAID");
    const totalRepaid = paidRepayments.reduce((sum, r) => sum + r.amount, 0);

    res.json({
      ...loan,
      totalRepaid,
      remainingAmount: loan.amount - totalRepaid,
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
        message: `Loan of ₹${loan.amount} has been closed`,
        type: "INFO",
      },
    });

    res.json(loan);
  } catch (error) {
    console.error("Close loan error:", error);
    res.status(500).json({ error: "Failed to close loan" });
  }
};
