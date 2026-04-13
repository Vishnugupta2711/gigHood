'use client';

import { useEffect, useState } from 'react';
import { Download, ShieldCheck, Activity, ChevronRight, Home, ChevronDown } from 'lucide-react';
import { fetchFraudQueue, FraudQueueItem } from '@/lib/admin/adminClient';

function normalizePath(path: string | null | undefined): 'FAST TRACK' | 'SOFT QUEUE' | 'ACTIVE VERIFY' {
  const normalized = (path || '').toLowerCase();
  if (normalized === 'fast_track') return 'FAST TRACK';
  if (normalized === 'soft_queue') return 'SOFT QUEUE';
  return 'ACTIVE VERIFY';
}

function formatScore(value: number | null | undefined, digits = 0): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return digits > 0 ? value.toFixed(digits) : String(Math.round(value)).padStart(2, '0');
}

export default function Claims() {
  const [claimsData, setClaimsData] = useState<FraudQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<FraudQueueItem | null>(null);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [pathFilter, setPathFilter] = useState('All Paths');

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchFraudQueue();
        setClaimsData(data);
        if (data.length) setSelectedClaim(prev => prev ?? data[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const getFraudColor = (score: number) => {
    if (score < 20) return '#10b981'; // emerald
    if (score < 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getPathConfig = (path: string | null) => {
    const normalized = normalizePath(path);
    if (normalized === 'FAST TRACK') return { color: '#10b981', label: 'FAST TRACK', barWidth: '100%', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700' };
    if (normalized === 'SOFT QUEUE') return { color: '#f97316', label: 'SOFT QUEUE', barWidth: '60%',  bg: 'bg-orange-50 border-orange-200 text-orange-700' };
    return { color: '#ef4444', label: 'ACTIVE VERIFY', barWidth: '30%', bg: 'bg-red-50 border-red-200 text-red-700' };
  };

  const isSafe = (claim: FraudQueueItem) => claim.fraud_score < 20;

  const handleExportCSV = () => { /* noop for brevity */ };

  const filteredData = claimsData.filter((c) => {
    const pathLabel = normalizePath(c.resolution_path);
    const statusLabel = c.fraud_score < 20 ? 'Verified Safe' : 'Under Review';
    const statusMatches = statusFilter === 'All Statuses' || statusLabel === statusFilter;
    const pathMatches = pathFilter === 'All Paths' || pathLabel === pathFilter;
    return statusMatches && pathMatches;
  });

  if (loading) {
    return (
      <div className="p-7 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_16px_rgba(249,115,22,0.3)]" />
      </div>
    );
  }

  const sel = selectedClaim;
  const pc = sel ? getPathConfig(sel.resolution_path) : null;

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
          <span className="text-stone-700 font-semibold">Claims Pipeline</span>
        </nav>
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-3">
              Parametric Claims Pipeline
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Real-time parametric validation flow for gig-economy payouts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { val: statusFilter, set: setStatusFilter, opts: ['All Statuses', 'Verified Safe', 'Under Review'] },
              { val: pathFilter, set: setPathFilter, opts: ['All Paths', 'FAST TRACK', 'SOFT QUEUE', 'ACTIVE VERIFY'] },
            ].map(({ val, set, opts }) => (
              <div key={val} className="relative">
                <select
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="appearance-none bg-white border border-stone-200 rounded-xl px-4 py-2 pr-8 text-xs font-semibold text-stone-700 cursor-pointer focus:outline-none focus:border-orange-300 shadow-sm"
                >
                  {opts.map((o) => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            ))}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors flex items-center gap-2 shadow-md"
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* TABLE */}
        <div className="lg:col-span-8 overflow-hidden" style={cardStyle}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-stone-100">
                  {['Claim ID', 'Worker', 'Zone', 'DCI', 'Fraud Score', 'Path', 'Payout'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[9px] font-black tracking-[0.2em] uppercase text-stone-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((claim) => {
                  const cpc = getPathConfig(claim.resolution_path);
                  const isSel = sel?.claim_id === claim.claim_id;
                  return (
                    <tr
                      key={claim.claim_id}
                      onClick={() => setSelectedClaim(claim)}
                      className={`cursor-pointer transition-colors border-b border-stone-50 ${isSel ? 'bg-orange-50/50' : 'hover:bg-stone-50'}`}
                    >
                      <td className="px-5 py-4 font-bold text-[12px] text-stone-900">{claim.claim_id}</td>
                      <td className="px-5 py-4 font-medium text-[13px] text-stone-700">{claim.worker_name}</td>
                      <td className="px-5 py-4 font-mono text-[11px] text-stone-500">{claim.city}</td>
                      <td className="px-5 py-4 font-black font-mono text-[13px] text-stone-800">{formatScore(claim.dci_score, 2)}</td>
                      <td className="px-5 py-4 font-black font-mono text-[14px]" style={{ color: getFraudColor(claim.fraud_score) }}>
                        {formatScore(claim.fraud_score)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border ${cpc.bg}`}>
                          {cpc.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-stone-800">
                        ₹{claim.payout ?? 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILS SIDEBAR */}
        {sel && pc && (
          <div className="lg:col-span-4 rounded-2xl flex flex-col pt-6 pb-2 px-6" style={{ background: 'linear-gradient(160deg, #1A1612 0%, #1F1A15 60%, #241E18 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Selected Claim</p>
                <p className="text-2xl font-black text-white tracking-tight">{sel.claim_id}</p>
              </div>
              {isSafe(sel) && (
                <div className="flex items-center gap-1.5 px-2 py-1 border border-emerald-500/30 bg-emerald-500/10 rounded-md text-[9px] font-black uppercase text-emerald-400">
                  <ShieldCheck size={12} /> Safe
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-stone-400 font-semibold">Pipeline Route</span>
                <span className="font-bold" style={{ color: pc.color }}>{pc.label}</span>
              </div>
              <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: pc.barWidth, background: pc.color, boxShadow: `0 0 10px ${pc.color}` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">DCI Score</p>
                <p className="text-3xl font-black text-white font-mono">{formatScore(sel.dci_score, 2)}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1.5">Fraud Risk</p>
                <p className="text-3xl font-black font-mono" style={{ color: getFraudColor(sel.fraud_score) }}>{formatScore(sel.fraud_score)}</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-3">
               <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Worker Meta</p>
               <div className="flex justify-between items-center text-[12px]">
                 <span className="text-stone-400">Name</span>
                 <span className="font-bold text-stone-200">{sel.worker_name}</span>
               </div>
               <div className="flex justify-between items-center text-[12px]">
                 <span className="text-stone-400">Zone</span>
                 <span className="font-bold text-stone-200 font-mono">{sel.city}</span>
               </div>
               <div className="flex justify-between items-center text-[12px]">
                 <span className="text-stone-400">Payout</span>
                 <span className="font-bold text-emerald-400 tabular-nums">₹{sel.payout ?? 0}</span>
               </div>
            </div>

            <div className="bg-[#120F0D] border border-orange-500/10 p-4 rounded-xl text-[11px] text-stone-400 leading-relaxed min-h-[90px] mb-4">
              <span className="text-orange-400 font-bold block mb-1 uppercase tracking-widest text-[9px]">Audit Log</span>
              {normalizePath(sel.resolution_path) === 'FAST TRACK' && `Verified DCI ${formatScore(sel.dci_score, 2)}. High spatial-temporal correlation found in Zone ${sel.city}. Payout executed.`}
              {normalizePath(sel.resolution_path) === 'SOFT QUEUE' && `Flagged DCI ${formatScore(sel.dci_score, 2)}. Fraud score ${formatScore(sel.fraud_score)} exceeds optimal threshold. Marked for review.`}
              {normalizePath(sel.resolution_path) === 'ACTIVE VERIFY' && `Critical intervention. Fraud score ${formatScore(sel.fraud_score)} elevated in ${sel.city}. Escalated to investigations.`}
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}