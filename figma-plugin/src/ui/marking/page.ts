// Marking page — full-panel takeover for designer-set interactivity markers.
// Mirrors the settings-page pattern: sibling DOM, `hidden` attribute toggle,
// `init` + `show` + `hide` exports, Esc + back-button close.
//
// Commit 2: selection card + primary Include/Exclude CTAs + Reset link.
// Commit 3 (TODO): descendant list below the CTAs.

import type { DescendantInteractive, UIToMain } from '../../shared/protocol'
import {
  deriveState,
  setMarkerState,
  type MarkerState,
  type MarkersFile,
} from '../../shared/markers.ts'
import {
  attachMarkerMessageHandler,
  getMarkingState,
  loadMarkers,
  saveMarkers,
  startMarkerWatch,
  stopMarkerWatch,
  subscribeMarkers,
  type MarkingState,
} from './store.ts'

/** Must match `DESCENDANT_LIST_CAP` in `src/main/index.ts`. When the list
 *  contains this many entries we assume the main thread had to truncate and
 *  show the overflow tail. */
const DESCENDANT_LIST_CAP = 200

function sendUiMessage(msg: UIToMain): void {
  parent.postMessage({ pluginMessage: msg }, '*')
}

/** Pure derivation of a row's visual state from (detected × markerState).
 *  Exported for unit tests in `__tests__/derive-row.test.ts`. Doesn't touch
 *  DOM — keeps the row builder thin and the cross-product testable. */
export interface RowAppearance {
  /** Show the dashed "auto" pill — only when detected by classifier AND user
   *  hasn't marked it. */
  showAuto: boolean
  /** Include row button is the active state. */
  includeActive: boolean
  /** Exclude row button is the active state. */
  excludeActive: boolean
  /** Reset button is disabled — only when state === neutral (nothing to reset). */
  resetDisabled: boolean
  /** Strikethrough the row name — only in exclude state. */
  strikethrough: boolean
}

export function deriveRowAppearance(
  detected: boolean,
  state: MarkerState
): RowAppearance {
  return {
    showAuto: detected && state === 'neutral',
    includeActive: state === 'include',
    excludeActive: state === 'exclude',
    resetDisabled: state === 'neutral',
    strikethrough: state === 'exclude',
  }
}

interface PageRefs {
  page: HTMLElement
  main: HTMLElement
  settingsPage: HTMLElement | null
  closeBtn: HTMLButtonElement
  body: HTMLElement
}

let refs: PageRefs | null = null
let onCloseCallback: (() => void) | null = null
let unsubscribe: (() => void) | null = null
/** Element to restore focus to on close. Captured when `showMarkingPage`
 *  fires so we send focus back to wherever it came from (typically the
 *  header Mark button). Falls back to `<body>` if missing. */
let previouslyFocused: HTMLElement | null = null
/** Track whether we've already landed focus inside the page on this open
 *  cycle, so subsequent re-renders don't steal focus from a user-clicked
 *  control. Reset on close. */
let focusLandedThisOpen = false

const TOAST_VISIBLE_MS = 1800

export function initMarkingPage(onClose?: () => void): void {
  if (refs) return
  onCloseCallback = onClose ?? null
  attachMarkerMessageHandler()
  refs = collectRefs()
  wireEvents(refs)
}

export function showMarkingPage(): void {
  if (!refs) throw new Error('marking page not initialised')
  // Capture focus origin so we can restore it on close.
  previouslyFocused = (document.activeElement as HTMLElement) ?? null
  focusLandedThisOpen = false

  void loadMarkers()
  startMarkerWatch()

  refs.main.hidden = true
  if (refs.settingsPage) refs.settingsPage.hidden = true
  refs.page.hidden = false

  if (!unsubscribe) {
    unsubscribe = subscribeMarkers(() => {
      render()
      maybeUpgradeFocusToInclude()
    })
  }
  render()
  // Default focus to the back button so a Tab cycle starts at the page header.
  // We'll upgrade to the Include CTA via `maybeUpgradeFocusToInclude` once a
  // markable selection arrives — provided the user hasn't moved focus yet.
  refs.closeBtn.focus()
  maybeUpgradeFocusToInclude()
}

