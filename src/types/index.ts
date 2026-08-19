// ─── CORE ENTITY TYPES ───────────────────────────────────────────────────────

export interface Industry {
  id: string
  name: string
  shortName: string
  description: string
  status: 'active' | 'planned' | 'stub'
  archetypes: Archetype[]
}

export interface Archetype {
  id: string
  name: string
}

export interface Domain {
  id: string
  industryId: string
  name: string
  shortName: string
  tier: 'primary-value-chain' | 'enterprise-control' | 'enterprise-support'
  color: string
  description: string
  archetypes: string[]
  standards: StandardRef[]
  sortOrder: number
  // Set by overlay
  _isClientAddition?: boolean
  _originalName?: string
}

export interface ProcessGroup {
  id: string          // e.g. COL-CDD
  domainId: string
  industryId: string
  name: string
  description: string
  archetypes: string[]
  standards?: StandardRef[]
  sortOrder: number
  _isClientAddition?: boolean
}

export interface ProcessFunction {
  id: string          // e.g. COL-CDD-001
  processGroupId: string
  domainId: string
  industryId: string
  name: string
  description?: string
  archetypes: string[]
  sortOrder: number
  _isClientAddition?: boolean
}

export interface Regulation {
  id: string          // e.g. REG-FATF-AML
  industryIds: string[]
  name: string
  shortName: string
  ref: string
  type: ObligationType
  jurisdictions: Jurisdiction[]
  regulators: string[]
  requirements: string
  penalty: string
  effectiveDate: string
  lastUpdated: string
  status: 'current' | 'pending' | 'superseded' | 'proposed'
  tags: string[]
  notes?: string
}

export interface RegMapping {
  id: string          // e.g. MAP-COL-CDD-001-FATF-AML
  regulationId: string
  domainId: string
  processGroupId: string
  l2Id: string
  industryId: string
  archetypes: string[]
  obligation: string
  notes?: string
}

export interface E2EProcess {
  id: string          // e.g. L2A
  industryId: string
  name: string
  group: string
  groupColor: string
  groupSortOrder: number
  objective: string
  criticality: 'critical' | 'important' | 'operational'
  criticalityReason: string
  archetypes: string[]
  farAccountability?: string
  steps: E2EStep[]
  sortOrder: number
}

export interface E2EStep {
  processGroupId: string
  l2Ids: string[]
}

export interface E2ERegMapping {
  id: string
  e2eId: string
  regulationId: string
  l2Id: string
  industryId: string
  archetypes: string[]
  obligation: string
  sequenceNote: string
}

export interface ProductLine {
  id: string
  industryId: string
  name: string
  shortName: string
  icon: string
  tag: string
  color: string
  description: string
  archetypes: string[]
  sortOrder: number
}

export interface ProductLineMapping {
  id: string
  productLineId: string
  type: 'domain' | 'e2e' | 'regulation'
  entityId: string
  role?: 'primary' | 'supporting'
  acuity?: 'high' | 'medium' | 'low'
  rationale: string
}

export interface Standard {
  id: string
  name: string
  shortName: string
  version: string
  publisher: string
  url: string
  description: string
  industryIds: string[]
  relevantDomains: string[]
}

// ─── CLIENT OVERLAY ───────────────────────────────────────────────────────────

export interface ClientOverlay {
  clientId: string
  clientName: string
  baseIndustryId: string
  archetypeFilter?: string[]
  themeOverride?: {
    primaryColor?: string
    logoText?: string
    logoSubtext?: string
  }
  domainOverrides: EntityOverride[]
  processGroupOverrides: EntityOverride[]
  l2Overrides: EntityOverride[]
  additionalRegMappings: RegMapping[]
  hiddenDomains: string[]
  hiddenE2Es: string[]
}

export interface EntityOverride {
  action: 'rename' | 'add' | 'hide'
  domainId?: string
  processGroupId?: string
  l2Id?: string
  id?: string
  name?: string
  [key: string]: unknown
}

// ─── DERIVED / COMPUTED TYPES ─────────────────────────────────────────────────

// Resolved domain with all its process groups and L2s populated
export interface ResolvedDomain extends Domain {
  processGroups: ResolvedProcessGroup[]
  regulations: RegMapping[]
}

export interface ResolvedProcessGroup extends ProcessGroup {
  processFunctions: ProcessFunction[]
  regulations: RegMapping[]
}

// L2 with all its regulations and E2Es populated — the /l2/:id view
export interface ResolvedL2 extends ProcessFunction {
  domain: Domain
  processGroup: ProcessGroup
  regulations: Array<RegMapping & { regulation: Regulation }>
  e2eProcesses: Array<E2ERegMapping & { e2e: E2EProcess }>
}

// ─── ENUMS ───────────────────────────────────────────────────────────────────

export type ObligationType =
  | 'aml' | 'conduct' | 'prudential' | 'reporting'
  | 'operational' | 'data' | 'governance' | 'regulatory'
  | 'commercial' | 'security' | 'financial' | 'model'

export type Jurisdiction = 'AU' | 'UK' | 'EU' | 'US' | 'INTL'

export const OBLIGATION_LABELS: Record<ObligationType, string> = {
  aml: 'AML / CFT',
  conduct: 'Conduct / Consumer',
  prudential: 'Prudential',
  reporting: 'Reporting',
  operational: 'Operational Resilience',
  data: 'Data & Privacy',
  governance: 'Governance',
  regulatory: 'Regulatory / Licence',
  commercial: 'Commercial / Access',
  security: 'Security / Critical Infrastructure',
  financial: 'Financial',
  model: 'Model Risk',
}

export const OBLIGATION_COLORS: Record<ObligationType, { bg: string; text: string; border: string }> = {
  aml:        { bg: '#F0FDF4', text: '#065F46', border: '#6EE7B7' },
  conduct:    { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  prudential: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  reporting:  { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  operational:{ bg: '#F5F3FF', text: '#5B21B6', border: '#C4B5FD' },
  data:       { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },
  governance: { bg: '#F0FDF4', text: '#166534', border: '#86EFAC' },
  regulatory: { bg: '#FEF3C7', text: '#78350F', border: '#FCD34D' },
  commercial: { bg: '#EFF6FF', text: '#1E3A8A', border: '#BFDBFE' },
  security:   { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  financial:  { bg: '#F5F3FF', text: '#4C1D95', border: '#C4B5FD' },
  model:      { bg: '#F0FFFE', text: '#134E4A', border: '#99F6E4' },
}

export const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  AU: '🇦🇺 Australia',
  UK: '🇬🇧 United Kingdom',
  EU: '🇪🇺 European Union',
  US: '🇺🇸 United States',
  INTL: '🌐 International',
}

export const TIER_LABELS: Record<string, string> = {
  'primary-value-chain': 'Primary Value Chain',
  'enterprise-control': 'Enterprise Control & Enablement',
  'enterprise-support': 'Enterprise Support',
}

export const CRITICALITY_COLORS = {
  critical:    { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  important:   { bg: '#EFF6FF', text: '#1E3A8A', dot: '#3B82F6' },
  operational: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
}
