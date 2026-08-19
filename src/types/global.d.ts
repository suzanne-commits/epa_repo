// Ambient global type shim: src/types/index.ts (do not modify) references
// `StandardRef` for Domain.standards / ProcessGroup.standards but never
// declares it. Matches the shape used in /data/reference/domains.json,
// e.g. {"framework":"BIAN","version":"v12","ref":"Customer Onboarding"}.
export {}

declare global {
  interface StandardRef {
    framework: string
    version: string
    ref: string
  }
}
