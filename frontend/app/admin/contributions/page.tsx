'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import FeedbackBanner from '@/components/FeedbackBanner';
import StatCard from '@/components/StatCard';
import TrustBadge from '@/components/TrustBadge';
import { contributionService, memberService } from '@/services';
import type { Contribution, MemberListItem } from '@/types';
import { formatCurrency } from '@/lib/format';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function ContributionsPage() {
  const router = useRouter();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'MISSED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingContributionId, setUpdatingContributionId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '2500',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: 'PAID' as 'PAID' | 'MISSED' | 'PENDING',
  });

  const fetchData = async () => {
    try {
      const [contributionData, memberData] = await Promise.all([
        contributionService.getAll(),
        memberService.getAll(),
      ]);
      setContributions(contributionData);
      setMembers(memberData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load contribution records');
    } finally {
      setLoading(false);
    }
  };

  const markContributionPaid = async (contribution: Contribution) => {
    try {
      setUpdatingContributionId(contribution.id);
      await contributionService.updateStatus(contribution.id, 'PAID');
      setSuccess(
        `Monthly deposit for ${contribution.member?.name || 'the member'} in ${monthNames[contribution.month - 1]} ${contribution.year} marked as paid.`
      );
      setError(null);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update contribution status');
      setSuccess(null);
    } finally {
      setUpdatingContributionId(null);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await contributionService.add({
        memberId: formData.memberId,
        amount: Number(formData.amount),
        month: formData.month,
        year: formData.year,
        status: formData.status,
      });
      setSuccess('Contribution recorded successfully.');
      setError(null);
      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save contribution');
      setSuccess(null);
    }
  };

  const visibleContributions = contributions.filter((item) => statusFilter === 'ALL' || item.status === statusFilter);
  const overdueContributions = contributions.filter((item) => item.status === 'MISSED');
  const totalOverduePayments = overdueContributions.reduce((sum, item) => sum + item.amount, 0);
  const contributionsByMonth = useMemo(() => {
    const grouped = new Map<string, { label: string; items: Contribution[] }>();

    visibleContributions.forEach((contribution) => {
      const label = `${monthNames[contribution.month - 1]} ${contribution.year}`;
      const key = `${contribution.year}-${String(contribution.month).padStart(2, '0')}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.items.push(contribution);
        return;
      }

      grouped.set(key, {
        label,
        items: [contribution],
      });
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([, value]) => value);
  }, [visibleContributions]);

  return (
    <AppShell
      title="Monthly Savings Collection"
      subtitle="Record regular contributions, monitor overdue payments, and keep a clean monthly savings trail for the cooperative."
      actions={
        <>
          <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>
            {showForm ? 'Close Form' : 'Record Contribution'}
          </button>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Paid Contributions" value={String(contributions.filter((item) => item.status === 'PAID').length)} tone="success" hint="Successfully collected" />
        <StatCard label="Pending Contributions" value={String(contributions.filter((item) => item.status === 'PENDING').length)} tone="warning" hint="Need follow-up this month" />
        <StatCard label="Overdue Payments" value={String(contributions.filter((item) => item.status === 'MISSED').length)} tone="danger" hint="Late monthly deposits needing action" />
        <StatCard
          label="Total Overdue Payments"
          value={formatCurrency(totalOverduePayments)}
          tone="danger"
          hint={`${overdueContributions.length} overdue monthly deposit(s)`}
        />
      </section>

      {error ? <div className="mt-6"><FeedbackBanner message={error} tone="danger" /></div> : null}
      {success ? <div className="mt-6"><FeedbackBanner message={success} tone="success" /></div> : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="panel grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Member</label>
            <select value={formData.memberId} onChange={(e) => setFormData({ ...formData, memberId: e.target.value })} required>
              <option value="">Select member</option>
              {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Amount</label>
            <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Month</label>
            <input type="number" min="1" max="12" value={formData.month} onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Year</label>
            <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'PAID' | 'MISSED' | 'PENDING' })}>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="MISSED">Overdue Payment</option>
            </select>
          </div>
          <div className="xl:col-span-5">
            <button type="submit" className="btn btn-primary">Save Entry</button>
          </div>
        </form>
      ) : null}

      <section className="mt-8 panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title">Contribution Ledger</h2>
            <p className="section-copy">{loading ? 'Loading records...' : `${visibleContributions.length} contribution entries across ${contributionsByMonth.length} month section(s).`}</p>
          </div>
          <select className="md:w-[220px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PAID' | 'PENDING' | 'MISSED')}>
            <option value="ALL">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="MISSED">Overdue Payments</option>
          </select>
        </div>
        <div className="mt-4 space-y-6">
          {contributionsByMonth.length ? contributionsByMonth.map((group, index) => (
            <details
              key={group.label}
              open={index === 0}
              className="group rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5"
            >
              <summary className="list-none cursor-pointer">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4 transition group-open:rotate-90"
                      >
                        <path d="m7 4 6 6-6 6" />
                      </svg>
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{group.label}</h3>
                      <p className="text-sm text-slate-500">{group.items.length} deposit record(s)</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    Total collected: <span className="font-semibold text-slate-900">{formatCurrency(group.items.reduce((sum, item) => sum + item.amount, 0))}</span>
                  </div>
                </div>
              </summary>
              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Trust</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((contribution) => (
                        <tr key={contribution.id}>
                          <td>
                            <p className="font-semibold text-slate-900">{contribution.member?.name || 'Member'}</p>
                            <p className="text-xs text-slate-500">{contribution.member?.email}</p>
                          </td>
                          <td>{formatCurrency(contribution.amount)}</td>
                          <td>
                            <span className={`badge ${
                              contribution.status === 'PAID'
                                ? 'badge-success'
                                : contribution.status === 'MISSED'
                                  ? 'badge-danger'
                                  : 'badge-warning'
                            }`}>
                              {contribution.status === 'MISSED' ? 'OVERDUE' : contribution.status}
                            </span>
                          </td>
                          <td><TrustBadge score={contribution.member?.memberProfile?.trustScore ?? 0} /></td>
                          <td>
                            {contribution.status === 'MISSED' ? (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => markContributionPaid(contribution)}
                                disabled={updatingContributionId === contribution.id}
                              >
                                {updatingContributionId === contribution.id ? 'Updating...' : 'Mark as Paid'}
                              </button>
                            ) : (
                              <span className="text-sm text-slate-400">
                                {contribution.status === 'PAID' ? 'Collected' : 'Waiting'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          )) : (
            <div className="rounded-2xl px-4 py-10 text-center text-sm text-slate-500">
              No contribution records matched the current filter.
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}

export default dynamic(() => Promise.resolve(ContributionsPage), {
  ssr: false,
});
