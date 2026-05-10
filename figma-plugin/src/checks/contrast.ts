// WCAG 2.1 contrast ratio + color blending.
// Faithful TypeScript port of /scripts/contrast-ratio.py.
// Pure functions over primitive types. No Figma, no DOM, no Node.

export type RGB = readonly [r: number, g: number, b: number]
export type RGBA = readonly [r: number, g: number, b: number, a: number]

export interface ContrastInput {
  fg: string | RGBA
  bg: string | RGB | RGBA
  threshold: number
  fgOpacityMultiplier?: number
}

export interface ContrastResult {
  ratio: number
  threshold: number
  pass: boolean
  fgResolved: RGB
  bgResolved: RGB
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB_RE = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/i

/** Parse `#RGB`, `#RRGGBB`, `#RRGGBBAA`, `rgb(...)`, or `rgba(...)`. Throws on garbage. */
export function parseColor(input: string): RGBA {
  const s = input.trim().toLowerCase()
  if (s.startsWith('#') || HEX_RE.test(s)) {
    const m = s.match(HEX_RE)
    if (m) {
      const h = m[1]
      if (h.length === 3) {
        return [
          parseInt(h[0] + h[0], 16),
          parseInt(h[1] + h[1], 16),
          parseInt(h[2] + h[2], 16),
          1.0,
        ] as const
      }
      if (h.length === 6) {
        return [
          parseInt(h.slice(0, 2), 16),
          parseInt(h.slice(2, 4), 16),
          parseInt(h.slice(4, 6), 16),
          1.0,
        ] as const
      }
      if (h.length === 8) {
        return [
          parseInt(h.slice(0, 2), 16),
          parseInt(h.slice(2, 4), 16),
          parseInt(h.slice(4, 6), 16),
          parseInt(h.slice(6, 8), 16) / 255,
        ] as const
      }
    }
  }
  const m = s.match(RGB_RE)
  if (m) {
    const r = parseInt(m[1], 10)
    const g = parseInt(m[2], 10)
    const b = parseInt(m[3], 10)
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1.0
    return [r, g, b, a] as const
  }
  throw new Error(`Cannot parse color: ${input}`)
}

/** Straight-alpha "over" composite of fg onto opaque bg. r/g/b stay in 0..255. */
export function blendOnBackground(fg: RGBA, bg: RGB): RGB {
  const [r1, g1, b1, a] = fg
  const [r2, g2, b2] = bg
  return [
    r1 * a + r2 * (1 - a),
    g1 * a + g2 * (1 - a),
    b1 * a + b2 * (1 - a),
  ] as const
}

/** WCAG 2.1 relative luminance. Input r/g/b in 0..255; output 0..1. */
export function relativeLuminance(rgb: RGB): number {
  const linearize = (v: number): number => {
    const u = v / 255
    return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * linearize(rgb[0]) + 0.7152 * linearize(rgb[1]) + 0.0722 * linearize(rgb[2])
}

/** Contrast ratio per WCAG 2.1. Output >= 1. */
export function contrastRatio(a: RGB, b: RGB): number {
  const l1 = relativeLuminance(a)
  const l2 = relativeLuminance(b)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function toRGBA(input: string | RGBA | RGB): RGBA {
  if (typeof input === 'string') return parseColor(input)
  if (input.length === 4) return input as RGBA
  return [input[0], input[1], input[2], 1.0] as const
}

function stripAlpha(input: string | RGB | RGBA): RGB {
  if (typeof input === 'string') {
    const c = parseColor(input)
    return [c[0], c[1], c[2]] as const
  }
  return [input[0], input[1], input[2]] as const
}

/**
 * Orchestration sugar mirroring the Python script's `main`. Optionally applies
 * an extra opacity multiplier, alpha-blends fg over bg if needed, computes the
 * ratio, and compares to the threshold. Ratio is rounded to 2 decimals.
 */
export function checkContrast(input: ContrastInput): ContrastResult {
  const fgRaw = toRGBA(input.fg)
  const bgRGB = stripAlpha(input.bg)
  const mul = input.fgOpacityMultiplier ?? 1.0
  const effectiveAlpha = fgRaw[3] * mul
  const fgWithAlpha: RGBA = [fgRaw[0], fgRaw[1], fgRaw[2], effectiveAlpha] as const

  const fgResolved: RGB =
    effectiveAlpha < 1.0
      ? blendOnBackground(fgWithAlpha, bgRGB)
      : ([fgWithAlpha[0], fgWithAlpha[1], fgWithAlpha[2]] as const)

  const rawRatio = contrastRatio(fgResolved, bgRGB)
  return {
    ratio: roundHalfToEven(rawRatio, 2),
    threshold: input.threshold,
    pass: rawRatio >= input.threshold,
    fgResolved,
    bgResolved: bgRGB,
  }
}

// Banker's rounding (round half to even) at the given decimal place.
// Matches Python's `f"{x:.2f}"` behavior — Python uses IEEE 754 round-to-even,
// JavaScript's Math.round is half-away-from-zero. Without this, 1.125 prints
// as "1.13" in JS but "1.12" in Python.
export function roundHalfToEven(n: number, decimals: number): number {
  if (!Number.isFinite(n)) return n
  const factor = Math.pow(10, decimals)
  const scaled = n * factor
  const truncated = Math.trunc(scaled)
  const fraction = scaled - truncated
  const eps = 1e-9
  if (Math.abs(Math.abs(fraction) - 0.5) < eps) {
    return (truncated % 2 === 0 ? truncated : truncated + Math.sign(scaled)) / factor
  }
  return Math.round(scaled) / factor
}
