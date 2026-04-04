'use client';

export default function PayoutSummaryPage() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Payout Summary &amp; Analytics</h1>
          <p className="text-on-surface-variant mt-1">Ledger reconciliation and financial velocity monitoring.</p>
        </div>
      </div>

      {/* Primary KPI Grid (Current Loss Ratio & Trends) */}
      <div className="grid grid-cols-12 gap-6">
        {/* Current Loss Ratio Card */}
        <div className="col-span-12 lg:col-span-4 bg-[#0F172A] rounded-xl p-8 text-white shadow-[0px_4px_30px_rgb(0,0,0,0.15)] relative flex flex-col justify-between overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-slate-400">Current System Loss Ratio</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-5xl font-extrabold text-white tracking-tight">0.71</p>
                  <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 uppercase tracking-wider italic">Safe Zone</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-500 bg-slate-800/50 p-2 rounded-lg">analytics</span>
            </div>
            <p className="text-xs text-slate-400 mt-6 leading-relaxed border-l-2 border-emerald-500/50 pl-3 italic">System healthy. Current loss ratio is within the operational threshold of 0.75 for the fiscal quarter.</p>
          </div>
          
          {/* Animated Gauge visual */}
          <div className="relative mt-8 flex flex-col items-center justify-center">
            <div className="relative w-64 h-32 overflow-hidden">
              <div className="absolute inset-0 bg-slate-800/30 rounded-t-full backdrop-blur-sm border border-white/5"></div>
              <svg className="w-full h-full transform transition-all duration-1000 ease-out" viewBox="0 0 100 50">
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#10b981"></stop>
                    <stop offset="75%" stopColor="#f59e0b"></stop>
                    <stop offset="100%" stopColor="#ef4444"></stop>
                  </linearGradient>
                </defs>
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeLinecap="round" strokeWidth="10"></path>
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#gaugeGrad)" strokeDasharray="125.6" strokeDashoffset="36.4" strokeLinecap="round" strokeWidth="10"></path>
              </svg>
              <div className="absolute bottom-0 left-1/2 w-1 h-24 bg-white origin-bottom -translate-x-1/2 rotate-[54deg] shadow-lg rounded-full"></div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-2 border-white rounded-full z-20"></div>
            </div>
            <div className="flex justify-between w-64 px-1 mt-3">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Stable</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Critical</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payout Trends Chart Placeholder */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Payout Ledger Trends</h3>
              <p className="text-sm text-on-surface-variant">Monthly premiums collected vs. payouts triggered</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Premiums</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ac59fb]"></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Payouts</span>
              </div>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-2 mt-4">
            {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'].map((month, idx) => {
              const premiumH = [32, 28, 36, 40, 32, 20][idx];
              const payoutH = [12, 16, 24, 32, 28, 44][idx];
              return (
                <div key={month} className="flex-1 flex flex-col justify-end gap-1 group">
                  <div className={`w-full ${idx === 5 ? 'bg-[#ac59fb]' : 'bg-[#ac59fb]/30'} rounded-t-sm transition-all`} style={{ height: `${payoutH}%` }}></div>
                  <div className={`w-full ${idx === 5 ? 'bg-primary' : 'bg-primary/30'} rounded-t-sm transition-all`} style={{ height: `${premiumH}%` }}></div>
                  <span className={`text-[10px] ${idx === 5 ? 'font-bold text-on-surface' : 'text-on-surface-variant'} mt-2 text-center`}>{month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Payouts Table */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 flex justify-between items-center bg-surface-container-low border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            <h2 className="text-xl font-bold text-on-surface">Recent Ledger Payouts</h2>
          </div>
          <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            View All
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low/30">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Transaction ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Worker Account</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Method</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Parametric Trigger</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest border-t border-surface-container-highest">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">TX-948120</td>
                <td className="px-6 py-4"><div className="text-sm font-bold text-on-surface">Marcus Chen</div></td>
                <td className="px-6 py-4 text-sm font-bold text-on-surface">$1,450.00</td>
                <td className="px-6 py-4 text-xs text-on-surface-variant">Direct Deposit (••92)</td>
                <td className="px-6 py-4 text-xs text-on-surface-variant italic">Rain-Out Trigger &gt; 4hrs</td>
                <td className="px-6 py-4"><span className="px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-tight">Success</span></td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">TX-948119</td>
                <td className="px-6 py-4"><div className="text-sm font-bold text-on-surface">Sarah Williams</div></td>
                <td className="px-6 py-4 text-sm font-bold text-on-surface">$240.00</td>
                <td className="px-6 py-4 text-xs text-on-surface-variant">Stripe Connect</td>
                <td className="px-6 py-4 text-xs text-on-surface-variant italic">API Error &gt; 2hrs</td>
                <td className="px-6 py-4"><span className="px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-tight">Success</span></td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-on-surface-variant">TX-948118</td>
                <td className="px-6 py-4"><div className="text-sm font-bold text-on-surface">David Okafor</div></td>
                <td className="px-6 py-4 text-sm font-bold text-on-surface">$3,120.00</td>
                <td className="px-6 py-4 text-xs text-on-surface-variant">Instant Pay (Visa)</td>
                <td className="px-6 py-4 text-xs text-on-surface-variant italic">Platform Outage (Critical)</td>
                <td className="px-6 py-4"><span className="px-2 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-tight">Success</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
