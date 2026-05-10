// Pure tree + property diff between two variant subtree summaries.
// Built and consumed by runners/variant.ts; isolated here for unit testing.

export interface VariantNodeSummary {
  key: string
  fallbackKey: string
  id: string
  name: string
  type: string
  fillHex: string | null
  strokeHex: string | null
  strokeWeight: number | null
  hasEffects: boolean
  text: string | null
  iconCount: number
}

export interface VariantSubtreeSummary {
  rootId: string
  rootName: string
  nodes: VariantNodeSummary[]
}

export interface VariantNodeChange {
  key: string
  before: VariantNodeSummary
  after: VariantNodeSummary
  fillChanged: boolean
  strokeChanged: boolean
  strokeWeightChanged: boolean
  textChanged: boolean
  effectsChanged: boolean
  iconCountChanged: boolean
}

export interface VariantDiff {
  added: VariantNodeSummary[]
  removed: VariantNodeSummary[]
  changed: VariantNodeChange[]
}

function indexBy<T>(items: T[], key: (t: T) => string): Map<string, T> {
  const m = new Map<string, T>()
  for (const it of items) m.set(key(it), it)
  return m
}

function detectChange(before: VariantNodeSummary, after: VariantNodeSummary): VariantNodeChange | null {
  const fillChanged = before.fillHex !== after.fillHex
  const strokeChanged = before.strokeHex !== after.strokeHex
  const strokeWeightChanged = before.strokeWeight !== after.strokeWeight
  const textChanged = before.text !== after.text
  const effectsChanged = before.hasEffects !== after.hasEffects
  const iconCountChanged = before.iconCount !== after.iconCount
  if (
    !fillChanged &&
    !strokeChanged &&
    !strokeWeightChanged &&
    !textChanged &&
    !effectsChanged &&
    !iconCountChanged
  ) {
    return null
  }
  return {
    key: before.key,
    before,
    after,
    fillChanged,
    strokeChanged,
    strokeWeightChanged,
    textChanged,
    effectsChanged,
    iconCountChanged,
  }
}

export function diffVariants(
  base: VariantSubtreeSummary,
  target: VariantSubtreeSummary
): VariantDiff {
  const baseByKey = indexBy(base.nodes, n => n.key)
  const targetByKey = indexBy(target.nodes, n => n.key)

  const added: VariantNodeSummary[] = []
  const removed: VariantNodeSummary[] = []
  const changed: VariantNodeChange[] = []

  // Pass 1: matched-by-key.
  const consumedBaseKeys = new Set<string>()
  const consumedTargetKeys = new Set<string>()
  for (const [k, after] of targetByKey) {
    const before = baseByKey.get(k)
    if (before) {
      const ch = detectChange(before, after)
      if (ch) changed.push(ch)
      consumedBaseKeys.add(k)
      consumedTargetKeys.add(k)
    }
  }

  // Pass 2: fallback match for remaining nodes (catches simple renames).
  const baseRemaining = base.nodes.filter(n => !consumedBaseKeys.has(n.key))
  const targetRemaining = target.nodes.filter(n => !consumedTargetKeys.has(n.key))
  const baseByFallback = indexBy(baseRemaining, n => n.fallbackKey)
  for (const after of targetRemaining) {
    const before = baseByFallback.get(after.fallbackKey)
    if (before && !consumedBaseKeys.has(before.key)) {
      const ch = detectChange(before, after)
      if (ch) changed.push(ch)
      consumedBaseKeys.add(before.key)
      consumedTargetKeys.add(after.key)
    }
  }

  // Anything still unmatched is added/removed.
  for (const n of base.nodes) if (!consumedBaseKeys.has(n.key)) removed.push(n)
  for (const n of target.nodes) if (!consumedTargetKeys.has(n.key)) added.push(n)

  return { added, removed, changed }
}
