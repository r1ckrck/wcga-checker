import { test } from 'node:test'
import assert from 'node:assert/strict'

// Minimal DOM stub for node:test — buildStat is pure DOM, doesn't need a
// real browser. We assert the shape of the produced markup via a small
// document mock that mirrors the few APIs the helper touches.

interface NodeStub {
  tagName: string
  ns: string | null
  attrs: Record<string, string>
  className: string
  children: NodeStub[]
  textContent: string
  title: string
  setAttribute: (k: string, v: string) => void
  setAttributeNS: (ns: string, k: string, v: string) => void
  appendChild: (n: NodeStub) => NodeStub
}

function makeNode(tagName: string, ns: string | null = null): NodeStub {
  const node: NodeStub = {
    tagName,
    ns,
    attrs: {},
    className: '',
    children: [],
    textContent: '',
    title: '',
    setAttribute(k: string, v: string) {
      node.attrs[k] = v
    },
    setAttributeNS(_ns: string, k: string, v: string) {
      node.attrs[k] = v
    },
    appendChild(child: NodeStub) {
      node.children.push(child)
      return child
    },
  }
  return node
}

;(globalThis as unknown as { document: unknown }).document = {
  createElement: (t: string) => makeNode(t),
  createElementNS: (ns: string, t: string) => makeNode(t, ns),
}

const { buildStat } = await import('../icon-stat.ts')

test('buildStat — produces a span with svg use href and count', () => {
  const el = buildStat('check', 4, 'passed') as unknown as NodeStub
  assert.equal(el.tagName, 'span')
  assert.equal(el.className, 'results__stat results__stat--check')
  assert.equal(el.title, '4 passed')
  // children: <svg> and <span class="results__stat-count">
  assert.equal(el.children.length, 2)
  const svg = el.children[0]
  assert.equal(svg.tagName, 'svg')
  assert.equal(svg.attrs['aria-hidden'], 'true')
  const use = svg.children[0]
  assert.equal(use.tagName, 'use')
  assert.equal(use.attrs['href'], '#icon-check')
  assert.equal(use.attrs['xlink:href'], '#icon-check')
  const count = el.children[1]
  assert.equal(count.tagName, 'span')
  assert.equal(count.className, 'results__stat-count')
  assert.equal(count.textContent, '4')
})

test('buildStat — warning icon', () => {
  const el = buildStat('warning', 0, 'flagged') as unknown as NodeStub
  assert.equal(el.className, 'results__stat results__stat--warning')
  assert.equal(el.title, '0 flagged')
  const use = el.children[0].children[0]
  assert.equal(use.attrs['href'], '#icon-warning')
})

test('buildStat — prohibit icon', () => {
  const el = buildStat('prohibit', 12, 'unable to test') as unknown as NodeStub
  assert.equal(el.className, 'results__stat results__stat--prohibit')
  const count = el.children[1]
  assert.equal(count.textContent, '12')
})
