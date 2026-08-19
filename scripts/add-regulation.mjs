#!/usr/bin/env node
/**
 * add-regulation.mjs
 * Run: npm run data:add-regulation
 *
 * Interactive wizard to add a new regulation to regulations.json.
 * Generates both the regulation entry and stub reg_mappings entries.
 * Copy the output JSON into the appropriate files.
 */

import { createInterface } from 'readline'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dir, '../data/reference')

const rl = createInterface({ input: process.stdin, output: process.stdout })
const q = (prompt) => new Promise(resolve => rl.question(prompt, resolve))

console.log('\n══ Add New Regulation ══════════════════════════════════════════\n')

async function main() {
  const shortName = await q('Short name (e.g. APRA CPS 230): ')
  const name = await q('Full name: ')
  const ref = await q('Reference (e.g. APRA CPS 230 (July 2025); CPG 230): ')
  const type = await q('Type [aml/conduct/prudential/reporting/operational/data/governance/model]: ')
  const jurisdictions = (await q('Jurisdictions (comma-sep, e.g. AU or AU,UK): ')).split(',').map(s=>s.trim())
  const regulators = (await q('Regulators (comma-sep): ')).split(',').map(s=>s.trim())
  const requirements = await q('Key requirements (one paragraph): ')
  const penalty = await q('Penalty / enforcement: ')
  const effectiveDate = await q('Effective date (YYYY-MM-DD): ')
  const tags = (await q('Tags (comma-sep): ')).split(',').map(s=>s.trim())

  // Generate ID
  const idParts = shortName.toUpperCase().replace(/[^A-Z0-9 ]/g,'').split(' ').slice(0,4)
  const id = 'REG-' + idParts.join('-')

  const regEntry = {
    id,
    industryIds: ['financial-services'],
    name,
    shortName,
    ref,
    type,
    jurisdictions,
    regulators,
    requirements,
    penalty,
    effectiveDate,
    lastUpdated: new Date().toISOString().split('T')[0],
    status: 'current',
    tags,
    notes: '',
  }

  // Show which L2s to map
  const processFunctions = JSON.parse(readFileSync(join(DATA, 'process_functions.json'), 'utf8'))
  console.log('\n── Next: map to L2s ────────────────────────────────────────────')
  console.log('Enter the L2 IDs this regulation applies to (comma-sep):')
  console.log('Available L2s (sample):')
  processFunctions.slice(0, 10).forEach(pf => console.log(`  ${pf.id} — ${pf.name}`))
  console.log('  (run npm run data:stats to see all L2s)')

  const l2Input = await q('\nL2 IDs: ')
  const l2Ids = l2Input.split(',').map(s=>s.trim()).filter(Boolean)

  const domains = JSON.parse(readFileSync(join(DATA, 'domains.json'), 'utf8'))
  const processGroups = JSON.parse(readFileSync(join(DATA, 'process_groups.json'), 'utf8'))

  const stubMappings = l2Ids.map(l2Id => {
    const pf = processFunctions.find(p => p.id === l2Id)
    const pg = pf ? processGroups.find(g => g.id === pf.processGroupId) : null
    const domain = pg ? domains.find(d => d.id === pg.domainId) : null
    return {
      id: `MAP-${l2Id}-${id.replace('REG-','')}`,
      regulationId: id,
      domainId: domain?.id ?? 'UNKNOWN',
      processGroupId: pg?.id ?? 'UNKNOWN',
      l2Id,
      industryId: 'financial-services',
      archetypes: pf?.archetypes ?? [],
      obligation: `[REQUIRED: Describe what ${shortName} specifically requires at ${pf?.name ?? l2Id}]`,
      notes: '',
    }
  })

  rl.close()

  console.log('\n\n══ OUTPUT: Add to /data/reference/regulations.json ════════════\n')
  console.log(JSON.stringify(regEntry, null, 2))
  console.log('\n\n══ OUTPUT: Add to /data/reference/reg_mappings.json ═══════════\n')
  console.log(JSON.stringify(stubMappings, null, 2))
  console.log('\n\n⚠️  Remember to fill in the "obligation" field for each mapping.\n')
}

main().catch(console.error)
