'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { contributionService } from '@/services';
import type { Contribution } from '@/types';
import { formatCurrency } from '@/lib/format';

export default function MemberSavingsPage() {
  const router = useRouter();
  const [contributions, setContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(user);
    contributionService.getMember(parsed.id).then(setContributions);
  }, [router]);

  const totalSavings = contributions.filter((item) => item.status === 'PAID').reduce((sum, item) => sum + item.amount, 0);

  return (
    <AppShell title="My Savings History" subtitle="A simple ledger showing monthly contributions, missed months, and your cumulative savings in the cooperative.">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel"><p className="text-sm text-slate-500">Total Savings</p><p className="mt-3 text-3xl font-semibold text-emerald-700">{formatCurrency(totalSavings)}</p></div>
        <div className="panel"><p className="text-sm text-slate-500">Paid Months</p><p className="mt-3 text-3xl font-semibold text-slate-900">{contributions.filter((item) => item.status === 'PAID').length}</p></div>
        <div className="panel"><p className="text-sm text-slate-500">Missed Months</p><p className="mt-3 text-3xl font-semibold text-rose-700">{contributions.filter((item) => item.status === 'MISSED').length}</p></div>
      </section>
      <section className="panel mt-8">
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
              {contributions.map((contribution) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
