'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { loanService } from '@/services';
import type { Loan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

export default function MemberLoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(user);
    loanService.getMember(parsed.id).then(setLoans);
  }, [router]);

  return (
    <AppShell title="My Loans" subtitle="Review principal, EMI, outstanding balance, repayment progress, and upcoming due dates without needing help from the admin desk.">
      <section className="grid gap-6">
        {loans.map((loan) => (
          <div key={loan.id} className="panel">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl text-slate-900">{formatCurrency(loan.amount)}</h2>
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
        ))}
      </section>
    </AppShell>
  );
}
