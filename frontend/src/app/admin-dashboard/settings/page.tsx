'use client';

import { useEffect, useState } from 'react';
import { Copy, Settings as SettingsIcon, ShieldAlert, Key, Users, Activity, ChevronRight, Home } from 'lucide-react';
import { fetchKPIs, AdminKPIs } from '@/lib/admin/adminClient';

export default function Settings() {
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);

  const [criticalThreshold, setCriticalThreshold] = useState(12);
  const [alertThreshold, setAlertThreshold] = useState(5);
  const [payoutMode, setPayoutMode] = useState('instant');

  useEffect(() => {
    fetchKPIs().then(setKpis).catch(console.error);
  }, []);

  const lossRatio = kpis?.system_loss_ratio ?? 0.71;

  const systemHealth =
    lossRatio > 0.75 ? 'CRITICAL' : lossRatio > 0.65 ? 'WARNING' : 'STABLE';

  const cardStyle = {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid rgba(249,115,22,0.12)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 8px 24px rgba(249,115,22,0.05)',
  };

  return (
    <div className="p-7 space-y-7 max-w-[1400px] mx-auto">
      {/* HEADER */}
      <div>
        <nav className="flex items-center gap-1 text-[11px] text-stone-400 mb-3">
          <Home size={11} />
          <span className="mx-1">·</span>
          <span className="hover:text-orange-500 cursor-pointer transition-colors">Admin</span>
          <ChevronRight size={11} className="text-stone-300" />
          <span className="text-stone-700 font-semibold">System Orchestration</span>
        </nav>
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-3">
              <SettingsIcon className="text-stone-400" size={24} />
              System Orchestration
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Configure core logic, thresholds, and operational limits.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PLATFORM CONFIG */}
        <div className="lg:col-span-2 p-6" style={cardStyle}>
          <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
            <h2 className="text-[14px] font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <ShieldAlert size={16} className="text-orange-500" /> Platform Configuration
            </h2>
            <button
              onClick={() => {
                setCriticalThreshold(12);
                setAlertThreshold(5);
                setPayoutMode('instant');
              }}
              className="text-[11px] text-orange-600 font-black tracking-widest uppercase hover:underline"
            >
              Reset Defaults
            </button>
          </div>

          <div className="space-y-8">
            {/* DCI Thresholds */}
            <div>
              <label className="text-[10px] font-black tracking-[0.2em] uppercase text-stone-400 block mb-3">
                DCI Threshold Levels (%)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <p className="text-[11px] font-bold text-stone-600 mb-2">Critical Trigger</p>
                  <input
                    type="number"
                    value={criticalThreshold}
                    onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg bg-[#FAFAF8] font-mono text-stone-900 font-bold focus:outline-none focus:border-orange-400 focus:bg-white shadow-sm transition-colors"
                  />
                  <div className="absolute right-4 top-9 text-stone-400 text-xs font-mono">%</div>
                </div>

                <div className="relative">
                  <p className="text-[11px] font-bold text-stone-600 mb-2">Alert Threshold</p>
                  <input
                    type="number"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg bg-[#FAFAF8] font-mono text-stone-900 font-bold focus:outline-none focus:border-orange-400 focus:bg-white shadow-sm transition-colors"
                  />
                  <div className="absolute right-4 top-9 text-stone-400 text-xs font-mono">%</div>
                </div>
              </div>

              {/* SYSTEM FEEDBACK */}
              <div className="mt-4 text-[11px] text-stone-500 font-semibold bg-stone-50 border border-stone-100 p-2.5 rounded-lg flex items-center gap-2">
                Current system loss ratio: <span className="font-black text-stone-800 font-mono text-xs">{lossRatio.toFixed(2)}</span>
                <span className="text-stone-300">|</span>
                Status: 
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                  systemHealth === 'CRITICAL' ? 'bg-red-50 text-red-600 border border-red-100' :
                  systemHealth === 'WARNING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                  'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {systemHealth}
                </span>
              </div>
            </div>

            {/* Payout Mode */}
            <div>
              <label className="text-[10px] font-black tracking-[0.2em] uppercase text-stone-400 block mb-3">
                Payout Timing
              </label>

              <div className="space-y-3">
                {[
                  { id: 'instant', label: 'Instant Settlement', desc: 'Real-time ledger updates' },
                  { id: 'batch', label: 'Batch Processing', desc: 'EOD execution block' },
                  { id: 'manual', label: 'Verification Queue', desc: 'Requires admin signature' },
                ].map((opt) => (
                  <label key={opt.id} className="flex flex-row items-start gap-4 cursor-pointer p-4 rounded-xl border border-stone-100 hover:border-orange-200 hover:bg-orange-50/20 transition-colors w-full sm:w-2/3">
                    <div className="pt-0.5">
                      <input
                        type="radio"
                        name="payout"
                        className="w-4 h-4 text-orange-500 border-stone-300 focus:ring-orange-500 bg-white"
                        checked={payoutMode === opt.id}
                        onChange={() => setPayoutMode(opt.id)}
                      />
                    </div>
                    <div>
                      <span className="text-[13px] font-bold text-stone-900 block">{opt.label}</span>
                      <span className="text-[11px] font-semibold text-stone-500">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                alert('Configuration applied successfully.');
              }}
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold tracking-wide shadow-md transition-colors w-full sm:w-auto"
            >
              Apply Configurations
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* API KEYS */}
          <div className="bg-gradient-to-br from-[#1c1917] to-[#292524] p-6 rounded-2xl relative overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Key size={64} />
            </div>
            <h2 className="text-[14px] font-bold text-white tracking-tight flex items-center gap-2 mb-6">
              <Key size={16} className="text-orange-400" /> API Access
            </h2>

            <div className="space-y-5">
              <div>
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2">Production Key</p>
                <div className="bg-[#120F0D] border border-[#3E3A36] p-3 rounded-lg flex items-center justify-between group">
                  <code className="text-[11px] text-emerald-400 font-mono tracking-wider font-bold">
                    kl_live_94...xBz
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText('kl_live_9428..._xBz')}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#2A2622] rounded"
                  >
                    <Copy size={12} className="text-stone-400" />
                  </button>
                </div>
              </div>

              <button className="w-full px-4 py-2 bg-[#2A2622] text-stone-200 border border-[#3E3A36] rounded-lg text-xs font-bold hover:bg-[#3E3A36] transition-colors">
                Rotate Secret Key
              </button>
            </div>
          </div>

          {/* SYSTEM HEALTH */}
          <div className="p-6" style={cardStyle}>
            <h2 className="text-[14px] font-bold text-stone-900 tracking-tight flex items-center gap-2 mb-4">
              <Activity size={16} className="text-emerald-500" /> Metrics Overview
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-stone-50 text-xs">
                <span className="font-semibold text-stone-500">Loss Ratio</span>
                <span className="font-black text-stone-900 font-mono">{lossRatio.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stone-50 text-xs">
                <span className="font-semibold text-stone-500">Health</span>
                <span className={`font-black uppercase tracking-wider ${
                  systemHealth === 'CRITICAL' ? 'text-red-500' :
                  systemHealth === 'WARNING' ? 'text-amber-500' :
                  'text-emerald-500'
                }`}>
                  {systemHealth}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 text-xs">
                <span className="font-semibold text-stone-500">Throughput</span>
                <span className="font-black text-stone-900 font-mono">~2.4k txn/s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* USER MANAGEMENT */}
      <div className="p-6" style={cardStyle}>
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
          <h2 className="text-[14px] font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Users size={16} className="text-orange-500" /> User Management
          </h2>
          <button className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-stone-200 transition-colors">
            + Invite
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Admin Member</th>
                <th className="py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Role</th>
                <th className="py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-stone-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Julian Draxler', role: 'Architecture Lead', isCrit: true },
                { name: 'Sarah Chen', role: 'Risk Engine', isCrit: false },
              ].map((u, i) => (
                <tr key={i} className="border-b border-stone-50 hover:bg-orange-50/20 transition-colors">
                  <td className="py-4 font-bold text-[13px] text-stone-800">{u.name}</td>
                  <td className="py-4 text-[12px] font-semibold text-stone-500">{u.role}</td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[9px] font-black rounded-md border tracking-wider ${
                      u.isCrit ? 'bg-violet-50 text-violet-600 border-violet-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${u.isCrit ? 'bg-violet-500': 'bg-emerald-500'}`} />
                      ACTIVE
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}