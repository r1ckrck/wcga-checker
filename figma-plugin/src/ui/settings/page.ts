// Settings page wiring — full-panel swap (#main hides, #settings-page shows).
//
// Responsibilities:
//   - Populate fields from the cached settings on every open.
//   - Tab click: clear key, swap model dropdown + placeholder + hint, toggle
//     Google caveat banner. (Tab switch is purely local; nothing persists
//     until Save.)
//   - Save: round-trip through settings store, toast confirmation, close.
//   - Cancel / × / Esc: discard local edits, close.
//   - Clear key: two-click confirm (3s window) — only visible when a key
//     is currently saved for the active tab.
//
// The page never echoes a stored key back into the input — paste-only,
// security-by-UX. The "Clear key" button is the affordance that shows
// "yes, a key is saved for this provider".

import {
  KEY_PLACEHOLDER,
  KEY_SOURCE_URL,
  MODEL_OPTIONS,
  PROVIDER_LABELS,
} from '../ai/registry.ts'
import type { ProviderId } from '../../shared/settings.ts'
import { getSettings, saveSettings } from './store.ts'

interface PageRefs {
  page: HTMLElement
  main: HTMLElement
  tabs: HTMLButtonElement[]
  caveat: HTMLElement
  keyInput: HTMLInputElement
  keyHint: HTMLElement
  modelSelect: HTMLSelectElement
  saveBtn: HTMLButtonElement
  cancelBtn: HTMLButtonElement
  closeBtn: HTMLButtonElement
  clearBtn: HTMLButtonElement
  clearLabel: HTMLElement
}

let refs: PageRefs | null = null
let activeProvider: ProviderId = 'openrouter'
let onCloseCallback: (() => void) | null = null

// Clear-key two-click confirm state. Reset by any non-clear interaction.
let clearArmed = false
let clearArmedTimer: ReturnType<typeof setTimeout> | null = null
const CLEAR_CONFIRM_WINDOW_MS = 3000

/** One-time wiring. Idempotent — safe to call multiple times. The optional
 *  `onClose` runs after every close so the header can re-render. */
export function initSettingsPage(onClose?: () => void): void {
  if (refs) return
  onCloseCallback = onClose ?? null
  refs = collectRefs()
  wireEvents(refs)
}

export function showSettingsPage(): void {
  if (!refs) throw new Error('settings page not initialised')
  populateFromSettings()
  refs.main.hidden = true
  refs.page.hidden = false
  refs.keyInput.focus()
}

export function hideSettingsPage(): void {
  if (!refs) return
  refs.page.hidden = true
  refs.main.hidden = false
  resetClearArm()
  if (onCloseCallback) onCloseCallback()
}

// ── Internals ────────────────────────────────────────────────────

function collectRefs(): PageRefs {
  return {
    page: required('settings-page'),
    main: required('main'),
    tabs: Array.from(document.querySelectorAll<HTMLButtonElement>('.settings-tab')),
    caveat: required('settings-caveat'),
    keyInput: required<HTMLInputElement>('settings-key'),
    keyHint: required('settings-key-hint'),
    modelSelect: required<HTMLSelectElement>('settings-model'),
    saveBtn: required<HTMLButtonElement>('settings-save'),
    cancelBtn: required<HTMLButtonElement>('settings-cancel'),
    closeBtn: required<HTMLButtonElement>('settings-close'),
    clearBtn: required<HTMLButtonElement>('settings-clear'),
    clearLabel: required('settings-clear-label'),
  }
}

function required<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id)
  if (!el) throw new Error(`Settings page missing #${id}`)
  return el as T
}

function wireEvents(r: PageRefs): void {
  for (const tab of r.tabs) {
    tab.addEventListener('click', () => {
      const provider = tab.dataset.provider as ProviderId | undefined
      if (!provider) return
      switchProvider(provider)
    })
  }

  r.keyInput.addEventListener('input', () => {
    r.saveBtn.disabled = r.keyInput.value.trim().length === 0
    resetClearArm()
  })

  r.modelSelect.addEventListener('change', () => {
    resetClearArm()
  })

  r.saveBtn.addEventListener('click', () => {
    void handleSave()
  })

  r.cancelBtn.addEventListener('click', () => hideSettingsPage())
  r.closeBtn.addEventListener('click', () => hideSettingsPage())

  r.clearBtn.addEventListener('click', () => {
    if (!clearArmed) {
      armClear()
      return
    }
    void handleClear()
  })

  // Esc closes the panel. Capture-phase + check the page is visible so we
  // don't swallow Escape elsewhere in the iframe.
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return
    if (!refs || refs.page.hidden) return
    e.preventDefault()
    hideSettingsPage()
  })
}

