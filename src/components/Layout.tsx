import { Outlet, NavLink, useParams } from 'react-router-dom'
import { useEPA } from '@/context/EPAContext'

const NAV_ITEMS = [
  { label: 'Explore Domains', path: '' },
  { label: 'E2E Processes', path: 'e2e' },
  { label: '⚖ Regulations', path: 'regulations' },
  { label: '📦 Product Lines', path: 'products' },
  { label: 'How It Works', path: 'how' },
  { label: '📐 Standards', path: 'standards' },
]

export function Layout() {
  const { industry, clientId } = useParams()
  const { data, loading, error, selectedIndustry } = useEPA()

  const basePath = clientId ? `/client/${clientId}` : `/${industry}`
  const industryData = data?.industries.find(i => i.id === (industry ?? selectedIndustry))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#163A5F] text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex items-center h-14 gap-4">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                <span className="text-xs font-black font-mono text-blue-300">EPA</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white/80 leading-tight">
                  {industryData?.name ?? 'EPA Suite'}
                </div>
                <div className="text-[9px] font-mono text-blue-300 uppercase tracking-widest">
                  Enterprise Process Architecture
                </div>
              </div>
            </NavLink>

            {/* Nav tabs */}
            <nav className="flex items-stretch h-full ml-4 overflow-x-auto">
              {NAV_ITEMS.map(item => (
                <NavLink
                  key={item.path}
                  to={`${basePath}${item.path ? '/' + item.path : ''}`}
                  end={item.path === ''}
                  className={({ isActive }) =>
                    `px-3 py-0 flex items-center text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap border-b-2 transition-colors ${
                      isActive
                        ? 'text-blue-300 border-blue-300'
                        : 'text-white/50 border-transparent hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Client badge */}
            {clientId && (
              <div className="ml-auto shrink-0 px-2 py-1 rounded bg-white/10 text-[10px] font-mono text-blue-300">
                CLIENT: {clientId}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-screen-xl mx-auto px-6 py-7 pb-16">
        {loading && (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <div className="text-sm">Loading EPA data…</div>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Error loading data: {error}
          </div>
        )}
        {!loading && !error && <Outlet />}
      </main>
    </div>
  )
}
