import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { prisma } from "../index";

export const getAllMembers = async (req: AuthRequest, res: Response) => {
  try {
    const members = await prisma.user.findMany({
      where: { role: "MEMBER" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        memberProfile: {
          select: {
            phone: true,
            address: true,
          },
        },
      },
    });

    res.json(members);
  } catch (error) {
    console.error("Get members error:", error);
    res.status(500).json({ error: "Failed to fetch members" });
  }
};

export const addMember = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await require("bcryptjs").hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "MEMBER",
      },
    });

    const profile = await prisma.memberProfile.create({
      data: {
        userId: user.id,
        phone,
        address,
      },
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: profile.phone,
      address: profile.address,
    });
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ error: "Failed to add member" });
  }
};

export const updateMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
    });

    const profile = await prisma.memberProfile.update({
      where: { userId: id },
      data: {
        ...(phone && { phone }),
        ...(address && { address }),
      },
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: profile.phone,
      address: profile.address,
    });
  } catch (error) {
    console.error("Update member error:", error);
    res.status(500).json({ error: "Failed to update member" });
  }
};

export const deleteMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: "Member deleted successfully" });
  } catch (error) {
    console.error("Delete member error:", error);
    res.status(500).json({ error: "Failed to delete member" });
  }
};

export const getMemberStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const contributions = await prisma.contribution.findMany({
      where: { memberId: id },
    });

    const loans = await prisma.loan.findMany({
      where: { memberId: id },
    });

    const totalSavings = contributions
      .filter((c) => c.status === "PAID")
      .reduce((sum, c) => sum + c.amount, 0);

    const totalLoans = loans
      .filter((l) => l.status === "ACTIVE")
      .reduce((sum, l) => sum + l.amount, 0);

    res.json({
      memberId: id,
      totalSavings,
      totalLoans,
      contributionsCount: contributions.length,
      loansCount: loans.length,
    });
  } catch (error) {
    console.error("Get member stats error:", error);
    res.status(500).json({ error: "Failed to fetch member stats" });
  }
};
