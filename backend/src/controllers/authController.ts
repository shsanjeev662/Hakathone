import { Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../index";
import { generateToken, hashPassword, comparePassword } from "../utils/helpers";
import { securityConfig } from "../config/security";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.MEMBER,
      },
    });

    await prisma.memberProfile.create({
      data: {
        userId: user.id,
      },
    });

    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.role === UserRole.MEMBER && user.isLocked) {
      return res.status(423).json({
        error: "Your member account is locked. Please use forgot password or contact the admin.",
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      if (user.role === UserRole.MEMBER) {
        const failedLoginAttempts = user.failedLoginAttempts + 1;
        const shouldLock =
          failedLoginAttempts >= securityConfig.auth.memberMaxFailedLoginAttempts;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts,
            isLocked: shouldLock,
            lockedAt: shouldLock ? new Date() : null,
          },
        });

        if (shouldLock) {
          const admins = await prisma.user.findMany({
            where: { role: UserRole.ADMIN },
            select: { id: true },
          });

          if (admins.length > 0) {
            await prisma.notification.createMany({
              data: admins.map((admin) => ({
                userId: admin.id,
                type: "ALERT",
                message: `Member account ${user.email} was locked after repeated failed login attempts.`,
              })),
            });
          }

          return res.status(423).json({
            error: "Your member account is locked after repeated failed login attempts. Please use forgot password or contact the admin.",
          });
        }
      }

      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.failedLoginAttempts > 0 || user.isLocked || user.lockedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          isLocked: false,
          lockedAt: null,
        },
      });
    }

    const token = generateToken(user.id, user.email, user.role);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const member = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (member?.role === UserRole.MEMBER) {
      const admins = await prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { id: true },
      });

      if (admins.length > 0) {
        try {
          await prisma.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              type: "WARNING",
              message: `${member.name} (${member.email}) requested a password reset.`,
            })),
          });
        } catch (notificationError) {
          console.error("Forgot password notification error:", notificationError);
        }
      }
    }

    return res.json({
      message:
        "If a matching member account exists, the admin has been notified to help with the password reset.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to process forgot password request" });
  }
};
