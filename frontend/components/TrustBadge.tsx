import type { RiskLevel } from '@/types';

export default function TrustBadge({
  score,
  riskLevel,
}: {
  score: number;
  riskLevel?: RiskLevel;
}) {
  const tone =
    score >= 80
      ? 'bg-teal-50 text-teal-700 ring-teal-200'
      : score >= 60
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-rose-50 text-rose-700 ring-rose-200';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${tone}`}>
      <span>{score}/100</span>
      {riskLevel ? <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold tracking-[0.12em] text-slate-500 shadow-sm">{riskLevel}</span> : null}
    </div>
  );
}
