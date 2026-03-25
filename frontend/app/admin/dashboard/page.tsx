'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import StatCard from '@/components/StatCard';
import TrustBadge from '@/components/TrustBadge';
import { dashboardService, repaymentService } from '@/services';
import type { DashboardStats } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
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
    await repaymentService.checkOverdue();
    await fetchStats();
  };

  if (loading) {
    return <AppShell title="Admin Dashboard">Loading dashboard...</AppShell>;
  }

  if (error || !stats) {
    return <AppShell title="Admin Dashboard">Error: {error}</AppShell>;
  }

  return (
    <AppShell
      title="Community Finance Control Room"
      subtitle="Track savings health, loan exposure, trust signals, and payment discipline from a single admin view designed for Dhukuti operations."
      actions={
        <>
          <button className="btn btn-secondary" onClick={fetchStats}>Refresh</button>
          <button className="btn btn-primary" onClick={refreshOverdue}>Mark Overdues</button>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Members" value={String(stats.totalMembers)} hint="Active cooperative members" />
        <StatCard label="Total Savings" value={formatCurrency(stats.totalSavings)} tone="success" hint={`${stats.collectionRate}% collection rate`} />
        <StatCard label="Active Loans" value={String(stats.activeLoans)} tone="warning" hint={formatCurrency(stats.totalActiveLoanAmount)} />
        <StatCard label="Overdue Payments" value={String(stats.overduePayments)} tone="danger" hint={formatCurrency(stats.totalOverdueAmount)} />
        <StatCard label="Average Trust" value={`${stats.trustScoreAverage}/100`} hint={`${stats.repaymentRate}% repayment rate`} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl text-slate-900">Savings Trend</h2>
            <p className="text-sm text-slate-500">Last 6 months</p>
          </div>
          <div className="mt-8 flex h-80 items-end gap-4">
            {stats.monthlySavings.map((item) => {
              const max = Math.max(...stats.monthlySavings.map((entry) => entry.total), 1);
              const height = `${Math.max(12, (item.total / max) * 100)}%`;
              return (
                <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
                  <div className="w-full rounded-t-[1.25rem] bg-gradient-to-t from-emerald-700 to-emerald-300" style={{ height }} />
                  <div className="text-center text-xs text-slate-600">
                    <p className="font-semibold">{item.label}</p>
                    <p>{formatCurrency(item.total)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <h2 className="text-2xl text-slate-900">Loan Health Mix</h2>
          <div className="mt-6 space-y-5">
            {stats.loanStatusBreakdown.map((item, index) => {
              const total = stats.loanStatusBreakdown.reduce((sum, entry) => sum + entry.value, 0) || 1;
              const width = `${(item.value / total) * 100}%`;
              const color = ['bg-emerald-600', 'bg-amber-500', 'bg-rose-500'][index] || 'bg-slate-500';
              return (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                    <span>{item.name}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="h-4 rounded-full bg-slate-100">
                    <div className={`h-4 rounded-full ${color}`} style={{ width }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel">
          <h2 className="text-2xl text-slate-900">Smart Alerts</h2>
          <div className="mt-5 space-y-4">
            {stats.smartAlerts.length ? stats.smartAlerts.map((alert) => (
              <div key={`${alert.title}-${alert.message}`} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{alert.title}</p>
                  <span className={`badge ${alert.type === 'ALERT' ? 'badge-danger' : alert.type === 'WARNING' ? 'badge-warning' : 'badge-info'}`}>
                    {alert.type}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{alert.message}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No urgent alerts right now.</p>}
          </div>
        </div>

        <div className="panel">
          <h2 className="text-2xl text-slate-900">High-Risk Borrowers</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Trust</th>
                  <th>Risk</th>
                  <th>Overdues</th>
                  <th>Consistency</th>
                </tr>
              </thead>
              <tbody>
                {stats.memberRisks.slice(0, 6).map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </div>
                    </td>
                    <td><TrustBadge score={member.trustScore} riskLevel={member.riskLevel} /></td>
                    <td>{member.riskScore}/100</td>
                    <td>{member.missedPayments}</td>
                    <td>{member.contributionConsistency}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-8 panel">
        <h2 className="text-2xl text-slate-900">Recent Loan Exposure</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.recentLoans.map((loan) => (
            <div key={loan.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{formatCurrency(loan.amount)}</p>
                <span className={`badge ${loan.riskLevel === 'HIGH' ? 'badge-danger' : loan.riskLevel === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`}>
                  {loan.riskLevel}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">Outstanding: {formatCurrency(loan.outstandingBalance)}</p>
              <p className="text-sm text-slate-600">Overdue: {formatCurrency(loan.overdueAmount)}</p>
              <p className="text-sm text-slate-600">Next due: {formatDate(loan.nextDueDate)}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
