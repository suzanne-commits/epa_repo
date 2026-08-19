#!/usr/bin/env node
/**
 * data-stats.mjs
 * Run: npm run data:stats
 * Shows a summary of what's populated and what's still needed.
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dir, '../data/reference')
const load = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'))

const domains          = load('domains.json')
const processGroups    = load('process_groups.json')
const processFunctions = load('process_functions.json')
const regulations      = load('regulations.json')
const regMappings      = load('reg_mappings.json')
const e2eProcesses     = load('e2e_processes.json')
const e2eRegMappings   = load('e2e_reg_mappings.json')

const mappedDomains = new Set(regMappings.map(m => m.domainId))
const mappedL2s = new Set(regMappings.map(m => m.l2Id))

console.log('\n══ EPA Data Population Status ══════════════════════════════════\n')

// Domain coverage table
console.log('Domain coverage:')
console.log('─'.repeat(70))
domains.forEach(d => {
  const groups = processGroups.filter(pg => pg.domainId === d.id)
  const fns = processFunctions.filter(pf => pf.domainId === d.id)
  const mapped = regMappings.filter(m => m.domainId === d.id)
  const status = fns.length === 0 ? '⬜ EMPTY' :
                 mapped.length === 0 ? '🟡 NO REGS' : '🟢 MAPPED'
  console.log(`${status}  ${d.id.padEnd(6)} ${d.name.padEnd(35)} ${groups.length} groups  ${fns.length} L2s  ${mapped.length} reg maps`)
})

// Regulation coverage
console.log('\nRegulation coverage:')
console.log('─'.repeat(70))
const currentRegs = regulations.filter(r => r.status === 'current')
const mappedRegs = new Set(regMappings.map(m => m.regulationId))
const unmappedRegs = currentRegs.filter(r => !mappedRegs.has(r.id))
console.log(`Total regulations: ${regulations.length} (${currentRegs.length} current, ${regulations.filter(r=>r.status==='superseded').length} superseded)`)
console.log(`Mapped to L2:      ${mappedRegs.size}`)
console.log(`Not yet mapped:    ${unmappedRegs.length}`)
if (unmappedRegs.length) {
  unmappedRegs.forEach(r => console.log(`  ⬜ ${r.shortName}`))
}

// E2E coverage
console.log('\nE2E regulatory mapping coverage:')
console.log('─'.repeat(70))
const mappedE2Es = new Set(e2eRegMappings.map(m => m.e2eId))
e2eProcesses.forEach(e => {
  const regs = e2eRegMappings.filter(m => m.e2eId === e.id)
  const status = regs.length === 0 ? '⬜' : '🟢'
  console.log(`${status} ${e.id.padEnd(10)} ${e.name.padEnd(30)} ${regs.length} obligations`)
})

console.log('\n═══════════════════════════════════════════════════════════════\n')
