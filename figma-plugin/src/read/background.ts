// Ancestor walk: find the first opaque solid surface behind a given node.
// "Behind" means an ancestor whose bounding box fully contains the node's
// bounding box and whose top fill resolves to a solid color.
//
// Error-handling policy: silent fallback. When no resolvable surface is
// found we return a `BackgroundSample` with `kind: 'unresolvable'` and a
// reason — the runner downstream surfaces that as `unable-to-test`. Never
// throws.

import type { BackgroundSample } from '../shared/dtos'
import { boxContains, toBBoxOrNull } from './geometry.ts'
import { isFillBearing, type FillBearing } from './guards.ts'
import { resolveNodeFills } from './color.ts'

export interface SampleBackgroundOptions {
  /**
   * Bug 6 — when the ancestor walk yields no enclosing surface (typical for
   * carousel cards whose bounding boxes extend beyond the audited component's
   * frame), fall back to the audit root's background. This assumes the user
   * intends content rendered outside the visible viewport to share the same
   * surface as the visible portion. Pass the audited node as `rootFallback`.
   */
  rootFallback?: SceneNode
}

/**
 * Try to resolve a node's own fill as a usable surface (opaque solid).
 * Returns null when the node has no visible solid fill, or a non-solid like a
 * gradient/image — the caller decides whether to surface that as an
 * unresolvable reason or keep searching.
 */
async function resolveAsSurface(
  node: SceneNode
): Promise<BackgroundSample | null> {
  if (!isFillBearing(node as BaseNode)) return null
  const fb = node as FillBearing
  const fills = fb.fills
  if (fills === figma.mixed || fills.length === 0) return null
  const visibleFills = fills.filter(p => p.visible !== false)
  if (visibleFills.length === 0) return null

  const resolved = await resolveNodeFills(fb, fb)
  if (resolved.source.kind === 'unresolvable') {
    const reason = resolved.source.reason
    if (reason === 'gradient' || reason === 'image' || reason === 'pattern' || reason === 'video') {
      return { kind: 'unresolvable', reason }
    }
    return null
  }
  if (!resolved.rgba || !resolved.hex) return null
  if (resolved.rgba[3] < 1) return null

  return {
    kind: 'solid',
    hex: resolved.hex,
    rgba: resolved.rgba,
    source: resolved.source,
    ancestorId: node.id,
  }
}

/**
 * Walk parents upward until we find a solid surface. Skips boolean operations
 * (masks, not surfaces) and ancestors whose bbox doesn't enclose the node.
 *
 * Bug 6 fallback: if no enclosing ancestor is found and the caller supplied a
 * `rootFallback`, try resolving the root's surface — useful when content
 * extends beyond the audited component's bounds (carousels, off-canvas rows).
 */
export async function sampleBackground(
  node: SceneNode,
  options: SampleBackgroundOptions = {}
): Promise<BackgroundSample> {
  const elementBox = toBBoxOrNull(node.absoluteBoundingBox)
  if (!elementBox) return { kind: 'unresolvable', reason: 'no-ancestor' }

  let current: BaseNode | null = node.parent
  while (current && current.type !== 'PAGE' && current.type !== 'DOCUMENT') {
    if (current.type === 'BOOLEAN_OPERATION') {
      current = current.parent
      continue
    }
    if (!isFillBearing(current)) {
      current = current.parent
      continue
    }
    const ancestorBox = toBBoxOrNull((current as SceneNode).absoluteBoundingBox)
    if (!ancestorBox || !boxContains(ancestorBox, elementBox)) {
      current = current.parent
      continue
    }
    const surface = await resolveAsSurface(current as SceneNode)
    if (surface) return surface
    current = current.parent
  }

  // Bug 6 — fallback to root's surface if provided. We bypass the bbox
  // containment check intentionally (that's what the fallback is for).
  if (options.rootFallback && options.rootFallback.id !== node.id) {
    const rootSurface = await resolveAsSurface(options.rootFallback)
    if (rootSurface) return rootSurface
  }

  return { kind: 'unresolvable', reason: 'no-ancestor' }
}
