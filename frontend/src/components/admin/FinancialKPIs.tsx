'use client';

import { useEffect, useState } from 'react';
import { fetchKPIs, AdminKPIs } from '@/lib/admin/adminClient';

export default function FinancialKPIs() {
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);

  useEffect(() => {
    fetchKPIs().then(setKpis).catch(console.error);
  }, []);

  if (!kpis) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-200/70 rounded-2xl"></div>
      ))}
    </div>
  );

  const kpiData = [
    { label: 'Total Disbursed This Week', value: `₹${kpis.total_claims_paid.toLocaleString()}`, caption: 'Across 6 zones' },
    { label: 'Active Policies', value: kpis.active_policies.toLocaleString(), caption: 'Coverage active' },
    { label: 'Average Payout', value: `₹${Math.round(kpis.total_claims_paid / Math.max(kpis.active_policies, 1)).toLocaleString()}`, caption: 'Per claim this week' },
    { label: 'Loss Ratio', value: kpis.system_loss_ratio.toFixed(2), caption: 'Payouts ÷ Premiums' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {kpiData.map((item, idx) => (
        <div key={idx} className="bg-[#111827] p-5 rounded-2xl shadow-[0_16px_32px_rgba(8,12,24,0.35)] border border-white/5 min-h-[96px]">
          <p className="text-slate-400 text-[9px] font-semibold uppercase tracking-[0.22em] mb-2">{item.label}</p>
          <h3 className="text-white text-2xl font-semibold tracking-tight">{item.value}</h3>
          <p className="text-[11px] text-slate-400 mt-2">{item.caption}</p>
        </div>
      ))}
    </div>
  );
}
