'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-3xl font-bold">
            🏢 Dhukuti
          </Link>

          <div className="flex gap-6 items-center">
            {user.role === 'ADMIN' ? (
              <>
                <Link href="/admin/dashboard" className="hover:text-blue-200">
                  Dashboard
                </Link>
                <Link href="/admin/members" className="hover:text-blue-200">
                  Members
                </Link>
                <Link href="/admin/contributions" className="hover:text-blue-200">
                  Contributions
                </Link>
                <Link href="/admin/loans" className="hover:text-blue-200">
                  Loans
                </Link>
                <Link href="/admin/repayments" className="hover:text-blue-200">
                  Repayments
                </Link>
              </>
            ) : (
              <>
                <Link href="/member/dashboard" className="hover:text-blue-200">
                  My Dashboard
                </Link>
                <Link href="/member/savings" className="hover:text-blue-200">
                  Savings
                </Link>
                <Link href="/member/loans" className="hover:text-blue-200">
                  Loans
                </Link>
              </>
            )}

            <div className="flex gap-3">
              <span className="text-sm">{user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
