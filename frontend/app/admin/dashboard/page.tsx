'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import FeedbackBanner from '@/components/FeedbackBanner';
import StatCard from '@/components/StatCard';
import TrustBadge from '@/components/TrustBadge';
import { dashboardService, repaymentService } from '@/services';
import type { DashboardStats } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

const tileIcons = {
  members: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 18a5.5 5.5 0 0 1 11 0" />
      <path d="M16.5 10.5a2.8 2.8 0 1 0 0-5.6" />
      <path d="M20.5 18a4.5 4.5 0 0 0-3.8-4.45" />
    </svg>
  ),
  savings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M5 8.5h14v9.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
      <path d="M7.5 8.5V7A2.5 2.5 0 0 1 10 4.5h7" />
      <circle cx="16.5" cy="13.5" r="1" fill="currentColor" />
    </svg>
  ),
  loans: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 10.5c0-1 1.1-1.8 2.5-1.8s2.5.8 2.5 1.8-1.1 1.8-2.5 1.8-2.5.8-2.5 1.8 1.1 1.8 2.5 1.8 2.5-.8 2.5-1.8" />
    </svg>
  ),
  overdue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5" />
      <path d="M12 16.5h.01" />
    </svg>
  ),
};

const quickActions = [
  { label: 'Register New Member', href: '/admin/members', tone: 'success' as const },
  { label: 'Record Monthly Deposits', href: '/admin/contributions', tone: 'warning' as const },
  { label: 'Approve New Loan', href: '/admin/loans', tone: 'default' as const },
  { label: 'Review Repayments', href: '/admin/repayments', tone: 'info' as const },
];

