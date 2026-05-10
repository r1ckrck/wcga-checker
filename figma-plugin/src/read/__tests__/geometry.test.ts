import { test } from 'node:test'
import assert from 'node:assert/strict'
import { boxContains, boxOverlaps, isAboveOrLeftOf } from '../geometry.ts'
import type { BBox } from '../../shared/dtos.ts'

const box = (x: number, y: number, width: number, height: number): BBox => ({ x, y, width, height })

test('boxContains — inner fully inside outer', () => {
  assert.equal(boxContains(box(0, 0, 100, 100), box(10, 10, 50, 50)), true)
})

test('boxContains — identical boxes (≥ on all sides)', () => {
  assert.equal(boxContains(box(0, 0, 100, 100), box(0, 0, 100, 100)), true)
})

test('boxContains — partial overlap', () => {
  assert.equal(boxContains(box(0, 0, 100, 100), box(50, 50, 100, 100)), false)
})

test('boxContains — completely outside', () => {
  assert.equal(boxContains(box(0, 0, 100, 100), box(200, 200, 50, 50)), false)
})

test('boxContains — inner extends right edge', () => {
  assert.equal(boxContains(box(0, 0, 100, 100), box(50, 50, 51, 50)), false)
})

test('boxOverlaps — adjacent edges do not overlap', () => {
  assert.equal(boxOverlaps(box(0, 0, 100, 100), box(100, 0, 50, 50)), false)
})

test('boxOverlaps — true overlap', () => {
  assert.equal(boxOverlaps(box(0, 0, 100, 100), box(50, 50, 100, 100)), true)
})

test('isAboveOrLeftOf — label above input', () => {
  const input = box(50, 100, 200, 40)
  const label = box(50, 70, 100, 20)
  assert.equal(isAboveOrLeftOf(input, label), true)
})

test('isAboveOrLeftOf — label to the left of input', () => {
  const input = box(120, 50, 200, 40)
  const label = box(20, 50, 80, 40)
  assert.equal(isAboveOrLeftOf(input, label), true)
})

test('isAboveOrLeftOf — label below input is not above', () => {
  const input = box(50, 50, 200, 40)
  const label = box(50, 100, 100, 20)
  assert.equal(isAboveOrLeftOf(input, label), false)
})
