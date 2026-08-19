# EPA Suite — Claude Code Build Brief

**Version:** 1.0 | **Date:** August 2026 | **Status:** Ready to build

---

## What this is

A multi-industry Enterprise Process Architecture (EPA) reference application.
Methodology: governance-first, L0/L1/L2/L3 hierarchy, E2E cross-domain overlays,
regulatory mapping at L2 level, dual views (process→regulation and regulation→process),
product line overlay, client customisation via JSON diff files.

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + React Router v6
**Deployment:** Netlify (static) + Cloudflare access control
**Data:** JSON files in /data/reference/ — NO backend, NO database

---

## What's already done — DO NOT MODIFY

- `/src/types/index.ts` — all TypeScript types. Complete and correct.
- `/src/utils/dataLoader.ts` — data loading, merging, caching, query helpers. Complete.
- `/src/context/EPAContext.tsx` — global state. Complete.
- `/src/main.tsx` — app entry point. Complete.
- `/src/App.tsx` — all routes defined. Complete.
- `/src/components/layout/Layout.tsx` — header nav. Complete.
- `/src/components/views/IndustryHome.tsx` — landing page. Complete.
- `/data/reference/*.json` — all reference data files. Valid JSON, do not touch.
- `/package.json`, `/vite.config.ts`, `/tsconfig.json`, `/tailwind.config.js` — Complete.
- `/netlify.toml` — deployment config. Complete.

---

## What Claude Code builds — in this order

### PHASE 1 — Core views (build these first, stop when done)

#### 1. `ExploreDomainsView.tsx`

The main domain explorer. Reads from `useEPA()`.

**Layout:**
- Industry header bar: industry name, archetype filter buttons (from `data.industries.find(i=>i.id===selectedIndustry).archetypes`), active count
- Three tier sections: Primary Value Chain / Enterprise Control & Enablement / Enterprise Support
- Domain cards in a responsive grid (min 280px columns)

**Domain card (collapsed):**
- Left colour pip (domain.color)
- Domain tag (e.g. "COL · L0 Domain") in domain colour
- Domain name (Playfair Display font)
- Domain description (small grey text)
- Archetype tags row (coloured chips)
- Process group count + L2 count
- Chevron to expand

**Domain card (expanded) — L1 accordion:**
Each process group is an accordion item. When expanded shows L2 list.

**L2 item:**
- Dot in domain colour
- L2 label badge
- L2 name
- Regulation tags (coloured chips by obligation type) — use `getRegulationsForL2(data, pf.id)`
- Clicking a regulation tag opens the Regulation Detail Modal

**Archetype filter:** When archetype selected, dim non-applicable domains but never hide them.
When jurisdiction filter selected, dim L2 reg tags that don't match.

**Search:** Global search across domain names, process group names, L2 names, regulation names.
Show results as a floating list above the content, dismiss on click outside.

---

#### 2. `RegulationsView.tsx`

Two-view regulatory landscape. Toggle at top: "Process → Regulation" / "Regulation → Process".

