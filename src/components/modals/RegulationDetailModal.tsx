import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useEPA } from '@/context/EPAContext'
import { OBLIGATION_COLORS, OBLIGATION_LABELS, JURISDICTION_LABELS } from '@/types'

interface RegulationDetailModalProps {
  regulationId: string
  l2Id?: string
  domainId?: string
  onClose: () => void
}

export function RegulationDetailModal({ regulationId, l2Id, domainId, onClose }: RegulationDetailModalProps) {
  const { data } = useEPA()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!data) return null

  const regulation = data.regulations.find(r => r.id === regulationId)
  if (!regulation) return null

  const colors = OBLIGATION_COLORS[regulation.type]

  // All reg mappings for this regulation, optionally scoped to a domain
  const allMappings = data.regMappings.filter(m => m.regulationId === regulationId)
  const scopedMappings = domainId
    ? allMappings.filter(m => m.domainId === domainId)
    : allMappings

  // The specific obligation statement for the clicked L2 (if any)
  const l2Mapping = l2Id
    ? allMappings.find(m => m.l2Id === l2Id) ?? scopedMappings.find(m => m.l2Id === l2Id)
    : undefined

  const scopeDomain = domainId ? data._maps.domainById.get(domainId) : undefined

  function onBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/50 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      onMouseDown={onBackdropClick}
    >
      <div
        ref={panelRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mt-4 mb-8 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <span
            className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded"
            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
          >
            {OBLIGATION_LABELS[regulation.type]}
          </span>

          <h2 className="font-serif text-2xl text-[#163A5F] mt-3 pr-8">{regulation.name}</h2>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="font-mono text-xs text-slate-500">{regulation.ref}</span>
            <span
              className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                regulation.status === 'current'
                  ? 'bg-emerald-50 text-emerald-700'
                  : regulation.status === 'pending' || regulation.status === 'proposed'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {regulation.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {regulation.jurisdictions.map(j => (
              <span key={j} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {JURISDICTION_LABELS[j]}
              </span>
            ))}
          </div>

          {regulation.regulators.length > 0 && (
            <div className="text-xs text-slate-500 mt-2">
              Regulator{regulation.regulators.length > 1 ? 's' : ''}: {regulation.regulators.join(', ')}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {l2Mapping && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Where this obligation lands
              </h3>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
                {l2Mapping.obligation}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Sub-processes in scope{scopeDomain ? ` within ${scopeDomain.shortName}` : ''}
            </h3>
            {scopedMappings.length === 0 ? (
              <div className="text-sm text-slate-400">No mapped sub-processes.</div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {scopedMappings.map(m => {
                  const l2 = data._maps.processFunctionById.get(m.l2Id)
                  if (!l2) return null
                  const isHighlighted = m.l2Id === l2Id
                  return (
                    <span
                      key={m.id}
                      className={`text-[11px] px-2 py-1 rounded-md font-mono ${
                        isHighlighted
                          ? 'bg-blue-600 text-white'
                          : 'bg-teal-50 text-teal-800 border border-teal-100'
                      }`}
                    >
                      {l2.name}
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Full regulatory requirement
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{regulation.requirements}</p>
          </div>

          <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-1">
              Enforcement &amp; penalty
            </h3>
            <p className="text-sm text-red-800 leading-relaxed">{regulation.penalty}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
