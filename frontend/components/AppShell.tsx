'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

const adminMobileLinks = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/members', label: 'Members' },
  { href: '/admin/loans', label: 'Loans' },
  { href: '/admin/reports', label: 'Reports' },
];

const memberMobileLinks = [
  { href: '/member/dashboard', label: 'Dashboard' },
  { href: '/member/savings', label: 'Savings' },
  { href: '/member/loans', label: 'Loans' },
];

export default function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<'ADMIN' | 'MEMBER' | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      setUserRole(parsed.role);
    }
  }, []);

  const links = userRole === 'ADMIN' ? adminMobileLinks : memberMobileLinks;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <div className="hidden lg:block">
          <Navbar />
        </div>
        <div className="min-w-0">
          <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.16em] text-slate-400">SMART DHUKUTI</p>
                <p className="text-sm text-slate-500">{userRole === 'ADMIN' ? 'Admin Panel' : 'Member Portal'}</p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Logout
              </button>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium ${
                    pathname === link.href ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex flex-col gap-4 px-5 py-5 sm:px-8 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h1 className="font-sans text-[1.95rem] font-semibold tracking-[-0.04em] text-slate-950">{title}</h1>
                {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p> : null}
              </div>
              {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
            </div>
          </header>
          <main className="px-5 py-6 sm:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
