'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { repaymentService, loanService } from '@/services';

export default function RepaymentsPage() {
  const router = useRouter();
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    loanId: '',
    amount: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [repaymentsData, loansData] = await Promise.all([
        repaymentService.getAll(),
        loanService.getAll(),
      ]);
      setRepayments(repaymentsData);
      setLoans(loansData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await repaymentService.record(formData.loanId, parseFloat(formData.amount));
      setFormData({ loanId: '', amount: '' });
      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record repayment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'badge-success';
      case 'OVERDUE':
        return 'badge-danger';
      case 'PENDING':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">📝 Repayments</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : '+ Record Payment'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleRecordRepayment}
            className="bg-white rounded-lg shadow p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <select
              value={formData.loanId}
              onChange={(e) => setFormData({ ...formData, loanId: e.target.value })}
              className="px-4 py-2 border rounded-lg"
              required
            >
              <option value="">Select Loan</option>
              {loans.filter(l => l.status === 'ACTIVE').map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.member?.name || 'N/A'} - ₹{loan.amount}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="px-4 py-2 border rounded-lg"
              required
            />
            <button type="submit" className="btn btn-success">
              Record Payment
            </button>
          </form>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Paid Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {repayments.map((repayment) => (
                  <tr key={repayment.id}>
                    <td>{repayment.loan?.member?.name || 'N/A'}</td>
                    <td>₹{repayment.amount.toFixed(2)}</td>
                    <td>{new Date(repayment.dueDate).toLocaleDateString()}</td>
                    <td>{repayment.paidDate ? new Date(repayment.paidDate).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className={`badge ${getStatusColor(repayment.status)}`}>
                        {repayment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