**View 1 — Process → Regulation (RCSA owner's view):**
- Tier dividers (Primary Value Chain / Enterprise Control / Enterprise Support)
- Domain sections (expandable)
- Inside each domain: table with columns: Regulation | Type | Requirements | Penalty
- Below each regulation row: full-width L2 sub-process chips (teal colour)
  showing which L2s are in scope for that regulation in this domain
- Use `data.regMappings.filter(m => m.domainId === domain.id && m.regulationId === reg.id)`

**View 2 — Regulation → Process (Compliance officer's view):**
- Regulations grouped by obligation type
- Each regulation expandable: shows description, penalty, then all domains it touches
- Each domain shows which L2s are in scope
- Use `getL2sForRegulation(data, reg.id)`

**Filters:** Obligation type filter + Jurisdiction filter (side by side)
Jurisdiction filter uses `regulation.jurisdictions` array — AU/UK/EU/US/INTL

**Regulation Detail Modal** (shared across all views):
Opens when any regulation tag is clicked anywhere in the app.
Shows: obligation type badge, regulation name, ref, regulator, requirements,
penalty, then "L2 sub-processes in scope" with the clicked L2 highlighted blue.
Uses `data.regMappings` filtered by regulation + domain.
Props: `regulationId: string, l2Id: string, domainId: string`
Dismiss: click outside, X button, or Escape key.

---

#### 3. `E2EView.tsx`

E2E process navigator with regulatory obligation section.

**Layout:**
- Intro stats bar (total E2Es, critical count, important count)
- Two filter rows: Criticality filter + (Phase 2) Product line filter
- E2E groups with colour-coded group headers
- E2E cards in a responsive grid

**E2E card (collapsed):**
- Left colour bar (group colour)
- E2E ID badge (e.g. "L2A")
- E2E name + criticality badge
- Objective text (italic)
- Product line tags (which product lines this E2E serves)

**E2E card (expanded):**
- Criticality reason (light background, left border)
- FAR accountability note (if `e2e.farAccountability` exists) — gold colour
- Step list: each step shows domain name + L2 chips
  L2 chips are clickable → navigate to `/[industry]/l2/[l2Id]`
- **Regulatory obligations section** (⚖ icon header):
  Each E2E reg mapping (from `getE2ERegulationsForE2E(data, e2e.id)`) shown as a card:
  - Obligation type badge
  - Regulation name + ref
  - "↳ L2: [l2 name]" — which specific L2 this applies to
  - Obligation statement
  - "→ View full requirement" — opens Regulation Detail Modal

---

#### 4. `L2DetailView.tsx`

The most powerful compliance monitoring view. Route: `/:industry/l2/:l2Id`

Shows a single L2 function with ALL its regulatory context:

**Header:** Domain → Process Group → L2 name. Breadcrumb navigation.

**Section 1 — Regulatory obligations (all regulations that map to this L2):**
For each: obligation type badge, regulation name, specific obligation statement,
"→ Full requirement" button opening modal.
Use `getRegulationsForL2(data, l2Id)`.

**Section 2 — E2E processes this L2 appears in:**
For each E2E: E2E name + criticality, which step this L2 is in, any regulatory obligation
triggered at this L2 within that E2E.
Use `getE2EsForL2(data, l2Id)`.

**Section 3 — All L2s in same process group:**
Sibling L2s with their regulation count. Click to navigate to their detail view.

---

#### 5. Regulation Detail Modal (shared component)

File: `src/components/modals/RegulationDetailModal.tsx`

Used by: ExploreDomainsView, RegulationsView, E2EView, L2DetailView

Props:
```typescript
interface RegulationDetailModalProps {
  regulationId: string
  l2Id?: string        // highlighted L2 (the one clicked)
  domainId?: string    // to scope L2 list
  onClose: () => void
}
```

Content:
- Obligation type badge (coloured per OBLIGATION_COLORS from types)
- Regulation name (Playfair Display, large)
- Reference + status badge
- Jurisdictions chips (🇦🇺 🇬🇧 etc.)
- Regulators (grey text)
- "Where this obligation lands" — obligation statement from the regMapping
  (look up `data.regMappings.find(m => m.regulationId === regulationId && m.l2Id === l2Id)`)
- "Sub-processes in scope within [domain]" — all L2s mapped to this regulation
  in this domain, with the clicked L2 highlighted in blue
- "Full regulatory requirement" — `regulation.requirements`
- "Enforcement & penalty" — `regulation.penalty` (red left border)
- Dismiss: backdrop click, X button, Escape key

---

### PHASE 2 — After Phase 1 is working

#### 6. `ProductLinesView.tsx`

Product line overlay. Nav strip at top showing all product lines for selected industry.

Each product line panel:
- Hero: icon, name, description, primary/supporting domain count, E2E count
- **E2E Processes section (filtered to this product line):**
  From `data.productLineMappings.filter(m => m.productLineId === pl.id && m.type === 'e2e')`
  Each E2E shows only the L2s relevant to this product line.
  "→ view in E2E tab" link navigates to E2E tab with that E2E expanded.
- **Domain footprint:** Primary and supporting domains
- **Key regulations:** `data.productLineMappings.filter(m => m.type === 'regulation')`
- **AI opportunities & risks** (hardcoded per product line for now)

#### 7. Client overlay support

Add client selector to the Layout header.
When clientId is set in URL (`/client/macquarie-dfg`), `useEPA` loads the overlay.
The overlay renames entities — the UI just displays whatever `data` contains,
so client renaming is automatic. No special client rendering code needed.

#### 8. `HowItWorksView.tsx` + `StandardsView.tsx`

How It Works: The methodology narrative — process architecture as control design prerequisite,
COSO ERM validation, the L0/L1/L2/L3 hierarchy visual, E2E as governance frame, FAR as accountability unit.

Standards: Framework reference cards per industry — BIAN, APQC, eTOM, COSO, IIA.
Load from `data.standards` filtered by `industryId`.

---

### PHASE 3 — Admin / data maintenance

#### 9. `AdminView.tsx` — complete the four tabs

The stub is in place. Build the four tabs:

**Stats tab:** Already implemented in stub. Enhance with coverage heatmap.

**Data Browser tab:** 
- Entity type selector (left sidebar): Industries, Domains, Process Groups, L2s, Regulations, Mappings, E2Es
- Entity list (middle): searchable, filterable
- Entity detail (right): full JSON pretty-printed, copy button

**Add/Edit tab:**
Forms for each entity type producing copy-pasteable JSON output.
The scripts in /scripts/ do the same thing — this is the GUI version.
Forms use controlled inputs. On submit, show the JSON to copy. Do NOT write files from the browser.

**Validate tab:**
Run the same checks as scripts/validate-data.mjs in the browser.
Show green/red status per check. Show counts.

---

## Design tokens

All views use Tailwind. Key classes:

```
Colors:
  bg-[#163A5F]        Navy (header background, dark sections)
  text-[#163A5F]      Navy text
  bg-slate-50         Page background
  bg-white            Cards
  border-slate-200    Card borders

Typography:
  font-serif          Playfair Display (domain names, section headers)
  font-mono           IBM Plex Mono (IDs, badges, code)
  font-sans           Inter (body text)

Obligation type badge pattern:
  Use OBLIGATION_COLORS from src/types/index.ts
  Structure: <span style={{background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`}}>

