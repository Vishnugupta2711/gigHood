'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const navItems = [
  { href: '/admin-dashboard', icon: 'dashboard', label: 'Overview' },
  { href: '/admin-dashboard/map', icon: 'map', label: 'H3 Hex Map' },
  { href: '/admin-dashboard/claims', icon: 'description', label: 'Claims' },
  { href: '/admin-dashboard/fraud', icon: 'security', label: 'Fraud Monitor' },
  { href: '/admin-dashboard/policies', icon: 'verified_user', label: 'Active Policies' },
  { href: '/admin-dashboard/payouts', icon: 'payments', label: 'Payout Summary' },
];

const bottomNavItems = [
  { href: '/admin-dashboard/settings', icon: 'settings', label: 'Settings' },
  { href: '#', icon: 'help', label: 'Support' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin-dashboard') return pathname === '/admin-dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen font-body bg-background text-on-surface">
      {/* SideNavBar — Fixed Position for Premium Feel */}
      <aside className="w-[240px] h-screen fixed top-0 left-0 bg-[#0F172A] flex flex-col py-6 shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-50 border-r border-white/5">
        <div className="px-6 mb-10 group">
          <h1 className="text-xl font-bold tracking-tight text-white leading-tight uppercase flex items-center gap-2">
            GIGHOOD
            <span className="w-1.5 h-1.5 bg-[#AC59FB] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-[0_0_8px_#AC59FB]"></span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-[0.22em] uppercase mt-1.5 opacity-60">Parametric Control</p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col gap-1.5 px-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                  isActive(item.href)
                    ? 'text-white bg-purple-600/15 border border-purple-500/20 shadow-[0_0_20px_rgba(172,89,251,0.1)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {/* Glowing Indicator Bar */}
                {isActive(item.href) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#AC59FB] rounded-r-full shadow-[0_0_12px_#AC59FB]"></div>
                )}
                
                <span 
                  className="material-symbols-outlined text-[20px] transition-all group-hover:scale-110"
                  style={{ fontVariationSettings: isActive(item.href) ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-semibold tracking-wide">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800/40 px-3 space-y-1.5">
            {bottomNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden ${
                  isActive(item.href)
                    ? 'text-white bg-purple-600/15 border border-purple-500/20 shadow-[0_0_20px_rgba(172,89,251,0.1)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {isActive(item.href) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#AC59FB] rounded-r-full shadow-[0_0_12px_#AC59FB]"></div>
                )}

                <span 
                  className="material-symbols-outlined text-[20px] transition-all group-hover:scale-110"
                  style={{ fontVariationSettings: isActive(item.href) ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-semibold tracking-wide">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="px-6 mb-8 mt-auto">
          <button className="w-full bg-[#AC59FB] hover:bg-[#B76EFC] text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] transition-all active:scale-[0.96] shadow-2xl shadow-purple-900/50 border border-white/10">
            New Policy
          </button>
        </div>
      </aside>

      {/* Main Content — Offset by sidebar width */}
      <main className="flex-1 ml-[240px] flex flex-col min-w-0 bg-[#FAFAF7]">
        {/* TopNavBar */}
        <header className="sticky top-0 right-0 w-full z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 flex justify-between items-center h-16 px-8">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-full max-w-md group">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-[#AC59FB] transition-colors">search</span>
              <input
                className="w-full bg-slate-50/80 border-none rounded-full py-2.5 pl-11 pr-4 text-xs font-medium focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-slate-400"
                placeholder="Search workers, zones, or hex IDs..."
                type="text"
              />
            </div>
            <div className="hidden xl:flex items-center gap-2 bg-[#22C55E]/5 px-4 py-1.5 rounded-full border border-[#22C55E]/10">
              <span className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Live Status — Sync Active</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <button className="hover:bg-slate-100 text-slate-600 rounded-xl p-2.5 transition-all relative group">
                <span className="material-symbols-outlined text-[23px]" style={{ fontVariationSettings: "'wght' 300" }}>notifications</span>
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#EF4444] rounded-full border-2 border-white shadow-sm"></span>
              </button>
              <button className="hover:bg-slate-100 text-slate-600 rounded-xl p-2.5 transition-all">
                <span className="material-symbols-outlined text-[23px]" style={{ fontVariationSettings: "'wght' 300" }}>history_toggle_off</span>
              </button>
            </div>
            
            <div className="w-[1px] h-8 bg-slate-200/80 mx-1"></div>

            <button className="hidden sm:block text-[10px] font-black text-[#0F172A] px-6 py-2.5 bg-white rounded-xl shadow-xl shadow-black/5 border border-slate-100 hover:shadow-2xl hover:border-slate-200 transition-all active:scale-95 uppercase tracking-widest">
              Admin Console
            </button>

            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-2xl ring-1 ring-slate-100 cursor-pointer hover:ring-[#AC59FB] transition-all">
              <img
                alt="Admin Avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuALeuxaNZiQZ3Ppfh8s3i9crjZBr6z7ggLMRw859gSwJdG8NqfBxnPHsnyagyTTupd0VNvgNlE8oPanNcsEHCkprxEnZAWxutgCRU3aklOzA03VFoK5jXASUqP9EP_Mxths-8TCWU6fy9jPxk_X96zmvNDFOIR7rY8Bq8nkjGaC9b64Llu-RONWJqHkF_LAUzIyAtOtqym9ZbQSqDUWVv9g2MWAZVyGL9qA80xt1iIrtUNvaPogdVc0EV52KIoHaY97WuGo3mMr5w"
              />
            </div>
          </div>
        </header>

        {/* Dashboard Canvas Wrapper */}
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
