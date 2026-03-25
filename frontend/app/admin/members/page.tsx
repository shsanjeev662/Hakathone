'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import TrustBadge from '@/components/TrustBadge';
import { memberService } from '@/services';
import type { MemberListItem } from '@/types';
import { formatCurrency } from '@/lib/format';

const initialForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  occupation: '',
  emergencyContact: '',
};

export default function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);

  const fetchMembers = async () => {
    const data = await memberService.getAll();
    setMembers(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    const draft = localStorage.getItem('member-form-draft');
    if (draft) setFormData(JSON.parse(draft));
    fetchMembers();
  }, [router]);

  useEffect(() => {
    localStorage.setItem('member-form-draft', JSON.stringify(formData));
  }, [formData]);

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    await memberService.add(formData);
    setFormData(initialForm);
    localStorage.removeItem('member-form-draft');
    setShowForm(false);
    await fetchMembers();
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Delete this member and all related records?')) return;
    await memberService.delete(id);
    await fetchMembers();
  };

  return (
    <AppShell
      title="Member Registry"
      subtitle="Register members, keep contact details up to date, and monitor trust score health before savings or loans begin to drift."
      actions={
        <>
          <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>
            {showForm ? 'Close Form' : 'Add Member'}
          </button>
        </>
      }
    >
      {showForm ? (
        <form onSubmit={handleAddMember} className="panel grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <input placeholder="Full name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <input placeholder="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          <input placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
          <input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <input placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          <input placeholder="Occupation" value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} />
          <input placeholder="Emergency contact" value={formData.emergencyContact} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} />
          <div className="md:col-span-2 xl:col-span-3 flex gap-3">
            <button type="submit" className="btn btn-primary">Save Member</button>
            <button type="button" className="btn btn-secondary" onClick={() => setFormData(initialForm)}>Reset</button>
          </div>
        </form>
      ) : null}

      <section className="mt-8 panel">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl text-slate-900">All Members</h2>
          <p className="text-sm text-slate-500">{loading ? 'Loading...' : `${members.length} member records`}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Contact</th>
                <th>Trust</th>
                <th>Savings</th>
                <th>Loans</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <p className="font-semibold text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.memberProfile?.occupation || 'Community member'}</p>
                  </td>
                  <td>
                    <p>{member.email}</p>
                    <p className="text-xs text-slate-500">{member.memberProfile?.phone || 'No phone listed'}</p>
                  </td>
                  <td><TrustBadge score={member.memberProfile?.trustScore ?? 0} riskLevel={member.riskLevel} /></td>
                  <td>{formatCurrency(member.totals.savings)}</td>
                  <td>
                    <p>{formatCurrency(member.totals.activeLoans)}</p>
                    <p className="text-xs text-slate-500">{member.overdueCount} overdue</p>
                  </td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDeleteMember(member.id)}>Delete</button>
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
