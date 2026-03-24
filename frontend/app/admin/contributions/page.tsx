'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { contributionService, memberService } from '@/services';

export default function ContributionsPage() {
  const router = useRouter();
  const [contributions, setContributions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    memberId: '',
    amount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
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
      const [contributionsData, membersData] = await Promise.all([
        contributionService.getAll(),
        memberService.getAll(),
      ]);
      setContributions(contributionsData);
      setMembers(membersData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await contributionService.add({
        memberId: formData.memberId,
        amount: parseFloat(formData.amount),
        month: formData.month,
        year: formData.year,
      });
      setFormData({
        memberId: '',
        amount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
      setShowForm(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add contribution');
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
          <h1 className="text-3xl font-bold">💰 Contributions</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add Contribution'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleAddContribution}
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
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="px-4 py-2 border rounded-lg"
              required
            />
            <input
              type="number"
              min="1"
              max="12"
              placeholder="Month"
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
              className="px-4 py-2 border rounded-lg"
              required
            />
            <input
              type="number"
              placeholder="Year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="px-4 py-2 border rounded-lg"
              required
            />
            <button type="submit" className="btn btn-success">
              Add
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
                  <th>Month/Year</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((contribution) => (
                  <tr key={contribution.id}>
                    <td>{contribution.member?.name || 'N/A'}</td>
                    <td>₹{contribution.amount}</td>
                    <td>{contribution.month}/{contribution.year}</td>
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
