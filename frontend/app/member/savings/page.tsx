'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { contributionService } from '@/services';

export default function MemberSavingsPage() {
  const router = useRouter();
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (user) {
      const userData = JSON.parse(user);
      setMemberId(userData.id);
      fetchContributions(userData.id);
    }
  }, [router]);

  const fetchContributions = async (id: string) => {
    try {
      const data = await contributionService.getMember(id);
      setContributions(data);
    } catch (err) {
      console.error('Error fetching contributions:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSavings = contributions
    .filter((c) => c.status === 'PAID')
    .reduce((sum, c) => sum + c.amount, 0);

  const missedCount = contributions.filter((c) => c.status === 'MISSED').length;

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
        <h1 className="text-3xl font-bold mb-8">💰 My Savings</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Savings</p>
            <p className="text-3xl font-bold text-green-600">
              ₹{totalSavings.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Contributions Made</p>
            <p className="text-3xl font-bold text-blue-600">
              {contributions.filter((c) => c.status === 'PAID').length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Missed Payments</p>
            <p className="text-3xl font-bold text-red-600">{missedCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Month/Year</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((contribution) => (
                  <tr key={contribution.id}>
                    <td>
                      {contribution.month}/{contribution.year}
                    </td>
                    <td>₹{contribution.amount}</td>
                    <td>
                      <span
                        className={`badge ${
                          contribution.status === 'PAID'
                            ? 'badge-success'
                            : contribution.status === 'MISSED'
                              ? 'badge-danger'
                              : 'badge-warning'
                        }`}
                      >
                        {contribution.status}
                      </span>
                    </td>
                    <td>{new Date(contribution.createdAt).toLocaleDateString()}</td>
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
