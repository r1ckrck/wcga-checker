import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkSpacing } from '../typography.ts'

// ── Line-height (≥75% of font size) ─────────────────────────────────

test('line-height 100% passes (above 75% floor)', () => {
  const r = checkSpacing({ fontSize: 16, lineHeight: 16 })
  const lh = r.find(x => x.property === 'line-height')
  assert.equal(lh?.actual, '100%')
  assert.equal(lh?.required, '≥75%')
  assert.equal(lh?.pass, true)
})

test('exact 75% line-height passes — boundary', () => {
  const r = checkSpacing({ fontSize: 100, lineHeight: 75 })
  const lh = r.find(x => x.property === 'line-height')
  assert.equal(lh?.actual, '75%')
  assert.equal(lh?.pass, true)
})

test('74% line-height fails — just under the floor', () => {
  const r = checkSpacing({ fontSize: 100, lineHeight: 74 })
  const lh = r.find(x => x.property === 'line-height')
  assert.equal(lh?.actual, '74%')
  assert.equal(lh?.pass, false)
})

test('line-height undefined (AUTO) → "not set" / pass=null', () => {
  const r = checkSpacing({ fontSize: 14 })
  const lh = r.find(x => x.property === 'line-height')
  assert.equal(lh?.actual, 'not set')
  assert.equal(lh?.pass, null)
})

// ── Letter-spacing (≥ -6% of font size) ─────────────────────────────

test('letter-spacing 0 passes (above -6% floor)', () => {
  const r = checkSpacing({ fontSize: 16, letterSpacing: 0 })
  const ls = r.find(x => x.property === 'letter-spacing')
  assert.equal(ls?.actual, '0%')
  assert.equal(ls?.required, '≥-6%')
  assert.equal(ls?.pass, true)
})

test('letter-spacing -6% passes — boundary', () => {
  // -6% of 16 = -0.96
  const r = checkSpacing({ fontSize: 16, letterSpacing: -0.96 })
  const ls = r.find(x => x.property === 'letter-spacing')
  assert.equal(ls?.actual, '-6%')
  assert.equal(ls?.pass, true)
})

test('letter-spacing tighter than -6% fails', () => {
  // -10% of 16 = -1.6
  const r = checkSpacing({ fontSize: 16, letterSpacing: -1.6 })
  const ls = r.find(x => x.property === 'letter-spacing')
  assert.equal(ls?.actual, '-10%')
  assert.equal(ls?.pass, false)
})

test('letter-spacing positive value passes', () => {
  // 12% of 14 ≈ 1.68
  const r = checkSpacing({ fontSize: 14, letterSpacing: 1.68 })
  const ls = r.find(x => x.property === 'letter-spacing')
  assert.equal(ls?.pass, true)
})

// ── Paragraph-spacing (≥70% of line-height) ─────────────────────────

test('paragraph-spacing 70% of line-height passes — boundary', () => {
  // line-height 20, paragraph spacing 14 → 70%
  const r = checkSpacing({
    fontSize: 16,
    lineHeight: 20,
    paragraphSpacing: 14,
    singleLine: false,
  })
  const ps = r.find(x => x.property === 'paragraph-spacing')
  assert.equal(ps?.actual, '70%')
  assert.equal(ps?.required, '≥70%')
  assert.equal(ps?.pass, true)
})

test('paragraph-spacing 60% of line-height fails', () => {
  const r = checkSpacing({
    fontSize: 16,
    lineHeight: 20,
    paragraphSpacing: 12,
    singleLine: false,
  })
  const ps = r.find(x => x.property === 'paragraph-spacing')
  assert.equal(ps?.actual, '60%')
  assert.equal(ps?.pass, false)
})

test('paragraph-spacing falls back to 1.2× fontSize when line-height is AUTO/null', () => {
  // No explicit lineHeight → falls back to 1.2 * 16 = 19.2 baseline.
  // Need spacing = 0.7 * 19.2 = 13.44 to pass.
  const passing = checkSpacing({
    fontSize: 16,
    paragraphSpacing: 14,
    singleLine: false,
  })
  const psPass = passing.find(x => x.property === 'paragraph-spacing')
  assert.equal(psPass?.pass, true)

  const failing = checkSpacing({
    fontSize: 16,
    paragraphSpacing: 10,
    singleLine: false,
  })
  const psFail = failing.find(x => x.property === 'paragraph-spacing')
  assert.equal(psFail?.pass, false)
})

test('paragraph-spacing null → unable to determine', () => {
  const r = checkSpacing({
    fontSize: 16,
    lineHeight: 20,
    paragraphSpacing: null,
    singleLine: false,
  })
  const ps = r.find(x => x.property === 'paragraph-spacing')
  assert.equal(ps?.actual, 'not set')
  assert.equal(ps?.pass, null)
})

test('single-line skips paragraph-spacing entirely', () => {
  const r = checkSpacing({
    fontSize: 14,
    lineHeight: 21,
    paragraphSpacing: 0,
    singleLine: true,
  })
  assert.equal(r.find(x => x.property === 'paragraph-spacing'), undefined)
})

// ── Word-spacing removed ────────────────────────────────────────────

test('word-spacing is no longer in the result set', () => {
  const r = checkSpacing({ fontSize: 14, lineHeight: 21 })
  // SpacingProperty no longer includes word-spacing — runtime check still
  // useful to catch a regression where the rule sneaks back in.
  assert.equal(r.find(x => (x.property as string) === 'word-spacing'), undefined)
})

// ── Result shape ────────────────────────────────────────────────────

test('returns line-height + letter-spacing when single-line=true (paragraph-spacing skipped)', () => {
  const r = checkSpacing({
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 2,
    singleLine: true,
  })
  assert.equal(r.length, 2)
  assert.equal(r[0].property, 'line-height')
  assert.equal(r[1].property, 'letter-spacing')
})

test('returns three entries when multi-line', () => {
  const r = checkSpacing({
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 2,
    paragraphSpacing: 20,
    singleLine: false,
  })
  assert.equal(r.length, 3)
})

test('zero fontSize edge case — no throw, ratio defaults to 0', () => {
  const r = checkSpacing({ fontSize: 0, lineHeight: 10 })
  const lh = r.find(x => x.property === 'line-height')
  assert.equal(lh?.actual, '0%')
  assert.equal(lh?.pass, false)
})

test('null values treated as not set', () => {
  const r = checkSpacing({ fontSize: 14, lineHeight: null, letterSpacing: null })
  assert.equal(r[0].pass, null)
  assert.equal(r[1].pass, null)
})

test('actualPercent + requiredPercent are exposed numerically', () => {
  const r = checkSpacing({ fontSize: 14, lineHeight: 22 })
  const lh = r.find(x => x.property === 'line-height')
  assert.equal(lh?.actualPercent, (22 / 14) * 100)
  assert.equal(lh?.requiredPercent, 75)
})
