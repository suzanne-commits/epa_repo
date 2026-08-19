import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useEPA } from '@/context/EPAContext'
import { getRegulationsForL2, getE2EsForL2, getProcessFunctionsForGroup } from '@/utils/dataLoader'
import { OBLIGATION_COLORS, OBLIGATION_LABELS, CRITICALITY_COLORS } from '@/types'
import { RegulationDetailModal } from '@/components/modals/RegulationDetailModal'

export function L2DetailView() {
  const { industry, l2Id } = useParams()
  const { data } = useEPA()
  const navigate = useNavigate()
  const [modalReg, setModalReg] = useState<{ regulationId: string; l2Id: string; domainId: string } | null>(null)

  const l2 = useMemo(() => (data && l2Id ? data._maps.processFunctionById.get(l2Id) : undefined), [data, l2Id])
  const processGroup = useMemo(
    () => (data && l2 ? data._maps.processGroupById.get(l2.processGroupId) : undefined),
    [data, l2]
  )
  const domain = useMemo(
    () => (data && processGroup ? data._maps.domainById.get(processGroup.domainId) : undefined),
    [data, processGroup]
  )

  const regulations = useMemo(() => (data && l2Id ? getRegulationsForL2(data, l2Id) : []), [data, l2Id])
  const e2es = useMemo(() => (data && l2Id ? getE2EsForL2(data, l2Id) : []), [data, l2Id])
  const siblings = useMemo(
    () => (data && processGroup ? getProcessFunctionsForGroup(data, processGroup.id) : []),
    [data, processGroup]
  )

  if (!data) return null

  if (!l2 || !processGroup || !domain) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        L2 process <span className="font-mono">{l2Id}</span> not found.
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 flex-wrap">
        <Link to={`/${industry}`} className="hover:text-slate-600" style={{ color: domain.color }}>
          {domain.name}
        </Link>
        <ChevronRight size={12} />
        <span>{processGroup.name}</span>
        <ChevronRight size={12} />
        <span className="text-slate-600 font-medium">{l2.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-8">
        <div className="w-1.5 h-10 rounded-sm shrink-0 mt-1" style={{ background: domain.color }} />
        <div>
          <div className="font-mono text-[11px] text-slate-400">{l2.id}</div>
          <h1 className="font-serif text-2xl text-[#163A5F]">{l2.name}</h1>
          {l2.description && <p className="text-sm text-slate-500 mt-1">{l2.description}</p>}
        </div>
      </div>

      {/* Section 1 — Regulatory obligations */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-200">
          Regulatory Obligations
        </h2>
        {regulations.length === 0 ? (
          <div className="text-sm text-slate-400 p-4 bg-white rounded-xl border border-slate-200">
            No regulatory obligations mapped to this L2 yet.
          </div>
        ) : (
          <div className="space-y-2">
            {regulations.map(r => {
              const colors = OBLIGATION_COLORS[r.regulation.type]
              return (
                <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span
                      className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded"
                      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                    >
                      {OBLIGATION_LABELS[r.regulation.type]}
                    </span>
                    <span className="text-sm font-semibold text-[#163A5F]">{r.regulation.name}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.obligation}</p>
                  <button
                    onClick={() => setModalReg({ regulationId: r.regulationId, l2Id: l2.id, domainId: domain.id })}
                    className="text-[11px] font-semibold text-blue-600 hover:underline mt-2"
                  >
                    → Full requirement
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Section 2 — E2E processes */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-200">
          E2E Processes
        </h2>
        {e2es.length === 0 ? (
          <div className="text-sm text-slate-400 p-4 bg-white rounded-xl border border-slate-200">
            This L2 does not appear in any mapped E2E process.
          </div>
        ) : (
          <div className="space-y-2">
            {e2es.map(m => {
              const critColors = CRITICALITY_COLORS[m.e2e.criticality]
              const stepIndex = m.e2e.steps.findIndex(s => s.l2Ids.includes(l2.id))
              return (
                <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {m.e2e.id}
                    </span>
                    <span className="text-sm font-semibold text-[#163A5F]">{m.e2e.name}</span>
                    <span
                      className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full"
                      style={{ background: critColors.bg, color: critColors.text }}
                    >
                      {m.e2e.criticality}
                    </span>
                  </div>
                  {stepIndex >= 0 && (
                    <div className="text-[11px] text-slate-400 mt-1.5">
                      Step {stepIndex + 1} of {m.e2e.steps.length}
                    </div>
                  )}
                  <p className="text-xs text-slate-600 leading-relaxed mt-1.5">{m.obligation}</p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Section 3 — Sibling L2s */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-200">
          Other L2s in {processGroup.name}
        </h2>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {siblings.map(sibling => {
            const isCurrent = sibling.id === l2.id
            const regCount = data._maps.regMappingsByL2.get(sibling.id)?.length ?? 0
            return (
              <button
                key={sibling.id}
                onClick={() => !isCurrent && navigate(`/${industry}/l2/${sibling.id}`)}
                disabled={isCurrent}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  isCurrent
                    ? 'bg-blue-50 border-blue-200 cursor-default'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs font-medium text-slate-700">{sibling.name}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {regCount} regulation{regCount !== 1 ? 's' : ''}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {modalReg && (
        <RegulationDetailModal
          regulationId={modalReg.regulationId}
          l2Id={modalReg.l2Id}
          domainId={modalReg.domainId}
          onClose={() => setModalReg(null)}
        />
      )}
    </div>
  )
}
