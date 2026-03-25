'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import TrustBadge from '@/components/TrustBadge';
import { contributionService, memberService } from '@/services';
import type { Contribution, MemberListItem } from '@/types';
import { formatCurrency } from '@/lib/format';

export default function ContributionsPage() {
  const router = useRouter();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '2500',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: 'PAID' as 'PAID' | 'MISSED' | 'PENDING',
  });

  const fetchData = async () => {
    const [contributionData, memberData] = await Promise.all([
      contributionService.getAll(),
      memberService.getAll(),
    ]);
    setContributions(contributionData);
    setMembers(memberData);
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
    await contributionService.add({
      memberId: formData.memberId,
      amount: Number(formData.amount),
      month: formData.month,
      year: formData.year,
      status: formData.status,
    });
    setShowForm(false);
    await fetchData();
  };

  return (
    <AppShell
      title="Monthly Savings Collection"
      subtitle="Record regular contributions quickly, even in a low-tech workflow. Voice assist helps speed up data entry during collection meetings."
      actions={
        <>
          <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>
            {showForm ? 'Close Form' : 'Record Contribution'}
          </button>
        </>
      }
    >
      {showForm ? (
        <form onSubmit={handleSubmit} className="panel grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <select value={formData.memberId} onChange={(e) => setFormData({ ...formData, memberId: e.target.value })} required>
            <option value="">Select member</option>
            {members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
          <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
          <input type="number" min="1" max="12" value={formData.month} onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })} required />
          <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })} required />
          <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'PAID' | 'MISSED' | 'PENDING' })}>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="MISSED">Missed</option>
          </select>
          <div className="xl:col-span-5">
            <button type="submit" className="btn btn-primary">Save Entry</button>
          </div>
        </form>
      ) : null}

      <section className="mt-8 panel">
        <h2 className="text-2xl text-slate-900">Contribution Ledger</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Month</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Trust</th>
              </tr>
            </thead>
            <tbody>
              {contributions.map((contribution) => (
                <tr key={contribution.id}>
                  <td>
                    <p className="font-semibold text-slate-900">{contribution.member?.name || 'Member'}</p>
                    <p className="text-xs text-slate-500">{contribution.member?.email}</p>
                  </td>
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
                  <td><TrustBadge score={contribution.member?.memberProfile?.trustScore ?? 0} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
