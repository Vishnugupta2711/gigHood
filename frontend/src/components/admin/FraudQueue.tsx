'use client';

import { useEffect, useState } from 'react';
import { fetchFraudQueue, FraudQueueItem } from '@/lib/admin/adminClient';

export default function FraudQueue() {
  const [queue, setQueue] = useState<FraudQueueItem[]>([]);

  useEffect(() => {
    fetchFraudQueue().then(setQueue).catch(console.error);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-extrabold text-[#0F172A]">Claims Pipeline</h2>
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg overflow-x-auto no-scrollbar">
            <button className="px-3 py-1.5 text-xs font-bold bg-white text-primary rounded-md shadow-sm">All</button>
            <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-all whitespace-nowrap">Path 1 – Fast Track</button>
            <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-all whitespace-nowrap">Path 2 – Soft Queue</button>
            <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-primary transition-all whitespace-nowrap">Path 3 – Active Verify</button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Worker ID</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Zone</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Trigger DCI</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Fraud</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Path</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Payout</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {queue.map((item) => {
              const isPaid = item.status === 'paid';
              const isDenied = item.status === 'denied';
              const statusColors = isPaid ? 'bg-secondary-container/20 text-secondary' : 
                                   isDenied ? 'bg-error-container text-error' : 
                                   'bg-amber-100 text-amber-600';
              
              // Map fraud score to reference colors
              let fraudScoreColor = 'text-secondary';
              if (item.fraud_score > 70) fraudScoreColor = 'text-error';
              else if (item.fraud_score > 30) fraudScoreColor = 'text-amber-500';

              return (
                <tr key={item.claim_id} className="hover:bg-slate-50 transition-all cursor-pointer">
                  <td className="px-6 py-3.5 text-sm font-bold font-mono">W-{item.claim_id.split('-')[0].substring(0,5).toUpperCase()}</td>
                  <td className="px-6 py-3.5 text-xs text-slate-600 font-medium">
                    {item.worker_name.split(' ')[0]} / {item.city}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-mono text-center">0.88</td>
                  <td className={`px-6 py-3.5 text-sm font-mono text-center ${fraudScoreColor}`}>
                    {(item.fraud_score ?? 0).toString().padStart(2, '0')}
                  </td>
                  <td className="px-6 py-3.5 text-xs text-slate-600">
                    {(item.flags?.length ?? 0) === 0 ? "Fast Track" : (item.fraud_score > 70 ? "Active Verify" : "Soft Queue")}
                  </td>
                  <td className="px-6 py-3.5 text-sm font-bold">₹{((item.fraud_score ?? 0) * 17 + 300).toLocaleString()}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase whitespace-nowrap ${statusColors}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              )
            })}
            {queue.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">No items in queue</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