function populateFromSettings(): void {
  if (!refs) return
  const s = getSettings()
  activeProvider = s.provider
  selectTab(activeProvider)
  // Never echo the stored key back. The input always opens empty; the
  // "Clear key" button surfaces when a key is currently saved for the
  // active provider so the user knows there's one stored.
  refs.keyInput.value = ''
  refs.keyInput.placeholder = KEY_PLACEHOLDER[activeProvider]
  refs.modelSelect.innerHTML = ''
  for (const m of MODEL_OPTIONS[activeProvider]) {
    const opt = document.createElement('option')
    opt.value = m
    opt.textContent = m
    if (m === s.model) opt.selected = true
    refs.modelSelect.appendChild(opt)
  }
  refs.caveat.hidden = activeProvider !== 'google'
  refs.keyHint.textContent = hintFor(activeProvider)
  refs.saveBtn.disabled = true
  // Show "Clear key" only when the active tab matches the stored provider
  // *and* there's actually a key saved.
  refs.clearBtn.hidden = !(s.provider === activeProvider && s.apiKey.length > 0)
  resetClearArm()
}

function switchProvider(next: ProviderId): void {
  if (!refs) return
  if (next === activeProvider) return
  activeProvider = next
  selectTab(next)
  // Per spec: switching tabs clears the key field. Local state only; nothing
  // persists until Save. Stored key for the previous provider stays put.
  refs.keyInput.value = ''
  refs.keyInput.placeholder = KEY_PLACEHOLDER[next]
  refs.modelSelect.innerHTML = ''
  for (const m of MODEL_OPTIONS[next]) {
    const opt = document.createElement('option')
    opt.value = m
    opt.textContent = m
    refs.modelSelect.appendChild(opt)
  }
  refs.caveat.hidden = next !== 'google'
  refs.keyHint.textContent = hintFor(next)
  refs.saveBtn.disabled = true
  // Clear button is per-provider — only show it when the user is on the
  // tab matching the currently-saved provider.
  const stored = getSettings()
  refs.clearBtn.hidden = !(stored.provider === next && stored.apiKey.length > 0)
  resetClearArm()
}

function selectTab(provider: ProviderId): void {
  if (!refs) return
  for (const tab of refs.tabs) {
    const isActive = tab.dataset.provider === provider
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false')
    tab.classList.toggle('settings-tab--active', isActive)
  }
}

function hintFor(p: ProviderId): string {
  const url = KEY_SOURCE_URL[p]
  switch (p) {
    case 'openrouter':
      return `Get a key at ${url}. Stored locally in figma.clientStorage; never sent anywhere except OpenRouter.`
    case 'anthropic':
      return `Get a key at ${url}. Calls Anthropic directly from your browser; key sits in figma.clientStorage.`
    case 'google':
      return `Get a key at ${url}. CORS support is inconsistent — see note above.`
  }
}

async function handleSave(): Promise<void> {
  if (!refs) return
  const apiKey = refs.keyInput.value.trim()
  if (apiKey.length === 0) return
  const model = refs.modelSelect.value
  refs.saveBtn.disabled = true
  try {
    await saveSettings({ provider: activeProvider, apiKey, model, aiEnabled: true })
    toast(`Saved ${PROVIDER_LABELS[activeProvider]} key`)
    hideSettingsPage()
  } catch (e) {
    toast(`Couldn't save: ${(e as Error).message}`)
    refs.saveBtn.disabled = false
  }
}

async function handleClear(): Promise<void> {
  if (!refs) return
  const s = getSettings()
  resetClearArm()
  try {
    await saveSettings({ ...s, apiKey: '' })
    toast('Cleared key')
    hideSettingsPage()
  } catch (e) {
    toast(`Couldn't clear: ${(e as Error).message}`)
  }
}

function armClear(): void {
  if (!refs) return
  clearArmed = true
  refs.clearLabel.textContent = 'Click again to clear'
  refs.clearBtn.classList.add('settings-actions__clear--armed')
  if (clearArmedTimer != null) clearTimeout(clearArmedTimer)
  clearArmedTimer = setTimeout(() => resetClearArm(), CLEAR_CONFIRM_WINDOW_MS)
}

function resetClearArm(): void {
  if (!refs) return
  clearArmed = false
  refs.clearLabel.textContent = 'Clear key'
  refs.clearBtn.classList.remove('settings-actions__clear--armed')
  if (clearArmedTimer != null) {
    clearTimeout(clearArmedTimer)
    clearArmedTimer = null
  }
}

/** Lightweight toast — reuses the existing #toast element if present, else
 *  no-ops. The main UI module owns the full toast lifecycle; we just push
 *  text into it. */
function toast(message: string): void {
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent = message
  el.hidden = false
  setTimeout(() => {
    el.hidden = true
  }, 1500)
}
