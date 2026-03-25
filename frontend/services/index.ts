import api from './api';
import type {
  Contribution,
  DashboardStats,
  Loan,
  LoanSummaryReport,
  MemberDashboard,
  MemberListItem,
  MemberStatementReport,
  MonthlyReport,
  Repayment,
  User,
} from '@/types';

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post<User>('/auth/login', { email, password });
    return response.data;
  },
  register: async (name: string, email: string, password: string) => {
    const response = await api.post<User>('/auth/register', { name, email, password });
    return response.data;
  },
};

export const memberService = {
  getAll: async () => {
    const response = await api.get<MemberListItem[]>('/members');
    return response.data;
  },
  add: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    occupation?: string;
    emergencyContact?: string;
  }) => {
    const response = await api.post('/members', data);
    return response.data;
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const response = await api.put(`/members/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/members/${id}`);
    return response.data;
  },
  getStats: async (id: string) => {
    const response = await api.get(`/members/${id}/stats`);
    return response.data;
  },
};

export const contributionService = {
  getAll: async () => {
    const response = await api.get<Contribution[]>('/contributions');
    return response.data;
  },
  add: async (data: {
    memberId: string;
    amount: number;
    month: number;
    year: number;
    status?: 'PAID' | 'MISSED' | 'PENDING';
  }) => {
    const response = await api.post('/contributions', data);
    return response.data;
  },
  getMember: async (memberId: string) => {
    const response = await api.get<Contribution[]>(`/contributions/member/${memberId}`);
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await api.put(`/contributions/${id}/status`, { status });
    return response.data;
  },
};

export const loanService = {
  getAll: async () => {
    const response = await api.get<Loan[]>('/loans');
    return response.data;
  },
  issue: async (data: {
    memberId: string;
    amount: number;
    interestRate: number;
    durationMonths: number;
    startDate?: string;
  }) => {
    const response = await api.post('/loans', data);
    return response.data;
  },
  getMember: async (memberId: string) => {
    const response = await api.get<Loan[]>(`/loans/member/${memberId}`);
    return response.data;
  },
  getDetails: async (id: string) => {
    const response = await api.get<Loan>(`/loans/${id}`);
    return response.data;
  },
  close: async (id: string) => {
    const response = await api.patch(`/loans/${id}/close`);
    return response.data;
  },
};

export const repaymentService = {
  getAll: async () => {
    const response = await api.get<Repayment[]>('/repayments');
    return response.data;
  },
  record: async (data: { loanId?: string; repaymentId?: string; amount: number; paidDate?: string }) => {
    const response = await api.post('/repayments', data);
    return response.data;
  },
  getLoan: async (loanId: string) => {
    const response = await api.get(`/repayments/${loanId}`);
    return response.data;
  },
  checkOverdue: async () => {
    const response = await api.post('/repayments/check-overdue');
    return response.data;
  },
};

export const dashboardService = {
  getStats: async () => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },
  getMemberDashboard: async () => {
    const response = await api.get<MemberDashboard>('/dashboard/member');
    return response.data;
  },
};

export const reportService = {
  getMemberStatement: async (memberId: string) => {
    const response = await api.get<MemberStatementReport>(`/reports/member/${memberId}`);
    return response.data;
  },
  getMonthlyReport: async () => {
    const response = await api.get<MonthlyReport>('/reports/monthly');
    return response.data;
  },
  getLoanSummary: async () => {
    const response = await api.get<LoanSummaryReport>('/reports/loans');
    return response.data;
  },
};
