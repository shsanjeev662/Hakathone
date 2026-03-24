'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { loanService, memberService } from '@/services';

export default function LoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    interestRate: '12',
    durationMonths: '12',
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
      const [loansData, membersData] = await Promise.all([
        loanService.getAll(),
        memberService.getAll(),
      ]);
      setLoans(loansData);
      setMembers(membersData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loanService.issue({
        memberId: formData.memberId,
        amount: parseFloat(formData.amount),
        interestRate: parseFloat(formData.interestRate),
        durationMonths: parseInt(formData.durationMonths),
      });
      setFormData({
        memberId: '',
        amount: '',
        interestRate: '12',
        durationMonths: '12',
      });
      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to issue loan');
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
          <h1 className="text-3xl font-bold">🏦 Loan Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : '+ Issue Loan'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleIssueLoan}
            className="bg-white rounded-lg shadow p-6 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
          >
            <select
              value={formData.memberId}
              onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
              className="px-4 py-2 border rounded-lg"
              required
            >
              <option value="">Select Member</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Loan Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="px-4 py-2 border rounded-lg"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Interest Rate (%)"
              value={formData.interestRate}
              onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              className="px-4 py-2 border rounded-lg"
              required
            />
            <input
              type="number"
              placeholder="Duration (Months)"
              value={formData.durationMonths}
              onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
              className="px-4 py-2 border rounded-lg"
              required
            />
            <button type="submit" className="btn btn-success">
              Issue Loan
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
                  <th>EMI</th>
                  <th>Interest</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Start Date</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td>{loan.member?.name || 'N/A'}</td>
                    <td>₹{loan.amount.toLocaleString()}</td>
                    <td>₹{loan.emiAmount.toFixed(2)}</td>
                    <td>{loan.interestRate}%</td>
                    <td>{loan.durationMonths} months</td>
                    <td>
                      <span
                        className={`badge ${
                          loan.status === 'ACTIVE'
                            ? 'badge-success'
                            : 'badge-info'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </td>
                    <td>{new Date(loan.startDate).toLocaleDateString()}</td>
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
