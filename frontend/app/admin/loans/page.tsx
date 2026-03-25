'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import TrustBadge from '@/components/TrustBadge';
import { loanService, memberService } from '@/services';
import type { Loan, MemberListItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

export default function LoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [decision, setDecision] = useState<{ riskLevel: string; warnings: string[]; trustScore: number } | null>(null);
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '50000',
    interestRate: '12',
    durationMonths: '6',
    startDate: new Date().toISOString().slice(0, 10),
  });

  const fetchData = async () => {
    const [loanData, memberData] = await Promise.all([loanService.getAll(), memberService.getAll()]);
    setLoans(loanData);
    setMembers(memberData);
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router]);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === formData.memberId),
    [members, formData.memberId]
  );

  const handleIssueLoan = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await loanService.issue({
      memberId: formData.memberId,
      amount: Number(formData.amount),
      interestRate: Number(formData.interestRate),
      durationMonths: Number(formData.durationMonths),
      startDate: formData.startDate,
    });
    setDecision(result.approvalInsights);
    setShowForm(false);
    await fetchData();
  };

  return (
    <AppShell
      title="Loan Decision Desk"
      subtitle="Issue loans with an auto-generated repayment plan, see simulated AI-based borrower risk before approval, and track outstanding balance after disbursement."
      actions={<button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>{showForm ? 'Close Form' : 'Issue Loan'}</button>}
    >
      {showForm ? (
        <form onSubmit={handleIssueLoan} className="panel grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <select value={formData.memberId} onChange={(e) => setFormData({ ...formData, memberId: e.target.value })} required>
            <option value="">Select member</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
          <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
          <input type="number" value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })} required />
          <input type="number" value={formData.durationMonths} onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })} required />
          <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
          {selectedMember ? (
            <div className="md:col-span-2 xl:col-span-5 rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Borrower snapshot</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <TrustBadge score={selectedMember.memberProfile?.trustScore ?? 0} riskLevel={selectedMember.riskLevel} />
                <span className="text-sm text-slate-600">Savings: {formatCurrency(selectedMember.totals.savings)}</span>
                <span className="text-sm text-slate-600">Outstanding: {formatCurrency(selectedMember.totals.activeLoans)}</span>
              </div>
            </div>
          ) : null}
          <div className="xl:col-span-5">
            <button type="submit" className="btn btn-primary">Approve and Generate Schedule</button>
          </div>
        </form>
      ) : null}

      {decision ? (
        <section className="panel mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <TrustBadge score={decision.trustScore} riskLevel={decision.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH'} />
            <p className="text-sm text-slate-700">Loan decision saved with simulated AI risk screening.</p>
          </div>
          {decision.warnings.length ? (
            <div className="mt-4 space-y-2">
              {decision.warnings.map((warning) => (
                <div key={warning} className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">{warning}</div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="panel mt-8">
        <h2 className="text-2xl text-slate-900">Loan Portfolio</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Trust</th>
                <th>Loan</th>
                <th>Outstanding</th>
                <th>Next Due</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td>
                    <p className="font-semibold text-slate-900">{loan.member?.name}</p>
                    <p className="text-xs text-slate-500">{loan.member?.email}</p>
                  </td>
                  <td><TrustBadge score={loan.member?.memberProfile?.trustScore ?? 0} /></td>
                  <td>
                    <p>{formatCurrency(loan.amount)}</p>
                    <p className="text-xs text-slate-500">EMI {formatCurrency(loan.emiAmount)}</p>
                  </td>
                  <td>{formatCurrency(loan.outstandingBalance || 0)}</td>
                  <td>{formatDate(loan.nextDueDate)}</td>
                  <td>
                    <span className={`badge ${loan.riskLevel === 'HIGH' ? 'badge-danger' : loan.riskLevel === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`}>
                      {loan.riskLevel}
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
