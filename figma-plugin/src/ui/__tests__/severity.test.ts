import { test } from 'node:test'
import assert from 'node:assert/strict'
import { severityFromRatio, formatPctOfRequired } from '../severity.ts'

test('severityFromRatio — passes-or-tied ratios still tier as mild (renderer guards on flag status)', () => {
  assert.equal(severityFromRatio(4.5, 4.5), 'mild')
  assert.equal(severityFromRatio(5, 4.5), 'mild')
})

test('severityFromRatio — mild at 80%+', () => {
  assert.equal(severityFromRatio(3.6, 4.5), 'mild')
  assert.equal(severityFromRatio(4.4, 4.5), 'mild')
})

test('severityFromRatio — moderate at 50–79%', () => {
  assert.equal(severityFromRatio(2.25, 4.5), 'moderate')
  assert.equal(severityFromRatio(3.5, 4.5), 'moderate')
})

test('severityFromRatio — severe below 50%', () => {
  assert.equal(severityFromRatio(2, 4.5), 'severe')
  assert.equal(severityFromRatio(0, 4.5), 'severe')
})

test('severityFromRatio — non-numeric inputs default to severe', () => {
  assert.equal(severityFromRatio(NaN, 4.5), 'severe')
  assert.equal(severityFromRatio(2, NaN), 'severe')
  assert.equal(severityFromRatio(2, 0), 'severe')
})

test('formatPctOfRequired rounds to nearest integer', () => {
  assert.equal(formatPctOfRequired(2.1, 4.5), '47% of required')
  assert.equal(formatPctOfRequired(4.5, 4.5), '100% of required')
})

test('formatPctOfRequired returns null on bad inputs', () => {
  assert.equal(formatPctOfRequired(NaN, 4.5), null)
  assert.equal(formatPctOfRequired(2, 0), null)
})
