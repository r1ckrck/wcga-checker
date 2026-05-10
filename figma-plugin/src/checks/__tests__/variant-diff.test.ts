import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  diffVariants,
  type VariantSubtreeSummary,
  type VariantNodeSummary,
} from '../variant-diff.ts'

const node = (over: Partial<VariantNodeSummary>): VariantNodeSummary => ({
  key: over.key ?? 'Root',
  fallbackKey: over.fallbackKey ?? 'd=0|i=0|t=FRAME',
  id: over.id ?? '0:1',
  name: over.name ?? 'Root',
  type: over.type ?? 'FRAME',
  fillHex: over.fillHex ?? null,
  strokeHex: over.strokeHex ?? null,
  strokeWeight: over.strokeWeight ?? null,
  hasEffects: over.hasEffects ?? false,
  text: over.text ?? null,
  iconCount: over.iconCount ?? 0,
})

const tree = (rootName: string, nodes: VariantNodeSummary[]): VariantSubtreeSummary => ({
  rootId: '0:1',
  rootName,
  nodes,
})

test('diffVariants — identical trees produce empty diff', () => {
  const a = tree('Default', [node({})])
  const b = tree('Focus', [node({})])
  const d = diffVariants(a, b)
  assert.equal(d.added.length, 0)
  assert.equal(d.removed.length, 0)
  assert.equal(d.changed.length, 0)
})

test('diffVariants — added node detected', () => {
  const a = tree('Default', [node({ key: 'Root' })])
  const b = tree('Error', [
    node({ key: 'Root' }),
    node({ key: 'Root>ErrorText', type: 'TEXT', text: 'Required' }),
  ])
  const d = diffVariants(a, b)
  assert.equal(d.added.length, 1)
  assert.equal(d.added[0].type, 'TEXT')
  assert.equal(d.removed.length, 0)
})

test('diffVariants — removed node detected', () => {
  const a = tree('Default', [node({ key: 'Root' }), node({ key: 'Root>Icon', type: 'INSTANCE' })])
  const b = tree('Focus', [node({ key: 'Root' })])
  const d = diffVariants(a, b)
  assert.equal(d.added.length, 0)
  assert.equal(d.removed.length, 1)
  assert.equal(d.removed[0].type, 'INSTANCE')
})

test('diffVariants — fill color change is fillChanged', () => {
  const a = tree('Default', [node({ key: 'Root', fillHex: '#FFFFFF' })])
  const b = tree('Error', [node({ key: 'Root', fillHex: '#FF0000' })])
  const d = diffVariants(a, b)
  assert.equal(d.changed.length, 1)
  assert.equal(d.changed[0].fillChanged, true)
  assert.equal(d.changed[0].strokeChanged, false)
})

test('diffVariants — stroke change detected', () => {
  const a = tree('Default', [node({ key: 'Root', strokeHex: '#CCC' })])
  const b = tree('Focus', [node({ key: 'Root', strokeHex: '#0066FF' })])
  const d = diffVariants(a, b)
  assert.equal(d.changed.length, 1)
  assert.equal(d.changed[0].strokeChanged, true)
})

test('diffVariants — text change detected', () => {
  const a = tree('Default', [node({ key: 'Root>Label', type: 'TEXT', text: 'OK' })])
  const b = tree('Error', [node({ key: 'Root>Label', type: 'TEXT', text: 'Failed' })])
  const d = diffVariants(a, b)
  assert.equal(d.changed.length, 1)
  assert.equal(d.changed[0].textChanged, true)
})

test('diffVariants — fallback match catches simple rename', () => {
  // Same depth/index/type, different name → match via fallbackKey.
  const a = tree('Default', [node({ key: 'Root>Label', fallbackKey: 'd=1|i=0|t=TEXT', type: 'TEXT', text: 'Old', fillHex: '#000' })])
  const b = tree('Focus', [node({ key: 'Root>Heading', fallbackKey: 'd=1|i=0|t=TEXT', type: 'TEXT', text: 'Old', fillHex: '#FFF' })])
  const d = diffVariants(a, b)
  // Should be matched (changed), not added/removed.
  assert.equal(d.added.length, 0)
  assert.equal(d.removed.length, 0)
  assert.equal(d.changed.length, 1)
  assert.equal(d.changed[0].fillChanged, true)
})

test('diffVariants — multiple changes on same node', () => {
  const a = tree('Default', [node({ key: 'Root', fillHex: '#FFF', strokeHex: '#CCC', strokeWeight: 1 })])
  const b = tree('Focus', [node({ key: 'Root', fillHex: '#FFF', strokeHex: '#000', strokeWeight: 2, hasEffects: true })])
  const d = diffVariants(a, b)
  assert.equal(d.changed.length, 1)
  assert.equal(d.changed[0].fillChanged, false)
  assert.equal(d.changed[0].strokeChanged, true)
  assert.equal(d.changed[0].strokeWeightChanged, true)
  assert.equal(d.changed[0].effectsChanged, true)
})
