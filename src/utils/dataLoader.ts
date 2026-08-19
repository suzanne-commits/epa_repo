/**
 * EPA Data Loader
 *
 * Loads reference JSON data files and optionally merges a client overlay.
 * All data is fetched from /data/ which Vite serves as static assets.
 * No backend required — pure static file loading.
 */

import type {
  Industry, Domain, ProcessGroup, ProcessFunction, Regulation,
  RegMapping, E2EProcess, E2ERegMapping, ProductLine, ProductLineMapping,
  Standard, ClientOverlay, EntityOverride,
} from '@/types'

// ─── RAW DATA CACHE ──────────────────────────────────────────────────────────

let cache: EPAData | null = null
const clientCache = new Map<string, EPAData>()

export interface EPAData {
  industries: Industry[]
  domains: Domain[]
  processGroups: ProcessGroup[]
  processFunctions: ProcessFunction[]
  regulations: Regulation[]
  regMappings: RegMapping[]
  e2eProcesses: E2EProcess[]
  e2eRegMappings: E2ERegMapping[]
  productLines: ProductLine[]
  productLineMappings: ProductLineMapping[]
  standards: Standard[]
  // Derived lookup maps for O(1) access
  _maps: DataMaps
}

export interface DataMaps {
  domainById: Map<string, Domain>
  processGroupById: Map<string, ProcessGroup>
  processFunctionById: Map<string, ProcessFunction>
  regulationById: Map<string, Regulation>
  // regMappings indexed by l2Id for fast L2 → regulation lookup
  regMappingsByL2: Map<string, RegMapping[]>
  // regMappings indexed by regulationId for fast regulation → process lookup
  regMappingsByReg: Map<string, RegMapping[]>
  // regMappings indexed by domainId
  regMappingsByDomain: Map<string, RegMapping[]>
  // e2eRegMappings indexed by e2eId
  e2eRegMappingsByE2E: Map<string, E2ERegMapping[]>
  // e2eRegMappings indexed by l2Id
  e2eRegMappingsByL2: Map<string, E2ERegMapping[]>
  // processFunctions indexed by processGroupId
  functionsByGroup: Map<string, ProcessFunction[]>
  // processGroups indexed by domainId
  groupsByDomain: Map<string, ProcessGroup[]>
  // e2eProcesses indexed by group label
  e2eByGroup: Map<string, E2EProcess[]>
}

