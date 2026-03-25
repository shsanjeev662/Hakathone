'use client';

import type { ReactNode } from 'react';
import Navbar from '@/components/Navbar';

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
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e7f3ee_0%,#f6f0dc_35%,#f3efe7_100%)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_30px_80px_rgba(35,60,45,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
                Smart Digital Cooperative System
              </p>
              <h1 className="mt-3 font-serif text-3xl text-slate-900 sm:text-4xl">{title}</h1>
              {subtitle ? <p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-base">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
          </div>
        </section>
        {children}
      </main>
    </div>
  );
}
