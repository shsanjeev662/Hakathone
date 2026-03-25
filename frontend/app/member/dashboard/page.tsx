'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import StatCard from '@/components/StatCard';
import TrustBadge from '@/components/TrustBadge';
import { dashboardService } from '@/services';
import type { MemberDashboard } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

export default function MemberDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<MemberDashboard | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    dashboardService.getMemberDashboard().then(setDashboard);
  }, [router]);

  if (!dashboard) {
    return <AppShell title="My Dashboard">Loading dashboard...</AppShell>;
  }

  return (
    <AppShell
      title={`Namaste, ${dashboard.member.name}`}
      subtitle="See your savings journey, trust score, active loans, and upcoming dues in one clear member-friendly view."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Trust Score" value={`${dashboard.trust.score}/100`} hint={`${dashboard.trust.contributionConsistency}% contribution consistency`} />
        <StatCard label="Total Savings" value={formatCurrency(dashboard.savings.total)} tone="success" hint={`${dashboard.savings.paid} monthly contributions`} />
        <StatCard label="Active Loans" value={String(dashboard.loans.active)} tone="warning" hint={formatCurrency(dashboard.loans.totalAmount)} />
        <StatCard label="Outstanding Balance" value={formatCurrency(dashboard.loans.outstandingBalance)} tone="danger" hint={`${dashboard.dues.overdue.length} overdue instalments`} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel">
          <h2 className="text-2xl text-slate-900">My Trust Profile</h2>
          <div className="mt-4 flex items-center gap-3">
            <TrustBadge score={dashboard.trust.score} riskLevel={dashboard.trust.riskLevel} />
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Your trust score increases when you contribute regularly and pay instalments on time. It falls when payments are missed or delayed.
          </p>
        </div>

        <div className="panel">
          <h2 className="text-2xl text-slate-900">Upcoming Due Dates</h2>
          <div className="mt-4 space-y-3">
            {dashboard.dues.upcoming.length ? dashboard.dues.upcoming.map((due) => (
              <div key={due.id} className="rounded-[1.4rem] bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{formatCurrency(due.amount)}</p>
                <p className="text-sm text-slate-600">Due {formatDate(due.dueDate)}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No upcoming dues right now.</p>}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <h2 className="text-2xl text-slate-900">Alerts & Messages</h2>
          <div className="mt-4 space-y-3">
            {dashboard.notifications.length ? dashboard.notifications.map((notification) => (
              <div key={notification.id} className={`rounded-[1.4rem] p-4 text-sm ${
                notification.type === 'ALERT'
                  ? 'bg-rose-50 text-rose-800'
                  : notification.type === 'WARNING'
                    ? 'bg-amber-50 text-amber-900'
                    : 'bg-sky-50 text-sky-800'
              }`}>
                {notification.message}
              </div>
            )) : <p className="text-sm text-slate-500">No notifications available.</p>}
          </div>
        </div>

        <div className="panel">
          <h2 className="text-2xl text-slate-900">Overdue Payments</h2>
          <div className="mt-4 space-y-3">
            {dashboard.dues.overdue.length ? dashboard.dues.overdue.map((overdue) => (
              <div key={overdue.id} className="rounded-[1.4rem] bg-rose-50 p-4">
                <p className="font-semibold text-rose-900">{formatCurrency(overdue.amount)}</p>
                <p className="text-sm text-rose-700">Was due on {formatDate(overdue.dueDate)}</p>
              </div>
            )) : <p className="text-sm text-slate-500">You have no overdue payments.</p>}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
