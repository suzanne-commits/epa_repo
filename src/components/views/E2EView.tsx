import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, Scale } from 'lucide-react'
import { useEPA } from '@/context/EPAContext'
import { getE2ERegulationsForE2E } from '@/utils/dataLoader'
import { CRITICALITY_COLORS, OBLIGATION_COLORS, OBLIGATION_LABELS, type E2EProcess } from '@/types'
import { RegulationDetailModal } from '@/components/modals/RegulationDetailModal'

type Criticality = E2EProcess['criticality']

export function E2EView() {
  const { data, selectedIndustry } = useEPA()
  const navigate = useNavigate()
  const { e2eId } = useParams()
  const [criticalityFilter, setCriticalityFilter] = useState<'all' | Criticality>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [modalReg, setModalReg] = useState<{ regulationId: string; l2Id: string; domainId: string } | null>(null)

  // Deep link support: /:industry/e2e/:e2eId auto-expands and scrolls to that E2E
  useEffect(() => {
    if (!e2eId) return
    setExpanded(prev => new Set(prev).add(e2eId))
    const el = document.getElementById(`e2e-${e2eId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [e2eId])

  const e2es = useMemo(() => {
    if (!data) return []
    return data.e2eProcesses
      .filter(e => e.industryId === selectedIndustry)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [data, selectedIndustry])

  const filtered = useMemo(
    () => e2es.filter(e => criticalityFilter === 'all' || e.criticality === criticalityFilter),
    [e2es, criticalityFilter]
  )

  const grouped = useMemo(() => {
    const map = new Map<string, { color: string; sortOrder: number; items: E2EProcess[] }>()
    for (const e of filtered) {
      const g = map.get(e.group) ?? { color: e.groupColor, sortOrder: e.groupSortOrder, items: [] }
      g.items.push(e)
      map.set(e.group, g)
    }
    return Array.from(map.entries()).sort((a, b) => a[1].sortOrder - b[1].sortOrder)
  }, [filtered])

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!data) return null

  const criticalCount = e2es.filter(e => e.criticality === 'critical').length
  const importantCount = e2es.filter(e => e.criticality === 'important').length

  return (
    <div>
      <h1 className="font-serif text-2xl text-[#163A5F] mb-4">End-to-End Processes</h1>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <StatPill label="Total E2Es" value={e2es.length} />
        <StatPill label="Critical" value={criticalCount} color={CRITICALITY_COLORS.critical} />
        <StatPill label="Important" value={importantCount} color={CRITICALITY_COLORS.important} />
      </div>

      {/* Criticality filter */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        <FilterChip label="All" active={criticalityFilter === 'all'} onClick={() => setCriticalityFilter('all')} />
        {(['critical', 'important', 'operational'] as Criticality[]).map(c => (
          <FilterChip
            key={c}
            label={c[0].toUpperCase() + c.slice(1)}
            active={criticalityFilter === c}
            onClick={() => setCriticalityFilter(c)}
            color={CRITICALITY_COLORS[c]}
          />
        ))}
      </div>

      {grouped.length === 0 && (
        <div className="text-sm text-slate-400 p-8 text-center">No E2E processes match this filter.</div>
      )}

      {grouped.map(([groupName, group]) => (
        <section key={groupName} className="mb-10">
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-3 pb-2 border-b-2"
            style={{ color: group.color, borderColor: group.color }}
          >
            {groupName}
          </h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {group.items.map(e2e => (
              <E2ECard
                key={e2e.id}
                e2e={e2e}
                expanded={expanded.has(e2e.id)}
                onToggle={() => toggle(e2e.id)}
                onNavigateL2={l2Id => navigate(`/${selectedIndustry}/l2/${l2Id}`)}
                onOpenRegulation={setModalReg}
              />
            ))}
          </div>
        </section>
      ))}

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

function StatPill({ label, value, color }: { label: string; value: number; color?: { bg: string; text: string } }) {
  return (
    <div
      className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white flex items-baseline gap-2"
      style={color ? { background: color.bg } : undefined}
    >
      <span className="text-lg font-bold" style={{ color: color?.text ?? '#163A5F' }}>{value}</span>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  )
}

function FilterChip({
  label, active, onClick, color,
}: { label: string; active: boolean; onClick: () => void; color?: { bg: string; text: string } }) {
  if (active && color) {
    return (
      <button onClick={onClick} className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: color.bg, color: color.text }}>
        {label}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
        active ? 'bg-[#163A5F] text-white border-[#163A5F]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  )
}

interface E2ECardProps {
  e2e: E2EProcess
  expanded: boolean
  onToggle: () => void
  onNavigateL2: (l2Id: string) => void
  onOpenRegulation: (v: { regulationId: string; l2Id: string; domainId: string }) => void
}

function E2ECard({ e2e, expanded, onToggle, onNavigateL2, onOpenRegulation }: E2ECardProps) {
  const { data } = useEPA()
  if (!data) return null

  const critColors = CRITICALITY_COLORS[e2e.criticality]
  const productLines = data.productLineMappings
    .filter(m => m.type === 'e2e' && m.entityId === e2e.id)
    .map(m => data.productLines.find(pl => pl.id === m.productLineId))
    .filter(Boolean)

  const obligations = getE2ERegulationsForE2E(data, e2e.id)

  return (
    <div id={`e2e-${e2e.id}`} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex">
      <div className="w-1 shrink-0" style={{ background: e2e.groupColor }} />
      <div className="flex-1 min-w-0">
        <button onClick={onToggle} className="w-full text-left p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
              {e2e.id}
            </span>
            {expanded ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <h3 className="font-serif text-base text-[#163A5F]">{e2e.name}</h3>
            <span
              className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full"
              style={{ background: critColors.bg, color: critColors.text }}
            >
              {e2e.criticality}
            </span>
          </div>
          <p className="text-xs text-slate-500 italic mt-1.5 leading-relaxed">{e2e.objective}</p>
          {productLines.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {productLines.map(pl => pl && (
                <span key={pl.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                  {pl.icon} {pl.shortName}
                </span>
              ))}
            </div>
          )}
        </button>

        {expanded && (
          <div className="border-t border-slate-100 p-4 space-y-4">
            <div className="bg-slate-50 border-l-4 rounded-r-lg p-3 text-xs text-slate-600 leading-relaxed" style={{ borderColor: critColors.dot }}>
              {e2e.criticalityReason}
            </div>

            {e2e.farAccountability && (
              <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-1">FAR Accountability</div>
                <div className="text-xs text-amber-800 leading-relaxed">{e2e.farAccountability}</div>
              </div>
            )}

            {/* Steps */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Process steps</div>
              <ol className="space-y-2">
                {e2e.steps.map((step, i) => {
                  const group = data._maps.processGroupById.get(step.processGroupId)
                  const domain = group ? data._maps.domainById.get(group.domainId) : undefined
                  return (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span className="font-mono text-slate-300 mt-0.5">{i + 1}</span>
                      <div>
                        <span className="text-slate-500">{domain?.shortName ?? group?.domainId} · {group?.name ?? step.processGroupId}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {step.l2Ids.map(l2Id => {
                            const l2 = data._maps.processFunctionById.get(l2Id)
                            return (
                              <button
                                key={l2Id}
                                onClick={() => onNavigateL2(l2Id)}
                                className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                              >
                                {l2?.name ?? l2Id}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* Regulatory obligations */}
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                <Scale size={12} /> Regulatory obligations
              </div>
              {obligations.length === 0 ? (
                <div className="text-xs text-slate-400">No mapped regulatory obligations yet.</div>
              ) : (
                <div className="space-y-2">
                  {obligations.map(o => {
                    const colors = OBLIGATION_COLORS[o.regulation.type]
                    return (
                      <div key={o.id} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded"
                              style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                            >
                              {OBLIGATION_LABELS[o.regulation.type]}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">{o.regulation.shortName}</span>
                            <span className="font-mono text-[10px] text-slate-400">{o.regulation.ref}</span>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1.5">↳ L2: {o.l2?.name ?? o.l2Id}</div>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{o.obligation}</p>
                        <button
                          onClick={() =>
                            onOpenRegulation({ regulationId: o.regulationId, l2Id: o.l2Id, domainId: o.l2?.domainId ?? '' })
                          }
                          className="text-[11px] font-semibold text-blue-600 hover:underline mt-2"
                        >
                          → View full requirement
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
