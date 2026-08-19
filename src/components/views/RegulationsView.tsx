import { Fragment, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useEPA } from '@/context/EPAContext'
import { getDomainsForIndustry, getL2sForRegulation } from '@/utils/dataLoader'
import {
  OBLIGATION_COLORS, OBLIGATION_LABELS, JURISDICTION_LABELS, TIER_LABELS,
  type ObligationType, type Jurisdiction, type Domain, type Regulation,
} from '@/types'
import { RegulationDetailModal } from '@/components/modals/RegulationDetailModal'

const TIER_ORDER: Domain['tier'][] = ['primary-value-chain', 'enterprise-control', 'enterprise-support']

type Mode = 'process-to-reg' | 'reg-to-process'

export function RegulationsView() {
  const { data, selectedIndustry } = useEPA()
  const { regId } = useParams()
  const [mode, setMode] = useState<Mode>('process-to-reg')
  const [obligationFilter, setObligationFilter] = useState<'all' | ObligationType>('all')
  const [jurisdictionFilter, setJurisdictionFilter] = useState<'all' | Jurisdiction>('all')
  const [modalReg, setModalReg] = useState<{ regulationId: string; l2Id: string; domainId: string } | null>(null)

  // Deep link support: /:industry/regulation/:regId opens the modal directly
  useEffect(() => {
    if (!data || !regId) return
    const mapping = data.regMappings.find(m => m.regulationId === regId)
    setModalReg({ regulationId: regId, l2Id: mapping?.l2Id ?? '', domainId: mapping?.domainId ?? '' })
  }, [data, regId])

  const domains = useMemo(
    () => (data ? getDomainsForIndustry(data, selectedIndustry) : []),
    [data, selectedIndustry]
  )

  const regulations = useMemo(() => {
    if (!data) return []
    return data.regulations
      .filter(r => r.industryIds.includes(selectedIndustry))
      .filter(r => obligationFilter === 'all' || r.type === obligationFilter)
      .filter(r => jurisdictionFilter === 'all' || r.jurisdictions.includes(jurisdictionFilter))
  }, [data, selectedIndustry, obligationFilter, jurisdictionFilter])

  const obligationTypesPresent = useMemo(() => {
    if (!data) return []
    const types = new Set(data.regulations.filter(r => r.industryIds.includes(selectedIndustry)).map(r => r.type))
    return Array.from(types)
  }, [data, selectedIndustry])

  if (!data) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-serif text-2xl text-[#163A5F]">Regulatory Landscape</h1>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            onClick={() => setMode('process-to-reg')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
              mode === 'process-to-reg' ? 'bg-[#163A5F] text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Process → Regulation
          </button>
          <button
            onClick={() => setMode('reg-to-process')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
              mode === 'reg-to-process' ? 'bg-[#163A5F] text-white' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Regulation → Process
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            Obligation type
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip label="All" active={obligationFilter === 'all'} onClick={() => setObligationFilter('all')} />
            {obligationTypesPresent.map(t => (
              <FilterChip
                key={t}
                label={OBLIGATION_LABELS[t]}
                active={obligationFilter === t}
                onClick={() => setObligationFilter(t)}
                color={OBLIGATION_COLORS[t]}
              />
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            Jurisdiction
          </div>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip label="All" active={jurisdictionFilter === 'all'} onClick={() => setJurisdictionFilter('all')} />
            {(Object.keys(JURISDICTION_LABELS) as Jurisdiction[]).map(j => (
              <FilterChip
                key={j}
                label={JURISDICTION_LABELS[j]}
                active={jurisdictionFilter === j}
                onClick={() => setJurisdictionFilter(j)}
              />
            ))}
          </div>
        </div>
      </div>

      {mode === 'process-to-reg' ? (
        <ProcessToRegulationView
          domains={domains}
          regulations={regulations}
          onOpenRegulation={setModalReg}
        />
      ) : (
        <RegulationToProcessView regulations={regulations} onOpenRegulation={setModalReg} />
      )}

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

function FilterChip({
  label, active, onClick, color,
}: { label: string; active: boolean; onClick: () => void; color?: { bg: string; text: string; border: string } }) {
  if (active && color) {
    return (
      <button
        onClick={onClick}
        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
        style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
      >
        {label}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
        active
          ? 'bg-[#163A5F] text-white border-[#163A5F]'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  )
}

// ─── VIEW 1: Process → Regulation ─────────────────────────────────────────

function ProcessToRegulationView({
  domains, regulations, onOpenRegulation,
}: {
  domains: Domain[]
  regulations: Regulation[]
  onOpenRegulation: (v: { regulationId: string; l2Id: string; domainId: string }) => void
}) {
  const { data } = useEPA()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  if (!data) return null

  const regIds = new Set(regulations.map(r => r.id))

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const domainsByTier = new Map<string, Domain[]>()
  for (const d of domains) {
    const list = domainsByTier.get(d.tier) ?? []
    list.push(d)
    domainsByTier.set(d.tier, list)
  }

  return (
    <div>
      {TIER_ORDER.map(tier => {
        const tierDomains = domainsByTier.get(tier) ?? []
        if (tierDomains.length === 0) return null
        return (
          <section key={tier} className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-200">
              {TIER_LABELS[tier]}
            </h2>
            <div className="space-y-2">
              {tierDomains.map(domain => {
                const domainRegMappings = data.regMappings.filter(
                  m => m.domainId === domain.id && regIds.has(m.regulationId)
                )
                const domainRegIds = Array.from(new Set(domainRegMappings.map(m => m.regulationId)))
                if (domainRegIds.length === 0) return null
                const isOpen = expanded.has(domain.id)

                return (
                  <div key={domain.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => toggle(domain.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-1 h-4 rounded-sm" style={{ background: domain.color }} />
                        <span className="font-serif text-base text-[#163A5F]">{domain.name}</span>
                        <span className="text-[11px] text-slate-400">
                          {domainRegIds.length} regulation{domainRegIds.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[10px] uppercase tracking-wide text-slate-400 text-left">
                              <th className="px-4 py-2 font-semibold">Regulation</th>
                              <th className="px-4 py-2 font-semibold">Type</th>
                              <th className="px-4 py-2 font-semibold">Requirements</th>
                              <th className="px-4 py-2 font-semibold">Penalty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {domainRegIds.map(regId => {
                              const reg = data._maps.regulationById.get(regId)
                              if (!reg) return null
                              const colors = OBLIGATION_COLORS[reg.type]
                              const l2Mappings = domainRegMappings.filter(m => m.regulationId === regId)
                              return (
                                <Fragment key={regId}>
                                  <tr className="border-t border-slate-100 align-top">
                                    <td className="px-4 py-3">
                                      <button
                                        onClick={() =>
                                          onOpenRegulation({
                                            regulationId: regId,
                                            l2Id: l2Mappings[0]?.l2Id ?? '',
                                            domainId: domain.id,
                                          })
                                        }
                                        className="text-left text-[#163A5F] font-semibold hover:underline"
                                      >
                                        {reg.shortName}
                                      </button>
                                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">{reg.ref}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
                                        style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                                      >
                                        {OBLIGATION_LABELS[reg.type]}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">
                                      <span className="line-clamp-3">{reg.requirements}</span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-red-700 max-w-xs">
                                      <span className="line-clamp-3">{reg.penalty}</span>
                                    </td>
                                  </tr>
                                  <tr className="bg-slate-50/60">
                                    <td colSpan={4} className="px-4 pb-3">
                                      <div className="flex flex-wrap gap-1.5">
                                        {l2Mappings.map(m => {
                                          const l2 = data._maps.processFunctionById.get(m.l2Id)
                                          if (!l2) return null
                                          return (
                                            <button
                                              key={m.id}
                                              onClick={() =>
                                                onOpenRegulation({ regulationId: regId, l2Id: m.l2Id, domainId: domain.id })
                                              }
                                              className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-100 hover:bg-teal-100"
                                            >
                                              {l2.name}
                                            </button>
                                          )
                                        })}
                                      </div>
                                    </td>
                                  </tr>
                                </Fragment>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

// ─── VIEW 2: Regulation → Process ─────────────────────────────────────────

function RegulationToProcessView({
  regulations, onOpenRegulation,
}: {
  regulations: Regulation[]
  onOpenRegulation: (v: { regulationId: string; l2Id: string; domainId: string }) => void
}) {
  const { data } = useEPA()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  if (!data) return null

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const byType = new Map<string, Regulation[]>()
  for (const r of regulations) {
    const list = byType.get(r.type) ?? []
    list.push(r)
    byType.set(r.type, list)
  }

  return (
    <div className="space-y-8">
      {Array.from(byType.entries()).map(([type, regs]) => {
        const colors = OBLIGATION_COLORS[type as ObligationType]
        return (
          <section key={type}>
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-3 pb-2 border-b border-slate-200" style={{ color: colors.text }}>
              {OBLIGATION_LABELS[type as ObligationType]}
            </h2>
            <div className="space-y-2">
              {regs.map(reg => {
                const isOpen = expanded.has(reg.id)
                const l2s = getL2sForRegulation(data, reg.id)
                const byDomain = new Map<string, typeof l2s>()
                for (const m of l2s) {
                  const list = byDomain.get(m.domainId) ?? []
                  list.push(m)
                  byDomain.set(m.domainId, list)
                }

                return (
                  <div key={reg.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => toggle(reg.id)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[#163A5F]">{reg.name}</div>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">{reg.ref}</div>
                      </div>
                      {isOpen ? <ChevronDown size={16} className="text-slate-400 shrink-0" /> : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
                    </button>

                    {isOpen && (
                      <div className="border-t border-slate-100 p-4 space-y-4">
                        <p className="text-xs text-slate-600 leading-relaxed">{reg.requirements}</p>
                        <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-2.5 text-xs text-red-800">
                          {reg.penalty}
                        </div>

                        {byDomain.size === 0 ? (
                          <div className="text-xs text-slate-400">No mapped process domains yet.</div>
                        ) : (
                          <div className="space-y-3">
                            {Array.from(byDomain.entries()).map(([domainId, mappings]) => {
                              const domain = data._maps.domainById.get(domainId)
                              if (!domain) return null
                              return (
                                <div key={domainId}>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <div className="w-1 h-3.5 rounded-sm" style={{ background: domain.color }} />
                                    <span className="text-xs font-semibold text-slate-700">{domain.name}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pl-3.5">
                                    {mappings.map(m => (
                                      <button
                                        key={m.id}
                                        onClick={() => onOpenRegulation({ regulationId: reg.id, l2Id: m.l2Id, domainId })}
                                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-100 hover:bg-teal-100"
                                      >
                                        {m.l2.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
