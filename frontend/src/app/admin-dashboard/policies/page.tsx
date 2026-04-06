'use client';

import { useEffect, useState } from 'react';
import {
  fetchPolicyStats,
  fetchPolicyTiers,
  fetchPayoutTrends,
  fetchRecentPayouts,
  PolicyStats,
  PolicyTier,
  MonthlyTrend,
  PayoutItem,
} from '@/lib/admin/adminClient';

/* ─── Avatar helpers ─────────────────────────────────────────── */
const initials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const avatarColors = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
];

/* ─── Semicircular SVG Gauge ─────────────────────────────────── */
function GaugeArc({ value }: { value: number }) {
  const clamp    = Math.min(1, Math.max(0, value));
  const cx = 100, cy = 100, r = 72;
  const toRad    = (deg: number) => (deg * Math.PI) / 180;
  const arcStart = 205, arcEnd = 335;
  const fullSweep = arcEnd - arcStart;

  const pt = (deg: number) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });

  const arcD = (from: number, to: number) => {
    const s = pt(from), e = pt(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  };

  const fillEnd = arcStart + clamp * fullSweep;
  const green   = arcStart + Math.min(clamp, 0.60) * fullSweep;
  const yellow  = arcStart + Math.min(clamp, 0.85) * fullSweep;
  const nx      = cx + (r - 20) * Math.cos(toRad(fillEnd));
  const ny      = cy + (r - 20) * Math.sin(toRad(fillEnd));
  const startPt = pt(arcStart), endPt = pt(arcEnd);

  return (
    <svg viewBox="0 0 200 130" className="w-full max-w-[200px] mx-auto">
      {/* Track */}
      <path d={arcD(arcStart, arcEnd)} fill="none" stroke="#1e293b" strokeWidth={11} strokeLinecap="round" />
      {/* Green fill */}
      {clamp > 0 && (
        <path d={arcD(arcStart, green)} fill="none" stroke="#34d399" strokeWidth={11} strokeLinecap="round" />
      )}
      {/* Yellow fill */}
      {clamp > 0.60 && (
        <path d={arcD(green, yellow)} fill="none" stroke="#fbbf24" strokeWidth={11} strokeLinecap="round" />
      )}
      {/* Red fill */}
      {clamp > 0.85 && (
        <path d={arcD(yellow, fillEnd)} fill="none" stroke="#f87171" strokeWidth={11} strokeLinecap="round" />
      )}
      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx.toFixed(2)} y2={ny.toFixed(2)}
        stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="white" />
      {/* Labels */}
      <text x={startPt.x - 4} y={startPt.y + 14} fill="#475569" fontSize="8" textAnchor="middle">0</text>
      <text x={endPt.x + 4}   y={endPt.y + 14}   fill="#ef4444" fontSize="8" textAnchor="middle">1</text>
    </svg>
  );
}

