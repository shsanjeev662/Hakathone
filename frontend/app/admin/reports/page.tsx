'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { memberService, reportService } from '@/services';
import type { LoanSummaryReport, MemberListItem, MemberStatementReport, MonthlyReport } from '@/types';
import { formatCurrency } from '@/lib/format';

const downloadJson = (name: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberStatement, setMemberStatement] = useState<MemberStatementReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [loanSummary, setLoanSummary] = useState<LoanSummaryReport | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    const load = async () => {
      const [memberData, monthly, loans] = await Promise.all([
        memberService.getAll(),
        reportService.getMonthlyReport(),
        reportService.getLoanSummary(),
      ]);
      setMembers(memberData);
      setSelectedMemberId(memberData[0]?.id || '');
      setMonthlyReport(monthly);
      setLoanSummary(loans);
    };
    load();
  }, [router]);

  useEffect(() => {
    if (!selectedMemberId) return;
    reportService.getMemberStatement(selectedMemberId).then(setMemberStatement);
  }, [selectedMemberId]);

  return (
    <AppShell title="Downloadable Reports" subtitle="Generate member statements, monthly cooperative summaries, and portfolio-level loan exports for meetings, audits, and hackathon demos.">
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="panel">
          <h2 className="text-2xl text-slate-900">Monthly Report</h2>
          {monthlyReport ? (
            <>
              <p className="mt-4 text-sm text-slate-600">Savings collected: {formatCurrency(monthlyReport.savingsCollected)}</p>
              <p className="text-sm text-slate-600">Missed contributions: {monthlyReport.missedContributions}</p>
              <p className="text-sm text-slate-600">Overdue repayments: {monthlyReport.overdueRepayments}</p>
              <button className="btn btn-primary mt-5" onClick={() => downloadJson('monthly-cooperative-report.json', monthlyReport)}>
                Download
              </button>
            </>
          ) : null}
        </div>

        <div className="panel">
          <h2 className="text-2xl text-slate-900">Loan Summary</h2>
          {loanSummary ? (
            <>
              <p className="mt-4 text-sm text-slate-600">Total loans: {loanSummary.totals.totalLoans}</p>
              <p className="text-sm text-slate-600">Active loans: {loanSummary.totals.activeLoans}</p>
              <p className="text-sm text-slate-600">Disbursed amount: {formatCurrency(loanSummary.totals.disbursedAmount)}</p>
              <button className="btn btn-primary mt-5" onClick={() => downloadJson('loan-summary-report.json', loanSummary)}>
                Download
              </button>
            </>
          ) : null}
        </div>

        <div className="panel">
          <h2 className="text-2xl text-slate-900">Member Statement</h2>
          <select className="mt-4" value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
          {memberStatement ? (
            <>
              <p className="mt-4 text-sm text-slate-600">Trust score: {memberStatement.trustScore}/100</p>
              <p className="text-sm text-slate-600">Contributions: {memberStatement.contributionHistory.length}</p>
              <p className="text-sm text-slate-600">Loans: {memberStatement.loans.length}</p>
              <button className="btn btn-primary mt-5" onClick={() => downloadJson(`member-statement-${memberStatement.member.name}.json`, memberStatement)}>
                Download
              </button>
            </>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
