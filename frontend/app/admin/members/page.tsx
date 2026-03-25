'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import FeedbackBanner from '@/components/FeedbackBanner';
import StatCard from '@/components/StatCard';
import TrustBadge from '@/components/TrustBadge';
import { memberService } from '@/services';
import type { MemberListItem } from '@/types';
import { formatCurrency } from '@/lib/format';

const initialForm = {
  id: '',
  name: '',
  email: '',
  password: '',
  resetPassword: '',
  phone: '',
  address: '',
  occupation: '',
  emergencyContact: '',
};

function MembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; name: string } | null>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [showCreatedPassword, setShowCreatedPassword] = useState(false);
  const [resettingMemberId, setResettingMemberId] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const data = await memberService.getAll();
      setMembers(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load members');
    } finally {
      setLoading(false);
    }
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

  const handleSaveMember = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (editingMemberId) {
        await memberService.update(editingMemberId, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          occupation: formData.occupation,
          emergencyContact: formData.emergencyContact,
        });

        if (formData.resetPassword.trim()) {
          const response = await memberService.resetPassword(editingMemberId, formData.resetPassword);
          setSuccess(response.message || 'Member details updated and password reset successfully.');
        } else {
          setSuccess('Member details updated successfully.');
        }
        setCreatedCredentials(null);
      } else {
        await memberService.add({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          occupation: formData.occupation,
          emergencyContact: formData.emergencyContact,
        });
        setCreatedCredentials({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
        setSuccess('Member created successfully. Share the login credentials with the member.');
      }
      setFormData(initialForm);
      setEditingMemberId(null);
      setShowFormPassword(false);
      localStorage.removeItem('member-form-draft');
      setShowForm(false);
      await fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create member');
    }
  };

  const startEditingMember = (member: MemberListItem) => {
    setEditingMemberId(member.id);
    setFormData({
      id: member.id,
      name: member.name,
      email: member.email,
      password: '',
      resetPassword: '',
      phone: member.memberProfile?.phone || '',
      address: member.memberProfile?.address || '',
      occupation: member.memberProfile?.occupation || '',
      emergencyContact: member.memberProfile?.emergencyContact || '',
    });
    setCreatedCredentials(null);
    setError(null);
    setSuccess(null);
    setShowFormPassword(false);
    setShowForm(true);
  };

  const cancelEditing = () => {
    setEditingMemberId(null);
    setFormData(initialForm);
    setShowFormPassword(false);
    setShowForm(false);
    localStorage.removeItem('member-form-draft');
  };

  const handleDeleteMember = async (id: string) => {
    if (!window.confirm('Delete this member and all related records?')) return;
    setError(null);
    setSuccess(null);
    try {
      await memberService.delete(id);
      setSuccess('Member removed successfully.');
      await fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete member');
    }
  };

  const handleDirectResetPassword = async (member: MemberListItem) => {
    const newPassword = window.prompt(`Enter a new password for ${member.name}`);
    if (!newPassword) return;

    setError(null);
    setSuccess(null);
    setResettingMemberId(member.id);

    try {
      const response = await memberService.resetPassword(member.id, newPassword);
      setSuccess(response.message || `Password reset successfully for ${member.name}.`);
      await fetchMembers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset member password');
    } finally {
      setResettingMemberId(null);
    }
  };

  const filteredMembers = members.filter((member) =>
    `${member.name} ${member.email} ${member.memberProfile?.phone || ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell
      title="Member Registry"
      subtitle="Register members, keep contact details up to date, search quickly, and monitor trust health before savings and loans begin to drift."
      actions={
        <>
          <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>
            {showForm ? 'Close Form' : 'Add Member'}
          </button>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Members" value={String(members.length)} hint="Registered cooperative members" />
        <StatCard label="High Trust Members" value={String(members.filter((member) => (member.memberProfile?.trustScore ?? 0) >= 80).length)} tone="success" hint="Strong payment behavior" />
        <StatCard label="Members Requiring Follow-up" value={String(members.filter((member) => member.overdueCount > 0).length)} tone="danger" hint="Overdue or risky profiles" />
      </section>

      {error ? <div className="mt-6"><FeedbackBanner message={error} tone="danger" /></div> : null}
      {success ? <div className="mt-6"><FeedbackBanner message={success} tone="success" /></div> : null}
      {createdCredentials ? (
        <section className="panel mt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Member Login Ready</h2>
              <p className="mt-1 text-sm text-slate-500">Share these credentials with the new member and ask them to change the password later if needed.</p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(`Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`);
                setSuccess('Credentials copied to clipboard.');
              }}
            >
              Copy Credentials
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Member</p>
              <p className="mt-2 font-semibold text-slate-900">{createdCredentials.name}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Email</p>
              <p className="mt-2 font-semibold text-slate-900">{createdCredentials.email}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Password</p>
              <div className="mt-2 flex items-center gap-3">
                <p className="font-semibold text-slate-900">
                  {showCreatedPassword ? createdCredentials.password : '••••••••'}
                </p>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreatedPassword((value) => !value)}
                >
                  {showCreatedPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {showForm ? (
        <form onSubmit={handleSaveMember} className="panel grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3">
            <h2 className="text-2xl font-semibold text-slate-900">
              {editingMemberId ? 'Edit Member' : 'Add Member'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {editingMemberId
                ? 'Update profile details, and set a new password if the member needs a reset or account unlock.'
                : 'Create a new member account with their first login credentials.'}
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
            <input placeholder="e.g. Sita Sharma" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input placeholder="member@dhukuti.com" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              {editingMemberId ? 'New password (optional)' : 'Password'}
            </label>
            <div className="flex gap-2">
              <input
                className="flex-1"
                placeholder={editingMemberId ? 'Leave blank to keep current password' : 'Create password'}
                value={editingMemberId ? formData.resetPassword : formData.password}
                type={showFormPassword ? 'text' : 'password'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [editingMemberId ? 'resetPassword' : 'password']: e.target.value,
                  })
                }
                required={!editingMemberId}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowFormPassword((value) => !value)}
              >
                {showFormPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
            <input placeholder="98XXXXXXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
            <input placeholder="Kathmandu, Nepal" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Occupation</label>
            <input placeholder="Farmer, teacher, shop owner..." value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} />
          </div>
          <div className="xl:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Emergency contact</label>
            <input placeholder="Name and phone number" value={formData.emergencyContact} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} />
          </div>
          <div className="md:col-span-2 xl:col-span-3 flex gap-3">
            <button type="submit" className="btn btn-primary">
              {editingMemberId ? 'Save Changes' : 'Save Member'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={editingMemberId ? cancelEditing : () => setFormData(initialForm)}
            >
              {editingMemberId ? 'Cancel Edit' : 'Reset'}
            </button>
          </div>
        </form>
      ) : null}

      <section className="mt-8 panel">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl text-slate-900">All Members</h2>
          <p className="text-sm text-slate-500">{loading ? 'Loading...' : `${filteredMembers.length} visible records`}</p>
        </div>
        <div className="mb-5 grid gap-4 md:grid-cols-[1fr_220px]">
          <input
            placeholder="Search by name, email, or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Additional feature: quick member search
          </div>
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
                <th>Access</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length ? filteredMembers.map((member) => (
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
                    <span className={`badge ${member.isLocked ? 'badge-danger' : 'badge-success'}`}>
                      {member.isLocked ? 'LOCKED' : 'ACTIVE'}
                    </span>
                    <p className="mt-2 text-xs text-slate-500">
                      {member.failedLoginAttempts} failed login attempt(s)
                    </p>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-secondary" onClick={() => startEditingMember(member)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleDirectResetPassword(member)}
                        disabled={resettingMemberId === member.id}
                      >
                        {resettingMemberId === member.id ? 'Resetting...' : 'Reset Password'}
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDeleteMember(member.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="rounded-2xl px-4 py-10 text-center text-sm text-slate-500">
                    No members matched your search.
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

export default dynamic(() => Promise.resolve(MembersPage), {
  ssr: false,
});
