'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { fetchFraudQueue, overrideClaimDecision, FraudQueueItem } from '@/lib/admin/adminClient';

// ─── Local helpers ─────────────────────────────────────────────────────────────
function normalizePathLabel(path: string | null | undefined, flags: string[] | undefined, fraudScore: number | null | undefined): string {
  const normalized = (path || '').toLowerCase();
  if (normalized === 'fast_track') return 'Fast Track';
  if (normalized === 'soft_queue') return 'Soft Queue';
  if (normalized === 'active_verify') return 'Active Verify';
  if (normalized === 'deny') return 'Denied';
  if ((flags?.length ?? 0) === 0) return 'Fast Track';
  if ((fraudScore ?? 0) > 70) return 'Active Verify';
  return 'Soft Queue';
}

function formatDciScore(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--';
  return value.toFixed(2);
}

function formatFraudScore(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--';
  return Math.round(value).toString().padStart(2, '0');
}

// ─── Decision display config ──────────────────────────────────────────────────
const DECISION_CONFIG = {
  APPROVE: {
    label: 'APPROVE',
    bg:     'rgba(22,163,74,0.1)',
    border: 'rgba(22,163,74,0.3)',
    text:   '#16A34A',
    dot:    '#22C55E',
  },
  REVIEW: {
    label: 'REVIEW',
    bg:     'rgba(217,119,6,0.1)',
    border: 'rgba(217,119,6,0.3)',
    text:   '#D97706',
    dot:    '#F59E0B',
  },
  DENY: {
    label: 'DENY',
    bg:     'rgba(220,38,38,0.1)',
    border: 'rgba(220,38,38,0.3)',
    text:   '#DC2626',
    dot:    '#EF4444',
  },
} as const;

const CONFIDENCE_LABELS: Record<string, string> = {
  HIGH:             'AI · High confidence',
  MEDIUM:           'AI · Medium confidence',
  MANUAL_OVERRIDE:  '👤 Manual override',
};

