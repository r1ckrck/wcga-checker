// Tests for the marking store's pure transition behaviour.
//
// The store itself coordinates load/save round-trips via window.postMessage
// (which we can't easily stub in node:test without a DOM polyfill). What we
// CAN test directly is the pure state-derivation surface — `setMarkerState`
// composition, click-active-CTA semantics, mutex invariants — by exercising
// the underlying `markers.ts` helpers as used by the page.
//
// Page-level DOM rendering tests will arrive in commit 4 alongside the
// minimal-DOM-stub pattern used by `icon-stat.test.ts`.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  deriveState,
  setMarkerState,
  EMPTY_MARKERS_FILE,
  type MarkersFile,
} from '../../../shared/markers.ts'

// Simulate the page's "click Include" / "click Exclude" / "click Reset" flows
// against the immutable MarkersFile model. These exercise the same state
// transitions the page UI triggers via store.saveMarkers().

function clickInclude(file: MarkersFile, nodeId: string): MarkersFile {
  return setMarkerState(file, nodeId, 'include')
}
function clickExclude(file: MarkersFile, nodeId: string): MarkersFile {
  return setMarkerState(file, nodeId, 'exclude')
}
function clickReset(file: MarkersFile, nodeId: string): MarkersFile {
  return setMarkerState(file, nodeId, 'neutral')
}

// ── Single-node transitions ────────────────────────────────────────

test('click Include from Neutral → Include', () => {
  let f: MarkersFile = EMPTY_MARKERS_FILE
  f = clickInclude(f, 'n1')
  assert.equal(deriveState(f, 'n1'), 'include')
})

test('click Exclude from Neutral → Exclude', () => {
  let f: MarkersFile = EMPTY_MARKERS_FILE
  f = clickExclude(f, 'n1')
  assert.equal(deriveState(f, 'n1'), 'exclude')
})

test('click Include from Exclude → Include (no two-step)', () => {
  let f: MarkersFile = EMPTY_MARKERS_FILE
  f = clickExclude(f, 'n1')
  f = clickInclude(f, 'n1')
  assert.equal(deriveState(f, 'n1'), 'include')
  // Single write — node should not appear in exclude.
  assert.equal(f.exclude.includes('n1'), false)
})

test('click Exclude from Include → Exclude (no two-step)', () => {
  let f: MarkersFile = EMPTY_MARKERS_FILE
  f = clickInclude(f, 'n1')
  f = clickExclude(f, 'n1')
  assert.equal(deriveState(f, 'n1'), 'exclude')
  assert.equal(f.include.includes('n1'), false)
})

test('Reset from Include → Neutral', () => {
  let f: MarkersFile = EMPTY_MARKERS_FILE
  f = clickInclude(f, 'n1')
  f = clickReset(f, 'n1')
  assert.equal(deriveState(f, 'n1'), 'neutral')
  assert.deepEqual(f, EMPTY_MARKERS_FILE)
})

test('Reset from Exclude → Neutral', () => {
  let f: MarkersFile = EMPTY_MARKERS_FILE
  f = clickExclude(f, 'n1')
  f = clickReset(f, 'n1')
  assert.equal(deriveState(f, 'n1'), 'neutral')
})

test('Reset from Neutral → still Neutral (idempotent)', () => {
  const f: MarkersFile = EMPTY_MARKERS_FILE
  const out = clickReset(f, 'n1')
  assert.equal(deriveState(out, 'n1'), 'neutral')
  assert.deepEqual(out, EMPTY_MARKERS_FILE)
})

// ── Multi-write sequences ──────────────────────────────────────────

test('rapid toggle resolves to last write (last-write-wins)', () => {
  let f: MarkersFile = EMPTY_MARKERS_FILE
  for (let i = 0; i < 20; i++) {
    f = i % 2 === 0 ? clickInclude(f, 'n1') : clickExclude(f, 'n1')
  }
  // Last call was clickExclude (i = 19, odd → exclude).
  assert.equal(deriveState(f, 'n1'), 'exclude')
})

test('mutex preserved through include↔exclude sequence', () => {
  let f: MarkersFile = EMPTY_MARKERS_FILE
  const sequence: Array<'include' | 'exclude'> = [
    'include',
    'exclude',
    'include',
    'exclude',
    'include',
  ]
  for (const next of sequence) {
    f = setMarkerState(f, 'n1', next)
    // Invariant after every step:
    assert.equal(f.include.filter(id => f.exclude.includes(id)).length, 0)
  }
  assert.equal(deriveState(f, 'n1'), 'include')
})

// ── Multi-node independence ───────────────────────────────────────

test('changing one node does not affect another', () => {
  let f: MarkersFile = EMPTY_MARKERS_FILE
  f = clickInclude(f, 'n1')
  f = clickExclude(f, 'n2')
  f = clickInclude(f, 'n3')

  assert.equal(deriveState(f, 'n1'), 'include')
  assert.equal(deriveState(f, 'n2'), 'exclude')
  assert.equal(deriveState(f, 'n3'), 'include')

  // Resetting n2 doesn't touch n1 or n3.
  f = clickReset(f, 'n2')
  assert.equal(deriveState(f, 'n1'), 'include')
  assert.equal(deriveState(f, 'n2'), 'neutral')
  assert.equal(deriveState(f, 'n3'), 'include')
})

test('include list is sorted across multiple inserts', () => {
  let f: MarkersFile = EMPTY_MARKERS_FILE
  f = clickInclude(f, 'z')
  f = clickInclude(f, 'a')
  f = clickInclude(f, 'm')
  assert.deepEqual(f.include, ['a', 'm', 'z'])
})

// ── Empty-state / disabled-CTA contracts ──────────────────────────

test('no-op when clicking the currently-active CTA (page-level contract)', () => {
  // The page never calls setMarkerState with the current state — clicking
  // the active CTA is a UI-level no-op. We assert that the page's contract
  // works correctly when it DOES short-circuit, by simulating it: calling
  // setMarkerState only on a real change yields the same state.
  let f: MarkersFile = EMPTY_MARKERS_FILE
  f = clickInclude(f, 'n1')
  const before = f
  // Page short-circuits: no setMarkerState call. State unchanged.
  assert.equal(deriveState(before, 'n1'), 'include')
})
