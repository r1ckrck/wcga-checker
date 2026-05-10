import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tryExportAll } from '../try-export-all.ts'

test('returns mapped values for successful items', async () => {
  const out = await tryExportAll([1, 2, 3], async n => n * 2)
  assert.deepEqual(out, [2, 4, 6])
})

test('drops null results silently', async () => {
  const out = await tryExportAll([1, 2, 3, 4], async n => (n % 2 === 0 ? n : null))
  assert.deepEqual(out, [2, 4])
})

test('drops thrown failures silently', async () => {
  const out = await tryExportAll([1, 2, 3], async n => {
    if (n === 2) throw new Error('boom')
    return n
  })
  assert.deepEqual(out, [1, 3])
})

test('preserves original order', async () => {
  // Stagger resolution to make sure ordering follows the input array,
  // not completion order.
  const out = await tryExportAll(['a', 'b', 'c'], async s => {
    const wait = s === 'a' ? 30 : s === 'b' ? 10 : 20
    await new Promise(r => setTimeout(r, wait))
    return s.toUpperCase()
  })
  assert.deepEqual(out, ['A', 'B', 'C'])
})

test('empty input returns empty output', async () => {
  const out = await tryExportAll<number, number>([], async n => n)
  assert.deepEqual(out, [])
})

test('all-null returns empty array', async () => {
  const out = await tryExportAll([1, 2, 3], async () => null)
  assert.deepEqual(out, [])
})
