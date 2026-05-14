import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isClickableName, normalizeLinkText } from '../interactivity.ts'

// ── isClickableName ─────────────────────────────────────────────────

test('matches plain Button', () => {
  assert.equal(isClickableName('Button'), true)
})

test('matches Button with slash-variant path', () => {
  assert.equal(isClickableName('Button/Primary/Large'), true)
})

test('matches PrimaryButton via camelCase split', () => {
  assert.equal(isClickableName('PrimaryButton'), true)
})

test('matches IconButton', () => {
  assert.equal(isClickableName('IconButton'), true)
})

test('matches IconBtn', () => {
  assert.equal(isClickableName('IconBtn'), true)
})

test('matches Btn-Primary', () => {
  assert.equal(isClickableName('Btn-Primary'), true)
})

test('matches Link', () => {
  assert.equal(isClickableName('Link'), true)
})

test('matches Chip', () => {
  assert.equal(isClickableName('Chip'), true)
})

test('matches Tab', () => {
  assert.equal(isClickableName('Tab'), true)
})

test('matches MenuItem (compound include beats simple exclude)', () => {
  assert.equal(isClickableName('MenuItem'), true)
  assert.equal(isClickableName('Menu Item'), true)
  assert.equal(isClickableName('menu-item'), true)
})

test('matches NavItem and ListItem', () => {
  assert.equal(isClickableName('NavItem'), true)
  assert.equal(isClickableName('ListItem'), true)
})

test('matches Checkbox / Radio / Switch / Toggle', () => {
  assert.equal(isClickableName('Checkbox'), true)
  assert.equal(isClickableName('Radio'), true)
  assert.equal(isClickableName('Switch'), true)
  assert.equal(isClickableName('Toggle'), true)
})

test('matches Dropdown / Select / Combobox', () => {
  assert.equal(isClickableName('Dropdown'), true)
  assert.equal(isClickableName('Select'), true)
  assert.equal(isClickableName('Combobox'), true)
})

// ── Exclusions ──────────────────────────────────────────────────────

test('excludes ButtonGroup container', () => {
  assert.equal(isClickableName('ButtonGroup'), false)
  assert.equal(isClickableName('Button Group'), false)
  assert.equal(isClickableName('button-group'), false)
})

test('excludes Tabs (plural) container', () => {
  assert.equal(isClickableName('Tabs'), false)
  assert.equal(isClickableName('Tabs/Selected'), false)
})

test('excludes Menu container but allows MenuItem', () => {
  assert.equal(isClickableName('Menu'), false)
  assert.equal(isClickableName('MenuItem'), true)
})

test('excludes Toolbar / Navigation / Navbar', () => {
  assert.equal(isClickableName('Toolbar'), false)
  assert.equal(isClickableName('Navigation'), false)
  assert.equal(isClickableName('Navbar'), false)
})

test('excludes CheckboxGroup and RadioGroup', () => {
  assert.equal(isClickableName('CheckboxGroup'), false)
  assert.equal(isClickableName('RadioGroup'), false)
})

// ── Non-matches ─────────────────────────────────────────────────────

test('rejects unrelated names', () => {
  assert.equal(isClickableName('Card'), false)
  assert.equal(isClickableName('Container'), false)
  assert.equal(isClickableName('Header'), false)
  assert.equal(isClickableName('Avatar'), false)
})

test('rejects empty / whitespace', () => {
  assert.equal(isClickableName(''), false)
  assert.equal(isClickableName('   '), false)
})

// ── normalizeLinkText ───────────────────────────────────────────────

test('lowercases and trims', () => {
  assert.equal(normalizeLinkText('  Read More  '), 'read more')
})

test('strips trailing arrow', () => {
  assert.equal(normalizeLinkText('Read more →'), 'read more')
  assert.equal(normalizeLinkText('Read more>'), 'read more')
  assert.equal(normalizeLinkText('Read more »'), 'read more')
})

test('strips trailing punctuation', () => {
  assert.equal(normalizeLinkText('Read more.'), 'read more')
  assert.equal(normalizeLinkText('Click here!'), 'click here')
})

test('collapses internal whitespace', () => {
  assert.equal(normalizeLinkText('Read    more'), 'read more')
  assert.equal(normalizeLinkText('Read\n\tmore'), 'read more')
})

test('handles ALL CAPS', () => {
  assert.equal(normalizeLinkText('READ MORE →'), 'read more')
})

test('preserves substantive text', () => {
  assert.equal(
    normalizeLinkText('Read more about home loans'),
    'read more about home loans'
  )
})

test('empty input → empty', () => {
  assert.equal(normalizeLinkText(''), '')
  assert.equal(normalizeLinkText('   '), '')
})