export function hideMarkingPage(): void {
  if (!refs) return
  refs.page.hidden = true
  refs.main.hidden = false
  stopMarkerWatch()
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  // Restore focus to whatever opened the page (header Mark button most often).
  if (previouslyFocused && document.contains(previouslyFocused)) {
    previouslyFocused.focus()
  }
  previouslyFocused = null
  focusLandedThisOpen = false
  if (onCloseCallback) onCloseCallback()
}

/** Upgrade focus from the back button to the Include CTA the first time a
 *  markable selection becomes available. Skipped if the user has already
 *  moved focus elsewhere — their intent wins. */
function maybeUpgradeFocusToInclude(): void {
  if (!refs || focusLandedThisOpen) return
  if (document.activeElement !== refs.closeBtn) {
    // User moved focus already — don't yank it back.
    focusLandedThisOpen = true
    return
  }
  const includeBtn = refs.body.querySelector<HTMLButtonElement>(
    '.marking-ctas__btn--include:not(:disabled)'
  )
  if (includeBtn) {
    includeBtn.focus()
    focusLandedThisOpen = true
  }
}

// ── Wiring ────────────────────────────────────────────────────────

function collectRefs(): PageRefs {
  return {
    page: required('marking-page'),
    main: required('main'),
    settingsPage: document.getElementById('settings-page'),
    closeBtn: required<HTMLButtonElement>('marking-close'),
    body: required('marking-body'),
  }
}

function required<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Marking page missing #${id}`)
  return el as T
}

function wireEvents(r: PageRefs): void {
  r.closeBtn.addEventListener('click', () => hideMarkingPage())

  // Esc closes the page. Capture phase + visibility check so we don't swallow
  // Escape elsewhere in the iframe.
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return
    if (!refs || refs.page.hidden) return
    e.preventDefault()
    hideMarkingPage()
  })
}

// ── Render ────────────────────────────────────────────────────────

function render(): void {
  if (!refs) return
  const s = getMarkingState()
  const body = refs.body
  body.replaceChildren()

  if (s.loadError === 'no-file-key') {
    body.appendChild(buildReadOnlyMessage())
    return
  }

  body.appendChild(buildSelectionCard(s))
  body.appendChild(buildCtas(s))

  // Reset link only visible when state is Include or Exclude AND a node is
  // selected (no Reset on the empty-state).
  const currentState = currentNodeState(s)
  if (currentState !== 'neutral') {
    body.appendChild(buildResetLink(s))
  }

  // List is hidden when the selection itself is Include — the include marker
  // already carries the signal for that node and we don't need to surface
  // descendants. Shown for Neutral or Exclude so the user can drill down or
  // override children.
  if (currentState !== 'include' && s.selection.kind === 'any') {
    const list = buildDescendantList(s)
    if (list) body.appendChild(list)
  }
}

// ── State helpers ─────────────────────────────────────────────────

function currentNodeId(s: MarkingState): string | null {
  return s.selection.kind === 'any' && s.selection.canMark ? s.selection.id : null
}

function currentNodeState(s: MarkingState): MarkerState {
  const id = currentNodeId(s)
  if (!id) return 'neutral'
  return deriveState(s.markers, id)
}

async function writeState(
  s: MarkingState,
  nodeId: string,
  next: MarkerState
): Promise<void> {
  const nextFile: MarkersFile = setMarkerState(s.markers, nodeId, next)
  try {
    await saveMarkers(nextFile)
  } catch (e) {
    // Optimistic local update already happened in the store — we surface the
    // failure so the user knows persistence didn't stick. On the next load
    // the persisted (older) state will surface, which is the right answer
    // either way.
    const reason = (e as Error).message
    toast(
      reason === 'no-file-key'
        ? "Couldn't save — open this file in Figma editor mode to enable marking"
        : "Couldn't save marker — try again"
    )
  }
}

