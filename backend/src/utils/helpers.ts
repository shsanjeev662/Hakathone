import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { UserRole } from "@prisma/client";
import { securityConfig } from "../config/security";

export const generateToken = (id: string, email: string, role: UserRole) => {
  return jwt.sign(
    { id, email, role },
    securityConfig.jwtSecret,
    { expiresIn: "7d", algorithm: "HS256" }
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

    remainingBalance = Math.max(0, remainingBalance - emiAmount);
  }

  return schedule;
};

export const formatCurrency = (amount: number) =>
  `NPR ${Math.round(amount).toLocaleString("en-US")}`;

export const isContributionPastDue = (
  month: number,
  year: number,
  referenceDate = new Date()
) => {
  const currentMonth = referenceDate.getMonth() + 1;
  const currentYear = referenceDate.getFullYear();

  return year < currentYear || (year === currentYear && month < currentMonth);
};

export const calculateOverdueContributions = (
  contributions: Array<{
    month: number;
    year: number;
    amount: number;
    status: string;
  }>
): number => {
  return contributions
    .filter((contribution) => {
      const isNotPaid = contribution.status !== "PAID";
      return isContributionPastDue(contribution.month, contribution.year) && isNotPaid;
    })
    .reduce((sum, item) => sum + item.amount, 0);
};

export const getOverdueMonthsCount = (
  contributions: Array<{
    month: number;
    year: number;
    status: string;
  }>
): number => {
  return contributions.filter((contribution) => {
    const isNotPaid = contribution.status !== "PAID";
    return isContributionPastDue(contribution.month, contribution.year) && isNotPaid;
  }).length;
};