Domain colour pip:
  <div className="w-1 self-stretch rounded-sm" style={{background: domain.color}} />
```

---

## Data access patterns — use these, don't reinvent

```typescript
// In any component
const { data, selectedIndustry, selectedArchetype } = useEPA()

// Get domains for current industry
const domains = getDomainsForIndustry(data, selectedIndustry)

// Get process groups for a domain
const groups = getProcessGroupsForDomain(data, domain.id)

// Get L2s for a process group
const functions = getProcessFunctionsForGroup(data, group.id)

// Get regulations for an L2 (for the reg tag chips)
const regs = getRegulationsForL2(data, l2Id)

// Get all L2s that a regulation applies to
const l2s = getL2sForRegulation(data, regulationId)

// Get regulatory obligations for an E2E
const obligations = getE2ERegulationsForE2E(data, e2eId)

// Get E2Es an L2 appears in
const e2es = getE2EsForL2(data, l2Id)
```

All these are exported from `src/utils/dataLoader.ts`.

---

## Data population status

The data files are populated with Financial Services EPA data:
- **Fully populated:** COL domain (5 process groups, 20 L2s, 11 reg mappings)
- **Schema populated, L2 data needed:** LEN, PAY, RISK, CFC, DDT domains
- **Regulations:** 11 records including FAR, BEAR, APRA CPS 230, DORA, GDPR, IFRS 9
- **E2E processes:** 3 records (L2A, A2D, P2P2) — 14 more to add
- **Other industries:** Schema present, status: 'planned', data to be added

The app must work with partial data — domains with no L2s should render gracefully,
regulations with no mappings should still appear in the regulations view.

---

## Deployment

```bash
# Local dev
npm install
npm run dev

# Validate data before deploy
npm run data:validate
npm run data:stats

# Build for Netlify
npm run build
# Output: /dist — point Netlify to this directory
```

Netlify config is in `netlify.toml` — SPA redirects already configured.
Connect the GitHub repo to Netlify. Push to main = auto deploy.
