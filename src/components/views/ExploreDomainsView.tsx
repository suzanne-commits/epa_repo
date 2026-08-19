import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react'
import { useEPA } from '@/context/EPAContext'
import {
  getDomainsForIndustry,
  getProcessGroupsForDomain,
  getProcessFunctionsForGroup,
  getRegulationsForL2,
} from '@/utils/dataLoader'
import { OBLIGATION_COLORS, TIER_LABELS, type Domain, type ProcessFunction } from '@/types'
import { RegulationDetailModal } from '@/components/modals/RegulationDetailModal'

const TIER_ORDER: Domain['tier'][] = ['primary-value-chain', 'enterprise-control', 'enterprise-support']

interface SearchHit {
  kind: 'domain' | 'group' | 'l2' | 'regulation'
  label: string
  sublabel: string
  onClick: () => void
}

export function ExploreDomainsView() {
  const { data, selectedIndustry, selectedArchetype, setSelectedArchetype, selectedJurisdiction } = useEPA()

  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [modalReg, setModalReg] = useState<{ regulationId: string; l2Id: string; domainId: string } | null>(null)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const industry = data?.industries.find(i => i.id === selectedIndustry)
  const domains = useMemo(
    () => (data ? getDomainsForIndustry(data, selectedIndustry) : []),
    [data, selectedIndustry]
  )

  const domainsByTier = useMemo(() => {
    const map = new Map<string, Domain[]>()
    for (const d of domains) {
      const list = map.get(d.tier) ?? []
      list.push(d)
      map.set(d.tier, list)
    }
    return map
  }, [domains])

  function toggleDomain(id: string) {
    setExpandedDomains(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleGroup(id: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const searchHits = useMemo<SearchHit[]>(() => {
    if (!data || search.trim().length < 2) return []
    const q = search.trim().toLowerCase()
    const hits: SearchHit[] = []

    for (const d of domains) {
      if (d.name.toLowerCase().includes(q)) {
        hits.push({
          kind: 'domain',
          label: d.name,
          sublabel: 'Domain',
          onClick: () => {
            setExpandedDomains(prev => new Set(prev).add(d.id))
            setSearch('')
            setSearchOpen(false)
          },
        })
      }
      const groups = getProcessGroupsForDomain(data, d.id)
      for (const g of groups) {
        if (g.name.toLowerCase().includes(q)) {
          hits.push({
            kind: 'group',
            label: g.name,
            sublabel: `${d.name} · Process Group`,
            onClick: () => {
              setExpandedDomains(prev => new Set(prev).add(d.id))
              setExpandedGroups(prev => new Set(prev).add(g.id))
              setSearch('')
              setSearchOpen(false)
            },
          })
        }
        const l2s = getProcessFunctionsForGroup(data, g.id)
        for (const l2 of l2s) {
          if (l2.name.toLowerCase().includes(q)) {
            hits.push({
              kind: 'l2',
              label: l2.name,
              sublabel: `${d.name} · ${g.name}`,
              onClick: () => {
                setExpandedDomains(prev => new Set(prev).add(d.id))
                setExpandedGroups(prev => new Set(prev).add(g.id))
                setSearch('')
                setSearchOpen(false)
              },
            })
          }
        }
      }
    }

    for (const r of data.regulations) {
      if (r.name.toLowerCase().includes(q)) {
        hits.push({
          kind: 'regulation',
          label: r.name,
          sublabel: `Regulation · ${r.ref}`,
          onClick: () => {
            const mapping = data.regMappings.find(m => m.regulationId === r.id)
            if (mapping) {
              setExpandedDomains(prev => new Set(prev).add(mapping.domainId))
              setExpandedGroups(prev => new Set(prev).add(mapping.processGroupId))
              setModalReg({ regulationId: r.id, l2Id: mapping.l2Id, domainId: mapping.domainId })
            }
            setSearch('')
            setSearchOpen(false)
          },
        })
      }
    }

    return hits.slice(0, 20)
  }, [data, search, domains])

  if (!data || !industry) return null

  return (
    <div>
      {/* Industry header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-[#163A5F]">{industry.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{industry.description}</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search domains, processes, regulations…"
              className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {searchOpen && search.trim().length >= 2 && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSearchOpen(false)} />
              <div className="absolute z-40 mt-1 w-full max-h-80 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-xl">
                {searchHits.length === 0 ? (
                  <div className="p-3 text-sm text-slate-400">No matches</div>
                ) : (
                  searchHits.map((hit, i) => (
                    <button
                      key={i}
                      onClick={hit.onClick}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    >
                      <div className="text-sm text-slate-800">{hit.label}</div>
                      <div className="text-[11px] text-slate-400">{hit.sublabel}</div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Archetype filter */}
      {industry.archetypes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            onClick={() => setSelectedArchetype('all')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              selectedArchetype === 'all'
                ? 'bg-[#163A5F] text-white border-[#163A5F]'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            All ({domains.length})
          </button>
          {industry.archetypes.map(a => {
            const count = domains.filter(d => d.archetypes.includes(a.id)).length
            return (
              <button
                key={a.id}
                onClick={() => setSelectedArchetype(a.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  selectedArchetype === a.id
                    ? 'bg-[#163A5F] text-white border-[#163A5F]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {a.name} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Tier sections */}
      {TIER_ORDER.map(tier => {
        const tierDomains = domainsByTier.get(tier) ?? []
        if (tierDomains.length === 0) return null
        return (
          <section key={tier} className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-200">
              {TIER_LABELS[tier]}
            </h2>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {tierDomains.map(domain => (
                <DomainCard
                  key={domain.id}
                  domain={domain}
                  expanded={expandedDomains.has(domain.id)}
                  onToggle={() => toggleDomain(domain.id)}
                  expandedGroups={expandedGroups}
                  onToggleGroup={toggleGroup}
                  selectedArchetype={selectedArchetype}
                  selectedJurisdiction={selectedJurisdiction}
                  onOpenRegulation={setModalReg}
                />
              ))}
            </div>
          </section>
        )
      })}

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

interface DomainCardProps {
  domain: Domain
  expanded: boolean
  onToggle: () => void
  expandedGroups: Set<string>
  onToggleGroup: (id: string) => void
  selectedArchetype: string
  selectedJurisdiction: string
  onOpenRegulation: (v: { regulationId: string; l2Id: string; domainId: string }) => void
}

function DomainCard({
  domain, expanded, onToggle, expandedGroups, onToggleGroup,
  selectedArchetype, selectedJurisdiction, onOpenRegulation,
}: DomainCardProps) {
  const { data } = useEPA()
  if (!data) return null

  const groups = getProcessGroupsForDomain(data, domain.id)
  const l2Count = groups.reduce((sum, g) => sum + getProcessFunctionsForGroup(data, g.id).length, 0)
  const isApplicable = selectedArchetype === 'all' || domain.archetypes.includes(selectedArchetype)

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 overflow-hidden transition-opacity ${
        isApplicable ? '' : 'opacity-40'
      }`}
    >
      <button onClick={onToggle} className="w-full text-left flex items-stretch">
        <div className="w-1 self-stretch rounded-l-sm shrink-0" style={{ background: domain.color }} />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div
                className="text-[10px] font-mono font-semibold uppercase tracking-wide"
                style={{ color: domain.color }}
              >
                {domain.shortName} · L0 Domain
              </div>
              <h3 className="font-serif text-lg text-[#163A5F] mt-0.5">{domain.name}</h3>
            </div>
            {expanded ? (
              <ChevronDown size={16} className="text-slate-400 shrink-0 mt-1" />
            ) : (
              <ChevronRight size={16} className="text-slate-400 shrink-0 mt-1" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{domain.description}</p>

          {domain.archetypes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {domain.archetypes.map(a => (
                <span
                  key={a}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500"
                >
                  {a}
                </span>
              ))}
            </div>
          )}

          <div className="text-[11px] text-slate-400 mt-2.5">
            {groups.length} process group{groups.length !== 1 ? 's' : ''} · {l2Count} L2
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-100">
          {groups.length === 0 ? (
            <div className="p-4 text-xs text-slate-400">No process groups defined yet.</div>
          ) : (
            groups.map(group => (
              <ProcessGroupAccordion
                key={group.id}
                groupId={group.id}
                groupName={group.name}
                domainColor={domain.color}
                domainId={domain.id}
                expanded={expandedGroups.has(group.id)}
                onToggle={() => onToggleGroup(group.id)}
                selectedJurisdiction={selectedJurisdiction}
                onOpenRegulation={onOpenRegulation}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface ProcessGroupAccordionProps {
  groupId: string
  groupName: string
  domainColor: string
  domainId: string
  expanded: boolean
  onToggle: () => void
  selectedJurisdiction: string
  onOpenRegulation: (v: { regulationId: string; l2Id: string; domainId: string }) => void
}

function ProcessGroupAccordion({
  groupId, groupName, domainColor, domainId, expanded, onToggle, selectedJurisdiction, onOpenRegulation,
}: ProcessGroupAccordionProps) {
  const { data } = useEPA()
  if (!data) return null

  const l2s = getProcessFunctionsForGroup(data, groupId)

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-700">{groupName}</span>
        <span className="flex items-center gap-2 text-[11px] text-slate-400">
          {l2s.length} L2
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {expanded && (
        <div className="pb-2">
          {l2s.length === 0 ? (
            <div className="px-4 pb-2 text-xs text-slate-400">No L2s defined yet.</div>
          ) : (
            l2s.map(l2 => (
              <L2Row
                key={l2.id}
                l2={l2}
                domainColor={domainColor}
                domainId={domainId}
                selectedJurisdiction={selectedJurisdiction}
                onOpenRegulation={onOpenRegulation}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

interface L2RowProps {
  l2: ProcessFunction
  domainColor: string
  domainId: string
  selectedJurisdiction: string
  onOpenRegulation: (v: { regulationId: string; l2Id: string; domainId: string }) => void
}

function L2Row({ l2, domainColor, domainId, selectedJurisdiction, onOpenRegulation }: L2RowProps) {
  const { data } = useEPA()
  if (!data) return null

  const regs = getRegulationsForL2(data, l2.id)

  return (
    <div className="px-4 py-2 flex items-start gap-2.5">
      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: domainColor }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-mono text-[10px] text-slate-400">{l2.id}</span>
          <span className="text-sm text-slate-700">{l2.name}</span>
        </div>
        {regs.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {regs.map(r => {
              const colors = OBLIGATION_COLORS[r.regulation.type]
              const matchesJurisdiction =
                selectedJurisdiction === 'all' || r.regulation.jurisdictions.includes(selectedJurisdiction as any)
              return (
                <button
                  key={r.id}
                  onClick={() => onOpenRegulation({ regulationId: r.regulationId, l2Id: l2.id, domainId })}
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-opacity ${
                    matchesJurisdiction ? '' : 'opacity-30'
                  }`}
                  style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                >
                  {r.regulation.shortName}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
