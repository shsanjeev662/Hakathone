'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/members', label: 'Members' },
  { href: '/admin/contributions', label: 'Savings' },
  { href: '/admin/loans', label: 'Loans' },
  { href: '/admin/repayments', label: 'Repayments' },
  { href: '/admin/reports', label: 'Reports' },
];

const memberLinks = [
  { href: '/member/dashboard', label: 'Dashboard' },
  { href: '/member/savings', label: 'Savings' },
  { href: '/member/loans', label: 'Loans' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: 'ADMIN' | 'MEMBER' } | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) setUser(JSON.parse(raw));

    const syncStatus = () => setOnline(window.navigator.onLine);
    syncStatus();
    window.addEventListener('online', syncStatus);
    window.addEventListener('offline', syncStatus);
    return () => {
      window.removeEventListener('online', syncStatus);
      window.removeEventListener('offline', syncStatus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push('/login');
  };

  if (!user) return null;

  const links = user.role === 'ADMIN' ? adminLinks : memberLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-[rgba(21,49,38,0.94)] text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Link href={user.role === 'ADMIN' ? '/admin/dashboard' : '/member/dashboard'} className="font-serif text-2xl">
              Smart Dhukuti
            </Link>
            <span className={`badge ${online ? 'badge-success' : 'badge-warning'}`}>
              {online ? 'Online Sync Ready' : 'Offline Draft Mode'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-white/10 px-4 py-2">{user.name}</span>
            <button onClick={handleLogout} className="btn bg-rose-500 px-4 py-2 text-white hover:bg-rose-600">
              Logout
            </button>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? 'bg-amber-400 text-slate-950' : 'bg-white/8 text-white hover:bg-white/14'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