/** Lightweight toast reuses the existing #toast element (shared with the
 *  rest of the plugin). No-ops if the element isn't in the DOM. */
function toast(message: string): void {
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent = message
  el.hidden = false
  setTimeout(() => {
    el.hidden = true
  }, TOAST_VISIBLE_MS)
}

// ── Builders ──────────────────────────────────────────────────────

function buildReadOnlyMessage(): HTMLElement {
  const wrap = document.createElement('p')
  wrap.className = 'marking-empty'
  // This path fires when the document is read-only (Dev Mode without a
  // previously-set file id, or rare permission edge cases). Opening the
  // file in Figma editor mode once will initialise the file id and unlock
  // marking on the next plugin run.
  wrap.textContent =
    "Marking isn't available here — Dev Mode is read-only. Open this file in Figma editor mode to enable marking."
  return wrap
}

function buildSelectionCard(s: MarkingState): HTMLElement {
  const card = document.createElement('div')
  card.className = 'marking-selection-card'

  if (s.selection.kind === 'none') {
    const msg = document.createElement('p')
    msg.className = 'marking-empty'
    msg.textContent = 'Select a node in Figma to mark or unmark.'
    card.appendChild(msg)
    return card
  }

  if (s.selection.kind === 'multiple') {
    const msg = document.createElement('p')
    msg.className = 'marking-empty'
    msg.textContent = `${s.selection.count} nodes selected — select a single node.`
    card.appendChild(msg)
    return card
  }

  // kind === 'any'
  const name = document.createElement('span')
  name.className = 'marking-selection-card__name'
  name.textContent = s.selection.name
  card.appendChild(name)

  const meta = document.createElement('span')
  meta.className = 'marking-selection-card__meta'
  meta.textContent = `${s.selection.nodeType.toLowerCase()} · ${s.selection.width}×${s.selection.height}`
  card.appendChild(meta)

  const state = currentNodeState(s)
  if (state !== 'neutral') {
    card.appendChild(buildPill(state))
  }
  return card
}

function buildPill(state: MarkerState): HTMLElement {
  const pill = document.createElement('span')
  pill.className = `marking-pill marking-pill--${state}`
  const dot = document.createElement('span')
  dot.className = 'marking-pill__dot'
  dot.setAttribute('aria-hidden', 'true')
  pill.appendChild(dot)
  pill.appendChild(document.createTextNode(state === 'include' ? 'Include' : 'Exclude'))
  return pill
}

function buildCtas(s: MarkingState): HTMLElement {
  const row = document.createElement('div')
  row.className = 'marking-ctas'

  const id = currentNodeId(s)
  const state = currentNodeState(s)
  const disabled = id === null

  row.appendChild(buildCtaButton('include', state === 'include', disabled, () => {
    if (id) void writeState(s, id, 'include')
  }))
  row.appendChild(buildCtaButton('exclude', state === 'exclude', disabled, () => {
    if (id) void writeState(s, id, 'exclude')
  }))
  return row
}

function buildCtaButton(
  variant: 'include' | 'exclude',
  active: boolean,
  disabled: boolean,
  onClick: () => void
): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = `marking-ctas__btn marking-ctas__btn--${variant}`
  if (active) btn.classList.add('marking-ctas__btn--active')
  btn.disabled = disabled
  btn.setAttribute('aria-pressed', active ? 'true' : 'false')
  btn.textContent = variant === 'include' ? 'Include' : 'Exclude'
  // Click-the-active-CTA → no-op (Reset is the only path to Neutral).
  if (!active) {
    btn.addEventListener('click', onClick)
  }
  return btn
}

function buildResetLink(s: MarkingState): HTMLElement {
  const link = document.createElement('button')
  link.type = 'button'
  link.className = 'marking-ctas__reset'
  link.textContent = 'Reset'
  link.title = 'Clear override'
  link.addEventListener('click', () => {
    const id = currentNodeId(s)
    if (id) void writeState(s, id, 'neutral')
  })
  return link
}

// ── Descendant list ───────────────────────────────────────────────

