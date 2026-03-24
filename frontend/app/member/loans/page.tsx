'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { loanService, repaymentService } from '@/services';

export default function MemberLoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState<string>('');
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);

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
      fetchLoans(userData.id);
    }
  }, [router]);

  const fetchLoans = async (id: string) => {
    try {
      const data = await loanService.getMember(id);
      setLoans(data);
    } catch (err) {
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalLoanAmount = loans
    .filter((l) => l.status === 'ACTIVE')
    .reduce((sum, l) => sum + l.amount, 0);

  const totalRepaid = loans.reduce((sum, loan) => {
    const paidRepayments = loan.repayments.filter((r: any) => r.status === 'PAID');
    return sum + paidRepayments.reduce((loanSum: number, r: any) => loanSum + r.amount, 0);
  }, 0);

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
        <h1 className="text-3xl font-bold mb-8">🏦 My Loans</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Active Loans</p>
            <p className="text-3xl font-bold text-blue-600">
              {loans.filter((l) => l.status === 'ACTIVE').length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Loan Amount</p>
            <p className="text-3xl font-bold text-orange-600">
              ₹{totalLoanAmount.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm">Total Repaid</p>
            <p className="text-3xl font-bold text-green-600">
              ₹{totalRepaid.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {loans.map((loan) => {
            const paidRepayments = loan.repayments.filter((r: any) => r.status === 'PAID');
            const pendingRepayments = loan.repayments.filter((r: any) => r.status === 'PENDING');
            const overdueRepayments = loan.repayments.filter((r: any) => r.status === 'OVERDUE');
            const totalRepaidForLoan = paidRepayments.reduce((sum: number, r: any) => sum + r.amount, 0);

            return (
              <div key={loan.id} className="bg-white rounded-lg shadow p-6">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setExpandedLoan(expandedLoan === loan.id ? null : loan.id)}
                >
                  <div>
                    <h3 className="text-lg font-semibold">Loan ID: {loan.id.slice(0, 8)}</h3>
                    <p className="text-gray-600">
                      Principal: ₹{loan.amount.toLocaleString()} | EMI: ₹
                      {loan.emiAmount.toFixed(2)} | Duration: {loan.durationMonths} months
                    </p>
                  </div>
                  <span
                    className={`badge ${
                      loan.status === 'ACTIVE' ? 'badge-success' : 'badge-info'
                    }`}
                  >
                    {loan.status}
                  </span>
                </div>

                {expandedLoan === loan.id && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-gray-600">Interest Rate</p>
                        <p className="text-lg font-semibold">{loan.interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Repaid</p>
                        <p className="text-lg font-semibold">₹{totalRepaidForLoan.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Remaining</p>
                        <p className="text-lg font-semibold">
                          ₹{(loan.amount - totalRepaidForLoan).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Progress</p>
                        <p className="text-lg font-semibold">
                          {Math.round((totalRepaidForLoan / (loan.emiAmount * loan.durationMonths)) * 100)}%
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm font-medium mb-2">Repayment Status</p>
                      <div className="flex gap-4 text-sm">
                        <span className="badge badge-success">Paid: {paidRepayments.length}</span>
                        <span className="badge badge-warning">Pending: {pendingRepayments.length}</span>
                        <span className="badge badge-danger">Overdue: {overdueRepayments.length}</span>
                      </div>
                    </div>

                    <h4 className="font-semibold mb-3">Recent Repayments</h4>
                    <div className="space-y-2">
                      {loan.repayments.slice(0, 5).map((repayment: any) => (
                        <div key={repayment.id} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>₹{repayment.amount.toFixed(2)}</span>
                          <span>Due: {new Date(repayment.dueDate).toLocaleDateString()}</span>
                          <span
                            className={`badge ${
                              repayment.status === 'PAID'
                                ? 'badge-success'
                                : repayment.status === 'OVERDUE'
                                  ? 'badge-danger'
                                  : 'badge-warning'
                            }`}
                          >
                            {repayment.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
