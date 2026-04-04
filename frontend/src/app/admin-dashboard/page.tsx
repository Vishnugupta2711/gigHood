import FinancialKPIs from '@/components/admin/FinancialKPIs';
import LiveZoneMonitor from '@/components/admin/LiveZoneMonitor';
import FraudQueue from '@/components/admin/FraudQueue';

export default function AdminOverviewPage() {
  return (
    <>
      {/* SECTION 1 — KPI STRIP */}
      <FinancialKPIs />

      {/* SECTION 2 — LIVE H3 MAP */}
      <section className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 flex justify-between items-center border-b border-slate-200">
          <div>
            <h2 className="text-lg font-extrabold text-[#0F172A]">Live Demand Collapse Index — H3 Resolution 8</h2>
            <p className="text-xs text-slate-500">Real-time geospatial disruption monitoring</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-sm font-bold border border-slate-200 hover:bg-slate-50 transition-all">
              All Zones <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          </div>
        </div>
        <div className="relative h-[480px] bg-[#111827] hex-grid overflow-hidden">
          <img alt="H3 Map Data" className="w-full h-full object-cover opacity-60" 
               src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYnI0U1Q6Ame8TtNRGYfCe8c-R5v8LQvcS0BGWNYlR4oo-b69LYTD0UdKBDw0skQuvjNpDKAwmgFPpl5GcFEISt4ZX6Y7KpyfzjuEQht6joxPSszclto0m13y8CuAFmZsf7Iii8ctZ-sYr4XCyh6TOW3zfVSSL7Z771GpgF63F1EpBtQ9cLC9DgztpxJUGjZJNYXBz69fDzHtXDNo0DU3c3O6902PfDR9pNOqTC4dW1fLBYeRNKYR_6CM9AqFL1nahWtuE8TLoOw"/>
          
          {/* Floating Legend */}
          <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-2xl">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">DCI Status Legend</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                <span className="text-xs text-white">&lt; 0.65 (Stable)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="text-xs text-white">0.65–0.84 (Alert)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-error"></span>
                <span className="text-xs text-white">≥ 0.85 (Disrupted)</span>
              </div>
            </div>
          </div>

          {/* Floating Tooltip Example */}
          <div className="absolute top-[35%] left-[55%] bg-primary p-4 rounded-xl shadow-2xl border border-white/20 w-64 z-10 animate-bounce">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-white font-bold text-sm">Zone: Active</h4>
              <span className="bg-error/20 text-error text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Disrupted</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400"><span>DCI:</span> <span className="text-white font-mono">0.91</span></div>
              <div className="flex justify-between text-slate-400"><span>Affected Workers:</span> <span className="text-white font-mono">47</span></div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/10">
              <button className="w-full text-[10px] text-secondary font-bold uppercase tracking-widest hover:brightness-125 transition-all">Trigger Payout Flow</button>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rotate-45 border-r border-b border-white/20"></div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
          <FraudQueue />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <LiveZoneMonitor />
        </div>
      </div>

      {/* SECTION 4 — BOTTOM ROW */}
      <div className="grid grid-cols-12 gap-8">
        {/* Fraud Metrics */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-[#0F172A]">Fraud Signal Breakdown</h2>
              <p className="text-xs text-slate-500 mt-0.5">Primary risk vector distribution</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Avg Fraud Score</p>
              <p className="text-2xl font-black text-error">38</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-600 uppercase"><span>STATIC_DEVICE_FLAG</span><span>30%</span></div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-error h-full w-[30%]"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-600 uppercase"><span>MODEL_CONCENTRATION</span><span>25%</span></div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-error h-full w-[25%]"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-600 uppercase"><span>MOCK_LOCATION_FLAG</span><span>20%</span></div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-error h-full w-[20%]"></div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-3 rounded-lg">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Zone-hop rate</p>
              <p className="text-lg font-extrabold text-[#0F172A]">4.2%</p>
            </div>
            <div className="bg-surface-container-low p-3 rounded-lg">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Mock location networks</p>
              <p className="text-lg font-extrabold text-error">3 active</p>
            </div>
          </div>
        </div>

        {/* Active Policies by Tier */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <h2 className="text-lg font-extrabold text-[#0F172A] px-2">Policy Distribution</h2>
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-[6px] border-secondary flex justify-between items-center transition-transform hover:-translate-y-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tier 1 — Basic</h3>
              <p className="text-xs text-slate-500 mt-1">₹29/week · Coverage cap ₹500</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-[#0F172A]">1,204</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Workers</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-[6px] border-amber-500 flex justify-between items-center transition-transform hover:-translate-y-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tier 2 — Standard</h3>
              <p className="text-xs text-slate-500 mt-1">₹49/week · Coverage cap ₹1,000</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-[#0F172A]">1,891</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Workers</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-[6px] border-[#AC59FB] flex justify-between items-center transition-transform hover:-translate-y-1">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tier 3 — Premium</h3>
              <p className="text-xs text-slate-500 mt-1">₹79/week · Coverage cap ₹2,000</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-[#0F172A]">752</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Workers</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
