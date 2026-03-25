export type UserRole = 'ADMIN' | 'MEMBER';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
}

export interface MemberListItem {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  memberProfile?: {
    phone?: string;
    address?: string;
    occupation?: string;
    trustScore: number;
  };
  totals: {
    savings: number;
    activeLoans: number;
  };
  riskLevel: RiskLevel;
  overdueCount: number;
}

export interface Contribution {
  id: string;
  memberId: string;
  amount: number;
  month: number;
  year: number;
  status: 'PAID' | 'MISSED' | 'PENDING';
  createdAt: string;
  member?: {
    name: string;
    email: string;
    memberProfile?: {
      trustScore: number;
    };
  };
}

export interface Repayment {
  id: string;
  loanId: string;
  installmentNumber: number;
  amount: number;
  paidDate?: string;
  dueDate: string;
  principalAmount?: number;
  interestAmount?: number;
  status: 'PAID' | 'OVERDUE' | 'PENDING';
  createdAt: string;
  loan?: {
    id: string;
    amount: number;
    member?: {
      id: string;
      name: string;
      email: string;
      memberProfile?: {
        trustScore: number;
      };
    };
  };
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
  riskLevel: RiskLevel;
  riskScore: number;
  overdueCount?: number;
  paidAmount?: number;
  outstandingBalance?: number;
  overdueAmount?: number;
  nextDueDate?: string | null;
  member?: {
    id: string;
    name: string;
    email: string;
    memberProfile?: {
      trustScore: number;
    };
  };
  repayments?: Repayment[];
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}

export interface SmartAlert {
  type: 'INFO' | 'WARNING' | 'ALERT';
  title: string;
  message: string;
}

export interface MemberRisk {
  id: string;
  name: string;
  email: string;
  riskLevel: RiskLevel;
  riskScore: number;
  trustScore: number;
  missedPayments: number;
  contributionConsistency: number;
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
  collectionRate: number;
  repaymentRate: number;
  trustScoreAverage: number;
  memberRisks: MemberRisk[];
  smartAlerts: SmartAlert[];
  monthlySavings: Array<{ label: string; total: number }>;
  loanStatusBreakdown: Array<{ name: string; value: number }>;
  recentLoans: Array<{
    id: string;
    memberId: string;
    amount: number;
    riskLevel: RiskLevel;
    paidAmount: number;
    outstandingBalance: number;
    overdueAmount: number;
    nextDueDate: string | null;
  }>;
}

export interface MemberDashboard {
  member: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  trust: {
    score: number;
    riskLevel: RiskLevel;
    contributionConsistency: number;
  };
  savings: {
    total: number;
    paid: number;
    missed: number;
    recent: Contribution[];
  };
  loans: {
    active: number;
    totalAmount: number;
    outstandingBalance: number;
    items: Loan[];
  };
  dues: {
    upcoming: Array<Repayment & { loan: Loan }>;
    overdue: Array<Repayment & { loan: Loan }>;
  };
  notifications: Notification[];
}

export interface MemberStatementReport {
  generatedAt: string;
  member: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    occupation?: string;
  };
  trustScore: number;
  contributionHistory: Contribution[];
  loans: Loan[];
}

export interface MonthlyReport {
  generatedAt: string;
  month: number;
  year: number;
  savingsCollected: number;
  contributions: Contribution[];
  repayments: Repayment[];
  missedContributions: number;
  overdueRepayments: number;
}

export interface LoanSummaryReport {
  generatedAt: string;
  totals: {
    totalLoans: number;
    activeLoans: number;
    disbursedAmount: number;
  };
  loans: Array<{
    id: string;
    memberName: string;
    memberEmail: string;
    trustScore: number;
    amount: number;
    emiAmount: number;
    durationMonths: number;
    riskLevel: RiskLevel;
    status: string;
    paidAmount: number;
    outstandingBalance: number;
    overdueAmount: number;
    nextDueDate: string | null;
  }>;
}
