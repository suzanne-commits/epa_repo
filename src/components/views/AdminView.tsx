/**
 * AdminView — Data Maintenance Tool
 *
 * Allows viewing and updating the EPA reference data without touching code.
 * All changes are shown as JSON to copy into the data files.
 * In a future version this will write directly to the data files via a build hook.
 *
 * BUILD INSTRUCTIONS FOR CLAUDE CODE:
 * This view is the data maintenance interface. It must have four tabs:
 *
 * 1. DATA BROWSER — Browse all reference data entities. Click any entity to
 *    see its full JSON. Shows counts per entity type.
 *
 * 2. ADD / EDIT — Forms for adding new:
 *    - Regulation (produces a draft regulations.json entry + reg_mappings.json entries)
 *    - Domain (produces a domains.json entry)
 *    - Process Group (produces a process_groups.json entry)
 *    - Process Function / L2 (produces a process_functions.json entry)
 *    - E2E Process (produces an e2e_processes.json entry)
 *    All forms produce copy-pasteable JSON output.
 *
 * 3. VALIDATE — Runs validation rules across all data:
 *    - No orphaned foreign keys (every l2Id in reg_mappings exists in process_functions)
 *    - No duplicate IDs within any entity type
 *    - Every regulation has at least one reg_mapping
 *    - Every process group has at least one process function
 *    - Every E2E step references valid process groups and L2s
 *    Shows green/red status per rule.
 *
 * 4. STATS — Shows data completeness:
 *    - Domains: N total, N with full L2 population, N with reg mappings
 *    - Regulations: N total, N mapped to L2s, N in E2E_REG_MAP
 *    - E2E processes: N total, N with regulatory obligations mapped
 *    - Coverage matrix: domains × regulations heatmap
 */

import { useState } from 'react'
import { useEPA } from '@/context/EPAContext'

type AdminTab = 'browser' | 'add' | 'validate' | 'stats'

export function AdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats')
  const { data } = useEPA()

  const TABS: { id: AdminTab; label: string }[] = [
    { id: 'stats',    label: '📊 Data Stats' },
    { id: 'browser',  label: '🗂 Data Browser' },
    { id: 'add',      label: '➕ Add / Edit' },
    { id: 'validate', label: '✅ Validate' },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="text-xs font-mono text-blue-300 uppercase tracking-widest mb-1">
            EPA Suite
          </div>
          <h1 className="text-xl font-bold">Data Maintenance</h1>
          <p className="text-sm text-white/50 mt-1">
            Browse, validate, and generate JSON for the reference data files.
            Copy the output JSON into the appropriate file in /data/reference/.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white/15 text-white'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content — Claude Code implements each tab */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          {activeTab === 'stats' && data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Industries',        count: data.industries.length },
                { label: 'Domains',           count: data.domains.length },
                { label: 'Process Groups',    count: data.processGroups.length },
                { label: 'Process Functions', count: data.processFunctions.length },
                { label: 'Regulations',       count: data.regulations.length },
                { label: 'Reg Mappings',      count: data.regMappings.length },
                { label: 'E2E Processes',     count: data.e2eProcesses.length },
                { label: 'E2E Reg Mappings',  count: data.e2eRegMappings.length },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-black font-mono text-blue-300">{stat.count}</div>
                  <div className="text-xs text-white/50 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
          {activeTab !== 'stats' && (
            <div className="text-center text-white/30 font-mono text-sm py-8">
              {activeTab} tab — Claude Code implements per CLAUDE_CODE_BRIEF.md
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
