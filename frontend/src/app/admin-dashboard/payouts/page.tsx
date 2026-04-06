'use client';

import { useEffect, useState } from 'react';
import {
  fetchPayoutSummary,
  fetchRecentPayouts,
  PayoutSummary,
  PayoutItem,
} from '@/lib/admin/adminClient';

export default function PayoutSummaryPage() {
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);

  useEffect(() => {
    fetchPayoutSummary().then(setSummary).catch(console.error);
    fetchRecentPayouts().then(setPayouts).catch(console.error);
  }, []);

  if (!summary) {
    return (
      <div className="p-8 grid grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payout Summary</h1>
        <p className="text-muted-foreground mt-2">
          Real-time disbursement analytics & financial tracking
        </p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card p-6 rounded-xl border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            TOTAL PAYOUTS
          </p>
          <h3 className="text-3xl font-bold text-foreground">
            ₹{summary.total_payouts.toLocaleString()}
          </h3>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            AVG PAYOUT
          </p>
          <h3 className="text-3xl font-bold text-foreground">
            ₹{Math.round(summary.avg_payout).toLocaleString()}
          </h3>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            SUCCESS RATE
          </p>
          <h3 className="text-3xl font-bold text-foreground">
            {summary.success_rate.toFixed(1)}%
          </h3>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            PENDING PAYOUTS
          </p>
          <h3 className="text-3xl font-bold text-foreground">
            ₹{summary.pending_amount.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* LOSS RATIO CARD (FROM OLD UI 🔥) */}
      <div className="bg-[#0F172A] rounded-2xl p-6 text-white shadow-lg border border-white/5">
        <h3 className="text-xs uppercase text-slate-400 mb-2">
          System Loss Ratio
        </h3>
        <p className="text-4xl font-bold">{(summary.total_payouts / 1000000).toFixed(2)}</p>
        <p className="text-xs text-slate-400 mt-2">
          Derived from payouts vs premiums
        </p>
      </div>

      {/* TABLE */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Recent Payouts
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background border-b border-border">
                <th className="px-6 py-4 text-xs uppercase text-muted-foreground">ID</th>
                <th className="px-6 py-4 text-xs uppercase text-muted-foreground">Worker</th>
                <th className="px-6 py-4 text-xs uppercase text-muted-foreground">Amount</th>
                <th className="px-6 py-4 text-xs uppercase text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-xs uppercase text-muted-foreground">Status</th>
              </tr>
            </thead>

            <tbody>
              {payouts.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-background">
                  <td className="px-6 py-4 font-semibold">{item.id}</td>
                  <td className="px-6 py-4">{item.worker_name}</td>
                  <td className="px-6 py-4 font-bold">
                    ₹{item.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {payouts.length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No payout records found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}