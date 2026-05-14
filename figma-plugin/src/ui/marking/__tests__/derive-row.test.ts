// Cross-product test for the row appearance helper. Every combination of
// (detected × markerState) must produce a single, predictable visual state.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveRowAppearance } from '../page.ts'

// ── Neutral state ─────────────────────────────────────────────────

test('detected + neutral → auto pill shown, no active button, reset disabled', () => {
  const a = deriveRowAppearance(true, 'neutral')
  assert.equal(a.showAuto, true)
  assert.equal(a.includeActive, false)
  assert.equal(a.excludeActive, false)
  assert.equal(a.resetDisabled, true)
  assert.equal(a.strikethrough, false)
})

test('!detected + neutral → no pill, no active, reset disabled', () => {
  const a = deriveRowAppearance(false, 'neutral')
  assert.equal(a.showAuto, false)
  assert.equal(a.includeActive, false)
  assert.equal(a.excludeActive, false)
  assert.equal(a.resetDisabled, true)
  assert.equal(a.strikethrough, false)
})

// ── Include state ─────────────────────────────────────────────────

test('detected + include → include active, reset enabled, no auto pill', () => {
  const a = deriveRowAppearance(true, 'include')
  assert.equal(a.showAuto, false)
  assert.equal(a.includeActive, true)
  assert.equal(a.excludeActive, false)
  assert.equal(a.resetDisabled, false)
  assert.equal(a.strikethrough, false)
})

test('!detected + include → include active (include-only row)', () => {
  const a = deriveRowAppearance(false, 'include')
  assert.equal(a.showAuto, false)
  assert.equal(a.includeActive, true)
  assert.equal(a.excludeActive, false)
  assert.equal(a.resetDisabled, false)
  assert.equal(a.strikethrough, false)
})

// ── Exclude state ─────────────────────────────────────────────────

test('detected + exclude → exclude active, strikethrough on, reset enabled', () => {
  const a = deriveRowAppearance(true, 'exclude')
  assert.equal(a.showAuto, false)
  assert.equal(a.includeActive, false)
  assert.equal(a.excludeActive, true)
  assert.equal(a.resetDisabled, false)
  assert.equal(a.strikethrough, true)
})

test('!detected + exclude → exclude active, strikethrough on', () => {
  const a = deriveRowAppearance(false, 'exclude')
  assert.equal(a.showAuto, false)
  assert.equal(a.includeActive, false)
  assert.equal(a.excludeActive, true)
  assert.equal(a.resetDisabled, false)
  assert.equal(a.strikethrough, true)
})

// ── Invariants ────────────────────────────────────────────────────

test('include and exclude are never simultaneously active', () => {
  for (const detected of [true, false]) {
    for (const state of ['include', 'exclude', 'neutral'] as const) {
      const a = deriveRowAppearance(detected, state)
      assert.equal(
        a.includeActive && a.excludeActive,
        false,
        `(detected=${detected}, state=${state}) → both active`
      )
    }
  }
})

test('auto pill only ever shows in neutral state', () => {
  // Across all 6 combinations, showAuto must imply neutral.
  for (const detected of [true, false]) {
    for (const state of ['include', 'exclude', 'neutral'] as const) {
      const a = deriveRowAppearance(detected, state)
      if (a.showAuto) {
        assert.equal(state, 'neutral')
      }
    }
  }
})

test('strikethrough only in exclude state', () => {
  for (const detected of [true, false]) {
    for (const state of ['include', 'exclude', 'neutral'] as const) {
      const a = deriveRowAppearance(detected, state)
      if (a.strikethrough) assert.equal(state, 'exclude')
    }
  }
})
