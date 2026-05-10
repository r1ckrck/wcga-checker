// Alpha compositing helpers used by the color resolver to flatten multi-fill
// stacks. Pure — no Figma globals, no DOM, no async.
//
// Error-handling policy: pure math, no failure modes. Inputs that produce
// degenerate output (transparent stack, zero alpha) return well-defined
// transparent results; never throws.

import type { RGB, RGBA } from '../shared/dtos'
import { blendOnBackground } from '../checks/contrast.ts'

/** Single "over" operator. Re-exported from checks/contrast.ts to keep one source of truth. */
export const over = blendOnBackground

/**
 * Composite a stack of paints (top-first) over an opaque background. Empty
 * stacks return the background unchanged.
 */
export function compositeFills(stack: ReadonlyArray<RGBA>, bg: RGB): RGB {
  if (stack.length === 0) return bg
  // Iterate bottom-up, so each layer is composited "over" the running result.
  let result: RGB = bg
  for (let i = stack.length - 1; i >= 0; i--) {
    result = over(stack[i], result)
  }
  return result
}
