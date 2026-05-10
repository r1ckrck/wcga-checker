import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseColor,
  relativeLuminance,
  contrastRatio,
  blendOnBackground,
  checkContrast,
  type RGB,
  type RGBA,
} from '../contrast.ts'

const closeTo = (actual: number, expected: number, eps = 1e-6) =>
  Math.abs(actual - expected) <= eps

test('parseColor — 6-digit hex', () => {
  assert.deepEqual(parseColor('#FFFFFF'), [255, 255, 255, 1.0])
  assert.deepEqual(parseColor('#000000'), [0, 0, 0, 1.0])
  assert.deepEqual(parseColor('#333333'), [51, 51, 51, 1.0])
})

test('parseColor — 3-digit short hex expands each digit', () => {
  assert.deepEqual(parseColor('#333'), [51, 51, 51, 1.0])
  assert.deepEqual(parseColor('#abc'), [170, 187, 204, 1.0])
  assert.deepEqual(parseColor('#fff'), [255, 255, 255, 1.0])
})

test('parseColor — 8-digit hex includes alpha', () => {
  const [r, g, b, a] = parseColor('#33333380')
  assert.equal(r, 51)
  assert.equal(g, 51)
  assert.equal(b, 51)
  assert.ok(closeTo(a, 0.5019607843137255))
})

test('parseColor — rgb() and rgba()', () => {
  assert.deepEqual(parseColor('rgb(255, 255, 255)'), [255, 255, 255, 1.0])
  assert.deepEqual(parseColor('rgba(255,255,255,0.4)'), [255, 255, 255, 0.4])
  assert.deepEqual(parseColor('rgba(0, 41, 83, 1.0)'), [0, 41, 83, 1.0])
})

test('parseColor — case insensitive', () => {
  assert.deepEqual(parseColor('#abc'), [170, 187, 204, 1.0])
  assert.deepEqual(parseColor('#ABC'), [170, 187, 204, 1.0])
})

test('parseColor — throws on garbage', () => {
  assert.throws(() => parseColor('not-a-color'), /Cannot parse color/)
  assert.throws(() => parseColor(''), /Cannot parse color/)
  assert.throws(() => parseColor('#zzzzzz'), /Cannot parse color/)
})

test('relativeLuminance — boundary values', () => {
  assert.equal(relativeLuminance([0, 0, 0]), 0)
  assert.ok(closeTo(relativeLuminance([255, 255, 255]), 1.0))
})

test('contrastRatio — black vs white = 21', () => {
  assert.ok(closeTo(contrastRatio([0, 0, 0], [255, 255, 255]), 21, 1e-9))
  assert.ok(closeTo(contrastRatio([255, 255, 255], [0, 0, 0]), 21, 1e-9))
})

test('contrastRatio — same color = 1', () => {
  assert.ok(closeTo(contrastRatio([119, 119, 119], [119, 119, 119]), 1, 1e-9))
})

test('blendOnBackground — fully transparent fg returns bg', () => {
  const bg: RGB = [10, 20, 30]
  const fg: RGBA = [200, 200, 200, 0]
  assert.deepEqual(blendOnBackground(fg, bg), [10, 20, 30])
})

test('blendOnBackground — fully opaque fg returns fg rgb', () => {
  const bg: RGB = [10, 20, 30]
  const fg: RGBA = [200, 200, 200, 1.0]
  assert.deepEqual(blendOnBackground(fg, bg), [200, 200, 200])
})

test('checkContrast — Python parity: black on white thr 4.5', () => {
  const r = checkContrast({ fg: '#000000', bg: '#FFFFFF', threshold: 4.5 })
  assert.equal(r.ratio, 21)
  assert.equal(r.threshold, 4.5)
  assert.equal(r.pass, true)
  assert.deepEqual(r.fgResolved, [0, 0, 0])
  assert.deepEqual(r.bgResolved, [255, 255, 255])
})

test('checkContrast — Python parity: same color', () => {
  const r = checkContrast({ fg: '#777777', bg: '#777777', threshold: 4.5 })
  assert.equal(r.ratio, 1)
  assert.equal(r.pass, false)
})

test('checkContrast — Python parity: #333333 on #FFFFFF thr 4.5', () => {
  const r = checkContrast({ fg: '#333333', bg: '#FFFFFF', threshold: 4.5 })
  assert.equal(r.ratio, 12.63)
  assert.equal(r.pass, true)
})

test('checkContrast — Python parity: rgba(255,255,255,0.4) on #002953 thr 4.5', () => {
  const r = checkContrast({ fg: 'rgba(255,255,255,0.4)', bg: '#002953', threshold: 4.5 })
  assert.equal(r.ratio, 3.49)
  assert.equal(r.pass, false)
  // fg_resolved per Python: rgb(102,126,151) — Python truncates via int(), so
  // expect floats that round/truncate to those integers.
  assert.equal(Math.trunc(r.fgResolved[0]), 102)
  assert.equal(Math.trunc(r.fgResolved[1]), 126)
  assert.equal(Math.trunc(r.fgResolved[2]), 151)
  assert.deepEqual(r.bgResolved, [0, 41, 83])
})

test('checkContrast — Python parity: --fg-opacity 0.5 on black/white', () => {
  const r = checkContrast({
    fg: '#000000',
    bg: '#FFFFFF',
    threshold: 4.5,
    fgOpacityMultiplier: 0.5,
  })
  assert.equal(r.ratio, 3.98)
  assert.equal(r.pass, false)
  // fg_resolved per Python: rgb(127,127,127) (truncated)
  assert.equal(Math.trunc(r.fgResolved[0]), 127)
  assert.equal(Math.trunc(r.fgResolved[1]), 127)
  assert.equal(Math.trunc(r.fgResolved[2]), 127)
})

test('checkContrast — accepts pre-parsed tuples', () => {
  const r = checkContrast({
    fg: [0, 0, 0, 1.0] as const,
    bg: [255, 255, 255] as const,
    threshold: 4.5,
  })
  assert.equal(r.ratio, 21)
  assert.equal(r.pass, true)
})

test('checkContrast — sub-threshold', () => {
  // #888888 on white is ~3.59:1 — below 4.5 normal-text threshold.
  const r = checkContrast({ fg: '#888888', bg: '#FFFFFF', threshold: 4.5 })
  assert.equal(r.pass, false)
  assert.ok(r.ratio < 4.5)
})

test('checkContrast — pass uses raw ratio, not rounded', () => {
  // If a ratio is 4.499..., Python rounds display to 4.50 but pass is false.
  // We must match: comparison on raw value.
  // (Constructive test: pass requires actual >= threshold without 2dp round-up.)
  const r1 = checkContrast({ fg: '#000', bg: '#FFF', threshold: 21.001 })
  assert.equal(r1.pass, false)
  const r2 = checkContrast({ fg: '#000', bg: '#FFF', threshold: 21 })
  assert.equal(r2.pass, true)
})
