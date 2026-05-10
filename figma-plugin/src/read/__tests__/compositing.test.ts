import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compositeFills, over } from '../compositing.ts'
import type { RGB, RGBA } from '../../shared/dtos.ts'

test('compositeFills — empty stack returns bg', () => {
  const bg: RGB = [10, 20, 30]
  assert.deepEqual(compositeFills([], bg), bg)
})

test('compositeFills — single fully transparent layer returns bg', () => {
  const bg: RGB = [10, 20, 30]
  const stack: RGBA[] = [[200, 200, 200, 0]]
  assert.deepEqual(compositeFills(stack, bg), bg)
})

test('compositeFills — single fully opaque layer returns that layer', () => {
  const bg: RGB = [10, 20, 30]
  const stack: RGBA[] = [[200, 100, 50, 1]]
  assert.deepEqual(compositeFills(stack, bg), [200, 100, 50])
})

test('compositeFills — two layers composite top-down', () => {
  const bg: RGB = [0, 0, 0]
  // top: 50% white, bottom: opaque red.
  // Bottom over bg = red. Top over red = (red*0.5 + white*0.5) = (255*0.5+255*0.5, 0+127.5, 0+127.5)
  //                                                          = (255, 127.5, 127.5)
  const stack: RGBA[] = [
    [255, 255, 255, 0.5],
    [255, 0, 0, 1],
  ]
  const result = compositeFills(stack, bg)
  assert.equal(Math.round(result[0]), 255)
  assert.equal(Math.round(result[1]), 128)
  assert.equal(Math.round(result[2]), 128)
})

test('over — alpha=0 returns bg', () => {
  assert.deepEqual(over([255, 255, 255, 0], [10, 20, 30]), [10, 20, 30])
})

test('over — alpha=1 returns fg rgb', () => {
  assert.deepEqual(over([200, 100, 50, 1], [10, 20, 30]), [200, 100, 50])
})
