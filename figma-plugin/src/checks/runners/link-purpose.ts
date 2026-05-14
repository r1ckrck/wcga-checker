// SC 2.4.4 Link Purpose (In Context). Pure DTO consumer.
//
// Strategy: every clickable element has a normalized text string built by the
// read pipeline (lowercase, arrows + trailing punctuation stripped, whitespace
// collapsed). Match that against a list of vague phrases — if the *entire*
// normalized text equals a vague phrase, flag it. Substring matches don't
// count, so "Read more about home loans" passes.
//
// Icon-only clickables (textNormalized === '') are skipped — their accessible
// name comes from aria-label / layer name, neither of which we read reliably
// at design stage. SC 2.4.4 for icon buttons belongs in a later phase.

import type { AuditDTO, ClickableElement } from '../../shared/dtos'
import type { Finding } from '../findings.ts'

/**
 * Phrases that, when used as the *entire* link/button label, fail SC 2.4.4 —
 * the destination is undeterminable from the link text alone. Derived from
 * W3C techniques G91 and H30 and the workshop's audit feedback.
 *
 * English-only for Phase 1. Localized vague phrases (e.g. Hindi `अधिक पढ़ें`)
 * are intentionally out of scope.
 */
const VAGUE_PHRASES: ReadonlySet<string> = new Set([
  'read more',
  'click here',
  'learn more',
  'more',
  'details',
  'here',
  'view more',
  'see more',
  'tap here',
  'click',
  'tap',
  'link',
])

export function runLinkPurposeCheck(dto: AuditDTO): Finding[] {
  return dto.clickables
    .map(auditClickable)
    .filter((f): f is Finding => f !== null)
}

function auditClickable(c: ClickableElement): Finding | null {
  // Icon-only — out of scope for this runner.
  if (c.textNormalized === '') return null

  if (VAGUE_PHRASES.has(c.textNormalized)) {
    return {
      criterion: '2.4.4',
      status: 'flag',
      scope: 'element',
      nodeId: c.id,
      nodeName: c.name,
      message: `Link text "${c.textRaw.trim()}" is too vague.`,
      details: {
        severity: 'warning',
        text: c.textRaw.trim(),
        normalized: c.textNormalized,
      },
    }
  }

  return {
    criterion: '2.4.4',
    status: 'pass',
    scope: 'element',
    nodeId: c.id,
    nodeName: c.name,
    message: '2.4.4 — link text appears descriptive.',
  }
}
