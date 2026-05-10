import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkSpacing } from '../typography.ts'

test('all set, all passing — fs=14 lh=22 ls=2 ps=30', () => {
  const r = checkSpacing({
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 2,
    paragraphSpacing: 30,
  })
  assert.equal(r.length, 3)
  // line-height: 22/14 ≈ 157.1%
  assert.equal(r[0].property, 'line-height')
  assert.equal(r[0].actual, '157.1%')
  assert.equal(r[0].required, '≥150%')
  assert.equal(r[0].pass, true)
  // letter-spacing: 2/14 ≈ 14.3%
  assert.equal(r[1].property, 'letter-spacing')
  assert.equal(r[1].actual, '14.3%')
  assert.equal(r[1].required, '≥12%')
  assert.equal(r[1].pass, true)
  // paragraph-spacing: 30/14 ≈ 214.3%
  assert.equal(r[2].property, 'paragraph-spacing')
  assert.equal(r[2].actual, '214.3%')
  assert.equal(r[2].required, '≥200%')
  assert.equal(r[2].pass, true)
})

test('all set, all failing — fs=16 lh=18 ls=0 (default → pass) ps=0', () => {
  const r = checkSpacing({
    fontSize: 16,
    lineHeight: 18,
    letterSpacing: 0,
    paragraphSpacing: 0,
  })
  assert.equal(r.length, 3)
  // line-height fails — 18/16 = 112.5%
  assert.equal(r[0].property, 'line-height')
  assert.equal(r[0].pass, false)
  assert.equal(r[0].actual, '112.5%')
  // Bug 3 — letter-spacing 0 = default tracking → pass
  assert.equal(r[1].property, 'letter-spacing')
  assert.equal(r[1].pass, true)
  assert.equal(r[1].actual, '0% (default)')
  // paragraph-spacing 0 still fails (it's not a "default" property in the
  // same way — 0 paragraph spacing means paragraphs are touching)
  assert.equal(r[2].property, 'paragraph-spacing')
  assert.equal(r[2].pass, false)
  assert.equal(r[2].actual, '0%')
})

test('single-line skips paragraph — fs=14 lh=21 ls=2 singleLine=true', () => {
  const r = checkSpacing({
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 2,
    singleLine: true,
  })
  assert.equal(r.length, 2)
  assert.equal(r[0].property, 'line-height')
  assert.equal(r[0].actual, '150%')
  assert.equal(r[0].pass, true)
  assert.equal(r[1].property, 'letter-spacing')
  assert.equal(r.find(x => x.property === 'paragraph-spacing'), undefined)
})

test('missing values → pass=null with "not set" actual', () => {
  const r = checkSpacing({ fontSize: 14 })
  assert.equal(r.length, 3)
  for (const entry of r) {
    assert.equal(entry.actual, 'not set')
    assert.equal(entry.pass, null)
  }
  assert.equal(r[0].required, '≥150%')
  assert.equal(r[1].required, '≥12%')
  assert.equal(r[2].required, '≥200%')
})

test('word-spacing only emitted when provided; word-spacing 0 → default pass (Bug 3)', () => {
  const without = checkSpacing({ fontSize: 14 })
  assert.equal(without.find(x => x.property === 'word-spacing'), undefined)

  const withWord = checkSpacing({ fontSize: 14, wordSpacing: 3 })
  const ws = withWord.find(x => x.property === 'word-spacing')
  assert.ok(ws)
  assert.equal(ws!.property, 'word-spacing')
  // 3/14 ≈ 21.4%
  assert.equal(ws!.actual, '21.4%')
  assert.equal(ws!.required, '≥16%')
  assert.equal(ws!.pass, true)

  const withZero = checkSpacing({ fontSize: 14, wordSpacing: 0 })
  const ws0 = withZero.find(x => x.property === 'word-spacing')
  assert.equal(ws0!.actual, '0% (default)')
  assert.equal(ws0!.pass, true)
})

test('null values treated as not set', () => {
  const r = checkSpacing({ fontSize: 14, lineHeight: null, letterSpacing: null })
  assert.equal(r[0].pass, null)
  assert.equal(r[1].pass, null)
})

test('exact 150% line-height passes — boundary', () => {
  const r = checkSpacing({ fontSize: 14, lineHeight: 21 })
  assert.equal(r[0].pass, true)
  assert.equal(r[0].actual, '150%')
})

test('zero fontSize edge case — no throw, ratio defaults to 0', () => {
  const r = checkSpacing({ fontSize: 0, lineHeight: 10 })
  // Division by zero guarded → percent = 0
  assert.equal(r[0].actual, '0%')
  assert.equal(r[0].required, '≥150%')
  assert.equal(r[0].pass, false)
})

test('Bug 3 — letter-spacing 0 always passes (default tracking)', () => {
  const r = checkSpacing({ fontSize: 14, lineHeight: 22, letterSpacing: 0 })
  const ls = r.find(x => x.property === 'letter-spacing')
  assert.ok(ls)
  assert.equal(ls!.pass, true)
  assert.equal(ls!.actual, '0% (default)')
})

test('letter-spacing below threshold (non-zero) still fails', () => {
  // letter-spacing of 1px on 14px font = 7.1%, below 12% threshold
  const r = checkSpacing({ fontSize: 14, lineHeight: 22, letterSpacing: 1 })
  const ls = r.find(x => x.property === 'letter-spacing')
  assert.ok(ls)
  assert.equal(ls!.pass, false)
  assert.equal(ls!.actual, '7.1%')
})

test('actualPercent is exposed numerically', () => {
  const r = checkSpacing({ fontSize: 14, lineHeight: 22 })
  assert.equal(r[0].actualPercent, (22 / 14) * 100)
  assert.equal(r[0].requiredPercent, 150)
})
