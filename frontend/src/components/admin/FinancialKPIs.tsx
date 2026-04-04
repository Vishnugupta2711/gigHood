'use client';

import { useEffect, useState } from 'react';
import { fetchKPIs, AdminKPIs } from '@/lib/admin/adminClient';

export default function FinancialKPIs() {
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);

  useEffect(() => {
    fetchKPIs().then(setKpis).catch(console.error);
  }, []);

  if (!kpis) return <div className="text-sm p-4">Loading KPIs...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Primary Hero Card */}
      <div className="bg-[#0F172A] text-white rounded-xl p-6 shadow-sm">
        <div className="text-sm font-medium opacity-80 mb-2">Active Policies</div>
        <div className="text-3xl font-bold">{kpis.active_policies.toLocaleString()}</div>
      </div>
      
      {/* Secondary Cards */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-sm font-medium text-gray-500 mb-2">Total Premium</div>
        <div className="text-3xl font-bold text-gray-900">₹{kpis.total_premium.toLocaleString()}</div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-sm font-medium text-gray-500 mb-2">Claims Paid</div>
        <div className="text-3xl font-bold text-gray-900">₹{kpis.total_claims_paid.toLocaleString()}</div>
      </div>
      
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-sm font-medium text-gray-500 mb-2">System Loss Ratio</div>
        <div className={`text-3xl font-bold ${kpis.system_loss_ratio > 100 ? 'text-[#EF4444]' : kpis.system_loss_ratio > 80 ? 'text-[#F59E0B]' : 'text-[#22C55E]'}`}>
          {kpis.system_loss_ratio}%
        </div>
      </div>
    </div>
  );
}
