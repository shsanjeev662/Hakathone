'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { dashboardService } from '@/services';
import type { MemberDashboard } from '@/types';

export default function MemberDashboard() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<MemberDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchDashboard = async () => {
      try {
        const data = await dashboardService.getMemberDashboard();
        setDashboard(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
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

  if (error || !dashboard) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">📊 My Dashboard</h1>

        {/* Savings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Savings</p>
            <p className="text-3xl font-bold text-green-600">
              ₹{dashboard.savings.total.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {dashboard.savings.paid} paid contributions
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Active Loans</p>
            <p className="text-3xl font-bold text-blue-600">{dashboard.loans.active}</p>
            <p className="text-xs text-gray-500 mt-1">
              ₹{dashboard.loans.totalAmount.toLocaleString()} total
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Overdue Payments</p>
            <p className="text-3xl font-bold text-red-600">
              {dashboard.dues.overdue.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ₹
              {dashboard.dues.overdue
                .reduce((sum, r) => sum + r.amount, 0)
                .toLocaleString()}{' '}
              total
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Dues */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📅 Upcoming Dues</h2>
            {dashboard.dues.upcoming.length > 0 ? (
              <div className="space-y-3">
                {dashboard.dues.upcoming.map((due) => (
                  <div key={due.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">₹{due.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(due.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="badge badge-warning">PENDING</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming dues</p>
            )}
          </div>

          {/* Overdue */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">⚠️ Overdue Payments</h2>
            {dashboard.dues.overdue.length > 0 ? (
              <div className="space-y-3">
                {dashboard.dues.overdue.map((overdue) => (
                  <div key={overdue.id} className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <div>
                      <p className="font-medium">₹{overdue.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        Was due: {new Date(overdue.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="badge badge-danger">OVERDUE</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No overdue payments</p>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🔔 Notifications</h2>
          {dashboard.notifications.length > 0 ? (
            <div className="space-y-2">
              {dashboard.notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded ${
                    notif.type === 'ALERT'
                      ? 'bg-red-50 text-red-800'
                      : notif.type === 'WARNING'
                        ? 'bg-yellow-50 text-yellow-800'
                        : 'bg-blue-50 text-blue-800'
                  }`}
                >
                  {notif.message}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No notifications</p>
          )}
        </div>
      </div>
    </div>
  );
}
