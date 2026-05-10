// 1.4.1, 2.4.7, 3.3.1, 3.3.3 — variant tree+property diff.
// The only runner that touches figma.* APIs (looks up variant nodes by id).

import type { AuditDTO } from '../../shared/dtos'
import type { Finding } from '../findings.ts'
import {
  diffVariants,
  type VariantDiff,
  type VariantNodeSummary,
  type VariantSubtreeSummary,
} from '../variant-diff.ts'

const COLLECT_TYPES: NodeType[] = [
  'TEXT',
  'VECTOR',
  'BOOLEAN_OPERATION',
  'INSTANCE',
  'RECTANGLE',
  'ELLIPSE',
  'POLYGON',
  'STAR',
  'FRAME',
  'COMPONENT',
  'GROUP',
]

const VAGUE_RE = /\b(invalid|error|wrong|incorrect|required|please fix|try again)\b/i
const SPECIFIC_HINT_RE = /\d|"[^"]+"|'[^']+'|must |should |@|format|example/i

const MAX_VARIANT_NODES = 200

export async function runVariantCheck(dto: AuditDTO): Promise<Finding[]> {
  const out: Finding[] = []
  const componentName = dto.component.name
  const v = dto.variants

  if (!v) {
    return [
      makeNoVariants('1.4.1', componentName),
      makeNoVariants('2.4.7', componentName),
      makeNoVariants('3.3.1', componentName),
      makeNoVariants('3.3.3', componentName),
    ]
  }

  const baseSummary = await buildSubtree(v.defaultVariantId)
  const focusSummary = v.focusVariantId ? await buildSubtree(v.focusVariantId) : null
  const errorSummary = v.errorVariantId ? await buildSubtree(v.errorVariantId) : null

  // 2.4.7 — focus visible
  if (!focusSummary) {
    out.push(flag('2.4.7', componentName, 'No focus variant designed.'))
  } else if (!baseSummary) {
    out.push(unableToTest('2.4.7', componentName, 'Default variant unavailable.'))
  } else {
    const diff = diffVariants(baseSummary, focusSummary)
    if (isEmptyDiff(diff)) {
      out.push(flag('2.4.7', componentName, 'Focus variant has no visible difference from default.'))
    } else {
      out.push(pass('2.4.7', componentName, '2.4.7 — focus variant is visually distinct.'))
    }
  }

  // 1.4.1 / 3.3.1 / 3.3.3 — error variant analysis
  // When the variant doesn't exist, the three error checks all share the same
  // root cause. Collapse to one row so the user reads the finding once instead
  // of three times. Status is unable-to-test (we can't evaluate what isn't
  // there); criterion 1.4.1 is the representative for the (i) reveal.
  if (!errorSummary) {
    out.push(unableToTest(
      '1.4.1',
      componentName,
      'No error variant designed — can\'t test 1.4.1, 3.3.1, or 3.3.3.'
    ))
  } else if (!baseSummary) {
    out.push(unableToTest(
      '1.4.1',
      componentName,
      'Default variant unavailable — can\'t test 1.4.1, 3.3.1, or 3.3.3.'
    ))
  } else {
    const diff = diffVariants(baseSummary, errorSummary)
    out.push(judge1_4_1(componentName, diff))
    out.push(judge3_3_1(componentName, diff))
    out.push(judge3_3_3(componentName, diff))
  }

  return out
}

// ── Diff judges ─────────────────────────────────────────────────────

function isEmptyDiff(diff: VariantDiff): boolean {
  return diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0
}

function changesAreColorOnly(diff: VariantDiff): boolean {
  if (diff.added.length > 0 || diff.removed.length > 0) return false
  if (diff.changed.length === 0) return false
  return diff.changed.every(
    c =>
      (c.fillChanged || c.strokeChanged) &&
      !c.strokeWeightChanged &&
      !c.textChanged &&
      !c.effectsChanged &&
      !c.iconCountChanged
  )
}

function addedTextNodes(diff: VariantDiff): VariantNodeSummary[] {
  return diff.added.filter(n => n.type === 'TEXT' && n.text && n.text.trim().length > 0)
}

function hasNonColorIndicator(diff: VariantDiff): boolean {
  if (diff.added.some(n => n.type !== 'TEXT')) return true
  return diff.changed.some(
    c => c.strokeWeightChanged || c.effectsChanged || c.iconCountChanged
  )
}

function judge1_4_1(componentName: string, diff: VariantDiff): Finding {
  if (changesAreColorOnly(diff)) {
    return flag('1.4.1', componentName, 'Error state uses color alone — add a non-color indicator.')
  }
  return pass('1.4.1', componentName, '1.4.1 — error state encodes more than color.')
}

function judge3_3_1(componentName: string, diff: VariantDiff): Finding {
  const addedTexts = addedTextNodes(diff)
  if (addedTexts.length === 0) {
    return flag('3.3.1', componentName, 'Error state has no message text.')
  }
  if (!hasNonColorIndicator(diff)) {
    return flag('3.3.1', componentName, 'Error state has text but relies on color alone for visual identification.')
  }
  return pass('3.3.1', componentName, '3.3.1 — error state has text plus visual indicator.')
}

function judge3_3_3(componentName: string, diff: VariantDiff): Finding {
  const addedTexts = addedTextNodes(diff)
  if (addedTexts.length === 0) {
    return flag('3.3.3', componentName, 'No error message text to evaluate.')
  }
  // Concatenate added error text and check for vagueness.
  const fullText = addedTexts.map(n => n.text ?? '').join(' ').trim()
  const looksVague = VAGUE_RE.test(fullText) && !SPECIFIC_HINT_RE.test(fullText)
  if (looksVague) {
    return flag(
      '3.3.3',
      componentName,
      `Error message looks vague — add specific guidance. Found: "${fullText.slice(0, 80)}".`
    )
  }
  return pass('3.3.3', componentName, '3.3.3 — error message includes specific guidance.')
}

