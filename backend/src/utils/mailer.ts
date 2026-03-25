import nodemailer from "nodemailer";
import { securityConfig } from "../config/security";

const hasEmailConfig = Boolean(
  securityConfig.email.user &&
    securityConfig.email.password &&
    securityConfig.email.from
);

const transporter = hasEmailConfig
  ? nodemailer.createTransport({
      service: securityConfig.email.provider === "gmail" ? "gmail" : undefined,
      auth: {
        user: securityConfig.email.user,
        pass: securityConfig.email.password,
      },
    })
  : null;

export const sendPasswordResetEmail = async ({
  to,
  memberName,
  password,
}: {
  to: string;
  memberName: string;
  password: string;
}) => {
  if (!transporter || !securityConfig.email.from) {
    return {
      sent: false,
      reason: "Email delivery is not configured on the server.",
    };
  }

  await transporter.sendMail({
    from: securityConfig.email.from,
    to,
    subject: "Your Dhukuti password has been reset",
    text: `Hello ${memberName},\n\nYour password was reset by the admin.\n\nNew password: ${password}\n\nPlease sign in and change it as soon as possible.\n`,
    html: `
      <p>Hello ${memberName},</p>
      <p>Your password was reset by the admin.</p>
      <p><strong>New password:</strong> ${password}</p>
      <p>Please sign in and change it as soon as possible.</p>
    `,
  });

  return { sent: true };
};

export const sendRepaymentAlertEmail = async ({
  to,
  memberName,
  amount,
  installmentNumber,
  dueDate,
  status,
}: {
  to: string;
  memberName: string;
  amount: number;
  installmentNumber: number;
  dueDate: Date;
  status: "OVERDUE" | "UPCOMING";
}) => {
  if (!transporter || !securityConfig.email.from) {
    return {
      sent: false,
      reason: "Email delivery is not configured on the server.",
    };
  }

  const dueDateLabel = dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const subject =
    status === "OVERDUE"
      ? "Urgent: Your EMI payment is overdue"
      : "Reminder: Your EMI payment is due soon";
  const intro =
    status === "OVERDUE"
      ? "Your EMI payment is now overdue."
      : "This is a reminder that your EMI payment is due soon.";

  await transporter.sendMail({
    from: securityConfig.email.from,
    to,
    subject,
    text: `Hello ${memberName},\n\n${intro}\n\nInstallment: ${installmentNumber}\nAmount: NPR ${Math.round(
      amount
    )}\nDue date: ${dueDateLabel}\n\nPlease contact the cooperative office if you need help.\n`,
    html: `
      <p>Hello ${memberName},</p>
      <p>${intro}</p>
      <p><strong>Installment:</strong> ${installmentNumber}</p>
      <p><strong>Amount:</strong> NPR ${Math.round(amount)}</p>
      <p><strong>Due date:</strong> ${dueDateLabel}</p>
      <p>Please contact the cooperative office if you need help.</p>
    `,
  });

  return { sent: true };
};