function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [overdueAlertMessage, setOverdueAlertMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const statsData = await dashboardService.getStats();
      setStats(statsData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    fetchStats();
  }, [router]);

  const refreshOverdue = async () => {
    try {
      setError(null);
      const response = await repaymentService.checkOverdue();
      const count = Number(response.count || 0);
      const message = count > 0
        ? `${response.message}. The overdue payments alert has been updated, and total overdue amount now includes overdue monthly deposits as well.`
        : 'No new overdue repayments were found. The overdue payments alert is up to date, including overdue monthly deposits already on record.';
      setSuccess(message);
      setOverdueAlertMessage(message);
      await fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update overdue repayments');
    }
  };

  const maxMonthlyValue = useMemo(
    () => Math.max(...(stats?.monthlySavings.map((item) => item.total) || [1])),
    [stats]
  );
  const passwordResetRequests = useMemo(
    () =>
      (stats?.smartAlerts || []).filter(
        (alert) => alert.title === 'Member Reset Request' || /password reset/i.test(alert.message)
      ),
    [stats]
  );

  if (loading) return <AppShell title="Dashboard">Loading dashboard...</AppShell>;
  if (!stats) return <AppShell title="Dashboard">Error: {error || 'Failed to load dashboard'}</AppShell>;

  return (
    <AppShell
      title="Dashboard"
      subtitle="Monitor cooperative performance, overdue exposure, member activity, and quick actions from a single professional control panel."
      actions={
        <>
          <button className="btn btn-secondary" onClick={fetchStats}>Refresh</button>
          <button className="btn btn-primary" onClick={refreshOverdue}>Update Overdues</button>
        </>
      }
    >
      {error ? <div className="mb-6"><FeedbackBanner message={error} tone="danger" /></div> : null}
      {success ? <div className="mb-6"><FeedbackBanner message={success} tone="success" /></div> : null}
      {passwordResetRequests.length ? (
        <section className="mb-6 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">Password Reset Requests</p>
              <p className="mt-2 text-sm text-amber-800">
                Members have requested admin help resetting their account passwords.
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-amber-700">
              {passwordResetRequests.length} request(s)
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {passwordResetRequests.map((alert, index) => (
              <div key={`${alert.title}-${index}`} className="rounded-2xl border border-amber-200 bg-white px-4 py-3">
                <p className="font-semibold text-slate-900">{alert.title}</p>
                <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="border-b border-slate-200 p-0 md:border-r xl:border-b-0">
          <StatCard label="Total Members" value={String(stats.totalMembers)} hint="Active membership" tone="success" icon={tileIcons.members} />
        </div>
        <div className="border-b border-slate-200 p-0 xl:border-b-0 xl:border-r">
          <StatCard label="Total Shares Capital" value={formatCurrency(stats.totalSavings)} hint="Cooperative savings pool" tone="warning" icon={tileIcons.savings} />
        </div>
        <div className="border-b border-slate-200 p-0 md:border-r xl:border-b-0">
          <StatCard label="Outstanding Loans" value={formatCurrency(stats.totalActiveLoanAmount)} hint={`${stats.activeLoans} active loans`} tone="default" icon={tileIcons.loans} />
        </div>
        <div className="p-0">
          <StatCard
            label="Total Overdue Payments"
            value={formatCurrency(stats.totalOverdueAmount)}
            hint={`${stats.overdueRepayments} overdue repayments + ${stats.overdueContributions} overdue monthly deposits`}
            tone="danger"
            icon={tileIcons.overdue}
          />
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="panel">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title">Financial Summary</h2>
              <p className="section-copy">Monthly contributions vs loan pressure</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Last 6 months</div>
          </div>
          <div className="mt-8">
            <div className="flex h-[280px] items-end gap-4">
              {stats.monthlySavings.map((item) => {
                const barHeight = `${Math.max(18, (item.total / maxMonthlyValue) * 100)}%`;
                const pressure = stats.totalActiveLoanAmount > 0 ? Math.min(100, (item.total / stats.totalActiveLoanAmount) * 220) : 24;
                return (
                  <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                    <div className="flex h-full w-full items-end justify-center gap-2 rounded-2xl bg-slate-50 p-3">
                      <div className="w-1/2 rounded-xl bg-[linear-gradient(180deg,#14b8a6_0%,#0f766e_100%)]" style={{ height: barHeight }} />
                      <div className="w-1/2 rounded-xl bg-[linear-gradient(180deg,#ffbb59_0%,#ff9f34_100%)]" style={{ height: `${Math.max(16, pressure)}%` }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                      <p className="text-xs text-slate-500">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="section-title">Recent Activity Feed</h2>
          <div className="mt-5 space-y-4">
            {stats.smartAlerts.length ? stats.smartAlerts.map((alert, index) => (
              <div key={`${alert.title}-${index}`} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className={`mt-1 h-2.5 w-2.5 rounded-full ${
                  alert.type === 'ALERT' ? 'bg-rose-500' : alert.type === 'WARNING' ? 'bg-amber-500' : 'bg-teal-500'
                }`} />
                <div>
                  <p className="font-semibold text-slate-800">{alert.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{alert.message}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-500">No recent activity available.</p>}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1fr_0.8fr]">
        <div className="panel">
          <h2 className="section-title">Quick Actions</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`rounded-2xl border p-5 text-left transition hover:translate-y-[-1px] ${
                  action.tone === 'success'
                    ? 'border-teal-200 bg-teal-50'
                    : action.tone === 'warning'
                      ? 'border-[#efc97b] bg-[#fff2da]'
                      : action.tone === 'info'
                        ? 'border-[#b8cff5] bg-[#e9f1ff]'
                        : 'border-slate-200 bg-slate-50'
                }`}
              >
                <p className="text-base font-semibold text-slate-900">{action.label}</p>
              </Link>
            ))}
          </div>
          <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-700">Overdue update workflow</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use <span className="font-semibold text-slate-900">Update Overdues</span> to scan all pending instalments, mark the ones past their due date as overdue, and refresh the overdue payments alert alongside overdue monthly deposit totals.
            </p>
          </div>
        </div>

        <div className="panel">
          <h2 className="section-title">Overdue Payments Alert</h2>
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-rose-700">
              Alert: Overdue Payments ({stats.overduePayments})
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-rose-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Loan repayments</p>
                <p className="mt-2 text-lg font-semibold text-rose-800">{formatCurrency(stats.totalRepaymentOverdueAmount)}</p>
                <p className="mt-1 text-sm text-slate-500">{stats.overdueRepayments} overdue repayment(s)</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Monthly deposits</p>
                <p className="mt-2 text-lg font-semibold text-rose-800">{formatCurrency(stats.totalContributionOverdueAmount)}</p>
                <p className="mt-1 text-sm text-slate-500">{stats.overdueContributions} overdue monthly deposit(s)</p>
              </div>
            </div>
            {overdueAlertMessage ? (
              <div className="mt-4 rounded-xl border border-rose-300 bg-white px-4 py-3 text-sm font-medium text-rose-800">
                {overdueAlertMessage}
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              {stats.memberRisks.filter((member) => member.missedPayments > 0).slice(0, 3).map((member, index) => (
                <div key={member.id} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{index + 1}. {member.name}</p>
                      <p className="text-sm text-slate-500">{member.missedPayments} overdue item(s)</p>
                    </div>
                    <TrustBadge score={member.trustScore} riskLevel={member.riskLevel} />
                  </div>
                </div>
              ))}
              {stats.memberRisks.every((member) => member.missedPayments === 0) ? (
                <p className="text-sm text-slate-600">No members are currently overdue.</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="section-title">Membership Mix</h2>
          <div className="mt-6 flex items-center justify-center">
            <div className="relative h-44 w-44 rounded-full bg-[conic-gradient(#0f766e_0_38%,#5eead4_38%_72%,#ffb44a_72%_100%)]">
              <div className="absolute inset-[26px] rounded-full bg-white" />
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm">
            {[
              { label: 'Reliable members', color: 'bg-teal-700' },
              { label: 'Medium trust members', color: 'bg-teal-300' },
              { label: 'High attention required', color: 'bg-[#ffb44a]' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 text-slate-600">
                <span className={`h-3 w-3 rounded-full ${item.color}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 panel">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="section-title">Recent Loan Exposure</h2>
            <p className="section-copy">Outstanding portfolio snapshot</p>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Loan</th>
                <th>Risk</th>
                <th>Outstanding</th>
                <th>Overdue</th>
                <th>Next Due</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentLoans.map((loan) => (
                <tr key={loan.id}>
                  <td>
                    <p className="font-semibold text-slate-900">{formatCurrency(loan.amount)}</p>
                    <p className="text-xs text-slate-500">{loan.id.slice(0, 8)}</p>
                  </td>
                  <td>
                    <span className={`badge ${
                      loan.riskLevel === 'HIGH' ? 'badge-danger' : loan.riskLevel === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {loan.riskLevel}
                    </span>
                  </td>
                  <td>{formatCurrency(loan.outstandingBalance)}</td>
                  <td>{formatCurrency(loan.overdueAmount)}</td>
                  <td>{formatDate(loan.nextDueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

export default dynamic(() => Promise.resolve(AdminDashboard), {
  ssr: false,
});
