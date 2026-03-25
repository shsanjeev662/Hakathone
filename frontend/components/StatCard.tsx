import type { ReactNode } from 'react';

export default function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  icon?: ReactNode;
}) {
  const toneMap = {
    default: 'border-slate-200 bg-white',
    success: 'border-teal-200 bg-teal-50/70',
    warning: 'border-amber-200 bg-amber-50/70',
    danger: 'border-rose-200 bg-rose-50/70',
  };

  return (
    <div className={`h-full rounded-[1.75rem] border p-5 shadow-[0_16px_32px_rgba(15,23,42,0.05)] ${toneMap[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-3 text-[2.1rem] font-semibold leading-none tracking-[-0.05em] text-slate-950">{value}</p>
          {hint ? <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p> : null}
        </div>
        {icon ? <div className="rounded-2xl border border-white/80 bg-white/90 px-3 py-2 text-sm text-slate-500 shadow-sm">{icon}</div> : null}
      </div>
    </div>
  );
}
