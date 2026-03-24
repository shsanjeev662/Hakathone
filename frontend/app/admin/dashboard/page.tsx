'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { dashboardService } from '@/services';
import type { DashboardStats } from '@/types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

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

  if (error || !stats) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  const riskData = [
    { name: 'Low Risk', value: stats.memberRisks.filter((m) => m.riskLevel === 'LOW').length },
    { name: 'Medium Risk', value: stats.memberRisks.filter((m) => m.riskLevel === 'MEDIUM').length },
    { name: 'High Risk', value: stats.memberRisks.filter((m) => m.riskLevel === 'HIGH').length },
  ];

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">📊 Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Members</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalMembers}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Savings</p>
            <p className="text-3xl font-bold text-green-600">
              ₹{stats.totalSavings.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Active Loans</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.activeLoans}</p>
            <p className="text-xs text-gray-500 mt-1">
              ₹{stats.totalActiveLoanAmount.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Overdue Payments</p>
            <p className="text-3xl font-bold text-red-600">{stats.overduePayments}</p>
            <p className="text-xs text-gray-500 mt-1">
              ₹{stats.totalOverdueAmount.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Risk Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Member Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Overall Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Overall Status</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">Collection Rate</span>
                  <span className="font-semibold">
                    {stats.totalMembers > 0
                      ? Math.round(
                        ((stats.totalMembers - stats.missedContributions) /
                          stats.totalMembers) *
                        100
                      )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        stats.totalMembers > 0
                          ? Math.round(
                            ((stats.totalMembers -
                              stats.missedContributions) /
                              stats.totalMembers) *
                            100
                          )
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-700">Loan Repayment Rate</span>
                  <span className="font-semibold">
                    {stats.pendingRepayments > 0
                      ? Math.round(
                        ((stats.pendingRepayments - stats.overduePayments) /
                          stats.pendingRepayments) *
                        100
                      )
                      : 100}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        stats.pendingRepayments > 0
                          ? Math.round(
                            ((stats.pendingRepayments -
                              stats.overduePayments) /
                              stats.pendingRepayments) *
                            100
                          )
                          : 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* High Risk Members */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">High Risk Members</h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Risk Level</th>
                  <th>Missed Payments</th>
                </tr>
              </thead>
              <tbody>
                {stats.memberRisks
                  .filter((m) => m.riskLevel === 'HIGH')
                  .map((member) => (
                    <tr key={member.id}>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>
                        <span className="badge badge-danger">{member.riskLevel}</span>
                      </td>
                      <td>{member.missedPayments}</td>
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
