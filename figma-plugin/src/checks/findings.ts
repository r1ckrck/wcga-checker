// Finding shapes shared across runners and the orchestrator.

export type FindingStatus = 'pass' | 'flag' | 'unable-to-test'
export type FindingScope = 'component' | 'element'

export interface Finding {
  criterion: string
  status: FindingStatus
  scope: FindingScope
  nodeId: string | null
  nodeName: string | null
  message: string
  details?: Record<string, unknown>
}

export interface ManualCheckItem {
  criterion: string
  name: string
  applicable: boolean
  hint?: string
}

export interface FindingsReport {
  passes: Finding[]
  flags: Finding[]
  unableToTest: Finding[]
  manual: ManualCheckItem[]
  warnings: string[]
}

/**
 * Aggregate per-element findings into criterion buckets.
 *
 * Per-element passes are ALWAYS preserved — even when other elements on the
 * same criterion failed or couldn't be tested. The renderer surfaces them
 * in the pass disclosure so the user can see exactly which elements passed,
 * not just the failures. Earlier behaviour (drop passes when any flag
 * exists) hid useful information; the new rule is "loud failures, AND
 * surface every per-element pass."
 *
 * Element-less component-scoped passes (e.g. variant audit summaries) flow
 * through unchanged.
 */
export function aggregate(findings: Finding[]): {
  passes: Finding[]
  flags: Finding[]
  unableToTest: Finding[]
} {
  const byCriterion = new Map<string, Finding[]>()
  for (const f of findings) {
    const arr = byCriterion.get(f.criterion) ?? []
    arr.push(f)
    byCriterion.set(f.criterion, arr)
  }

  const passes: Finding[] = []
  const flags: Finding[] = []
  const unableToTest: Finding[] = []

  for (const [, group] of byCriterion) {
    passes.push(...group.filter(f => f.status === 'pass'))
    flags.push(...group.filter(f => f.status === 'flag'))
    unableToTest.push(...group.filter(f => f.status === 'unable-to-test'))
  }

  return { passes, flags, unableToTest }
}
