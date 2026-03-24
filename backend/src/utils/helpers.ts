import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

export const generateToken = (id: string, email: string, role: string) => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET || "your_jwt_secret_key_here",
    { expiresIn: "7d" }
  );
};

export const hashPassword = async (password: string) => {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string) => {
  return bcryptjs.compare(password, hash);
};

export const calculateEMI = (
  principal: number,
  annualRate: number,
  months: number
): number => {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;

  const emi =
    (principal *
      monthlyRate *
      Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);

  return Math.round(emi * 100) / 100;
};

export const generateRepaymentSchedule = (
  loanAmount: number,
  emiAmount: number,
  startDate: Date,
  months: number
) => {
  const schedule = [];
  let remainingBalance = loanAmount;

  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      amount: emiAmount,
      dueDate,
      status: "PENDING",
    });

    remainingBalance -= emiAmount;
  }

  return schedule;
};

export const calculateRiskLevel = (
  missedPayments: number
): "LOW" | "MEDIUM" | "HIGH" => {
  if (missedPayments === 0) return "LOW";
  if (missedPayments <= 2) return "MEDIUM";
  return "HIGH";
};
