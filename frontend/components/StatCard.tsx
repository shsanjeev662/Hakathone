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
    default: 'from-slate-900 to-slate-700',
    success: 'from-emerald-700 to-emerald-500',
    warning: 'from-amber-700 to-orange-500',
    danger: 'from-rose-700 to-rose-500',
  };

  return (
    <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`mt-4 bg-gradient-to-r ${toneMap[tone]} bg-clip-text text-3xl font-semibold text-transparent`}>
            {value}
          </p>
          {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
        </div>
        {icon ? <div className="rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600">{icon}</div> : null}
      </div>
    </div>
  );
}
