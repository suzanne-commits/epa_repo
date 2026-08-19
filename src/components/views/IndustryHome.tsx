import { useNavigate } from 'react-router-dom'
import { useEPA } from '@/context/EPAContext'

const STATUS_STYLES = {
  active:   { dot: 'bg-emerald-400', label: 'Active', text: 'text-emerald-700 bg-emerald-50' },
  planned:  { dot: 'bg-amber-400',   label: 'Planned', text: 'text-amber-700 bg-amber-50' },
  stub:     { dot: 'bg-slate-300',   label: 'Stub', text: 'text-slate-500 bg-slate-100' },
}

export function IndustryHome() {
  const { data, loading } = useEPA()
  const navigate = useNavigate()

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#163A5F] flex items-center justify-center">
        <div className="text-white/50 text-sm font-mono">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#163A5F] flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="text-lg font-black font-mono text-blue-300">EPA</span>
          </div>
          <div className="text-left">
            <div className="text-xl font-bold text-white">EPA Suite</div>
            <div className="text-[10px] font-mono text-blue-300 uppercase tracking-widest">
              Enterprise Process Architecture
            </div>
          </div>
        </div>
        <p className="text-white/50 text-sm max-w-md">
          Select an industry to explore the process architecture, regulatory mapping, and E2E processes.
        </p>
      </div>

      {/* Industry cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
        {data.industries.map(industry => {
          const style = STATUS_STYLES[industry.status]
          const isActive = industry.status === 'active'
          return (
            <button
              key={industry.id}
              onClick={() => isActive && navigate(`/${industry.id}`)}
              disabled={!isActive}
              className={`text-left p-5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30 cursor-pointer'
                  : 'bg-white/5 border-white/10 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-black font-mono text-blue-300">
                  {industry.shortName}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${style.text}`}>
                  {style.label}
                </span>
              </div>
              <div className="text-sm font-semibold text-white mb-1">{industry.name}</div>
              <div className="text-xs text-white/50 leading-relaxed">{industry.description}</div>
              {industry.archetypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {industry.archetypes.map(a => (
                    <span key={a.id} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">
                      {a.id}
                    </span>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Admin link */}
      <div className="mt-10">
        <button
          onClick={() => navigate('/admin')}
          className="text-xs text-white/30 hover:text-white/50 transition-colors font-mono"
        >
          ⚙ Data Maintenance
        </button>
      </div>
    </div>
  )
}
