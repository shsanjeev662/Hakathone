import api from './api';
import type {
  User,
  Contribution,
  Loan,
  Repayment,
  DashboardStats,
  MemberDashboard,
} from '@/types';

// Auth
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post<User>('/auth/login', { email, password });
    return response.data;
  },
  register: async (name: string, email: string, password: string) => {
    const response = await api.post<User>('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  },
};

// Members
export const memberService = {
  getAll: async () => {
    const response = await api.get('/members');
    return response.data;
  },
  add: async (data: { name: string; email: string; password: string; phone?: string; address?: string }) => {
    const response = await api.post('/members', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
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

// Contributions
export const contributionService = {
  getAll: async () => {
    const response = await api.get('/contributions');
    return response.data;
  },
  add: async (data: { memberId: string; amount: number; month: number; year: number }) => {
    const response = await api.post('/contributions', data);
    return response.data;
  },
  getMember: async (memberId: string) => {
    const response = await api.get(`/contributions/member/${memberId}`);
    return response.data;
  },
  updateStatus: async (id: string, status: string) => {
    const response = await api.put(`/contributions/${id}/status`, { status });
    return response.data;
  },
};

// Loans
export const loanService = {
  getAll: async () => {
    const response = await api.get('/loans');
    return response.data;
  },
  issue: async (data: {
    memberId: string;
    amount: number;
    interestRate: number;
    durationMonths: number;
  }) => {
    const response = await api.post('/loans', data);
    return response.data;
  },
  getMember: async (memberId: string) => {
    const response = await api.get(`/loans/member/${memberId}`);
    return response.data;
  },
  getDetails: async (id: string) => {
    const response = await api.get(`/loans/${id}`);
    return response.data;
  },
  close: async (id: string) => {
    const response = await api.patch(`/loans/${id}/close`);
    return response.data;
  },
};

// Repayments
export const repaymentService = {
  getAll: async () => {
    const response = await api.get('/repayments');
    return response.data;
  },
  record: async (loanId: string, amount: number) => {
    const response = await api.post('/repayments', { loanId, amount });
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

// Dashboard
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
