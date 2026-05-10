// Severity tier for a flagged finding, computed from how far below the
// required threshold the actual value sits. Pure — no DOM, no figma globals.
//
// Tiers (per the redesign plan):
//   mild:     ≥80% of required
//   moderate: 50–79% of required
//   severe:   <50% of required, OR non-numeric flag (variant/label)
//
// The CSS layer maps each tier to a color via design tokens.

export type SeverityTier = 'mild' | 'moderate' | 'severe'

/**
 * Compute severity tier from numeric actual + required values.
 * If either is missing or non-positive, returns 'severe' (default for
 * findings that don't carry numeric severity — variant misses, missing
 * labels, etc.).
 */
export function severityFromRatio(actual: number, required: number): SeverityTier {
  if (
    !Number.isFinite(actual) ||
    !Number.isFinite(required) ||
    required <= 0
  ) {
    return 'severe'
  }
  const pct = actual / required
  if (pct >= 0.8) return 'mild'
  if (pct >= 0.5) return 'moderate'
  return 'severe'
}

/**
 * Format the percentage-of-required as a compact string for display next to
 * the severity dot. e.g. (47% of required). Returns null when input is
 * non-numeric — caller can simply omit the line.
 */
export function formatPctOfRequired(actual: number, required: number): string | null {
  if (
    !Number.isFinite(actual) ||
    !Number.isFinite(required) ||
    required <= 0
  ) {
    return null
  }
  return `${Math.round((actual / required) * 100)}% of required`
}
