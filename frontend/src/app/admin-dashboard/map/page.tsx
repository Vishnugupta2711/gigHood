'use client';

export default function H3HexMapPage() {
  return (
    <div className="flex-1 relative bg-[#111827] overflow-hidden rounded-xl shadow-2xl border border-slate-800 -mx-8 -my-8 h-[calc(100vh-4rem)]">
      {/* Immersive Map Visual */}
      <div className="absolute inset-0 z-0">
        <img className="w-full h-full object-cover opacity-40 mix-blend-luminosity" alt="Dark themed operational map" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy8kea2WRroYImdKqjfgC5CsS4xb3UWJvNOYNKSXdGiQlPVXwrcbkR2yLFimAZypiFtUfd0L3uhmjWyovRp-Gi5WY9j8nZ1JFxoKzKws_jZg2xbiesbFGJmBotgPFNhmI6sBF52l1kyjQzv0k2Iga5H1BTV_PjllIQBpxVEJu_dudeF54NQcBWz7RyAklKzh_pLPiDT2Fd6CxSjuovoZLiwl_TkopW04djkZWmdTn4im0b7JOsjGYdwlb4oxZKquiaOtzYW86JUw" />
        
        {/* Hex Overlay SVG Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 600" preserveAspectRatio="none">
          <g className="opacity-60">
            {/* Indiranagar (Green) */}
            <polygon className="pointer-events-auto cursor-pointer hover:opacity-100 transition-opacity" fill="#22C55E" points="120,100 150,85 180,100 180,130 150,145 120,130" stroke="#ffffff10" strokeWidth="1"></polygon>
            <polygon fill="#22C55E" points="185,100 215,85 245,100 245,130 215,145 185,130" stroke="#ffffff10" strokeWidth="1"></polygon>
            
            {/* Koramangala (Amber) */}
            <polygon fill="#F59E0B" points="300,300 330,285 360,300 360,330 330,345 300,330" stroke="#ffffff10" strokeWidth="1"></polygon>
            <polygon fill="#F59E0B" points="365,300 395,285 425,300 425,330 395,345 365,330" stroke="#ffffff10" strokeWidth="1"></polygon>
            
            {/* HSR Layout (Red) */}
            <polygon className="pointer-events-auto cursor-pointer hover:opacity-100 transition-opacity animate-pulse" fill="#EF4444" points="500,450 530,435 560,450 560,480 530,495 500,480" stroke="#ffffff20" strokeWidth="2"></polygon>
            <polygon fill="#EF4444" points="565,450 595,435 625,450 625,480 595,495 565,480" stroke="#ffffff10" strokeWidth="1"></polygon>
            <polygon fill="#EF4444" points="532,497 562,482 592,497 592,527 562,542 532,527" stroke="#ffffff10" strokeWidth="1"></polygon>
          </g>
        </svg>

        {/* Tooltip Element */}
        <div className="absolute top-[410px] left-[570px] z-30 bg-[#131B2E] text-white px-4 py-3 rounded-lg shadow-2xl backdrop-blur-md border border-white/10 animate-bounce">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-[#7C839B]">Critical Alert</span>
          </div>
          <p className="text-sm font-bold">Zone: HSR Layout</p>
          <div className="flex justify-between gap-4 mt-2">
            <div>
              <p className="text-[10px] text-[#7C839B] uppercase">DCI</p>
              <p className="text-lg font-bold">0.94</p>
            </div>
            <div>
              <p className="text-[10px] text-[#7C839B] uppercase">Peak Dur</p>
              <p className="text-lg font-bold">22m</p>
            </div>
          </div>
          <div className="w-full h-1 bg-white/10 mt-3 rounded-full overflow-hidden">
            <div className="w-[94%] h-full bg-error"></div>
          </div>
        </div>
      </div>

      {/* Floating Overlay Controls Layer */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-4">
        {/* Filter Panel */}
        <div className="bg-[#131B2E]/90 backdrop-blur-md p-4 rounded-xl border border-white/5 shadow-2xl flex flex-col gap-3 w-64">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Map Configuration</h3>
            <span className="material-symbols-outlined text-white/40 text-sm">tune</span>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-bold text-[#7C839B] uppercase ml-1">Resolution</label>
              <select className="w-full bg-slate-800/50 border-none text-white text-xs rounded-lg py-2 cursor-pointer focus:ring-1 focus:ring-[#ac59fb]">
                <option>H3 Resolution 8</option>
                <option>H3 Resolution 9</option>
                <option>H3 Resolution 10</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#7C839B] uppercase ml-1">Timeframe</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-800/50 p-1 rounded-lg">
                <button className="text-[10px] font-bold text-white bg-[#ac59fb] rounded py-1">Real-time</button>
                <button className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors">1h</button>
                <button className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors">4h</button>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time DCI Heatmap Panel */}
        <div className="bg-[#131B2E]/90 backdrop-blur-md p-4 rounded-xl border border-white/5 shadow-2xl w-64">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Real-time DCI Heatmap</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Avg. Network Load</span>
              <span className="text-xs font-bold text-[#6bff8f]">42%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Peak Congestion</span>
              <span className="text-xs font-bold text-error">HSR (0.94)</span>
            </div>
            {/* Mini Graph Visualization */}
            <div className="h-12 w-full flex items-end gap-1 px-1 mt-2">
              <div className="w-full h-[40%] bg-slate-700/50 rounded-t-sm"></div>
              <div className="w-full h-[55%] bg-slate-700/50 rounded-t-sm"></div>
              <div className="w-full h-[70%] bg-slate-700/50 rounded-t-sm"></div>
              <div className="w-full h-[90%] bg-[#ac59fb] rounded-t-sm"></div>
              <div className="w-full h-[85%] bg-[#ac59fb] rounded-t-sm"></div>
              <div className="w-full h-[95%] bg-error rounded-t-sm"></div>
              <div className="w-full h-[60%] bg-slate-700/50 rounded-t-sm"></div>
              <div className="w-full h-[45%] bg-slate-700/50 rounded-t-sm"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-20 flex flex-col gap-4">
        {/* Disruption Forecast */}
        <div className="bg-primary/90 backdrop-blur-md p-5 rounded-xl border border-white/5 shadow-2xl w-72">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#ac59fb]">bolt</span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Disruption Forecast</h3>
          </div>
          <div className="space-y-4">
            <div className="p-3 bg-white/5 rounded-lg border-l-4 border-error">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Next 15 Mins</p>
              <p className="text-sm font-medium text-white">Indiranagar DCI spike predicted (+14%)</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border-l-4 border-[#6bff8f]">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Next 60 Mins</p>
              <p className="text-sm font-medium text-white">Stability recovery in Koramangala Sector 4</p>
            </div>
          </div>
        </div>
        
        {/* Zone Comparison */}
        <div className="bg-primary-container/90 backdrop-blur-md p-5 rounded-xl border border-white/5 shadow-2xl w-72">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Zone Performance</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-slate-300 font-medium">HSR LAYOUT</span>
                  <span className="text-[10px] text-error font-bold">0.94</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[94%] h-full bg-error"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-slate-300 font-medium">KORAMANGALA</span>
                  <span className="text-[10px] text-amber-500 font-bold">0.72</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[72%] h-full bg-amber-500"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-slate-300 font-medium">INDIRANAGAR</span>
                  <span className="text-[10px] text-[#6bff8f] font-bold">0.44</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="w-[44%] h-full bg-[#6bff8f]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend in bottom left */}
      <div className="absolute bottom-6 left-6 z-20 bg-primary-container/90 backdrop-blur-md p-3 rounded-lg border border-white/5 shadow-lg">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[#6bff8f]"></span>
            <span className="text-[10px] text-white font-medium">Stable (DCI &lt; 0.65)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span className="text-[10px] text-white font-medium">Moderate (0.65 - 0.85)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-error"></span>
            <span className="text-[10px] text-white font-medium">High (DCI &gt; 0.85)</span>
          </div>
        </div>
      </div>
      
      {/* Action FABs */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
        <button className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center border border-white/10 shadow-xl transition-all">
          <span className="material-symbols-outlined">add</span>
        </button>
        <button className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center border border-white/10 shadow-xl transition-all">
          <span className="material-symbols-outlined">remove</span>
        </button>
        <button className="w-10 h-10 bg-[#ac59fb] hover:brightness-110 text-white rounded-lg flex items-center justify-center shadow-xl transition-all mt-2">
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </div>
    </div>
  );
}
