// Plain-English copy mappings used by the findings renderer. Pure —
// no DOM, no figma globals, no rendering. Centralised so wording stays
// consistent across the UI and is easy to audit by writers.

import type { ColorSourceUnresolvableReason, BackgroundUnresolvableReason } from '../shared/dtos'

/**
 * Translate an internal "unable-to-test" reason enum into a short sentence
 * fragment for display in the muted footer notes inside each group card.
 *
 * Inputs cover both `ColorSourceUnresolvableReason` (foreground side) and
 * `BackgroundUnresolvableReason` (background side). Some values overlap
 * (gradient/image/pattern/video) — we treat them identically. Background-only
 * reasons (no-ancestor / transparent-stack) are background-specific.
 */
export function plainEnglishReason(
  reason: ColorSourceUnresolvableReason | BackgroundUnresolvableReason | string
): string {
  switch (reason) {
    case 'gradient':
      return 'background is a gradient'
    case 'image':
      return 'background is an image'
    case 'pattern':
      return 'background uses a pattern'
    case 'video':
      return 'background is a video'
    case 'mixed':
      return 'element has multiple foreground colors'
    case 'invisible':
      return 'layer is hidden'
    case 'no-ancestor':
      return 'no solid surface above this element'
    case 'transparent-stack':
      return 'every ancestor is transparent'
    case 'no-rgba':
      return 'fill color could not be resolved'
    case 'unknown':
      return 'reason unknown'
    default:
      return reason
  }
}

/** Short label for a typography property failure ("line-height" etc.) → plain title. */
const TYPO_TITLE: Record<string, string> = {
  'line-height': 'Tight line height',
  'letter-spacing': 'Tight letter spacing',
  'paragraph-spacing': 'No paragraph spacing',
  'word-spacing': 'No word spacing',
}

export function typographyTitleFor(property: string): string {
  return TYPO_TITLE[property] ?? `Tight ${property}`
}

/** Friendly property label used in the bar-graph row. */
const TYPO_PROPERTY: Record<string, string> = {
  'line-height': 'Line height',
  'letter-spacing': 'Letter spacing',
  'paragraph-spacing': 'Paragraph spacing',
  'word-spacing': 'Word spacing',
}

export function typographyPropertyLabel(property: string): string {
  return TYPO_PROPERTY[property] ?? property
}

/**
 * Parse a typography "actual" or "required" string emitted by `checkSpacing`
 * (e.g. "157%", "0% (default)", "≥150%", "not set", "120px (1.50x)") into a
 * compact percent number we can drive the bar graph with. Returns null when
 * the string can't be interpreted.
 */
export function parsePercent(s: string | undefined | null): number | null {
  if (typeof s !== 'string') return null
  const m = s.match(/(\d+(?:\.\d+)?)\s*%/)
  if (!m) return null
  const v = Number.parseFloat(m[1])
  return Number.isFinite(v) ? v : null
}

/**
 * Translate a percent (e.g. 150) and font size (px) into the absolute pixel
 * equivalent. Used to render the "(19 px)" annotation alongside the percent.
 * Rounds to 1 decimal place (drops trailing .0).
 */
export function pctToPx(percent: number, fontSize: number): string {
  if (!Number.isFinite(percent) || !Number.isFinite(fontSize) || fontSize <= 0) {
    return ''
  }
  const px = (percent / 100) * fontSize
  const rounded = Math.round(px * 10) / 10
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} px`
}
