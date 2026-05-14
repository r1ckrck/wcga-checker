// Typography readability checks. These are NOT WCAG 1.4.12 — that SC is a
// user-override resilience test (does the design survive a forced 1.5× line
// spacing?), not a designer-shipped minimum. The values here are general
// readability floors that the workshop's audit feedback surfaced.
//
// Thresholds:
//   line-height       ≥ 75%  of font size
//   letter-spacing    ≥ -6%  of font size   (negative tracking allowed up to -6%)
//   paragraph-spacing ≥ 70%  of effective line-height (not font size)
//
// Word-spacing is intentionally absent — Figma doesn't expose a UI for it,
// so we can't measure or fix it at design stage.
//
// SC 1.4.12 itself will be picked up later by the container-resilience runner
// (overflow risk when the user forces 1.5× line-height etc.) — see PLAN.md.

export interface SpacingInput {
  fontSize: number
  /** px value resolved from PERCENT/PIXELS by the read pipeline; null = unable to determine; undefined = AUTO (skip line-height) */
  lineHeight?: number | null
  /** px value resolved from PERCENT/PIXELS; null = unable to determine; can be negative */
  letterSpacing?: number | null
  /** px paragraph spacing from TextNode; null = unable to determine */
  paragraphSpacing?: number | null
  singleLine?: boolean
}

export type SpacingProperty =
  | 'line-height'
  | 'letter-spacing'
  | 'paragraph-spacing'

export interface SpacingResult {
  property: SpacingProperty
  /** Human-readable actual value, e.g. "85%" or "-6%" or "not set" */
  actual: string
  /** Human-readable required threshold, e.g. "≥75%" or "≥-6%" */
  required: string
  /** Numeric values for downstream consumers — percent values */
  actualPercent: number | null
  requiredPercent: number
  pass: boolean | null
}

type Baseline = 'font-size' | 'line-height'

interface RuleSpec {
  property: SpacingProperty
  thresholdPercent: number
  baseline: Baseline
}

const RULES: Record<SpacingProperty, RuleSpec> = {
  'line-height':       { property: 'line-height',       thresholdPercent: 75,  baseline: 'font-size' },
  'letter-spacing':    { property: 'letter-spacing',    thresholdPercent: -6,  baseline: 'font-size' },
  'paragraph-spacing': { property: 'paragraph-spacing', thresholdPercent: 70,  baseline: 'line-height' },
}

/** Round a percent to a clean integer when possible, else 1 decimal. */
function fmtPercent(percent: number): string {
  if (!Number.isFinite(percent)) return String(percent)
  const rounded = Math.round(percent * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

function evaluate(
  rule: RuleSpec,
  baselinePx: number,
  valuePx: number | null | undefined
): SpacingResult {
  const requiredStr = `≥${rule.thresholdPercent}%`

  if (valuePx === null || valuePx === undefined) {
    return {
      property: rule.property,
      actual: 'not set',
      required: requiredStr,
      actualPercent: null,
      requiredPercent: rule.thresholdPercent,
      pass: null,
    }
  }

  const percent = baselinePx > 0 ? (valuePx / baselinePx) * 100 : 0

  return {
    property: rule.property,
    actual: fmtPercent(percent),
    required: requiredStr,
    actualPercent: percent,
    requiredPercent: rule.thresholdPercent,
    pass: percent >= rule.thresholdPercent,
  }
}

/**
 * Effective line-height for paragraph-spacing math. When the designer set an
 * explicit value we use that; when AUTO / unset we approximate at 1.2× font
 * size — Figma's intrinsic auto value sits in the 1.1×–1.3× range for most
 * fonts. Slight inaccuracy is acceptable for a heuristic readability check.
 */
function effectiveLineHeight(input: SpacingInput): number {
  if (input.lineHeight && input.lineHeight > 0) return input.lineHeight
  return input.fontSize * 1.2
}

/** Run readability checks. Returns one entry per applicable property. */
export function checkSpacing(input: SpacingInput): SpacingResult[] {
  const results: SpacingResult[] = []
  results.push(evaluate(RULES['line-height'], input.fontSize, input.lineHeight))
  results.push(evaluate(RULES['letter-spacing'], input.fontSize, input.letterSpacing))
  if (!input.singleLine) {
    results.push(
      evaluate(RULES['paragraph-spacing'], effectiveLineHeight(input), input.paragraphSpacing)
    )
  }
  return results
}
