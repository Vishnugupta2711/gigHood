'use client';

export default function ActivePoliciesPage() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Active Policies</h1>
          <p className="text-on-surface-variant mt-1">Real-time breakdown of parametric gig-economy worker coverage.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Value Locked</span>
            <span className="text-2xl font-bold text-on-surface">$14,280,900.00</span>
          </div>
          <div className="w-[1px] bg-slate-200 h-10 self-center"></div>
          <div className="text-right">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Active Nodes</span>
            <span className="text-2xl font-bold text-on-surface">42,891</span>
          </div>
        </div>
      </div>

      {/* Policy Distribution Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary">layers</span>
          <h2 className="text-xl font-bold text-on-surface">Policy Class Distribution</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1 */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-transparent hover:border-slate-300 transition-all shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant">person</span>
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-2 py-1 bg-surface-container-high rounded-full">Entry Tier</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">Tier 1 Basic</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-on-surface-variant">Active Workers</span>
                <span className="text-lg font-bold">12,402</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-on-surface-variant">Avg. Coverage</span>
                <span className="text-sm font-semibold">$500/mo</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                <div className="bg-primary w-1/4 h-full"></div>
              </div>
            </div>
          </div>
          
          {/* Tier 2 */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-transparent hover:border-slate-300 transition-all shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#dae2fd] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#131b2e]">group</span>
              </div>
              <span className="text-[10px] font-bold text-[#007432] uppercase tracking-widest px-2 py-1 bg-[#6bff8f] rounded-full">Most Popular</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">Tier 2 Standard</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-on-surface-variant">Active Workers</span>
                <span className="text-lg font-bold">28,110</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-on-surface-variant">Avg. Coverage</span>
                <span className="text-sm font-semibold">$1,200/mo</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                <div className="bg-primary w-2/3 h-full"></div>
              </div>
            </div>
          </div>

          {/* Tier 3 */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-transparent hover:border-slate-300 transition-all shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#f0dbff] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#2c0051]">workspace_premium</span>
              </div>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest px-2 py-1 bg-[#ac59fb] rounded-full">Premium Elite</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface">Tier 3 Premium</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-on-surface-variant">Active Workers</span>
                <span className="text-lg font-bold">2,379</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-on-surface-variant">Avg. Coverage</span>
                <span className="text-sm font-semibold">$2,500/mo</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                <div className="bg-primary w-[15%] h-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Network Policies Directory */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 flex justify-between items-center bg-surface-container-low border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">policy</span>
            <h2 className="text-xl font-bold text-on-surface">Network Directory</h2>
          </div>
          <div className="relative">
             <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
             <input className="bg-white border-slate-200 rounded-md py-1.5 pl-8 pr-3 text-sm focus:ring-2 focus:ring-[#ac59fb]" type="text" placeholder="Search accounts..." />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Policy ID</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Worker</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Zone Auth</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Tier</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-highest">
               <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">POL-991A</td>
                  <td className="px-6 py-4 font-bold text-on-surface">S. Williams</td>
                  <td className="px-6 py-4 text-sm text-slate-500">KA-B08</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-surface-container-highest text-xs rounded-lg font-bold">Standard</span></td>
                  <td className="px-6 py-4"><span className="text-[10px] font-bold text-secondary uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">Active</span></td>
               </tr>
               <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">POL-882C</td>
                  <td className="px-6 py-4 font-bold text-on-surface">J. Doe</td>
                  <td className="px-6 py-4 text-sm text-slate-500">MH-E12</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-surface-container-highest text-xs rounded-lg font-bold">Premium</span></td>
                  <td className="px-6 py-4"><span className="text-[10px] font-bold text-secondary uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">Active</span></td>
               </tr>
               <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">POL-119F</td>
                  <td className="px-6 py-4 font-bold text-on-surface">A. Kumar</td>
                  <td className="px-6 py-4 text-sm text-slate-500">TS-W21</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-surface-container-highest text-xs rounded-lg font-bold">Basic</span></td>
                  <td className="px-6 py-4"><span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded">Grace Period</span></td>
               </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
