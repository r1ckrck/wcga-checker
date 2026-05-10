// Single-pass collection of nodes by type. Walks the selected subtree once.
//
// Error-handling policy: pure traversal — no async, no throws. Returns an
// empty bucket for any category that has no matches. Failure modes here are
// limited to nodes that lack `findAllWithCriteria`; we degrade to a single-
// node walk in that case.

import { isFillBearing } from './guards.ts'

const COLLECT_TYPES: NodeType[] = [
  'TEXT',
  'VECTOR',
  'BOOLEAN_OPERATION',
  'INSTANCE',
  'RECTANGLE',
  'ELLIPSE',
  'POLYGON',
  'STAR',
  'LINE',
  'FRAME',
  'COMPONENT',
  'GROUP',
]

/** Drawn primitive shapes — non-vector, non-instance, but still visible
 * geometry that contributes to 1.4.11 (carousel dots, status pills, dividers,
 * pagination indicators, etc.). */
export type ShapeNode = RectangleNode | EllipseNode | PolygonNode | StarNode | LineNode

export interface CollectedNodes {
  texts: TextNode[]
  vectors: Array<VectorNode | BooleanOperationNode>
  shapes: ShapeNode[]
  instances: InstanceNode[]
  imageBearing: SceneNode[]
}

function hasVisibleImageFill(n: BaseNode): boolean {
  if (!isFillBearing(n)) return false
  if (n.fills === figma.mixed) return false
  return n.fills.some(p => p.type === 'IMAGE' && p.visible !== false)
}

/**
 * Traverse the selected node + its subtree. The selected node itself is
 * included — `findAllWithCriteria` only returns descendants, so we manually
 * append the root if it matches a bucket.
 */
export function collect(root: SceneNode): CollectedNodes {
  const supportsCriteria =
    'findAllWithCriteria' in root &&
    typeof (root as { findAllWithCriteria?: unknown }).findAllWithCriteria === 'function'

  const descendants: SceneNode[] = supportsCriteria
    ? (root as FrameNode).findAllWithCriteria({ types: COLLECT_TYPES })
    : []

  const all: SceneNode[] = [root, ...descendants]

  const texts: TextNode[] = []
  const vectors: Array<VectorNode | BooleanOperationNode> = []
  const shapes: ShapeNode[] = []
  const instances: InstanceNode[] = []
  const imageBearing: SceneNode[] = []

  for (const n of all) {
    if (n.visible === false) continue
    if (n.type === 'TEXT') texts.push(n)
    else if (n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION') vectors.push(n)
    else if (
      n.type === 'RECTANGLE' ||
      n.type === 'ELLIPSE' ||
      n.type === 'POLYGON' ||
      n.type === 'STAR' ||
      n.type === 'LINE'
    ) {
      shapes.push(n as ShapeNode)
    } else if (n.type === 'INSTANCE') instances.push(n)
    if (hasVisibleImageFill(n)) imageBearing.push(n)
  }

  return { texts, vectors, shapes, instances, imageBearing }
}