/* ─── Tier person icon ───────────────────────────────────────── */
const TierIcon = ({ idx }: { idx: number }) => {
  const colors = [
    'bg-slate-100 text-slate-500',
    'bg-blue-50  text-blue-500',
    'bg-purple-50 text-purple-500',
  ];
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${colors[idx]}`}>
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  );
};

/* ─── Custom SVG Payout Trends Chart ────────────────────────── */
interface ChartDatum { name: string; premiums: number; payouts: number }

function PayoutChart({ data }: { data: ChartDatum[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const W = 560, H = 240;
  const padL = 56, padR = 16, padT = 12, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxVal = Math.max(...data.flatMap((d) => [d.premiums, d.payouts]));
  const yMax   = Math.ceil(maxVal / 1_000_000) * 1_000_000;

  const groupW = chartW / data.length;
  const barW   = Math.round(groupW * 0.28);
  const gap    = Math.round(groupW * 0.04);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    val: f * yMax,
    y:   chartH - f * chartH,
  }));

  const fmtY = (v: number) =>
    v === 0 ? '0' : `₹${(v / 1_000_000).toFixed(1)}M`;

  /* Rounded-top rect path */
  const rr = 5;
  const roundRect = (x: number, y: number, w: number, h: number) =>
    `M ${x + rr} ${y} H ${x + w - rr} Q ${x + w} ${y} ${x + w} ${y + rr}` +
    ` V ${y + h} H ${x} V ${y + rr} Q ${x} ${y} ${x + rr} ${y}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="gradPremium" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c4b5fd" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ddd6fe" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="gradPayout" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="gradPremiumHov" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="gradPayoutHov" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#5b21b6" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>

      <g transform={`translate(${padL},${padT})`}>
        {/* Y gridlines + labels */}
        {yTicks.map(({ val, y }) => (
          <g key={val}>
            <line x1={0} y1={y} x2={chartW} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={-8} y={y + 4} fill="#94a3b8" fontSize={10} textAnchor="end" fontFamily="inherit">
              {fmtY(val)}
            </text>
          </g>
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const cx  = i * groupW + groupW / 2;
          const x1  = cx - barW - gap / 2;
          const x2  = cx + gap / 2;
          const ph  = (d.premiums / yMax) * chartH;
          const oh  = (d.payouts  / yMax) * chartH;
          const isHov = hovered === i;

          return (
            <g
              key={d.name}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'default' }}
            >
              {/* Column hover highlight */}
              {isHov && (
                <rect
                  x={cx - groupW / 2 + 4} y={0}
                  width={groupW - 8} height={chartH}
                  rx={6} fill="#f8fafc"
                />
              )}
              {/* Premium bar */}
              <path
                d={roundRect(x1, chartH - ph, barW, ph)}
                fill={isHov ? 'url(#gradPremiumHov)' : 'url(#gradPremium)'}
              />
              {/* Payout bar */}
              <path
                d={roundRect(x2, chartH - oh, barW, oh)}
                fill={isHov ? 'url(#gradPayoutHov)' : 'url(#gradPayout)'}
              />
              {/* X label */}
              <text
                x={cx} y={chartH + 22}
                fill="#94a3b8" fontSize={11} textAnchor="middle" fontFamily="inherit"
              >
                {d.name}
              </text>
              {/* Hover tooltip bubble */}
              {isHov && (
                <g transform={`translate(${cx - 52}, ${chartH - Math.max(ph, oh) - 62})`}>
                  <rect width={104} height={48} rx={8}
                    fill="white" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.12))" />
                  <text x={52} y={16} textAnchor="middle"
                    fill="#1e293b" fontSize={10} fontWeight="700" fontFamily="inherit">
                    {d.name}
                  </text>
                  <text x={10} y={30} fill="#94a3b8" fontSize={9} fontFamily="inherit">Premiums</text>
                  <text x={94} y={30} textAnchor="end"
                    fill="#7c3aed" fontSize={9} fontWeight="600" fontFamily="inherit">
                    ₹{(d.premiums / 1_000_000).toFixed(1)}M
                  </text>
                  <text x={10} y={42} fill="#94a3b8" fontSize={9} fontFamily="inherit">Payouts</text>
                  <text x={94} y={42} textAnchor="end"
                    fill="#5b21b6" fontSize={9} fontWeight="600" fontFamily="inherit">
                    ₹{(d.payouts / 1_000_000).toFixed(1)}M
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function ActivePoliciesPage() {
  const [policyStats, setPolicyStats] = useState<PolicyStats | null>(null);
  const [policyTiers, setPolicyTiers] = useState<PolicyTier[]>([]);
  const [payoutTrends, setPayoutTrends] = useState<MonthlyTrend[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<PayoutItem[]>([]);

  useEffect(() => {
    fetchPolicyStats().then(setPolicyStats).catch(console.error);
    fetchPolicyTiers().then(setPolicyTiers).catch(console.error);
    fetchPayoutTrends().then(setPayoutTrends).catch(console.error);
    fetchRecentPayouts().then(setRecentPayouts).catch(console.error);
  }, []);

  /* ── Skeleton ── */
  if (!policyStats) {
    return (
      <div className="p-8 grid grid-cols-2 gap-4 animate-pulse bg-[#F5F7FB] min-h-screen">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-xl" />
        ))}
      </div>
    );
  }

  /* ── Derived data (original formulas preserved) ── */
  const totalValueLocked = policyStats.total_value_locked;
  const activeNodes      = policyStats.active_nodes;
  const lossRatio        = policyStats.loss_ratio;

  const tierData = policyTiers.map((tier, idx) => ({
    name: tier.tier,
    workers: tier.workers,
    coverage: `₹${tier.avg_coverage}`,
  }));

  const chartData = payoutTrends.map((trend) => ({
    name: trend.month,
    premiums: trend.premiums || 0,
    payouts: trend.payouts,
  }));

  /* ── Render ── */
  return (
    <div className="p-10 bg-[#F5F7FB] min-h-screen space-y-8">

      {/* ── HEADER ── */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Active Policies &amp; Payouts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time oversight of parametric gig-economy stability.
          </p>
        </div>

        <div className="flex gap-10 text-right">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Total Value Locked
            </p>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              ₹{totalValueLocked.toLocaleString()}
            </h2>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Active Nodes
            </p>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              {activeNodes.toLocaleString()}
            </h2>
          </div>
        </div>
      </div>

      {/* ── TOP GRID ── */}
      <div className="grid grid-cols-3 gap-6">

        {/* Loss Ratio Card */}
        <div
          className="text-white p-6 rounded-2xl shadow-xl flex flex-col"
          style={{ backgroundColor: '#0B1220' }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
              Current Loss Ratio
            </p>
            <h2 className="text-5xl font-bold mt-2 tracking-tight tabular-nums">
              {lossRatio.toFixed(2)}
            </h2>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              5% BELOW THRESHOLD
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              System healthy. Current loss ratio is within operational threshold of 0.75.
            </p>
          </div>

          <div className="mt-auto pt-6">
            <GaugeArc value={lossRatio} />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 px-1">
              <span>STABLE</span>
              <span>WARNING (0.75)</span>
              <span className="text-red-400">CRITICAL</span>
            </div>
          </div>
        </div>

        {/* Payout Trends Chart */}
        <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Payout Trends</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly premiums collected vs. payouts triggered
              </p>
            </div>
            <div className="flex gap-5 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ background: 'linear-gradient(to bottom, #c4b5fd, #ddd6fe)' }}
                />
                PREMIUMS
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ background: 'linear-gradient(to bottom, #7c3aed, #a78bfa)' }}
                />
                PAYOUTS
              </span>
            </div>
          </div>
          <PayoutChart data={chartData} />
        </div>
      </div>

      {/* ── POLICY DISTRIBUTION ── */}
      <div>
        <h2 className="text-sm font-bold text-slate-800 mb-4">Policy Distribution</h2>

        <div className="grid grid-cols-3 gap-6">
          {tierData.map((tier, idx) => {
            const pct      = ((tier.workers / activeNodes) * 100).toFixed(0);
            const barColor = ['bg-slate-400', 'bg-blue-500', 'bg-purple-500'][idx];
            const badge    = [
              <span key="e"  className="text-[10px] px-2.5 py-1 bg-slate-100   rounded-full text-slate-500  font-semibold">ENTRY TIER</span>,
              <span key="p"  className="text-[10px] px-2.5 py-1 bg-emerald-50  rounded-full text-emerald-600 font-semibold">MOST POPULAR</span>,
              <span key="pr" className="text-[10px] px-2.5 py-1 bg-purple-50   rounded-full text-purple-600  font-semibold">PREMIUM ELITE</span>,
            ][idx];

            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-center">
                  <TierIcon idx={idx} />
                  {badge}
                </div>

                <h3 className="font-bold text-slate-800 text-sm">{tier.name}</h3>

                <div className="flex justify-between">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Active Workers</p>
                    <p className="font-bold text-slate-800 text-base tabular-nums">
                      {tier.workers.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs mb-1">Avg. Coverage</p>
                    <p className="font-bold text-slate-800 text-base">{tier.coverage}/mo</p>
                  </div>
                </div>

                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RECENT PAYOUTS ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Recent Payouts</h2>
          <button className="text-xs text-slate-400 hover:text-slate-700 font-semibold transition-colors">
            View All →
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/70">
              {['TRANSACTION ID', 'WORKER ACCOUNT', 'AMOUNT', 'STATUS', 'DATE'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {recentPayouts.slice(0, 6).map((p, i) => (
              <tr key={p.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 text-slate-400 text-xs font-mono tracking-tight">
                  {p.id}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                      {initials(p.worker_name)}
                    </div>
                    <span className="text-slate-700 font-semibold text-xs">{p.worker_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-slate-800 tabular-nums">₹{p.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full ${
                    p.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                      p.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    {p.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 text-xs">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}