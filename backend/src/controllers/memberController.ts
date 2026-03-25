import bcryptjs from "bcryptjs";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../index";
import { computeMemberAnalytics } from "../utils/analytics";
import { hashPassword } from "../utils/helpers";
import { sendPasswordResetEmail } from "../utils/mailer";

const baseMemberInclude = {
  memberProfile: true,
  contributions: true,
  loans: {
    include: {
      repayments: true,
    },
  },
} as const;

export const getAllMembers = async (_req: AuthRequest, res: Response) => {
  try {
    const members = await prisma.user.findMany({
      where: { role: "MEMBER" },
      include: baseMemberInclude,
      orderBy: { createdAt: "desc" },
    });

    res.json(
      members.map((member) => {
        const analytics = computeMemberAnalytics({
          contributions: member.contributions,
          repayments: member.loans.flatMap((loan) => loan.repayments),
        });

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          createdAt: member.createdAt,
          failedLoginAttempts: member.failedLoginAttempts,
          isLocked: member.isLocked,
          memberProfile: {
            phone: member.memberProfile?.phone,
            address: member.memberProfile?.address,
            occupation: member.memberProfile?.occupation,
            emergencyContact: member.memberProfile?.emergencyContact,
            trustScore: analytics.trustScore,
          },
          totals: {
            savings: member.contributions
              .filter((item) => item.status === "PAID")
              .reduce((sum, item) => sum + item.amount, 0),
            activeLoans: member.loans
              .filter((item) => item.status === "ACTIVE")
              .reduce((sum, item) => sum + item.amount, 0),
          },
          riskLevel: analytics.riskLevel,
          overdueCount: analytics.overdueCount,
        };
      })
    );
  } catch (error) {
    console.error("Get members error:", error);
    res.status(500).json({ error: "Failed to fetch members" });
  }
};

export const addMember = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, phone, address, occupation, emergencyContact } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "MEMBER",
        memberProfile: {
          create: {
            phone,
            address,
            occupation,
            emergencyContact,
          },
        },
      },
      include: {
        memberProfile: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ error: "Failed to add member" });
  }
};

export const updateMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, occupation, emergencyContact } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        memberProfile: {
          upsert: {
            create: {
              phone,
              address,
              occupation,
              emergencyContact,
            },
            update: {
              ...(phone !== undefined ? { phone } : {}),
              ...(address !== undefined ? { address } : {}),
              ...(occupation !== undefined ? { occupation } : {}),
              ...(emergencyContact !== undefined ? { emergencyContact } : {}),
            },
          },
        },
      },
      include: {
        memberProfile: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error("Update member error:", error);
    res.status(500).json({ error: "Failed to update member" });
  }
};

export const resetMemberPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || String(password).trim().length < 6) {
      return res.status(400).json({ error: "A new password of at least 6 characters is required" });
    }

    const member = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, name: true, email: true },
    });

    if (!member || member.role !== "MEMBER") {
      return res.status(404).json({ error: "Member not found" });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        isLocked: false,
        lockedAt: null,
      },
    });

    await prisma.notification.create({
      data: {
        userId: id,
        type: "INFO",
        message: "Your password was reset by the admin. Please use the new password shared with you.",
      },
    });

    const emailResult = await sendPasswordResetEmail({
      to: member.email,
      memberName: member.name,
      password,
    });

    res.json({
      message: emailResult.sent
        ? `Password reset successfully for ${member.name}. The account has been unlocked and the new password was sent by email.`
        : `Password reset successfully for ${member.name}. The account has been unlocked, but email delivery is not configured.`,
    });
  } catch (error) {
    console.error("Reset member password error:", error);
    res.status(500).json({ error: "Failed to reset member password" });
  }
};

export const deleteMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Delete member error:", error);
    res.status(500).json({ error: "Failed to delete member" });
  }
};

export const getMemberStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.user?.role !== "ADMIN" && req.user?.id !== id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const member = await prisma.user.findUnique({
      where: { id },
      include: baseMemberInclude,
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const analytics = computeMemberAnalytics({
      contributions: member.contributions,
      repayments: member.loans.flatMap((loan) => loan.repayments),
    });

    res.json({
      memberId: id,
      trustScore: analytics.trustScore,
      riskLevel: analytics.riskLevel,
      totalSavings: member.contributions
        .filter((item) => item.status === "PAID")
        .reduce((sum, item) => sum + item.amount, 0),
      totalLoans: member.loans.reduce((sum, item) => sum + item.amount, 0),
      contributionsCount: member.contributions.length,
      loansCount: member.loans.length,
      overdueCount: analytics.overdueCount,
      contributionConsistency: analytics.contributionConsistency,
    });
  } catch (error) {
    console.error("Get member stats error:", error);
    res.status(500).json({ error: "Failed to fetch member stats" });
  }
};
