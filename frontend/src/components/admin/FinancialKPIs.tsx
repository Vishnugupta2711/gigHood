'use client';

import { useEffect, useState } from 'react';
import { fetchKPIs, AdminKPIs } from '@/lib/admin/adminClient';

export default function FinancialKPIs() {
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);

  useEffect(() => {
    fetchKPIs().then(setKpis).catch(console.error);
  }, []);

  if (!kpis) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>
      ))}
    </div>
  );

  const kpiData = [
    { label: 'Total Disbursed This Week', value: `₹${kpis.total_claims_paid.toLocaleString()}`, trend: '12% vs last week', icon: 'payments', trendUp: true, color: 'bg-[#131B2E]', trendIcon: 'trending_up' },
    { label: 'Active Policies', value: kpis.active_policies.toLocaleString(), trend: 'Across 6 zones', icon: 'verified_user', trendUp: true, color: 'bg-[#131B2E]', trendIcon: 'check_circle' },
    { label: 'Total Premium', value: `₹${kpis.total_premium.toLocaleString()}`, trend: 'Collected actively', icon: 'account_balance_wallet', trendUp: true, color: 'bg-[#131B2E]', trendIcon: 'payments' },
    { label: 'System Loss Ratio', value: kpis.system_loss_ratio.toFixed(1), trend: 'Payouts ÷ Premiums', icon: 'analytics', trendUp: false, color: 'bg-[#131B2E]', trendIcon: 'show_chart' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map((item, idx) => (
        <div key={idx} className={`${item.color} p-6 rounded-xl shadow-sm relative overflow-hidden group`}>
          <div className="relative z-10">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">{item.label}</p>
            <h3 className="text-white text-4xl font-black tracking-tight mb-2">{item.value}</h3>
            <div className="mt-4 flex items-center gap-1 text-secondary text-[10px] font-bold uppercase tracking-tighter">
               {item.trendIcon && <span className="material-symbols-outlined text-xs">{item.trendIcon}</span>}
               <span>{item.trend}</span>
            </div>
          </div>
          {/* Ghost Icon background element from Stitch design */}
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-all duration-500 pointer-events-none">
            <span className="material-symbols-outlined text-[100px] text-white select-none">{item.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