// ─── FETCH HELPERS ───────────────────────────────────────────────────────────

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`)
  return res.json() as Promise<T>
}

// ─── LOAD REFERENCE DATA ─────────────────────────────────────────────────────

export async function loadReferenceData(): Promise<EPAData> {
  if (cache) return cache

  const [
    industries, domains, processGroups, processFunctions,
    regulations, regMappings, e2eProcesses, e2eRegMappings,
    productLines, productLineMappings, standards,
  ] = await Promise.all([
    fetchJSON<Industry[]>('/data/reference/industries.json'),
    fetchJSON<Domain[]>('/data/reference/domains.json'),
    fetchJSON<ProcessGroup[]>('/data/reference/process_groups.json'),
    fetchJSON<ProcessFunction[]>('/data/reference/process_functions.json'),
    fetchJSON<Regulation[]>('/data/reference/regulations.json'),
    fetchJSON<RegMapping[]>('/data/reference/reg_mappings.json'),
    fetchJSON<E2EProcess[]>('/data/reference/e2e_processes.json'),
    fetchJSON<E2ERegMapping[]>('/data/reference/e2e_reg_mappings.json'),
    fetchJSON<ProductLine[]>('/data/reference/product_lines.json'),
    fetchJSON<ProductLineMapping[]>('/data/reference/product_line_mappings.json'),
    fetchJSON<Standard[]>('/data/reference/standards.json'),
  ])

  cache = buildEPAData({
    industries, domains, processGroups, processFunctions,
    regulations, regMappings, e2eProcesses, e2eRegMappings,
    productLines, productLineMappings, standards,
  })

  return cache
}

// ─── LOAD WITH CLIENT OVERLAY ────────────────────────────────────────────────

export async function loadClientData(clientId: string): Promise<EPAData> {
  if (clientCache.has(clientId)) return clientCache.get(clientId)!

  const [reference, overlay] = await Promise.all([
    loadReferenceData(),
    fetchJSON<ClientOverlay>(`/data/clients/${clientId}/overlay.json`),
  ])

  const merged = applyOverlay(reference, overlay)
  clientCache.set(clientId, merged)
  return merged
}

// ─── OVERLAY MERGE LOGIC ─────────────────────────────────────────────────────

function applyOverlay(reference: EPAData, overlay: ClientOverlay): EPAData {
  let { domains, processGroups, processFunctions, regMappings } = reference

  // Apply archetype filter if specified
  if (overlay.archetypeFilter && overlay.archetypeFilter.length > 0) {
    const af = overlay.archetypeFilter
    domains = domains.filter(d => d.archetypes.some(a => af.includes(a)))
    processGroups = processGroups.filter(pg => pg.archetypes.some(a => af.includes(a)))
    processFunctions = processFunctions.filter(pf => pf.archetypes.some(a => af.includes(a)))
  }

  // Apply domain overrides
  domains = applyEntityOverrides(domains, overlay.domainOverrides, 'domainId') as Domain[]

  // Apply process group overrides
  processGroups = applyEntityOverrides(
    processGroups, overlay.processGroupOverrides, 'processGroupId'
  ) as ProcessGroup[]

  // Apply L2 overrides
  processFunctions = applyEntityOverrides(
    processFunctions, overlay.l2Overrides, 'l2Id'
  ) as ProcessFunction[]

  // Apply hidden domains / e2es
  if (overlay.hiddenDomains?.length) {
    domains = domains.filter(d => !overlay.hiddenDomains.includes(d.id))
  }

  // Merge additional client-specific reg mappings
  if (overlay.additionalRegMappings?.length) {
    regMappings = [...regMappings, ...overlay.additionalRegMappings]
  }

  return buildEPAData({
    ...reference,
    domains,
    processGroups,
    processFunctions,
    regMappings,
  })
}

function applyEntityOverrides<T extends { id: string; name: string }>(
  entities: T[],
  overrides: EntityOverride[],
  idField: string
): T[] {
  const additions = overrides
    .filter(o => o.action === 'add')
    .map(o => ({ ...o, _isClientAddition: true } as unknown as T))

  return [
    ...entities.map(entity => {
      const override = overrides.find(
        o => o.action === 'rename' && o[idField] === entity.id
      )
      if (!override) return entity
      return { ...entity, name: override.name ?? entity.name, _originalName: entity.name }
    }),
    ...additions,
  ]
}

// ─── BUILD DERIVED MAPS ──────────────────────────────────────────────────────

function buildEPAData(raw: Omit<EPAData, '_maps'>): EPAData {
  const _maps = buildMaps(raw)
  return { ...raw, _maps }
}

function buildMaps(data: Omit<EPAData, '_maps'>): DataMaps {
  const domainById = new Map(data.domains.map(d => [d.id, d]))
  const processGroupById = new Map(data.processGroups.map(pg => [pg.id, pg]))
  const processFunctionById = new Map(data.processFunctions.map(pf => [pf.id, pf]))
  const regulationById = new Map(data.regulations.map(r => [r.id, r]))

  const regMappingsByL2 = groupBy(data.regMappings, m => m.l2Id)
  const regMappingsByReg = groupBy(data.regMappings, m => m.regulationId)
  const regMappingsByDomain = groupBy(data.regMappings, m => m.domainId)
  const e2eRegMappingsByE2E = groupBy(data.e2eRegMappings, m => m.e2eId)
  const e2eRegMappingsByL2 = groupBy(data.e2eRegMappings, m => m.l2Id)
  const functionsByGroup = groupBy(data.processFunctions, pf => pf.processGroupId)
  const groupsByDomain = groupBy(data.processGroups, pg => pg.domainId)
  const e2eByGroup = groupBy(data.e2eProcesses, e => e.group)

  return {
    domainById, processGroupById, processFunctionById, regulationById,
    regMappingsByL2, regMappingsByReg, regMappingsByDomain,
    e2eRegMappingsByE2E, e2eRegMappingsByL2,
    functionsByGroup, groupsByDomain, e2eByGroup,
  }
}

function groupBy<T>(arr: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of arr) {
    const key = keyFn(item)
    const existing = map.get(key) ?? []
    map.set(key, [...existing, item])
  }
  return map
}

// ─── QUERY HELPERS ───────────────────────────────────────────────────────────
// These make common queries trivial in components

export function getDomainsForIndustry(data: EPAData, industryId: string): Domain[] {
  return data.domains
    .filter(d => d.industryId === industryId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getProcessGroupsForDomain(data: EPAData, domainId: string): ProcessGroup[] {
  return (data._maps.groupsByDomain.get(domainId) ?? [])
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getProcessFunctionsForGroup(data: EPAData, groupId: string): ProcessFunction[] {
  return (data._maps.functionsByGroup.get(groupId) ?? [])
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getRegulationsForL2(data: EPAData, l2Id: string): Array<RegMapping & { regulation: Regulation }> {
  const mappings = data._maps.regMappingsByL2.get(l2Id) ?? []
  return mappings
    .map(m => ({ ...m, regulation: data._maps.regulationById.get(m.regulationId)! }))
    .filter(m => m.regulation)
}

export function getL2sForRegulation(data: EPAData, regulationId: string): Array<RegMapping & { l2: ProcessFunction; domain: Domain }> {
  const mappings = data._maps.regMappingsByReg.get(regulationId) ?? []
  return mappings
    .map(m => ({
      ...m,
      l2: data._maps.processFunctionById.get(m.l2Id)!,
      domain: data._maps.domainById.get(m.domainId)!,
    }))
    .filter(m => m.l2 && m.domain)
}

export function getE2ERegulationsForE2E(
  data: EPAData, e2eId: string
): Array<E2ERegMapping & { regulation: Regulation; l2: ProcessFunction }> {
  const mappings = data._maps.e2eRegMappingsByE2E.get(e2eId) ?? []
  return mappings
    .map(m => ({
      ...m,
      regulation: data._maps.regulationById.get(m.regulationId)!,
      l2: data._maps.processFunctionById.get(m.l2Id)!,
    }))
    .filter(m => m.regulation)
}

export function getE2EsForL2(data: EPAData, l2Id: string): Array<E2ERegMapping & { e2e: E2EProcess }> {
  const mappings = data._maps.e2eRegMappingsByL2.get(l2Id) ?? []
  return mappings
    .map(m => ({ ...m, e2e: data.e2eProcesses.find(e => e.id === m.e2eId)! }))
    .filter(m => m.e2e)
}

export function filterByArchetype(data: EPAData, archetypeId: string): EPAData {
  if (archetypeId === 'all') return data
  return buildEPAData({
    ...data,
    domains: data.domains.filter(d => d.archetypes.includes(archetypeId)),
    processGroups: data.processGroups.filter(pg => pg.archetypes.includes(archetypeId)),
    processFunctions: data.processFunctions.filter(pf => pf.archetypes.includes(archetypeId)),
  })
}

export function filterByJurisdiction(regulations: Regulation[], jurisdiction: string): Regulation[] {
  if (jurisdiction === 'all') return regulations
  return regulations.filter(r => r.jurisdictions.includes(jurisdiction as any))
}

// Invalidate cache (call after data updates in admin)
export function invalidateCache() {
  cache = null
  clientCache.clear()
}
