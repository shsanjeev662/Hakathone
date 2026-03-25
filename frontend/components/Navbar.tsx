'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type NavUser = {
  name: string;
  role: 'ADMIN' | 'MEMBER';
  email?: string;
};

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/admin/members', label: 'Members', icon: 'users' },
  { href: '/admin/contributions', label: 'Transactions', icon: 'swap' },
  { href: '/admin/loans', label: 'Loans', icon: 'coin' },
  { href: '/admin/reports', label: 'Reports', icon: 'chart' },
];

const memberLinks = [
  { href: '/member/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/member/savings', label: 'Savings', icon: 'wallet' },
  { href: '/member/loans', label: 'Loans', icon: 'coin' },
];

const iconMap = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20h14V9.5" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M16 19a4 4 0 0 0-8 0" />
      <circle cx="12" cy="9" r="3.5" />
      <path d="M19 18a3 3 0 0 0-2.3-2.92" />
      <path d="M7.3 15.08A3 3 0 0 0 5 18" />
    </svg>
  ),
  swap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 7h12" />
      <path d="m12 3 4 4-4 4" />
      <path d="M20 17H8" />
      <path d="m12 13-4 4 4 4" />
    </svg>
  ),
  coin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 10.5c0-1 1.1-1.8 2.5-1.8s2.5.8 2.5 1.8-1.1 1.8-2.5 1.8-2.5.8-2.5 1.8 1.1 1.8 2.5 1.8 2.5-.8 2.5-1.8" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 15v-4" />
      <path d="M12 15V8" />
      <path d="M16 15v-6" />
      <path d="M20 15v-9" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19v14H6.5A2.5 2.5 0 0 1 4 16.5z" />
      <path d="M19 9h1.5A1.5 1.5 0 0 1 22 10.5v3A1.5 1.5 0 0 1 20.5 15H19" />
      <circle cx="18" cy="12" r=".8" fill="currentColor" />
    </svg>
  ),
};

function BrandMark() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
      <div className="relative h-7 w-7 rounded-xl border-2 border-white/90">
        <div className="absolute inset-y-1 left-1.5 w-1.5 rounded-full bg-white/90" />
        <div className="absolute bottom-1 right-1 h-3 w-3 rounded-md border-2 border-white/90" />
      </div>
    </div>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<NavUser | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      setUser(JSON.parse(raw));
    }

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  const links = user.role === 'ADMIN' ? adminLinks : memberLinks;

  return (
    <aside className="sticky top-0 flex h-screen flex-col border-r border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-6">
        <BrandMark />
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-slate-500">SMART DHUKUTI</p>
          <p className="text-sm text-slate-400">Operations System</p>
        </div>
      </div>

      <div className="px-4 py-6">
        <p className="px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Navigation</p>
        <nav className="mt-3 space-y-1.5">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? 'bg-slate-950 text-white shadow-[0_14px_24px_rgba(15,23,42,0.16)]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={active ? 'text-white' : 'text-slate-400'}>
                  {iconMap[link.icon as keyof typeof iconMap]}
                </span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-200 px-5 py-5">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">System Status</p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role === 'ADMIN' ? 'Administrator' : 'Member Portal'}</p>
            </div>
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
          <button onClick={handleLogout} className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
