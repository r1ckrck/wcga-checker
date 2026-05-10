// Build ImageElement DTOs from nodes that have IMAGE paints.
//
// Error-handling policy: silent skip. Candidates that don't carry usable
// fills, are invisible, or lack image paints are simply omitted from the
// returned array. No throws, no warnings — the rest of the audit doesn't
// depend on this list being complete.

import type { ImageElement } from '../shared/dtos'
import { isImageExemptName } from './regex.ts'
import { isFillBearing, type FillBearing } from './guards.ts'

/**
 * SceneNode with the dimensions / visibility fields we need on top of
 * `FillBearing`. Used as the local narrowed type after the guard fires.
 */
type ImageCandidate = BaseNode & FillBearing & {
  width: number
  height: number
  visible: boolean
}

function hasDims(n: BaseNode): n is BaseNode & { width: number; height: number; visible: boolean } {
  return 'width' in n && 'height' in n
}

function firstVisibleImageHash(node: ImageCandidate): string | null {
  if (node.fills === figma.mixed) return null
  for (const p of node.fills) {
    if (p.type === 'IMAGE' && p.visible !== false && p.imageHash) {
      return p.imageHash
    }
  }
  return null
}

export function buildImageElements(candidates: SceneNode[]): ImageElement[] {
  const out: ImageElement[] = []
  for (const node of candidates) {
    if (!isFillBearing(node) || !hasDims(node)) continue
    const cand = node as ImageCandidate
    if (cand.visible === false) continue
    const imageHash = firstVisibleImageHash(cand)
    if (imageHash === null) continue
    out.push({
      kind: 'image',
      id: cand.id,
      name: cand.name,
      width: Math.round(cand.width),
      height: Math.round(cand.height),
      isExempt: isImageExemptName(cand.name),
      imageHash,
    })
  }
  return out
}
