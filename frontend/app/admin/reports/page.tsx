'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import FeedbackBanner from '@/components/FeedbackBanner';
import StatCard from '@/components/StatCard';
import TrustBadge from '@/components/TrustBadge';
import { dashboardService, memberService, reportService } from '@/services';
import type { DashboardStats, LoanSummaryReport, MemberListItem, MemberStatementReport, MonthlyReport } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

const downloadJson = (name: string, payload: unknown) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

const downloadCsv = (name: string, rows: string[][]) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

function ReportsPage() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberStatement, setMemberStatement] = useState<MemberStatementReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [loanSummary, setLoanSummary] = useState<LoanSummaryReport | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    const load = async () => {
      try {
        const [memberData, monthly, loans, dashboard] = await Promise.all([
          memberService.getAll(),
          reportService.getMonthlyReport(),
          reportService.getLoanSummary(),
          dashboardService.getStats(),
        ]);
        setMembers(memberData);
        setSelectedMemberId(memberData[0]?.id || '');
        setMonthlyReport(monthly);
        setLoanSummary(loans);
        setDashboardStats(dashboard);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load reports');
      }
    };
    load();
  }, [router]);

  useEffect(() => {
    if (!selectedMemberId) return;
    reportService
      .getMemberStatement(selectedMemberId)
      .then(setMemberStatement)
      .catch((err: any) => setError(err.response?.data?.error || 'Failed to load member statement'));
  }, [selectedMemberId]);

  const visibleLoanRows = loanSummary?.loans.filter((loan) =>
    `${loan.memberName} ${loan.memberEmail} ${loan.riskLevel}`.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <AppShell title="Downloadable Reports" subtitle="Generate member statements, monthly cooperative summaries, and portfolio-level loan exports for meetings, audits, and hackathon demos.">
      {error ? <div className="mb-6"><FeedbackBanner message={error} tone="danger" /></div> : null}
      {success ? <div className="mb-6"><FeedbackBanner message={success} tone="success" /></div> : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Monthly Savings Collected" value={formatCurrency(monthlyReport?.savingsCollected || 0)} tone="success" hint="Current report period" />
        <StatCard label="Active Loan Accounts" value={String(loanSummary?.totals.activeLoans || 0)} tone="warning" hint="Open repayment schedules" />
        <StatCard
          label="Total Overdue Payments"
          value={formatCurrency(dashboardStats?.totalOverdueAmount || 0)}
          tone="danger"
          hint={`${dashboardStats?.overdueRepayments || 0} repayments + ${dashboardStats?.overdueContributions || 0} deposits`}
        />
        <StatCard label="Report Ready" value={selectedMemberId ? 'Yes' : 'No'} hint="Member statement selection" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="panel">
          <h2 className="section-title">Monthly Report</h2>
          <p className="section-copy mt-1">Operational summary for meetings and monthly review.</p>
          {monthlyReport ? (
            <>
              <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p>Savings collected: <span className="font-semibold text-slate-900">{formatCurrency(monthlyReport.savingsCollected)}</span></p>
                <p>Missed contributions: <span className="font-semibold text-slate-900">{monthlyReport.missedContributions}</span></p>
                <p>Overdue repayments: <span className="font-semibold text-slate-900">{monthlyReport.overdueRepayments}</span></p>
                <p>Total overdue payments: <span className="font-semibold text-slate-900">{formatCurrency(dashboardStats?.totalOverdueAmount || 0)}</span></p>
                <p>Generated: <span className="font-semibold text-slate-900">{formatDate(monthlyReport.generatedAt)}</span></p>
              </div>
              <button className="btn btn-primary mt-5" onClick={() => {
                downloadJson('monthly-cooperative-report.json', monthlyReport);
                setSuccess('Monthly report downloaded.');
              }}>
                Download
              </button>
            </>
          ) : null}
        </div>

        <div className="panel">
          <h2 className="section-title">Loan Summary</h2>
          <p className="section-copy mt-1">Portfolio snapshot for lending oversight and audit.</p>
          {loanSummary ? (
            <>
              <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p>Total loans: <span className="font-semibold text-slate-900">{loanSummary.totals.totalLoans}</span></p>
                <p>Active loans: <span className="font-semibold text-slate-900">{loanSummary.totals.activeLoans}</span></p>
                <p>Disbursed amount: <span className="font-semibold text-slate-900">{formatCurrency(loanSummary.totals.disbursedAmount)}</span></p>
              </div>
              <div className="mt-4 space-y-2">
                {loanSummary.loans.slice(0, 3).map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{loan.memberName}</p>
                      <p className="text-slate-500">{formatCurrency(loan.amount)}</p>
                    </div>
                    <TrustBadge score={loan.trustScore} riskLevel={loan.riskLevel} />
                  </div>
                ))}
              </div>
              <button className="btn btn-primary mt-5" onClick={() => {
                downloadJson('loan-summary-report.json', loanSummary);
                setSuccess('Loan summary report downloaded.');
              }}>
                Download
              </button>
            </>
          ) : null}
        </div>

        <div className="panel">
          <h2 className="section-title">Member Statement</h2>
          <p className="section-copy mt-1">Select one member and export a complete account view.</p>
          <select className="mt-4" value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
          {memberStatement ? (
            <>
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{memberStatement.member.name}</p>
                <p className="mt-1 text-sm text-slate-500">{memberStatement.member.email}</p>
                <div className="mt-4 flex items-center gap-3">
                  <TrustBadge score={memberStatement.trustScore} />
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>Contributions: <span className="font-semibold text-slate-900">{memberStatement.contributionHistory.length}</span></p>
                  <p>Loans: <span className="font-semibold text-slate-900">{memberStatement.loans.length}</span></p>
                </div>
              </div>
              <button className="btn btn-primary mt-5" onClick={() => {
                downloadJson(`member-statement-${memberStatement.member.name}.json`, memberStatement);
                setSuccess(`Member statement downloaded for ${memberStatement.member.name}.`);
              }}>
                Download
              </button>
            </>
          ) : null}
        </div>
      </section>

      <section className="panel mt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title">Loan Summary Detail</h2>
            <p className="section-copy mt-1">Search and export a clean CSV for presentation or audit work.</p>
          </div>
          <div className="flex flex-col gap-3 md:w-auto md:flex-row">
            <input
              className="md:w-[280px]"
              placeholder="Search borrower or risk level"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="btn btn-secondary"
              onClick={() => {
                downloadCsv('loan-summary-report.csv', [
                  ['Member', 'Email', 'Trust Score', 'Amount', 'EMI', 'Risk', 'Status', 'Outstanding'],
                  ...visibleLoanRows.map((loan) => [
                    loan.memberName,
                    loan.memberEmail,
                    String(loan.trustScore),
                    String(loan.amount),
                    String(loan.emiAmount),
                    loan.riskLevel,
                    loan.status,
                    String(loan.outstandingBalance),
                  ]),
                ]);
                setSuccess('Loan summary CSV exported.');
              }}
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Trust</th>
                <th>Loan</th>
                <th>Risk</th>
                <th>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {visibleLoanRows.length ? visibleLoanRows.slice(0, 8).map((loan) => (
                <tr key={loan.id}>
                  <td>
                    <p className="font-semibold text-slate-900">{loan.memberName}</p>
                    <p className="text-xs text-slate-500">{loan.memberEmail}</p>
                  </td>
                  <td><TrustBadge score={loan.trustScore} riskLevel={loan.riskLevel} /></td>
                  <td>
                    <p>{formatCurrency(loan.amount)}</p>
                    <p className="text-xs text-slate-500">EMI {formatCurrency(loan.emiAmount)}</p>
                  </td>
                  <td>{loan.riskLevel}</td>
                  <td>{formatCurrency(loan.outstandingBalance)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="rounded-2xl px-4 py-10 text-center text-sm text-slate-500">
                    No report rows matched your search.
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

export default dynamic(() => Promise.resolve(ReportsPage), {
  ssr: false,
});
