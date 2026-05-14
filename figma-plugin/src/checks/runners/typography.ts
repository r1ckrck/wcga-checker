// Typography readability + 1.4.5 Image of Text. Pure DTO consumer.
//
// Typography findings use criterion `'typography'` (not a WCAG SC) because
// these are general readability floors, not 1.4.12. The reflow check (future)
// will pick up the actual 1.4.12 SC. See PLAN.md.

import type { AuditDTO, ImageElement, TextElement, TextSegment } from '../../shared/dtos'
import type { Finding } from '../findings.ts'
import { checkSpacing } from '../typography.ts'

const TEXT_NAME_RE = /text|heading|title|label|copy/i
const TYPOGRAPHY_CRITERION = 'typography'

export function runTypographyCheck(dto: AuditDTO): Finding[] {
  const findings: Finding[] = []
  for (const text of dto.texts) {
    findings.push(...auditTextSpacing(text))
  }
  for (const img of dto.images) {
    const f = auditImageOfText(img)
    if (f) findings.push(f)
  }
  return findings
}

function auditTextSpacing(text: TextElement): Finding[] {
  const out: Finding[] = []
  // Use the dominant (largest font) segment as the audit subject — matches the
  // parent skill which audited per-text-element, not per-segment.
  const seg = pickAuditSegment(text.segments)
  if (!seg) {
    out.push({
      criterion: TYPOGRAPHY_CRITERION,
      status: 'unable-to-test',
      scope: 'element',
      nodeId: text.id,
      nodeName: text.name,
      message: 'Unable to test — no segments.',
    })
    return out
  }

  // AUTO line-height = no fixed constraint = drop the line-height check
  // entirely. (The paragraph-spacing math still uses a 1.2× fontSize fallback
  // internally — that's an approximation; the line-height check itself is the
  // one that can't be evaluated against AUTO.)
  const isAutoLineHeight = seg.lineHeightUnit === 'AUTO'
  const lineHeight = isAutoLineHeight ? undefined : (seg.lineHeightPx ?? null)

  const rawResults = checkSpacing({
    fontSize: seg.fontSize,
    lineHeight,
    letterSpacing: seg.letterSpacingPx,
    paragraphSpacing: text.paragraphSpacingPx,
    singleLine: text.isSingleLine,
  })

  const results = isAutoLineHeight
    ? rawResults.filter(r => r.property !== 'line-height')
    : rawResults

  for (const r of results) {
    // Truly single-visual-line text has no rendered line-height effect, so a
    // numeric shortfall is theoretical — treat as a pass. We use the
    // geometric isSingleVisualLine signal here (bbox vs line-height), not the
    // string-level isSingleLine which only detects hard breaks; a 5-line
    // soft-wrapped paragraph still has isSingleLine: true but should not auto-pass.
    if (r.property === 'line-height' && text.isSingleVisualLine && r.pass === false) {
      continue
    }
    if (r.pass === true) continue
    if (r.pass === null) {
      out.push({
        criterion: TYPOGRAPHY_CRITERION,
        status: 'unable-to-test',
        scope: 'element',
        nodeId: text.id,
        nodeName: text.name,
        message: `${r.property} — unable to determine.`,
        details: { property: r.property, required: r.required },
      })
    } else {
      out.push({
        criterion: TYPOGRAPHY_CRITERION,
        status: 'flag',
        scope: 'element',
        nodeId: text.id,
        nodeName: text.name,
        message: `${r.property} ${r.actual} (needs ${r.required}).`,
        details: { property: r.property, actual: r.actual, required: r.required },
      })
    }
  }

  // No flags emitted → record a pass for this element.
  if (out.length === 0) {
    out.push({
      criterion: TYPOGRAPHY_CRITERION,
      status: 'pass',
      scope: 'element',
      nodeId: text.id,
      nodeName: text.name,
      message: 'Typography — readability floors met.',
    })
  }
  return out
}

function pickAuditSegment(segments: TextSegment[]): TextSegment | null {
  if (segments.length === 0) return null
  // Largest fontSize wins; if tie, longest range wins.
  return [...segments].sort((a, b) => {
    if (b.fontSize !== a.fontSize) return b.fontSize - a.fontSize
    return (b.end - b.start) - (a.end - a.start)
  })[0]
}

// Bug 7 — the bare-size heuristic produced too many false positives
// (every video thumbnail / hero photo / illustration tripped it). The AI-driven
// image-of-text check (server-side, gated by the AI toggle) replaces it.
//
// What stays in the deterministic runner:
//   - Logo / brand exempt → pass (cheap, certain)
//   - Layer name explicitly suggests text content (e.g. "title.png",
//     "heading-banner") → flag (cheap, high signal)
// Everything else is deferred to the AI section in the UI.
function auditImageOfText(img: ImageElement): Finding | null {
  if (img.isExempt) {
    return {
      criterion: '1.4.5',
      status: 'pass',
      scope: 'element',
      nodeId: img.id,
      nodeName: img.name,
      message: '1.4.5 — exempt (logotype/brand).',
    }
  }
  if (TEXT_NAME_RE.test(img.name)) {
    return {
      criterion: '1.4.5',
      status: 'flag',
      scope: 'element',
      nodeId: img.id,
      nodeName: img.name,
      message: `Image "${img.name}" — name suggests text content; verify it uses real text layers.`,
      details: { width: img.width, height: img.height, signal: 'name' },
    }
  }
  // Defer to the AI section. Returning null keeps it out of the deterministic
  // findings entirely; the UI's Image-of-text section handles it.
  return null
}