// ─── Demo rows: show even before backend responds ────────────────────────────
const DEMO_ROWS: FraudQueueItem[] = [
  {
    claim_id: 'CL-9902', created_at: '2026-04-05T10:12:00Z', worker_name: 'Rajesh Kumar',
    city: 'MH-E12', status: 'paid', resolution_path: 'fast_track',
    fraud_score: 4, dci_score: 0.72, payout: 450.00, flags: [],
    decision: 'APPROVE', decision_reason: 'Score 4/100 within acceptable bounds. Behavior consistent with legitimate patterns.', decision_confidence: 'HIGH',
  },
  {
    claim_id: 'CL-9903', created_at: '2026-04-05T10:18:00Z', worker_name: 'Ananya S.',
    city: 'KA-B08', status: 'pending', resolution_path: 'soft_queue',
    fraud_score: 18, dci_score: 0.58, payout: 0.00, flags: ['soft_queue'],
    decision: 'APPROVE', decision_reason: 'Score 18/100 within acceptable bounds. Low anomaly signals.', decision_confidence: 'HIGH',
  },
  {
    claim_id: 'CL-9904', created_at: '2026-04-05T10:22:00Z', worker_name: 'Vikram Singh',
    city: 'DL-S14', status: 'verifying', resolution_path: 'active_verify',
    fraud_score: 62, dci_score: 0.81, payout: 0.00, flags: ['active_verify'],
    decision: 'REVIEW', decision_reason: 'Score 62/100 exceeds REVIEW threshold. Suspicious behavioral deviations detected. Manual verification required.', decision_confidence: 'MEDIUM',
  },
  {
    claim_id: 'CL-9905', created_at: '2026-04-05T10:28:00Z', worker_name: 'Priya Dash',
    city: 'TS-W21', status: 'denied', resolution_path: 'soft_queue',
    fraud_score: 88, dci_score: 0.92, payout: 0.00, flags: ['STATIC_DEVICE_FLAG', 'GATE2_NONE'],
    decision: 'DENY', decision_reason: 'Score 88/100 exceeds DENY threshold. Strong anomaly signals: zone spoofing and network ring membership confirmed.', decision_confidence: 'HIGH',
  },
  {
    claim_id: 'CL-9906', created_at: '2026-04-05T10:30:00Z', worker_name: 'Arjun Mehra',
    city: 'MH-E12', status: 'paid', resolution_path: 'fast_track',
    fraud_score: 2, dci_score: 0.34, payout: 320.50, flags: [],
    decision: 'APPROVE', decision_reason: 'Score 2/100 within acceptable bounds. Auto-approve authorized.', decision_confidence: 'HIGH',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function FraudQueue() {
  const [queue,        setQueue]        = useState<FraudQueueItem[]>([]);
  const [filter,       setFilter]       = useState<'ALL' | 'APPROVE' | 'REVIEW' | 'DENY'>('ALL');
  const [expandedRow,  setExpandedRow]  = useState<string | null>(null);
  const [overriding,   setOverriding]   = useState<string | null>(null);
  const [overrideMsg,  setOverrideMsg]  = useState<string | null>(null);
  // Learning intelligence stats (derived from queue + override history)
  const [totalOverrides,   setTotalOverrides]   = useState(0);
  const [isAdaptiveMode,   setIsAdaptiveMode]   = useState(false);
  const [sampleCount,      setSampleCount]      = useState(0);
  const [correctionIds,    setCorrectionIds]    = useState<Set<string>>(new Set());


  useEffect(() => {
    fetchFraudQueue().then(setQueue).catch(console.error);
  }, []);

  const baseRows  = queue.length > 0 ? queue.slice(0, 10) : DEMO_ROWS;
  const rows      = filter === 'ALL' ? baseRows : baseRows.filter(r => r.decision === filter);

  // ── Override handler ───────────────────────────────────────────────────────
  const handleOverride = useCallback(async (item: FraudQueueItem, action: 'APPROVE' | 'DENY') => {
    setOverriding(item.claim_id);
    setOverrideMsg(null);
    try {
      const result = await overrideClaimDecision(item.claim_id, action);
      const wasCorrection = (result as { was_correction?: boolean }).was_correction ?? (item.decision !== action);

      // Optimistic update: flip row decision + confidence
      const updater = (r: FraudQueueItem) => r.claim_id !== item.claim_id ? r : {
        ...r,
        decision:            action,
        decision_reason:     `Manual override by admin: ${action}.`,
        decision_confidence: 'MANUAL_OVERRIDE' as const,
      };
      setQueue(prev => prev.map(updater));

      // Track learning stats
      setTotalOverrides(t => t + 1);
      setSampleCount(s => s + 1);
      if (wasCorrection) {
        setCorrectionIds(prev => new Set(prev).add(item.claim_id));
      }
      // After 5+ samples the engine is in adaptive mode
      setSampleCount(s => { setIsAdaptiveMode(s >= 5); return s; });

      setOverrideMsg(`${item.claim_id} → ${action}${wasCorrection ? ' · AI corrected' : ''}`);
    } catch {
      setOverrideMsg('Override failed (backend unavailable in preview)');
    } finally {
      setOverriding(null);
      setTimeout(() => setOverrideMsg(null), 3500);
    }
  }, []);

  // ── Summary counts ─────────────────────────────────────────────────────────
  const counts = baseRows.reduce(
    (acc, r) => {
      if (r.decision === 'APPROVE') acc.approve++;
      else if (r.decision === 'REVIEW') acc.review++;
      else if (r.decision === 'DENY')   acc.deny++;
      return acc;
    },
    { approve: 0, review: 0, deny: 0 },
  );

  const accuracy = baseRows.length > 0
    ? Math.max(0, Math.round((1 - totalOverrides / baseRows.length) * 100))
    : 100;

  return (
    <div className="bg-white rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.08)] border border-slate-100 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] flex items-center gap-2">
              Claims Decision Pipeline
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white tracking-wider">
                AI-POWERED
              </span>
              {/* Adaptive / Baseline learning mode badge */}
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: isAdaptiveMode ? 'rgba(139,92,246,0.1)' : 'rgba(100,116,139,0.08)',
                  color: isAdaptiveMode ? '#7C3AED' : '#64748B',
                  border: `1px solid ${isAdaptiveMode ? 'rgba(139,92,246,0.25)' : 'rgba(100,116,139,0.15)'}`,
                }}
              >
                {isAdaptiveMode ? '🧠 Adaptive AI' : '🧠 Baseline AI'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Autonomous fraud verdicts · Admin override trains the model
            </p>
          </div>

          {/* Learning intelligence stats strip */}
        <div className="mt-3 flex items-center gap-4 px-0.5">
          {[
            { label: 'AI Accuracy',    value: `${accuracy}%`,      color: accuracy > 80 ? '#16A34A' : '#D97706' },
            { label: 'Override Rate',  value: `${totalOverrides > 0 ? Math.round(totalOverrides / Math.max(baseRows.length,1) * 100) : 0}%`, color: '#64748B' },
            { label: 'Learning Mode',  value: isAdaptiveMode ? 'Adaptive' : 'Baseline', color: isAdaptiveMode ? '#7C3AED' : '#64748B' },
            { label: 'Training Data',  value: `${sampleCount} samples`, color: '#64748B' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-[9px] font-semibold tracking-widest uppercase text-slate-400">{label}</span>
              <span className="text-[11px] font-black" style={{ color }}>{value}</span>
            </div>
          ))}
          {isAdaptiveMode && (
            <span className="ml-auto text-[10px] text-purple-500 font-semibold animate-pulse">
              ↑ Thresholds adapting from feedback
            </span>
          )}
        </div>

        {/* Override toast */}
          {overrideMsg && (
            <div
              className="text-[11px] font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(15,23,42,0.07)', color: '#0F172A' }}
            >
              ✓ {overrideMsg}
            </div>
          )}
        </div>

        {/* Decision summary + filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { key: 'ALL',     label: 'All Claims', count: baseRows.length },
            { key: 'APPROVE', label: 'Approved',   count: counts.approve },
            { key: 'REVIEW',  label: 'Review',     count: counts.review },
            { key: 'DENY',    label: 'Denied',     count: counts.deny },
          ] as const).map(({ key, label, count }) => {
            const active = filter === key;
            const cfg    = key !== 'ALL' ? DECISION_CONFIG[key] : null;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150"
                style={{
                  background: active ? (cfg?.bg ?? 'rgba(15,23,42,0.07)') : 'transparent',
                  color:      active ? (cfg?.text ?? '#0F172A') : '#64748B',
                  border:     `1px solid ${active ? (cfg?.border ?? 'rgba(15,23,42,0.15)') : 'transparent'}`,
                }}
              >
                {cfg && <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />}
                {label}
                <span className="font-bold ml-0.5 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {['Claim', 'Worker', 'Zone', 'DCI', 'Fraud', 'AI Decision', 'Confidence', 'Payout', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-[9px] font-semibold text-slate-500 uppercase tracking-[0.18em] whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((item) => {
              const dec    = item.decision ?? 'REVIEW';
              const cfg    = DECISION_CONFIG[dec as keyof typeof DECISION_CONFIG] ?? DECISION_CONFIG.REVIEW;
              const isOpen = expandedRow === item.claim_id;
              const busy   = overriding === item.claim_id;

              let fraudColor = '#10B981';
              if ((item.fraud_score ?? 0) > 74) fraudColor = '#EF4444';
              else if ((item.fraud_score ?? 0) > 44) fraudColor = '#F59E0B';

              return (
                <React.Fragment key={item.claim_id}>
                  <tr
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setExpandedRow(isOpen ? null : item.claim_id)}
                  >
                    {/* Claim ID */}
                    <td className="px-4 py-3 text-sm font-bold text-slate-900 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full inline-block" style={{ background: cfg.dot }} />
                        {item.claim_id}
                      </span>
                    </td>

                    {/* Worker */}
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{item.worker_name}</td>

                    {/* Zone */}
                    <td className="px-4 py-3 text-sm text-slate-500">{item.city}</td>

                    {/* DCI */}
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 text-center">
                      {formatDciScore(item.dci_score)}
                    </td>

                    {/* Fraud score */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-black" style={{ color: fraudColor }}>
                        {formatFraudScore(item.fraud_score)}
                      </span>
                    </td>

                    {/* AI Decision badge */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold"
                          style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                          {cfg.label}
                        </span>
                        {/* Show correction hint when admin overrode this claim */}
                        {(item.decision_confidence === 'MANUAL_OVERRIDE' || correctionIds.has(item.claim_id)) && (
                          <span className="text-[9px] text-red-400 font-semibold">⚠ Admin corrected</span>
                        )}
                      </div>
                    </td>

                    {/* Confidence */}
                    <td className="px-4 py-3 text-[10px] text-slate-400 whitespace-nowrap">
                      {CONFIDENCE_LABELS[item.decision_confidence ?? 'HIGH'] ?? '—'}
                    </td>

                    {/* Payout */}
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                      ₹{Math.round(item.payout ?? 0).toLocaleString()}
                    </td>

                    {/* Override actions */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={busy || dec === 'APPROVE'}
                          onClick={() => handleOverride(item, 'APPROVE')}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ background: 'rgba(22,163,74,0.1)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.25)' }}
                          onMouseEnter={e => { if (!busy && dec !== 'APPROVE') (e.currentTarget as HTMLElement).style.background = 'rgba(22,163,74,0.2)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(22,163,74,0.1)'; }}
                        >
                          {busy ? '…' : '✓ Approve'}
                        </button>
                        <button
                          disabled={busy || dec === 'DENY'}
                          onClick={() => handleOverride(item, 'DENY')}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.2)' }}
                          onMouseEnter={e => { if (!busy && dec !== 'DENY') (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.18)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.08)'; }}
                        >
                          {busy ? '…' : '✕ Deny'}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expandable AI reason + XAI breakdown row */}
                  {isOpen && (
                    <tr key={`${item.claim_id}-reason`} className="bg-slate-50/60">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[13px] font-black mt-0.5"
                            style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
                          >
                            {dec === 'APPROVE' ? '✓' : dec === 'DENY' ? '✕' : '⚑'}
                          </div>
                          <div className="flex-1 min-w-0 space-y-3">
                            <div>
                              <p className="text-[11px] font-bold mb-0.5 text-[#0F172A]">
                                🧠 AI Reasoning — {CONFIDENCE_LABELS[item.decision_confidence ?? 'HIGH']}
                              </p>
                              <p className="text-[12px] leading-relaxed text-slate-600">
                                {item.decision_reason ?? 'No AI reasoning available.'}
                              </p>
                            </div>

                            {/* XAI Feature Breakdown */}
                            {item.fraud_breakdown && Object.keys(item.fraud_breakdown).length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-2">
                                  📊 Risk Factor Breakdown
                                </p>
                                <div className="space-y-1.5">
                                  {Object.entries(item.fraud_breakdown)
                                    .sort(([, a], [, b]) => (b as number) - (a as number))
                                    .map(([key, val]) => {
                                      const v = Number(val);
                                      const barColor = v > 30 ? '#EF4444' : v > 10 ? '#F59E0B' : '#10B981';
                                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                      return (
                                        <div key={key} className="flex items-center gap-2">
                                          <span className="text-[10px] text-slate-500 w-44 flex-shrink-0 truncate">{label}</span>
                                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                              className="h-full rounded-full transition-all duration-500"
                                              style={{ width: `${Math.min(v, 100)}%`, background: barColor }}
                                            />
                                          </div>
                                          <span className="text-[10px] font-semibold w-8 text-right" style={{ color: barColor }}>
                                            {v.toFixed(0)}
                                          </span>
                                        </div>
                                      );
                                    })}
                                </div>
                                {item.fraud_top_reason && item.fraud_top_reason !== 'none' && (
                                  <div
                                    className="mt-3 px-3 py-2 rounded-lg flex items-center gap-2"
                                    style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)' }}
                                  >
                                    <span className="text-[13px]">🚨</span>
                                    <div>
                                      <span className="text-[9px] font-bold tracking-widest uppercase text-red-400">Primary Risk Factor</span>
                                      <p className="text-[12px] font-bold text-red-600">
                                        {item.fraud_top_reason.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Active flags */}
                            {item.flags && item.flags.length > 0 && item.flags[0] !== 'none' && (
                              <div className="flex flex-wrap gap-1.5">
                                {item.flags.map(flag => (
                                  <span
                                    key={flag}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(220,38,38,0.08)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.15)' }}
                                  >
                                    {flag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-[10px] text-slate-400">
          Click a row to see AI reasoning · Override buttons bypass AI decision
        </p>
        <p className="text-[10px] font-semibold text-slate-400">
          {rows.length} claim{rows.length !== 1 ? 's' : ''} shown
        </p>
      </div>
    </div>
  );
}