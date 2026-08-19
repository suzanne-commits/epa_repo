#!/usr/bin/env node
/**
 * add-l2.mjs
 * Run: npm run data:add-l2
 *
 * Interactive wizard to add a new L2 process function.
 * Automatically generates the correct sequential ID.
 */

import { createInterface } from 'readline'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dir, '../data/reference')

const rl = createInterface({ input: process.stdin, output: process.stdout })
const q = (prompt) => new Promise(resolve => rl.question(prompt, resolve))

const processGroups    = JSON.parse(readFileSync(join(DATA, 'process_groups.json'), 'utf8'))
const processFunctions = JSON.parse(readFileSync(join(DATA, 'process_functions.json'), 'utf8'))

console.log('\n══ Add New L2 Process Function ═════════════════════════════════\n')
console.log('Process Groups:')
processGroups.forEach(pg => console.log(`  ${pg.id.padEnd(12)} ${pg.name}`))

async function main() {
  const groupId = await q('\nProcess Group ID (e.g. COL-CDD): ')
  const group = processGroups.find(pg => pg.id === groupId)
  if (!group) { console.log('❌ Group not found'); process.exit(1) }

  // Auto-generate next ID
  const existing = processFunctions.filter(pf => pf.processGroupId === groupId)
  const maxSeq = existing.reduce((max, pf) => {
    const seq = parseInt(pf.id.split('-').pop() ?? '0')
    return Math.max(max, seq)
  }, 0)
  const newId = `${groupId}-${String(maxSeq + 1).padStart(3, '0')}`

  console.log(`\nNew L2 ID will be: ${newId}`)

  const name = await q('Process function name: ')
  const description = await q('Description (optional): ')
  const archetypes = (await q('Archetypes (comma-sep, or press Enter for all): ')).split(',').map(s=>s.trim()).filter(Boolean)

  const entry = {
    id: newId,
    processGroupId: groupId,
    domainId: group.domainId,
    industryId: group.industryId,
    name,
    description: description || undefined,
    archetypes: archetypes.length ? archetypes : group.archetypes,
    sortOrder: maxSeq + 1,
  }

  rl.close()

  console.log('\n\n══ OUTPUT: Add to /data/reference/process_functions.json ═══════\n')
  console.log(JSON.stringify(entry, null, 2))
  console.log('\n\n💡 Then run: npm run data:validate to check for issues.\n')
}

main().catch(console.error)
