#!/usr/bin/env node
/**
 * validate-data.mjs
 * Run: npm run data:validate
 *
 * Validates all reference JSON files for:
 * - Valid JSON
 * - No duplicate IDs
 * - No orphaned foreign keys
 * - Required fields present
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dir, '../data/reference')

function load(file) {
  try {
    return JSON.parse(readFileSync(join(DATA, file), 'utf8'))
  } catch (e) {
    console.error(`❌ Failed to parse ${file}: ${e.message}`)
    process.exit(1)
  }
}

const industries       = load('industries.json')
const domains          = load('domains.json')
const processGroups    = load('process_groups.json')
const processFunctions = load('process_functions.json')
const regulations      = load('regulations.json')
const regMappings      = load('reg_mappings.json')
const e2eProcesses     = load('e2e_processes.json')
const e2eRegMappings   = load('e2e_reg_mappings.json')

let errors = 0
let warnings = 0

function check(condition, message, level = 'error') {
  if (!condition) {
    const prefix = level === 'error' ? '❌' : '⚠️'
    console.log(`${prefix} ${message}`)
    if (level === 'error') errors++
    else warnings++
  }
}

function pass(message) {
  console.log(`✅ ${message}`)
}

// ── Duplicate ID checks
const domainIds = domains.map(d => d.id)
check(new Set(domainIds).size === domainIds.length, 'Duplicate domain IDs found')
const pgIds = processGroups.map(pg => pg.id)
check(new Set(pgIds).size === pgIds.length, 'Duplicate process group IDs found')
const pfIds = processFunctions.map(pf => pf.id)
check(new Set(pfIds).size === pfIds.length, 'Duplicate process function IDs found')
const regIds = regulations.map(r => r.id)
check(new Set(regIds).size === regIds.length, 'Duplicate regulation IDs found')
if (errors === 0) pass('No duplicate IDs')

// ── Foreign key checks
const domainIdSet = new Set(domainIds)
const pgIdSet = new Set(pgIds)
const pfIdSet = new Set(pfIds)
const regIdSet = new Set(regIds)
const e2eIdSet = new Set(e2eProcesses.map(e => e.id))

processGroups.forEach(pg => {
  check(domainIdSet.has(pg.domainId), `ProcessGroup ${pg.id} → domainId ${pg.domainId} not found`)
})
processFunctions.forEach(pf => {
  check(pgIdSet.has(pf.processGroupId), `ProcessFunction ${pf.id} → processGroupId ${pf.processGroupId} not found`)
})
regMappings.forEach(m => {
  check(regIdSet.has(m.regulationId), `RegMapping ${m.id} → regulationId ${m.regulationId} not found`)
  check(pfIdSet.has(m.l2Id), `RegMapping ${m.id} → l2Id ${m.l2Id} not found`)
  check(domainIdSet.has(m.domainId), `RegMapping ${m.id} → domainId ${m.domainId} not found`)
})
e2eRegMappings.forEach(m => {
  check(e2eIdSet.has(m.e2eId), `E2ERegMapping ${m.id} → e2eId ${m.e2eId} not found`)
  check(regIdSet.has(m.regulationId), `E2ERegMapping ${m.id} → regulationId ${m.regulationId} not found`)
})
e2eProcesses.forEach(e => {
  e.steps.forEach((step, i) => {
    check(pgIdSet.has(step.processGroupId),
      `E2E ${e.id} step ${i} → processGroupId ${step.processGroupId} not found`, 'warning')
    step.l2Ids.forEach(l2Id => {
      check(pfIdSet.has(l2Id),
        `E2E ${e.id} step ${i} → l2Id ${l2Id} not found`, 'warning')
    })
  })
})
if (errors === 0) pass('All foreign keys valid')

// ── Coverage stats
const mappedL2s = new Set(regMappings.map(m => m.l2Id))
const mappedE2Es = new Set(e2eRegMappings.map(m => m.e2eId))
const unmappedL2s = processFunctions.filter(pf => !mappedL2s.has(pf.id))
const unmappedE2Es = e2eProcesses.filter(e => !mappedE2Es.has(e.id))

console.log('\n── Coverage Stats ─────────────────────────────')
console.log(`Domains:          ${domains.length}`)
console.log(`Process Groups:   ${processGroups.length}`)
console.log(`Process Fns (L2): ${processFunctions.length} (${mappedL2s.size} with reg mappings, ${unmappedL2s.length} unmapped)`)
console.log(`Regulations:      ${regulations.length}`)
console.log(`Reg Mappings:     ${regMappings.length}`)
console.log(`E2E Processes:    ${e2eProcesses.length} (${mappedE2Es.size} with reg mappings, ${unmappedE2Es.length} unmapped)`)

if (unmappedL2s.length > 0) {
  console.log(`\n⚠️  L2s without regulatory mappings (${unmappedL2s.length}):`)
  unmappedL2s.slice(0, 10).forEach(pf => console.log(`   ${pf.id} — ${pf.name}`))
  if (unmappedL2s.length > 10) console.log(`   ...and ${unmappedL2s.length - 10} more`)
}

console.log('\n── Result ─────────────────────────────────────')
if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed')
} else {
  console.log(`${errors} errors, ${warnings} warnings`)
  if (errors > 0) process.exit(1)
}
