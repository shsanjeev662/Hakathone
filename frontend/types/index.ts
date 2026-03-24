export type UserRole = 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
}

export interface MemberProfile {
  id: string;
  userId: string;
  phone?: string;
  address?: string;
}

export interface Contribution {
  id: string;
  memberId: string;
  amount: number;
  month: number;
  year: number;
  status: 'PAID' | 'MISSED' | 'PENDING';
  createdAt: string;
}

export interface Loan {
  id: string;
  memberId: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  emiAmount: number;
  startDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CLOSED';
  createdAt: string;
  overdueCount?: number;
}

export interface Repayment {
  id: string;
  loanId: string;
  amount: number;
  paidDate?: string;
  dueDate: string;
  status: 'PAID' | 'OVERDUE' | 'PENDING';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalMembers: number;
  totalSavings: number;
  activeLoans: number;
  totalActiveLoanAmount: number;
  overduePayments: number;
  totalOverdueAmount: number;
  missedContributions: number;
  pendingRepayments: number;
  memberRisks: MemberRisk[];
}

export interface MemberRisk {
  id: string;
  name: string;
  email: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  missedPayments: number;
}

export interface MemberDashboard {
  member: {
    id: string;
    name: string;
    email: string;
  };
  savings: {
    total: number;
    paid: number;
    missed: number;
  };
  loans: {
    active: number;
    totalAmount: number;
  };
  dues: {
    upcoming: Repayment[];
    overdue: Repayment[];
  };
  notifications: Notification[];
}
