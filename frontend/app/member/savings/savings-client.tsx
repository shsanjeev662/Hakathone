'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import FeedbackBanner from '@/components/FeedbackBanner';
import StatCard from '@/components/StatCard';
import { contributionService } from '@/services';
import type { Contribution } from '@/types';
import { formatCurrency } from '@/lib/format';
import { getStoredUser } from '@/lib/auth';

export default function MemberSavingsClient() {
  const router = useRouter();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = getStoredUser();
    if (!token || !user) {
      router.push('/login');
      return;
    }
    contributionService.getMember(user.id).then(setContributions).catch((err: any) => {
      setError(err.response?.data?.error || 'Failed to load your savings history');
    });
  }, [router]);

  const totalSavings = contributions.filter((item) => item.status === 'PAID').reduce((sum, item) => sum + item.amount, 0);

  return (
    <AppShell title="My Savings History" subtitle="A simple ledger showing monthly contributions, missed months, and your cumulative savings in the cooperative.">
      {error ? <div className="mb-6"><FeedbackBanner message={error} tone="danger" /></div> : null}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Savings" value={formatCurrency(totalSavings)} tone="success" hint="Collected from paid monthly contributions" />
        <StatCard label="Paid Months" value={String(contributions.filter((item) => item.status === 'PAID').length)} hint="Consistent savings history" />
        <StatCard label="Missed Months" value={String(contributions.filter((item) => item.status === 'MISSED').length)} tone="danger" hint="Months needing attention" />
      </section>
      <section className="panel mt-8">
        <div className="mb-5">
          <h2 className="section-title">Contribution Ledger</h2>
          <p className="section-copy mt-1">A transparent monthly savings record for your account.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contributions.length ? contributions.map((contribution) => (
                <tr key={contribution.id}>
                  <td>{contribution.month}/{contribution.year}</td>
                  <td>{formatCurrency(contribution.amount)}</td>
                  <td>
                    <span className={`badge ${
                      contribution.status === 'PAID'
                        ? 'badge-success'
                        : contribution.status === 'MISSED'
                          ? 'badge-danger'
                          : 'badge-warning'
                    }`}>
                      {contribution.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="rounded-2xl px-4 py-10 text-center text-sm text-slate-500">
                    No savings entries are available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
