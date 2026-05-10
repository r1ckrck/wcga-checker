// Shape-predicate guards for Figma scene nodes. Pure — no figma globals at
// runtime, only references the global `figma` namespace types via the plugin
// typings. Single source of truth for "does this node carry a `fills` array"
// and friends; before this module the same predicate lived under three names
// (isFillBearing / hasFills) across image.ts, traverse.ts, background.ts.

/** Node carries an array-shaped `fills` field (excluding `figma.mixed`). */
export type FillBearing = SceneNode & {
  fills: ReadonlyArray<Paint> | typeof figma.mixed
}

/**
 * True when the node has a `fills` property whose value is an array. Filters
 * out both nodes without `fills` at all and nodes whose fills are
 * `figma.mixed` (mixed is never an array).
 */
export function isFillBearing(n: BaseNode): n is BaseNode & FillBearing {
  return 'fills' in n && Array.isArray((n as { fills?: unknown }).fills)
}
