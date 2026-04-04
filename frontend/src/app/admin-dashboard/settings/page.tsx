'use client';

export default function SettingsPage() {
  return (
    <>
      {/* Section Header */}
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-on-background">System Orchestration</h2>
        <p className="text-on-surface-variant max-w-2xl">Configure the core logic and operational thresholds for parametric risk distribution and ledger integrity.</p>
      </div>

      {/* Bento Grid Settings Layout */}
      <div className="grid grid-cols-12 gap-8">
        {/* Platform Configuration */}
        <section className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-xl p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-tertiary-container bg-tertiary-fixed p-2 rounded-lg">tune</span>
              <h3 className="text-lg font-bold">Platform Configuration</h3>
            </div>
            <button className="text-sm font-bold text-on-primary-container hover:text-primary transition-colors">Reset Defaults</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* DCI Thresholds */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">DCI Threshold Levels (%)</label>
              <div className="space-y-3">
                <div className="p-4 bg-surface-container-lowest rounded-lg flex items-center justify-between border border-outline-variant/10">
                  <span className="text-sm font-medium">Critical Trigger</span>
                  <input className="w-16 bg-surface-container-low border-none rounded p-1 text-center font-bold text-sm" type="number" defaultValue={12} />
                </div>
                <div className="p-4 bg-surface-container-lowest rounded-lg flex items-center justify-between border border-outline-variant/10">
                  <span className="text-sm font-medium">Alert Threshold</span>
                  <input className="w-16 bg-surface-container-low border-none rounded p-1 text-center font-bold text-sm" type="number" defaultValue={5} />
                </div>
              </div>
            </div>
            {/* Payout Timing */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Payout Timing</label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input defaultChecked className="text-primary focus:ring-primary h-4 w-4" name="payout" type="radio" />
                  <span className="text-sm">Instant Ledger Settlement (Real-time)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input className="text-primary focus:ring-primary h-4 w-4" name="payout" type="radio" />
                  <span className="text-sm">Batch Processing (EOD)</span>
                </div>
                <div className="flex items-center gap-2">
                  <input className="text-primary focus:ring-primary h-4 w-4" name="payout" type="radio" />
                  <span className="text-sm">Manual Verification Queue</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-outline-variant/10">
            <button className="bg-primary-container text-white font-bold py-3 px-8 rounded-lg text-sm active:scale-95 transition-transform shadow-lg shadow-primary-container/20">
              Apply Configurations
            </button>
          </div>
        </section>

        {/* API Keys & Security */}
        <section className="col-span-12 lg:col-span-4 space-y-8">
          <div className="bg-primary-container text-white rounded-xl p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary-fixed">key</span>
              <h3 className="text-lg font-bold">API Keys</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.1em] text-on-primary-container font-bold">Production Key</label>
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-3 group">
                  <code className="text-xs font-mono text-secondary-fixed-dim overflow-hidden whitespace-nowrap">kl_live_9428...x8z2</code>
                  <button className="ml-auto opacity-40 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
              </div>
              <button className="w-full py-2 text-sm font-bold border border-white/10 rounded-lg hover:bg-white/5 transition-colors">Rotate Secret Key</button>
            </div>
          </div>
          <div className="bg-white rounded-xl p-8 space-y-6 shadow-sm border border-slate-200/50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-tertiary-container">hub</span>
              <h3 className="text-lg font-bold">Webhooks</h3>
            </div>
            <p className="text-sm text-on-surface-variant">4 Active endpoints receiving ledger events.</p>
            <button className="text-primary text-sm font-bold flex items-center gap-2">
              Manage Endpoints <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* User Management */}
        <section className="col-span-12 bg-white rounded-xl p-8 space-y-6 shadow-sm border border-slate-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-tertiary-container">group</span>
              <h3 className="text-lg font-bold">User Management</h3>
            </div>
            <button className="bg-surface-container-high text-on-surface font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span> Invite Member
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Admin</th>
                  <th className="py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Access Level</th>
                  <th className="py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Last Active</th>
                  <th className="py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Status</th>
                  <th className="py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                <tr className="hover:bg-surface-container-low transition-colors group">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center font-bold text-xs text-on-tertiary-fixed">JD</div>
                      <div>
                        <p className="text-sm font-bold">Julian Draxler</p>
                        <p className="text-xs text-on-surface-variant">j.drax@kinetic.io</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm font-medium">Platform Admin</td>
                  <td className="py-4 text-sm text-on-surface-variant">2 mins ago</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-secondary-container/30 text-on-secondary-container text-[10px] font-bold rounded uppercase">Active</span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">more_vert</button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors group">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-xs text-on-primary-fixed">SC</div>
                      <div>
                        <p className="text-sm font-bold">Sarah Chen</p>
                        <p className="text-xs text-on-surface-variant">s.chen@kinetic.io</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-sm font-medium">Security Auditor</td>
                  <td className="py-4 text-sm text-on-surface-variant">14 hours ago</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-secondary-container/30 text-on-secondary-container text-[10px] font-bold rounded uppercase">Active</span>
                  </td>
                  <td className="py-4 text-right">
                    <button className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">more_vert</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Support Section */}
        <section className="col-span-12 grid grid-cols-12 gap-8 pt-8">
          {/* Tickets */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-tertiary-container">support_agent</span>
                <h3 className="text-lg font-bold">Support Operations</h3>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-xs font-bold bg-white rounded-lg border border-slate-200">Open Tickets (3)</button>
                <button className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface">Resolved</button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-6 bg-surface-container-low rounded-xl border-l-4 border-error space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold">Critical: Batch Ledger Failure #KL-9021</h4>
                    <p className="text-xs text-on-surface-variant">Reported by Sarah Chen • 45m ago</p>
                  </div>
                  <span className="px-2 py-1 bg-error-container text-on-error-container text-[10px] font-bold rounded">P0 CRITICAL</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center text-[8px] font-bold border-2 border-surface-container-low">SC</div>
                    <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-[8px] font-bold border-2 border-surface-container-low">JD</div>
                  </div>
                  <p className="text-xs font-medium text-on-surface-variant">In discussion: Resolving database lock contention.</p>
                </div>
              </div>
              <div className="p-6 bg-surface-container-low rounded-xl border-l-4 border-on-tertiary-container/30 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold">Parametric Drift Warning #KL-8994</h4>
                    <p className="text-xs text-on-surface-variant">Automated Alert • 2h ago</p>
                  </div>
                  <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold rounded">P2 MEDIUM</span>
                </div>
                <button className="text-xs font-bold text-on-tertiary-container hover:underline">View System Logs</button>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-tertiary-container">health_and_safety</span>
              <h3 className="text-lg font-bold">System Health</h3>
            </div>
            <div className="space-y-3">
              <div className="p-5 bg-white rounded-xl border border-slate-200/50 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant">API Latency</p>
                  <p className="text-xl font-bold">14ms</p>
                </div>
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div className="p-5 bg-white rounded-xl border border-slate-200/50 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant">Oracle Connectivity</p>
                  <p className="text-xl font-bold text-secondary">Operational</p>
                </div>
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div className="p-5 bg-white rounded-xl border border-slate-200/50 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-on-surface-variant">Ledger Throughput</p>
                  <p className="text-xl font-bold">2.4k txn/s</p>
                </div>
                <div className="flex gap-1 h-8 items-end">
                  <div className="w-1 bg-secondary rounded-full h-4"></div>
                  <div className="w-1 bg-secondary rounded-full h-6"></div>
                  <div className="w-1 bg-secondary rounded-full h-8"></div>
                  <div className="w-1 bg-secondary rounded-full h-5"></div>
                  <div className="w-1 bg-secondary rounded-full h-7"></div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-[#0F172A] rounded-xl text-white space-y-4">
              <h4 className="text-sm font-bold">Premium Support Tier</h4>
              <p className="text-xs text-slate-400">Your dedicated account manager is available for technical reviews every Tuesday.</p>
              <button className="w-full py-2 bg-slate-800 text-xs font-bold rounded-lg border border-white/5">Schedule Sync</button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
