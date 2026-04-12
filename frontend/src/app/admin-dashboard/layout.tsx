'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Grid3x3,
  Map,
  FileText,
  AlertTriangle,
  Shield,
  DollarSign,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Search,
  ChevronRight,
  Activity,
  Zap,
  X,
  ScrollText,
} from 'lucide-react'

import api from '@/lib/api'
import icon from '@/app/icon.jpg'

// ─── Nav manifest ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { icon: Grid3x3,      label: 'Overview',      href: '/admin-dashboard',          desc: 'System at a glance' },
  { icon: Map,          label: 'H3 Hex Map',     href: '/admin-dashboard/map',      desc: 'Zone disruption view' },
  { icon: FileText,     label: 'Claims',         href: '/admin-dashboard/claims',   desc: 'Live claim pipeline' },
  { icon: AlertTriangle,label: 'Fraud Monitor',  href: '/admin-dashboard/fraud',    desc: 'Risk signals & flags' },
  { icon: ScrollText,   label: 'Audit Trail',    href: '/admin-dashboard/audit',    desc: 'Compliance log · RBI ready' },
  { icon: Shield,       label: 'Active Policies',href: '/admin-dashboard/policies', desc: 'Worker coverage state' },
  { icon: DollarSign,   label: 'Payout Summary', href: '/admin-dashboard/payouts',  desc: 'UPI payout ledger' },
]

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = () => {
  const pathname = usePathname()
  const router   = useRouter()
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)

  useEffect(() => {
    NAV_ITEMS.forEach(item => router.prefetch(item.href))
    router.prefetch('/admin-dashboard/settings')
  }, [router])

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gighood_jwt')
      localStorage.removeItem('gighood-auth-store')
      localStorage.removeItem('gighood-language-store')
    }
    router.replace('/')
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <aside
      className="w-[240px] h-screen fixed left-0 top-0 flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #0D1524 0%, #0F172A 60%, #0A1020 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* ── Brand ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-5 flex items-center gap-3 border-b border-white/5">
        <div className="relative w-9 h-9 rounded-xl overflow-hidden ring-1 ring-orange-500/30 shadow-lg shadow-orange-900/20 flex-shrink-0">
          <Image src={icon} alt="gigHood" fill sizes="36px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-orange-400 tracking-widest truncate">
            gigHood
          </h1>
          <p
            className="text-[9px] font-semibold tracking-[0.18em] truncate"
            style={{ color: 'rgba(255,255,255,0.28)' }}
          >
            PARAMETRIC CONTROL
          </p>
        </div>
        {/* env badge */}
        <span
          className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider flex-shrink-0"
          style={{ background: 'rgba(251,146,60,0.12)', color: '#fb923c' }}
        >
          ADMIN
        </span>
      </div>

      {/* ── Section label ──────────────────────────────────────────────── */}
      <p
        className="px-6 pt-5 pb-2 text-[10px] font-semibold tracking-[0.16em] uppercase"
        style={{ color: 'rgba(255,255,255,0.22)' }}
      >
        Operations
      </p>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-none pb-2">
        {NAV_ITEMS.map(item => {
          const Icon   = item.icon
          const active = isActive(item.href)
          const hovered = hoveredHref === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoveredHref(item.href)}
              onMouseLeave={() => setHoveredHref(null)}
              className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
              style={{
                background: active
                  ? 'rgba(251,146,60,0.12)'
                  : hovered
                  ? 'rgba(255,255,255,0.05)'
                  : 'transparent',
                boxShadow: active
                  ? 'inset 0 0 0 1px rgba(251,146,60,0.18)'
                  : 'none',
              }}
            >
              {/* Active left bar */}
              {active && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
                  style={{ background: '#fb923c' }}
                />
              )}

              {/* Icon */}
              <span
                className="flex-shrink-0 transition-colors duration-150"
                style={{ color: active ? '#fb923c' : hovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.38)' }}
              >
                <Icon size={17} strokeWidth={active ? 2.25 : 1.75} />
              </span>

              {/* Label + desc */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-medium leading-tight truncate transition-colors duration-150"
                  style={{ color: active ? '#f97316' : hovered ? '#fff' : 'rgba(255,255,255,0.54)' }}
                >
                  {item.label}
                </p>
                {(active || hovered) && (
                  <p
                    className="text-[10px] truncate mt-0.5 transition-all duration-150"
                    style={{ color: active ? 'rgba(251,146,60,0.55)' : 'rgba(255,255,255,0.28)' }}
                  >
                    {item.desc}
                  </p>
                )}
              </div>

              {/* Chevron on active */}
              {active && (
                <ChevronRight
                  size={12}
                  className="flex-shrink-0"
                  style={{ color: 'rgba(251,146,60,0.5)' }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── System health strip ────────────────────────────────────────── */}
      <div
        className="mx-3 mb-3 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
        style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.12)' }}
      >
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-green-400 leading-tight">All systems nominal</p>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>DCI · Claims · Payout</p>
        </div>
        <Activity size={13} className="ml-auto flex-shrink-0 text-green-500/60" />
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="border-t border-white/5 px-3 py-3 space-y-0.5">
        <Link
          href="/admin-dashboard/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 group"
          style={{ color: 'rgba(255,255,255,0.38)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}
        >
          <Settings size={17} strokeWidth={1.75} />
          <span className="text-[13px] font-medium">Settings</span>
        </Link>

        <Link
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150"
          style={{ color: 'rgba(255,255,255,0.38)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}
        >
          <HelpCircle size={17} strokeWidth={1.75} />
          <span className="text-[13px] font-medium">Support</span>
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 group"
          style={{ color: 'rgba(248,113,113,0.55)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#f87171')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(248,113,113,0.55)')}
        >
          <LogOut size={17} strokeWidth={1.75} />
          <span className="text-[13px] font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
const Header = () => {
  const router  = useRouter()
  const pathname = usePathname()

  const [user,   setUser]   = useState<{ name?: string; email?: string } | null>(null)
  const [alerts, setAlerts] = useState(0)
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [showUserMenu, setShowUserMenu]   = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Load user + alert count
  useEffect(() => {
    const load = async () => {
      try {
        // Workers router is mounted at /workers — /auth/me does not exist
        const userRes  = await api.get('/workers/me')
        setUser(userRes.data)
      } catch { /* dashboard still renders without user info */ }
      try {
        // No dedicated /admin/alerts/count endpoint — derive from KPIs
        const kpiRes = await api.get('/admin/dashboard/kpis')
        setAlerts(kpiRes.data?.pending_claims ?? kpiRes.data?.fraud_queue_length ?? 0)
      } catch { /* suppress — server may not expose this endpoint in preview */ }
    }
    load()
  }, [])

  // Debounced search
  useEffect(() => {
    if (!search.trim()) return
    const t = setTimeout(async () => {
      try { await api.get(`/admin/search?q=${encodeURIComponent(search)}`) } catch { /* ignore */ }
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ⌘K shortcut
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Derive page title from pathname
  const pageTitle = (() => {
    if (pathname === '/admin-dashboard') return 'Overview'
    const seg = pathname.split('/').pop() || ''
    return seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ')
  })()

  const initials = user?.name ? user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : 'AD'

  return (
    <header
      className="ml-[240px] sticky top-0 z-20 flex items-center justify-between gap-4 px-6"
      style={{
        height: 64,
        background: 'rgba(250,250,247,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(15,23,42,0.07)',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
      }}
    >
      {/* ── Left: breadcrumb / page title ─────────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[13px] font-medium" style={{ color: 'rgba(15,23,42,0.35)' }}>
          Admin
        </span>
        <ChevronRight size={13} style={{ color: 'rgba(15,23,42,0.25)' }} />
        <span className="text-[13px] font-semibold" style={{ color: '#0F172A' }}>
          {pageTitle}
        </span>
      </div>

      {/* ── Centre: search ─────────────────────────────────────────────── */}
      <div
        className="relative flex items-center transition-all duration-200"
        style={{ width: searchFocused ? 380 : 300 }}
      >
        <Search
          size={15}
          className="absolute left-3 pointer-events-none"
          style={{ color: 'rgba(15,23,42,0.3)' }}
        />
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          type="text"
          placeholder="Search claims, workers…"
          className="w-full text-[13px] pl-9 pr-20 py-2 rounded-xl outline-none transition-all duration-200"
          style={{
            background: searchFocused ? '#fff' : '#F4F4F1',
            color: '#1A1C1B',
            border: searchFocused ? '1.5px solid rgba(251,146,60,0.55)' : '1.5px solid transparent',
            boxShadow: searchFocused ? '0 0 0 3px rgba(251,146,60,0.08)' : 'none',
          }}
        />
        {/* ⌘K hint */}
        {!search && !searchFocused && (
          <span
            className="absolute right-3 text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              color: 'rgba(15,23,42,0.3)',
              background: 'rgba(15,23,42,0.06)',
              fontFeatureSettings: '"kern"',
            }}
          >
            ⌘K
          </span>
        )}
        {search && (
          <button
            className="absolute right-3"
            onClick={() => setSearch('')}
            aria-label="Clear search"
          >
            <X size={13} style={{ color: 'rgba(15,23,42,0.35)' }} />
          </button>
        )}
      </div>

      {/* ── Right: controls ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Live status */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a' }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          Live
        </div>

        {/* Quick actions */}
        <button
          onClick={() => router.push('/admin-dashboard/claims')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150"
          style={{ background: 'rgba(251,146,60,0.1)', color: '#c2410c' }}
          title="Trigger claim cycle"
        >
          <Zap size={12} />
          Trigger
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg transition-colors duration-150"
          style={{ color: 'rgba(15,23,42,0.5)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(15,23,42,0.05)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {alerts > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 text-white text-[9px] font-bold px-1 py-px rounded-full leading-none"
              style={{ background: '#ef4444', minWidth: 16, textAlign: 'center' }}
            >
              {alerts > 99 ? '99+' : alerts}
            </span>
          )}
        </button>

        {/* Settings shortcut */}
        <button
          className="p-2 rounded-lg transition-colors duration-150"
          style={{ color: 'rgba(15,23,42,0.5)' }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(15,23,42,0.05)')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          onClick={() => router.push('/admin-dashboard/settings')}
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: 'rgba(15,23,42,0.1)' }} />

        {/* User chip */}
        <div className="relative" ref={userMenuRef}>
          <button
            className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl transition-all duration-150"
            style={{
              background: showUserMenu ? 'rgba(15,23,42,0.06)' : 'transparent',
              border: '1px solid transparent',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(15,23,42,0.05)')}
            onMouseLeave={e => {
              if (!showUserMenu) (e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
            onClick={() => setShowUserMenu(v => !v)}
            aria-label="User menu"
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
              style={{ background: 'linear-gradient(135deg, #fb923c 0%, #ef4444 100%)' }}
            >
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[12px] font-semibold leading-tight" style={{ color: '#0F172A' }}>
                {user?.name || 'Admin'}
              </p>
              {user?.email && (
                <p className="text-[10px] leading-tight" style={{ color: 'rgba(15,23,42,0.4)' }}>
                  {user.email.length > 20 ? user.email.slice(0, 20) + '…' : user.email}
                </p>
              )}
            </div>
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-30"
              style={{
                background: '#fff',
                boxShadow: '0 10px 30px rgba(15,23,42,0.10), 0 0 0 1px rgba(15,23,42,0.06)',
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(15,23,42,0.06)' }}>
                <p className="text-[12px] font-semibold" style={{ color: '#0F172A' }}>
                  {user?.name || 'Admin'}
                </p>
                <p className="text-[11px]" style={{ color: 'rgba(15,23,42,0.45)' }}>
                  {user?.email || 'admin@gighood.in'}
                </p>
              </div>
              <div className="py-1.5">
                <button
                  className="w-full text-left px-4 py-2 text-[13px] transition-colors duration-100"
                  style={{ color: 'rgba(15,23,42,0.65)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#F4F4F1')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  onClick={() => { setShowUserMenu(false); router.push('/admin-dashboard/settings') }}
                >
                  Account Settings
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-[13px] transition-colors duration-100"
                  style={{ color: '#dc2626' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#FEF2F2')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  onClick={() => {
                    setShowUserMenu(false)
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('gighood_jwt')
                      localStorage.removeItem('gighood-auth-store')
                      localStorage.removeItem('gighood-language-store')
                    }
                    router.replace('/')
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex" style={{ background: '#FAFAF7', minHeight: '100vh' }}>
      <Sidebar />

      <div className="flex-1 flex flex-col" style={{ marginLeft: 240 }}>
        <Header />

        <main
          className="flex-1"
          style={{ background: '#FAFAF7', minHeight: 'calc(100vh - 64px)' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}