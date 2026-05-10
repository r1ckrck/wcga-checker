// Pure geometry helpers used by the background ancestor walk and form-input
// label detection. No Figma globals.

import type { BBox } from '../shared/dtos'

/**
 * Convert a Figma `Rect` to our DTO `BBox`. Identity copy of the four numeric
 * fields — kept as a function so consumers can rely on a fresh object instead
 * of accidentally retaining a Figma-side reference.
 */
export function toBBox(rect: Rect): BBox {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
}

/**
 * Same conversion, null-tolerant. Useful when the source `absoluteBoundingBox`
 * may be null (background ancestor walk encounters non-renderable nodes).
 */
export function toBBoxOrNull(rect: Rect | null): BBox | null {
  return rect ? toBBox(rect) : null
}

/** True iff `inner` is fully contained within `outer` (≥ on all sides). */
export function boxContains(outer: BBox, inner: BBox): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  )
}

/** True iff the two boxes overlap on both axes. */
export function boxOverlaps(a: BBox, b: BBox): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  )
}

/** True iff `b` sits above or to the left of `a` (label position relative to input). */
export function isAboveOrLeftOf(a: BBox, b: BBox): boolean {
  const above = b.y + b.height <= a.y
  const leftOf = b.x + b.width <= a.x
  return above || leftOf
}
