'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import FeedbackBanner from '@/components/FeedbackBanner';
import TrustBadge from '@/components/TrustBadge';
import { dashboardService } from '@/services';
import type { MemberDashboard, Repayment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { getStoredUser } from '@/lib/auth';

const summaryIcons = {
  savings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M4 8.5h16v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
      <path d="M6.5 8.5V7A2 2 0 0 1 8.5 5h8" />
      <circle cx="16.5" cy="13" r="1" fill="currentColor" />
    </svg>
  ),
  loan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10 8.8h2.2a1.8 1.8 0 0 1 0 3.6H10V8.8z" />
      <path d="M10 12.4h2.7a1.8 1.8 0 0 1 0 3.6H10" />
      <path d="M9 7.5v9" />
    </svg>
  ),
  balance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M6 8h12" />
      <path d="M8.5 4.5h7" />
      <path d="M6.5 19.5h11A2.5 2.5 0 0 0 20 17V9a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 9v8a2.5 2.5 0 0 0 2.5 2.5Z" />
      <path d="M15 13h2.5" />
    </svg>
  ),
  due: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 10h16" />
      <path d="M9 14h2" />
      <path d="M13 14h2" />
    </svg>
  ),
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MemberDashboardClientPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<MemberDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!localStorage.getItem('token') || !user) {
      router.push('/login');
      return;
    }
    dashboardService.getMemberDashboard().then(setDashboard).catch((err: any) => {
      setError(err.response?.data?.error || 'Failed to load your dashboard');
    });
  }, [router]);

  if (!dashboard) {
    return <AppShell title="Member Dashboard">{error ? <FeedbackBanner message={error} tone="danger" /> : 'Loading dashboard...'}</AppShell>;
  }

  const primaryLoan = dashboard.loans.items[0];
  const repaymentSchedule: Repayment[] = primaryLoan?.repayments?.slice(0, 6) || [...dashboard.dues.upcoming, ...dashboard.dues.overdue].slice(0, 6);
  const nextDue = dashboard.dues.upcoming[0]?.dueDate || primaryLoan?.nextDueDate || null;
  const missedDueDates = dashboard.dues.overdue.slice(0, 6);
  const totalMissedDueAmount = dashboard.dues.overdue.reduce((sum, item) => sum + item.amount, 0);
  const memberIdLabel = `M${dashboard.member.id.slice(-4).toUpperCase()}`;
  const contributionRows = dashboard.savings.recent.slice(0, 5);
  const alerts = [
    ...(nextDue ? [{ id: 'next-due', type: 'ALERT' as const, message: `Your next instalment is due on ${formatDate(nextDue)}.` }] : []),
    ...(dashboard.dues.overdue.length ? [{ id: 'overdue', type: 'WARNING' as const, message: `You have ${dashboard.dues.overdue.length} overdue repayment(s) that need attention.` }] : []),
    ...dashboard.notifications.slice(0, 2).map((item) => ({
      id: item.id,
      type: item.type,
      message: item.message,
    })),
  ].slice(0, 3);

  return (
    <AppShell
      title="Member Dashboard"
    >
      <section className="rounded-[2rem] bg-[linear-gradient(135deg,#0f3f88_0%,#1556b0_55%,#0f766e_100%)] px-6 py-7 text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Member Portal</p>
            <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em]">Welcome, {dashboard.member.name}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Review your savings progress, current loan position, and payment reminders without needing help from the admin desk.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.16em] text-white/60">Member ID</p>
            <p className="mt-2 text-lg font-semibold">{memberIdLabel}</p>
            <div className="mt-3">
              <TrustBadge score={dashboard.trust.score} riskLevel={dashboard.trust.riskLevel} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="data-label">Total Savings</p>
              <p className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-emerald-800">{formatCurrency(dashboard.savings.total)}</p>
              <p className="mt-2 text-sm text-emerald-700/80">{dashboard.savings.paid} paid contributions</p>
            </div>
            <div className="rounded-2xl bg-white/90 p-3 text-emerald-700 shadow-sm">{summaryIcons.savings}</div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-sky-200 bg-sky-50/70 p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="data-label">Loan Taken</p>
              <p className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-sky-800">{formatCurrency(dashboard.loans.totalAmount)}</p>
              <p className="mt-2 text-sm text-sky-700/80">{dashboard.loans.active} active loan account(s)</p>
            </div>
            <div className="rounded-2xl bg-white/90 p-3 text-sky-700 shadow-sm">{summaryIcons.loan}</div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50/80 p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="data-label">Remaining Balance</p>
              <p className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-amber-700">{formatCurrency(dashboard.loans.outstandingBalance)}</p>
              <p className="mt-2 text-sm text-amber-700/80">{dashboard.dues.overdue.length} overdue instalments</p>
            </div>
            <div className="rounded-2xl bg-white/90 p-3 text-amber-600 shadow-sm">{summaryIcons.balance}</div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-violet-200 bg-violet-50/80 p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="data-label">Next Due Date</p>
              <p className="mt-3 text-[1.7rem] font-semibold tracking-[-0.04em] text-violet-700">{nextDue ? formatDate(nextDue) : 'No due date'}</p>
              <p className="mt-2 text-sm text-violet-700/80">Stay on time to protect your trust score</p>
            </div>
            <div className="rounded-2xl bg-white/90 p-3 text-violet-600 shadow-sm">{summaryIcons.due}</div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.95fr]">
        <div className="panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="section-title">Contribution History</h2>
              <p className="section-copy mt-1">Recent monthly savings activity from your account.</p>
            </div>
            <TrustBadge score={dashboard.trust.score} riskLevel={dashboard.trust.riskLevel} />
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contributionRows.length ? contributionRows.map((item) => (
                  <tr key={item.id}>
                    <td>{monthNames[item.month - 1]} {item.year}</td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td>
                      <span className={`badge ${
                        item.status === 'PAID'
                          ? 'badge-success'
                          : item.status === 'MISSED'
                            ? 'badge-danger'
                            : 'badge-warning'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="rounded-2xl px-4 py-10 text-center text-sm text-slate-500">
                      No contribution history is available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2 className="section-title">Loan Details</h2>
          <p className="section-copy mt-1">Current loan summary and key account details.</p>
          {primaryLoan ? (
            <div className="mt-5 space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <span className="text-slate-500">Loan Amount</span>
                <span className="font-semibold text-slate-950">{formatCurrency(primaryLoan.amount)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <span className="text-slate-500">Interest Rate</span>
                <span className="font-semibold text-slate-950">{primaryLoan.interestRate}%</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold text-slate-950">{primaryLoan.durationMonths} months</span>
              </div>
              <div className="rounded-[1.25rem] bg-sky-50 px-4 py-4">
                <p className="text-sm font-medium text-sky-700">Remaining Balance</p>
                <p className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-sky-800">
                  {formatCurrency(primaryLoan.outstandingBalance || 0)}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              No active loan details are available right now.
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.95fr]">
        <div className="panel">
          <h2 className="section-title">Repayment Schedule</h2>
          <p className="section-copy mt-1">Upcoming and recent instalments from your current loan schedule.</p>
          <div className="mt-5 overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {repaymentSchedule.length ? repaymentSchedule.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.dueDate)}</td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td>
                      <span className={`badge ${
                        item.status === 'PAID'
                          ? 'badge-success'
                          : item.status === 'OVERDUE'
                            ? 'badge-danger'
                            : 'badge-warning'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="rounded-2xl px-4 py-10 text-center text-sm text-slate-500">
                      No repayment schedule is available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {nextDue ? (
            <div className="mt-5 rounded-[1.25rem] border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-900">
              Next instalment is <span className="font-semibold">{formatCurrency(dashboard.dues.upcoming[0]?.amount || primaryLoan?.emiAmount || 0)}</span> and is due on <span className="font-semibold">{formatDate(nextDue)}</span>.
            </div>
          ) : null}
        </div>

        <div className="panel">
          <h2 className="section-title">Alerts</h2>
          <p className="section-copy mt-1">Friendly reminders to help you stay on track.</p>
          <div className="mt-4 space-y-3">
            {alerts.length ? alerts.map((notification) => (
              <div key={notification.id} className={`rounded-2xl border p-4 text-sm ${
                notification.type === 'ALERT'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : notification.type === 'WARNING'
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-sky-200 bg-sky-50 text-sky-800'
              }`}>
                {notification.message}
              </div>
            )) : <p className="text-sm text-slate-500">No alerts available right now.</p>}
          </div>
          <div className="mt-5 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            Please pay on time to avoid penalties and keep your trust score strong.
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.95fr]">
        <div className="panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="section-title">Missed Due Dates</h2>
              <p className="section-copy mt-1">Review every instalment date you missed so you can clear it quickly.</p>
            </div>
            <span className={`badge ${missedDueDates.length ? 'badge-danger' : 'badge-success'}`}>
              {missedDueDates.length} missed
            </span>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Installment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {missedDueDates.length ? missedDueDates.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.dueDate)}</td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td>#{item.installmentNumber}</td>
                    <td><span className="badge badge-danger">MISSED</span></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="rounded-2xl px-4 py-10 text-center text-sm text-slate-500">
                      You have not missed any due dates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2 className="section-title">Missed Payment Summary</h2>
          <p className="section-copy mt-1">A quick snapshot of missed repayments from your active loans.</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5">
              <p className="text-sm font-medium text-rose-700">Total missed instalments</p>
              <p className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-rose-800">{dashboard.dues.overdue.length}</p>
            </div>
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-medium text-amber-700">Amount overdue</p>
              <p className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-amber-800">
                {formatCurrency(totalMissedDueAmount)}
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              Clearing missed due dates early helps reduce penalties and keeps your trust score healthier.
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-[1.75rem] border border-sky-200 bg-sky-50 px-6 py-5 text-center">
        <p className="text-base font-semibold text-sky-900">Thank you for being a committed member. Keep up the good track record.</p>
        <p className="mt-2 text-sm text-sky-800">Contact your admin for any questions about savings, loans, or repayments.</p>
      </section>
    </AppShell>
  );
}