/** Build the row list for nodes inside the current selection. Returns null
 *  when the list would be empty — keeps the page tighter. */
function buildDescendantList(s: MarkingState): HTMLElement | null {
  if (s.descendants.length === 0) return null

  const wrap = document.createElement('div')
  wrap.className = 'marking-list'

  const heading = document.createElement('div')
  heading.className = 'marking-list__heading'
  heading.textContent = 'Interactive elements in selection'
  wrap.appendChild(heading)

  for (const row of s.descendants) {
    wrap.appendChild(buildDescendantRow(row, s))
  }

  // Overflow tail — main caps at DESCENDANT_LIST_CAP so a list at the cap
  // may have been truncated. Surface that to the designer.
  if (s.descendants.length >= DESCENDANT_LIST_CAP) {
    const tail = document.createElement('p')
    tail.className = 'marking-list__overflow'
    tail.textContent = 'More items not shown — narrow the selection to see them.'
    wrap.appendChild(tail)
  }
  return wrap
}

function buildDescendantRow(row: DescendantInteractive, s: MarkingState): HTMLElement {
  const state = deriveState(s.markers, row.id)
  const appearance = deriveRowAppearance(row.detected, state)

  const el = document.createElement('div')
  el.className = `marking-list__row marking-list__row--${state}`

  // Leading state dot — purple for include, amber for exclude, hairline for
  // neutral. Provides the at-a-glance state read without relying on the
  // button colors alone.
  const dot = document.createElement('span')
  dot.className = `marking-list__dot marking-list__dot--${state}`
  dot.setAttribute('aria-hidden', 'true')
  el.appendChild(dot)

  // Node name — click jumps to it in Figma via the existing select-node
  // handler.
  const nameBtn = document.createElement('button')
  nameBtn.type = 'button'
  nameBtn.className = 'marking-list__name'
  nameBtn.textContent = row.name || '(unnamed)'
  nameBtn.title = `${row.nodeType.toLowerCase()} · select in canvas`
  nameBtn.addEventListener('click', () => {
    sendUiMessage({ kind: 'select-node', nodeId: row.id })
  })
  el.appendChild(nameBtn)

  // "auto" pill or spacer.
  if (appearance.showAuto) {
    const auto = document.createElement('span')
    auto.className = 'marking-list__auto'
    auto.textContent = 'auto'
    el.appendChild(auto)
  } else {
    const spacer = document.createElement('span')
    spacer.className = 'marking-list__spacer'
    el.appendChild(spacer)
  }

  // Control cluster — same toggle semantics as the top CTAs.
  const controls = document.createElement('span')
  controls.className = 'marking-list__controls'
  controls.appendChild(
    buildRowIconBtn('include', '+', 'Include', appearance.includeActive, () => {
      if (!appearance.includeActive) void writeState(s, row.id, 'include')
    })
  )
  controls.appendChild(
    buildRowIconBtn('exclude', '−', 'Exclude', appearance.excludeActive, () => {
      if (!appearance.excludeActive) void writeState(s, row.id, 'exclude')
    })
  )
  controls.appendChild(
    buildRowIconBtn('reset', '↺', 'Reset', false, () => {
      if (!appearance.resetDisabled) void writeState(s, row.id, 'neutral')
    }, appearance.resetDisabled)
  )
  el.appendChild(controls)

  return el
}

function buildRowIconBtn(
  variant: 'include' | 'exclude' | 'reset',
  glyph: string,
  label: string,
  active: boolean,
  onClick: () => void,
  disabled = false
): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = `marking-list__icon-btn marking-list__icon-btn--${variant}`
  if (active) btn.classList.add('marking-list__icon-btn--active')
  btn.disabled = disabled
  btn.setAttribute('aria-label', label)
  btn.setAttribute('aria-pressed', active ? 'true' : 'false')
  btn.title = label
  btn.textContent = glyph
  // Clicking the active row CTA is a no-op (mirrors top CTA semantics).
  if (!active && !disabled) {
    btn.addEventListener('click', onClick)
  }
  return btn
}