// ── Subtree summary builder ─────────────────────────────────────────

async function buildSubtree(rootId: string): Promise<VariantSubtreeSummary | null> {
  const node = await figma.getNodeByIdAsync(rootId)
  if (!node || !isSceneNode(node)) return null
  const root = node as SceneNode

  const all: SceneNode[] = [root]
  if ('findAllWithCriteria' in root) {
    const descendants = (root as FrameNode).findAllWithCriteria({ types: COLLECT_TYPES })
    all.push(...descendants)
  }
  if (all.length > MAX_VARIANT_NODES) {
    return null
  }

  const idsByDepth = new Map<string, number>()
  function depthOf(n: SceneNode): number {
    if (n.id === root.id) return 0
    const cached = idsByDepth.get(n.id)
    if (cached !== undefined) return cached
    let d = 0
    let cur: BaseNode | null = n.parent
    while (cur && cur.id !== root.id) {
      d++
      cur = cur.parent
    }
    idsByDepth.set(n.id, d)
    return d
  }

  function chainKey(n: SceneNode): string {
    if (n.id === root.id) return n.name
    const parts: string[] = [n.name]
    let cur: BaseNode | null = n.parent
    while (cur && cur.id !== root.id && cur.type !== 'PAGE' && cur.type !== 'DOCUMENT') {
      parts.unshift(cur.name)
      cur = cur.parent
    }
    return parts.join('>')
  }

  // Cache parent-child indices for fallbackKey.
  function parentIndex(n: SceneNode): number {
    const p = n.parent
    if (!p || !('children' in p)) return 0
    return p.children.indexOf(n)
  }

  const summaries: VariantNodeSummary[] = all
    .filter(n => n.visible !== false)
    .map(n => ({
      key: chainKey(n),
      fallbackKey: `d=${depthOf(n)}|i=${parentIndex(n)}|t=${n.type}`,
      id: n.id,
      name: n.name,
      type: n.type,
      fillHex: extractTopFillHex(n),
      strokeHex: extractTopStrokeHex(n),
      strokeWeight: extractStrokeWeight(n),
      hasEffects: extractHasEffects(n),
      text: n.type === 'TEXT' ? (n as TextNode).characters.slice(0, 60) : null,
      iconCount: countIconDescendants(n),
    }))

  return { rootId: root.id, rootName: root.name, nodes: summaries }
}

function isSceneNode(n: BaseNode): n is SceneNode {
  return 'visible' in n && 'parent' in n
}

function extractTopFillHex(n: SceneNode): string | null {
  if (!('fills' in n)) return null
  const fills = (n as { fills: ReadonlyArray<Paint> | typeof figma.mixed }).fills
  if (fills === figma.mixed) return 'mixed'
  const visible = fills.filter(p => p.visible !== false)
  if (visible.length === 0) return null
  const top = visible[0]
  if (top.type === 'SOLID') {
    const c = top.color
    return rgbFloatToHex(c.r, c.g, c.b)
  }
  return top.type
}

function extractTopStrokeHex(n: SceneNode): string | null {
  if (!('strokes' in n)) return null
  const strokes = (n as { strokes: ReadonlyArray<Paint> }).strokes
  if (!Array.isArray(strokes) || strokes.length === 0) return null
  const visible = strokes.filter(p => p.visible !== false)
  if (visible.length === 0) return null
  const top = visible[0]
  if (top.type === 'SOLID') {
    const c = top.color
    return rgbFloatToHex(c.r, c.g, c.b)
  }
  return top.type
}

function extractStrokeWeight(n: SceneNode): number | null {
  if (!('strokeWeight' in n)) return null
  const w = (n as { strokeWeight: number | typeof figma.mixed }).strokeWeight
  if (w === figma.mixed) return null
  return w
}

function extractHasEffects(n: SceneNode): boolean {
  if (!('effects' in n)) return false
  const effects = (n as { effects: ReadonlyArray<Effect> }).effects
  if (!Array.isArray(effects)) return false
  return effects.some(e => e.visible !== false)
}

function countIconDescendants(n: SceneNode): number {
  if (!('findAll' in n)) return 0
  return (n as FrameNode).findAll(d =>
    d.type === 'INSTANCE' || d.type === 'VECTOR' || d.type === 'BOOLEAN_OPERATION'
  ).length
}

function rgbFloatToHex(r: number, g: number, b: number): string {
  const toHex = (v: number): string =>
    Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// ── Finding factories ───────────────────────────────────────────────

function makeNoVariants(criterion: string, componentName: string): Finding {
  return {
    criterion,
    status: 'unable-to-test',
    scope: 'component',
    nodeId: null,
    nodeName: componentName,
    message: 'No component variants — select a variant component to test.',
  }
}

function flag(criterion: string, componentName: string, message: string): Finding {
  return {
    criterion,
    status: 'flag',
    scope: 'component',
    nodeId: null,
    nodeName: componentName,
    message,
  }
}

function pass(criterion: string, componentName: string, message: string): Finding {
  return {
    criterion,
    status: 'pass',
    scope: 'component',
    nodeId: null,
    nodeName: componentName,
    message,
  }
}

function unableToTest(criterion: string, componentName: string, message: string): Finding {
  return {
    criterion,
    status: 'unable-to-test',
    scope: 'component',
    nodeId: null,
    nodeName: componentName,
    message,
  }
}
