'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import FeedbackBanner from '@/components/FeedbackBanner';
import StatCard from '@/components/StatCard';
import { loanService } from '@/services';
import type { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { getStoredUser } from '@/lib/auth';

function MemberLoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = getStoredUser();
    if (!token || !user) {
      router.push('/login');
      return;
    }
    loanService.getMember(user.id).then(setLoans).catch((err: any) => {
      setError(err.response?.data?.error || 'Failed to load your loans');
    });
  }, [router]);

  const outstanding = loans.reduce((sum, loan) => sum + (loan.outstandingBalance || 0), 0);
  const overdue = loans.reduce((sum, loan) => sum + (loan.overdueAmount || 0), 0);
  const totalPaid = loans.reduce((sum, loan) => sum + (loan.paidAmount || 0), 0);

  return (
    <AppShell title="My Loans" subtitle="Review principal, EMI, outstanding balance, repayment progress, and upcoming due dates without needing help from the admin desk.">
      {error ? <div className="mb-6"><FeedbackBanner message={error} tone="danger" /></div> : null}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Paid" value={formatCurrency(totalPaid)} tone="success" hint="Amount already repaid" />
        <StatCard label="Outstanding Balance" value={formatCurrency(outstanding)} tone="warning" hint="Remaining across active loans" />
        <StatCard label="Overdue Amount" value={formatCurrency(overdue)} tone="danger" hint="Needs action immediately" />
      </section>

      <section className="grid gap-6">
        {loans.length ? loans.map((loan) => (
          <div key={loan.id} className="panel">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">{formatCurrency(loan.amount)}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  EMI {formatCurrency(loan.emiAmount)} for {loan.durationMonths} months at {loan.interestRate}% interest
                </p>
              </div>
              <span className={`badge ${loan.riskLevel === 'HIGH' ? 'badge-danger' : loan.riskLevel === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`}>
                {loan.riskLevel} risk
              </span>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div><p className="text-sm text-slate-500">Outstanding</p><p className="mt-2 font-semibold text-slate-900">{formatCurrency(loan.outstandingBalance || 0)}</p></div>
              <div><p className="text-sm text-slate-500">Paid So Far</p><p className="mt-2 font-semibold text-slate-900">{formatCurrency(loan.paidAmount || 0)}</p></div>
              <div><p className="text-sm text-slate-500">Overdue</p><p className="mt-2 font-semibold text-rose-700">{formatCurrency(loan.overdueAmount || 0)}</p></div>
              <div><p className="text-sm text-slate-500">Next Due</p><p className="mt-2 font-semibold text-slate-900">{formatDate(loan.nextDueDate)}</p></div>
            </div>
          </div>
        )) : (
          <div className="panel">
            <h2 className="section-title">No active loans</h2>
            <p className="section-copy mt-2">You do not have any loan records yet. Once the cooperative issues a loan, it will appear here with repayment details.</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

export default dynamic(() => Promise.resolve(MemberLoansPage), {
  ssr: false,
});
