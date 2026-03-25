'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import TrustBadge from '@/components/TrustBadge';
import { repaymentService } from '@/services';
import type { Repayment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';

export default function RepaymentsPage() {
  const router = useRouter();
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [showForm, setShowForm] = useState(false);
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
      subtitle="Collect instalments, monitor delays, and show trust score recovery as members repay on time."
      actions={
        <>
          <button className="btn btn-primary" onClick={() => setShowForm((value) => !value)}>{showForm ? 'Close Form' : 'Record Payment'}</button>
        </>
      }
    >
      {showForm ? (
        <form onSubmit={submitPayment} className="panel grid gap-4 md:grid-cols-3">
          <select value={formData.repaymentId} onChange={(e) => {
            const repaymentId = e.target.value;
            const selected = pendingRepayments.find((item) => item.id === repaymentId);
            setFormData({
              ...formData,
              repaymentId,
              amount: selected ? String(selected.amount) : formData.amount,
            });
          }} required>
            <option value="">Select instalment</option>
            {pendingRepayments.map((repayment) => (
              <option key={repayment.id} value={repayment.id}>
                {repayment.loan?.member?.name} - {formatCurrency(repayment.amount)} - due {formatDate(repayment.dueDate)}
              </option>
            ))}
          </select>
          <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
          <input type="date" value={formData.paidDate} onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })} required />
          <div className="md:col-span-3">
            <button type="submit" className="btn btn-primary">Submit Repayment</button>
          </div>
        </form>
      ) : null}

      <section className="mt-8 panel">
        <h2 className="text-2xl text-slate-900">Instalment Ledger</h2>
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
              {repayments.map((repayment) => (
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
