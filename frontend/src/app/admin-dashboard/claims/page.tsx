'use client';

export default function ClaimsPipelinePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Page Sub-Header / Filters */}
      <section className="py-6 flex items-end justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">Claims Pipeline</h2>
          <p className="text-on-surface-variant text-sm mt-1">Real-time parametric validation flow for gig-economy payouts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Status</label>
            <select className="bg-surface-container-low border-none rounded-lg text-sm font-medium focus:ring-primary-fixed-dim pr-10">
              <option>All Statuses</option>
              <option>Paid</option>
              <option>Pending</option>
              <option>Verifying</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Path</label>
            <select className="bg-surface-container-low border-none rounded-lg text-sm font-medium focus:ring-primary-fixed-dim pr-10">
              <option>All Paths</option>
              <option>Fast Track</option>
              <option>Soft Queue</option>
              <option>Active Verify</option>
            </select>
          </div>
          <button className="h-10 px-4 bg-primary text-white text-sm font-semibold rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </button>
        </div>
      </section>

      {/* Main Content Layout (Table + Panel) */}
      <section className="flex-1 flex overflow-hidden pb-8 gap-6">
        {/* Claims Table */}
        <div className="flex-1 bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col border border-slate-200">
          <div className="overflow-x-auto overflow-y-auto no-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container-lowest z-10">
                <tr className="border-b border-surface-container-highest">
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Claim ID</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Worker</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Zone</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">DCI Trigger</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Fraud Score</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Path</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Payout</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-highest/50">
                <tr className="bg-surface-container-low/40 hover:bg-surface-container-high transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm font-semibold font-mono">CL-9902</td>
                  <td className="px-4 py-3 text-sm font-medium">Rajesh Kumar</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">MH-E12</td>
                  <td className="px-4 py-3 text-sm font-bold text-primary">0.88</td>
                  <td className="px-4 py-3 text-sm"><span className="text-green-600 font-bold">04</span></td>
                  <td className="px-4 py-3 text-xs font-medium uppercase text-on-surface-variant tracking-wider">Fast Track</td>
                  <td className="px-4 py-3 text-sm font-bold">₹1,240</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/30 text-secondary text-[10px] font-bold uppercase">Paid</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-high transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm font-semibold font-mono">CL-9903</td>
                  <td className="px-4 py-3 text-sm font-medium">Ananya S.</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">KA-B08</td>
                  <td className="px-4 py-3 text-sm font-bold text-primary">0.72</td>
                  <td className="px-4 py-3 text-sm"><span className="text-amber-600 font-bold">18</span></td>
                  <td className="px-4 py-3 text-xs font-medium uppercase text-on-surface-variant tracking-wider">Soft Queue</td>
                  <td className="px-4 py-3 text-sm font-bold">₹890</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">Pending</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-high transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm font-semibold font-mono">CL-9904</td>
                  <td className="px-4 py-3 text-sm font-medium">Vikram Singh</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">DL-S14</td>
                  <td className="px-4 py-3 text-sm font-bold text-primary">0.94</td>
                  <td className="px-4 py-3 text-sm"><span className="text-on-tertiary-container font-bold">62</span></td>
                  <td className="px-4 py-3 text-xs font-medium uppercase text-on-surface-variant tracking-wider">Active Verify</td>
                  <td className="px-4 py-3 text-sm font-bold">₹2,100</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-container text-[10px] font-bold uppercase animate-pulse">Verifying</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-high transition-colors cursor-pointer">
                  <td className="px-4 py-3 text-sm font-semibold font-mono">CL-9905</td>
                  <td className="px-4 py-3 text-sm font-medium">Priya Dash</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">TS-W21</td>
                  <td className="px-4 py-3 text-sm font-bold text-primary">0.12</td>
                  <td className="px-4 py-3 text-sm"><span className="text-error font-bold">88</span></td>
                  <td className="px-4 py-3 text-xs font-medium uppercase text-on-surface-variant tracking-wider">Soft Queue</td>
                  <td className="px-4 py-3 text-sm font-bold">₹450</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-error text-[10px] font-bold uppercase">Denied</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        <div className="w-[40%] flex flex-col gap-4">
          <div className="bg-[#0F172A] text-white p-6 rounded-xl shadow-lg flex-1">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Selected Claim</span>
                <h3 className="text-2xl font-bold mt-1">CL-9902</h3>
              </div>
              <span className="bg-secondary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[#002109]">Verified Safe</span>
            </div>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">Pipeline Route</span>
                  <span className="text-sm font-bold text-secondary-fixed">Fast Track</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary-fixed w-[100%]"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">DCI Score</p>
                  <p className="text-xl font-bold">0.88</p>
                  <p className="text-[10px] text-secondary mt-1">Confirmed Path 1</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fraud Score</p>
                  <p className="text-xl font-bold">04</p>
                  <p className="text-[10px] text-secondary mt-1">Status: Safe</p>
                </div>
              </div>
              <div className="border-t border-slate-800 pt-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Verification Artifacts</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-24 rounded-lg bg-slate-800 overflow-hidden relative group">
                    <img className="w-full h-full object-cover opacity-50" alt="H3 map" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7v3MzaJFF2C76ByRHLQMOqZxLZKgsEOnUWanQeEoczQ55-o9mIojPEvZXTSgrvDNorEWiSgJH0GfL4FGzDzR38lWludbb0j_kYDQObt2kQMl6yuCEmStl3QW9g22T6tiBN4sw2k6eACt_9ib-g5nr1ZuMmdGNkCiR6cAPTVMgaYr0YC5evTeVBFkTPmjFgUk6AXYOmCo7-9TxvFf2SPmMC-3Eh9PHNZX29Yx3LGh6eyI11Eg0j00gJzFmiPaam7YUFfVkmdj4YQ" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold bg-black/50 px-2 py-1 rounded">Geofence OK</span>
                    </div>
                  </div>
                  <div className="h-24 rounded-lg bg-slate-800 overflow-hidden relative group">
                    <img className="w-full h-full object-cover opacity-50" alt="Data" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_zBFPQTpH2axim7M34VuaXSBJQo1hFNBxZfI4UQyq_Qhh30jmdVioAYx4NnI1xnQc3v6gF7SrCaA6LTixgZngMM3wvubOhhlFuBq9eHTWtaLpsJro-fYXrwipS91sz1IZuOmtb2dOOX8NfBULN4YDC1i7SQNss19nROOj1VeTBTow28UFbjVrpAwYsKwaES_peoln3ENqJHIqERtoT_nzPY18uvdtdBkVtOngYI92mWNyPuGLJ5s-tjuxxqhU8YdmRubVmXdAHQ" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold bg-black/50 px-2 py-1 rounded">Signal Match</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase mb-2">Audit Narrative</h4>
                <p className="text-sm leading-relaxed text-slate-400">Path 1: Fast Track - DCI 0.88 confirmed. High spatial-temporal correlation found in Zone MH-E12. Payout executed at T+24ms via Ledger Node 4.</p>
              </div>
            </div>
          </div>
          {/* Secondary Summary Card */}
          <div className="bg-surface-container-high p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-on-tertiary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary-fixed">analytics</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Active Velocity</p>
                <p className="text-lg font-bold">842 Claims / Hour</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
