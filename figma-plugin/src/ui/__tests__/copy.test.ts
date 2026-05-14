import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  plainEnglishReason,
  typographyTitleFor,
  typographyPropertyLabel,
  parsePercent,
  pctToPx,
} from '../copy.ts'

test('plainEnglishReason — known reasons map', () => {
  assert.equal(plainEnglishReason('gradient'), 'background is a gradient')
  assert.equal(plainEnglishReason('image'), 'background is an image')
  assert.equal(plainEnglishReason('mixed'), 'element has multiple foreground colors')
  assert.equal(plainEnglishReason('no-ancestor'), 'no solid surface above this element')
  assert.equal(plainEnglishReason('transparent-stack'), 'every ancestor is transparent')
})

test('plainEnglishReason — unknown reason passes through', () => {
  assert.equal(plainEnglishReason('something-new'), 'something-new')
})

test('typographyTitleFor — known properties', () => {
  assert.equal(typographyTitleFor('line-height'), 'Tight line height')
  assert.equal(typographyTitleFor('letter-spacing'), 'Tight letter spacing')
  assert.equal(typographyTitleFor('paragraph-spacing'), 'Tight paragraph spacing')
  assert.equal(typographyTitleFor('word-spacing'), 'No word spacing')
})

test('typographyPropertyLabel — known properties', () => {
  assert.equal(typographyPropertyLabel('line-height'), 'Line height')
  assert.equal(typographyPropertyLabel('letter-spacing'), 'Letter spacing')
})

test('parsePercent — extracts integer percent', () => {
  assert.equal(parsePercent('157%'), 157)
  assert.equal(parsePercent('≥150%'), 150)
  assert.equal(parsePercent('120%'), 120)
})

test('parsePercent — extracts decimal percent', () => {
  assert.equal(parsePercent('12.5%'), 12.5)
})

test('parsePercent — extracts negative percent', () => {
  assert.equal(parsePercent('-12%'), -12)
  assert.equal(parsePercent('-6.5%'), -6.5)
  // Threshold strings prefix the value with ≥; the leading minus must still
  // be captured.
  assert.equal(parsePercent('≥-6%'), -6)
})

test('parsePercent — null on no percent', () => {
  assert.equal(parsePercent('not set'), null)
  assert.equal(parsePercent(undefined), null)
  assert.equal(parsePercent(null), null)
  assert.equal(parsePercent(''), null)
})

test('pctToPx — typical conversions', () => {
  assert.equal(pctToPx(150, 16), '24 px')
  assert.equal(pctToPx(120, 16), '19.2 px')
  assert.equal(pctToPx(100, 16), '16 px')
})

test('pctToPx — guards bad input', () => {
  assert.equal(pctToPx(NaN, 16), '')
  assert.equal(pctToPx(150, 0), '')
})
