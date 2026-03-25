import type { RiskLevel } from '@/types';

export default function TrustBadge({
  score,
  riskLevel,
}: {
  score: number;
  riskLevel?: RiskLevel;
}) {
  const tone =
    score >= 80 ? 'bg-emerald-100 text-emerald-800' : score >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800';

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${tone}`}>
      <span>Trust {score}/100</span>
      {riskLevel ? <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs">{riskLevel}</span> : null}
    </div>
  );
}
