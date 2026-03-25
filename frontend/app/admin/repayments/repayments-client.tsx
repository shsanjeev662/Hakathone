'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import StatCard from '@/components/StatCard';
import TrustBadge from '@/components/TrustBadge';
import { repaymentService } from '@/services';
import type { Repayment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

export default function RepaymentsClientPage() {
  const router = useRouter();
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'OVERDUE'>('ALL');
  const [formData, setFormData] = useState({
    repaymentId: '',
    amount: '',
    paidDate: new Date().toISOString().slice(0, 10),
  });

  const fetchData = async () => {
    const data = await repaymentService.getAll();
    setRepayments(data);
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router]);

  const pendingRepayments = useMemo(
    () => repayments.filter((item) => item.status !== 'PAID'),
    [repayments]
  );

  const visibleRepayments = repayments.filter((item) => statusFilter === 'ALL' || item.status === statusFilter);

  const submitPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    await repaymentService.record({
      repaymentId: formData.repaymentId,
      amount: Number(formData.amount),
      paidDate: formData.paidDate,
    });
    setShowForm(false);
    setFormData({
      repaymentId: '',
      amount: '',
      paidDate: new Date().toISOString().slice(0, 10),
    });
    await fetchData();
  };

  return (
    <AppShell
      title="Repayment Tracking"
      subtitle="Track instalments, recover overdue balances, and maintain a transparent repayment trail for members and administrators."
      actions={
        <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>
          {showForm ? 'Close Form' : 'Record Payment'}
        </button>
      }
    >
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Paid Instalments" value={String(repayments.filter((item) => item.status === 'PAID').length)} tone="success" hint="Completed repayments" />
        <StatCard label="Pending Instalments" value={String(repayments.filter((item) => item.status === 'PENDING').length)} tone="warning" hint="Upcoming dues" />
        <StatCard label="Overdue Instalments" value={String(repayments.filter((item) => item.status === 'OVERDUE').length)} tone="danger" hint="Need alert and follow-up" />
      </section>

      {showForm ? (
        <form onSubmit={submitPayment} className="panel grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <label className="mb-2 block text-sm font-medium text-slate-700">Select instalment</label>
            <select
              value={formData.repaymentId}
              onChange={(e) => {
                const repaymentId = e.target.value;
                const selected = pendingRepayments.find((item) => item.id === repaymentId);
                setFormData({
                  ...formData,
                  repaymentId,
                  amount: selected ? String(selected.amount) : formData.amount,
                });
              }}
              required
            >
              <option value="">Select instalment</option>
              {pendingRepayments.map((repayment) => (
                <option key={repayment.id} value={repayment.id}>
                  {repayment.loan?.member?.name} - {formatCurrency(repayment.amount)} - due {formatDate(repayment.dueDate)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Payment amount</label>
            <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Paid date</label>
            <input type="date" value={formData.paidDate} onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })} required />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="btn btn-primary">Submit Repayment</button>
          </div>
        </form>
      ) : null}

      <section className="mt-8 panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="section-title">Instalment Ledger</h2>
            <p className="section-copy">Filter repayment records and review overdue accounts with a cleaner ledger view.</p>
          </div>
          <select className="md:w-[220px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PAID' | 'PENDING' | 'OVERDUE')}>
            <option value="ALL">All statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Borrower</th>
                <th>Trust</th>
                <th>Instalment</th>
                <th>Due</th>
                <th>Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleRepayments.map((repayment) => (
                <tr key={repayment.id}>
                  <td>
                    <p className="font-semibold text-slate-900">{repayment.loan?.member?.name}</p>
                    <p className="text-xs text-slate-500">{repayment.loan?.member?.email}</p>
                  </td>
                  <td><TrustBadge score={repayment.loan?.member?.memberProfile?.trustScore ?? 0} /></td>
                  <td>
                    <p>{formatCurrency(repayment.amount)}</p>
                    <p className="text-xs text-slate-500">Instalment {repayment.installmentNumber}</p>
                  </td>
                  <td>{formatDate(repayment.dueDate)}</td>
                  <td>{formatDate(repayment.paidDate)}</td>
                  <td>
                    <span className={`badge ${repayment.status === 'PAID' ? 'badge-success' : repayment.status === 'OVERDUE' ? 'badge-danger' : 'badge-warning'}`}>
                      {repayment.status}
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
