'use client';

import { useEffect, useState } from 'react';
import { fetchFraudQueue, FraudQueueItem } from '@/lib/admin/adminClient';

export default function FraudMonitorPage() {
  const [fraudLogs, setFraudLogs] = useState<FraudQueueItem[]>([]);

  useEffect(() => {
    fetchFraudQueue().then(setFraudLogs).catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      {/* Title Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-on-background">Fraud Monitor</h2>
          <p className="text-on-surface-variant mt-1">Real-time risk assessment and parametric integrity analysis.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-surface-container-low text-on-surface text-sm font-semibold rounded-lg hover:bg-surface-container-high transition-colors">Export Report</button>
          <button className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg">Trigger Manual Audit</button>
        </div>
      </div>

      {/* Top Row: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#131B2E] p-6 rounded-xl shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Avg Fraud Score</p>
            <h3 className="text-white text-4xl font-bold">14.2<span className="text-sm font-normal text-slate-500 ml-1">/100</span></h3>
            <div className="mt-4 flex items-center gap-1 text-secondary text-xs font-bold">
              <span className="material-symbols-outlined text-sm">trending_down</span>
              <span>2.4% vs last 24h</span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-8xl">security</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider mb-2">Mock Locations (24h)</p>
          <h3 className="text-on-surface text-4xl font-bold">412</h3>
          <div className="mt-4 flex items-center gap-1 text-error text-xs font-bold">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>18% increase</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider mb-2">Velocity Violations</p>
          <h3 className="text-on-surface text-4xl font-bold">28</h3>
          <div className="mt-4 flex items-center gap-1 text-on-tertiary-container text-xs font-bold">
            <span className="material-symbols-outlined text-sm">bolt</span>
            <span>Stable baseline</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-on-surface-variant text-xs font-medium uppercase tracking-wider mb-2">Blacklisted Devices</p>
          <h3 className="text-on-surface text-4xl font-bold">1,094</h3>
          <div className="mt-4 flex items-center gap-1 text-secondary text-xs font-bold">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>Auto-blocked</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Analysis & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fraud Signal Breakdown */}
        <div className="lg:col-span-2 bg-surface-container-low p-8 rounded-xl">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-bold text-on-surface">Fraud Signal Breakdown</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-on-tertiary-container rounded-sm"></span>
                <span className="text-xs font-medium text-on-surface-variant">Anomalous</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-secondary-fixed-dim rounded-sm"></span>
                <span className="text-xs font-medium text-on-surface-variant">Baseline</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-tighter text-on-surface">STATIC_DEVICE_FLAG</span>
                <span className="text-xs font-medium text-on-surface-variant">84% Density</span>
              </div>
              <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden flex">
                <div className="h-full bg-on-tertiary-container" style={{ width: '84%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-tighter text-on-surface">MODEL_CONCENTRATION</span>
                <span className="text-xs font-medium text-on-surface-variant">62% Density</span>
              </div>
              <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden flex">
                <div className="h-full bg-on-tertiary-container" style={{ width: '62%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-tighter text-on-surface">HEX_JUMPING_VELOCITY</span>
                <span className="text-xs font-medium text-on-surface-variant">41% Density</span>
              </div>
              <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden flex">
                <div className="h-full bg-on-tertiary-container" style={{ width: '41%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-tighter text-on-surface">ROOT_KIT_DETECTION</span>
                <span className="text-xs font-medium text-on-surface-variant">12% Density</span>
              </div>
              <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden flex">
                <div className="h-full bg-on-tertiary-container" style={{ width: '12%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Fraud Stream */}
        <div className="bg-primary-container p-6 rounded-xl shadow-2xl flex flex-col h-full min-h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white">Live Fraud Stream</h4>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-3">
            <div className="p-2 bg-slate-800/50 rounded border-l-2 border-error">
              <p className="text-on-primary-container">14:22:01 <span className="text-white">FLAG_TRIGGERED</span></p>
              <p className="text-slate-400">UID: worker_9921 | ERR: MOCK_GPS</p>
            </div>
            <div className="p-2 bg-slate-800/30 rounded border-l-2 border-on-tertiary-container">
              <p className="text-on-primary-container">14:21:58 <span className="text-white">AUTH_ANOMALY</span></p>
              <p className="text-slate-400">IP: 192.168.1.1 | DEV: Rooted_Android</p>
            </div>
            <div className="p-2 bg-slate-800/30 rounded border-l-2 border-on-tertiary-container">
              <p className="text-on-primary-container">14:21:45 <span className="text-white">VELOCITY_VIOLATION</span></p>
              <p className="text-slate-400">UID: worker_1102 | JUMP: 45.2km/min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Watchlist Table */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-surface-container-high flex justify-between items-center">
          <h4 className="text-lg font-bold text-on-surface">High-Risk Worker Watchlist</h4>
          <button className="text-sm font-semibold text-on-tertiary-container hover:underline">View All Suspicious Accounts</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Worker ID</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Primary Violation</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Risk Level</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Fraud Score</th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fraudLogs.filter(f => f.fraud_score > 30).slice(0, 5).map((log) => (
                <tr key={log.claim_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4 text-sm font-bold font-mono">{log.worker_name} ({log.claim_id.split('-')[0]})</td>
                  <td className="px-8 py-4 text-sm text-slate-600">{log.flags.join(", ") || "Mock Location Data"}</td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-error-container text-error text-[10px] font-extrabold uppercase rounded-full">
                      Critical
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm text-error font-bold">{log.fraud_score} / 100</td>
                  <td className="px-8 py-4 text-right space-x-2">
                    <button className="text-xs font-bold text-error hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors">Flag</button>
                    <button className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-lg transition-colors">Investigate</button>
                  </td>
                </tr>
              ))}
              {fraudLogs.filter(f => f.fraud_score > 30).length === 0 && (
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4 text-sm font-bold font-mono">WK-9821-B</td>
                  <td className="px-8 py-4 text-sm text-slate-600">Mock Location Overflow</td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-error-container text-error text-[10px] font-extrabold uppercase rounded-full">
                      Critical
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm text-error font-bold">85 / 100</td>
                  <td className="px-8 py-4 text-right space-x-2">
                    <button className="text-xs font-bold text-error hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors">Flag</button>
                    <button className="text-xs font-bold bg-primary text-white px-3 py-1.5 rounded-lg transition-colors">Investigate</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
