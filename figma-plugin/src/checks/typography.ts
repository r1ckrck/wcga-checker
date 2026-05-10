// WCAG 1.4.12 text-spacing minimums.
// Output uses % to speak Figma's language — designers set spacing in % in the
// inspector, so the report stays consistent. The math under the hood still
// works in px (input from the read pipeline) but every emitted value is
// expressed as a percentage of the font size.

export interface SpacingInput {
  fontSize: number
  /** px value resolved from PERCENT/PIXELS by the read pipeline; null = unable to determine; undefined = AUTO (skip the check) */
  lineHeight?: number | null
  /** px value resolved from PERCENT/PIXELS; null = unable to determine */
  letterSpacing?: number | null
  paragraphSpacing?: number | null
  wordSpacing?: number | null
  singleLine?: boolean
}

export type SpacingProperty =
  | 'line-height'
  | 'letter-spacing'
  | 'paragraph-spacing'
  | 'word-spacing'

export interface SpacingResult {
  property: SpacingProperty
  /** Human-readable actual value, e.g. "157%" or "0% (default)" or "not set" */
  actual: string
  /** Human-readable required threshold, e.g. "≥150%" */
  required: string
  /** Numeric values for downstream consumers — percent values, never px */
  actualPercent: number | null
  requiredPercent: number
  pass: boolean | null
}

interface RuleSpec {
  property: SpacingProperty
  /** Required minimum as a percentage of font size */
  thresholdPercent: number
  /**
   * Bug 3: a value of 0 in this property is the Figma default ("no override
   * applied"). For letter-spacing and word-spacing this means the font's
   * natural tracking is in effect — WCAG 1.4.12 is satisfied because the user
   * can still override to the threshold without breaking the layout. Line-
   * height of literal 0 is degenerate and stays a real fail.
   */
  zeroIsDefault: boolean
}

const RULES: Record<SpacingProperty, RuleSpec> = {
  'line-height':       { property: 'line-height',       thresholdPercent: 150, zeroIsDefault: false },
  'letter-spacing':    { property: 'letter-spacing',    thresholdPercent: 12,  zeroIsDefault: true },
  'paragraph-spacing': { property: 'paragraph-spacing', thresholdPercent: 200, zeroIsDefault: false },
  'word-spacing':      { property: 'word-spacing',      thresholdPercent: 16,  zeroIsDefault: true },
}

/** Round a percent to a clean integer when possible, else 1 decimal. */
function fmtPercent(percent: number): string {
  if (!Number.isFinite(percent)) return String(percent)
  // Round to 1 decimal then drop the .0 for whole numbers.
  const rounded = Math.round(percent * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

function evaluate(
  rule: RuleSpec,
  fontSize: number,
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

  const percent = fontSize > 0 ? (valuePx / fontSize) * 100 : 0

  // Bug 3 — Figma default of 0% means "use font's natural tracking", which
  // WCAG 1.4.12 considers fine (user can still override).
  if (rule.zeroIsDefault && valuePx === 0) {
    return {
      property: rule.property,
      actual: '0% (default)',
      required: requiredStr,
      actualPercent: 0,
      requiredPercent: rule.thresholdPercent,
      pass: true,
    }
  }

  return {
    property: rule.property,
    actual: fmtPercent(percent),
    required: requiredStr,
    actualPercent: percent,
    requiredPercent: rule.thresholdPercent,
    pass: percent >= rule.thresholdPercent,
  }
}

/** Run WCAG 1.4.12 spacing checks. Returns one entry per applicable property. */
export function checkSpacing(input: SpacingInput): SpacingResult[] {
  const results: SpacingResult[] = []
  results.push(evaluate(RULES['line-height'], input.fontSize, input.lineHeight))
  results.push(evaluate(RULES['letter-spacing'], input.fontSize, input.letterSpacing))
  if (!input.singleLine) {
    results.push(evaluate(RULES['paragraph-spacing'], input.fontSize, input.paragraphSpacing))
  }
  if (input.wordSpacing !== null && input.wordSpacing !== undefined) {
    results.push(evaluate(RULES['word-spacing'], input.fontSize, input.wordSpacing))
  }
  return results
}
