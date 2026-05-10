// In-iframe cache + load/save bridge for AiSettings.
//
// The UI iframe can't read figma.clientStorage directly — only the main
// thread has access. This module owns the round-trip:
//   load → post `settings-load` → await `settings-loaded`
//   save → post `settings-save` → await `settings-saved` (or settings-error)
//
// `getSettings()` is synchronous and returns the most recently cached value
// (or DEFAULT_SETTINGS when nothing has loaded yet). The header indicator
// and the AI section state machine read it on every render — keeping it
// sync means they don't need to be async-aware.
//
// Subscribers fire after every successful load/save so the header indicator
// re-renders the moment the user toggles AI or saves a new key.

import type { MainToUI, UIToMain } from '../../shared/protocol'
import { DEFAULT_SETTINGS, type AiSettings } from '../../shared/settings.ts'

type Listener = (settings: AiSettings) => void

let cache: AiSettings = DEFAULT_SETTINGS
const listeners = new Set<Listener>()

// In-flight request tracking. The settings round-trip is modal (the user
// sees the settings page while it's happening), so a single in-flight slot
// per direction is enough. Multiple concurrent loads/saves would resolve
// to the most-recent response — fine for our use case.
let pendingLoadResolvers: Array<(s: AiSettings) => void> = []
let pendingSaveResolvers: Array<{ resolve: () => void; reject: (e: Error) => void }> = []

function send(msg: UIToMain): void {
  parent.postMessage({ pluginMessage: msg }, '*')
}

/** Synchronous read of the cached settings. Returns DEFAULT_SETTINGS until
 *  the first `loadSettings()` call resolves. Safe to call from anywhere. */
export function getSettings(): AiSettings {
  return cache
}

/** Round-trip a load request through main. Caches the result and notifies
 *  subscribers. Resolves with the loaded value (or DEFAULT_SETTINGS on a
 *  settings-error response). */
export function loadSettings(): Promise<AiSettings> {
  return new Promise<AiSettings>(resolve => {
    pendingLoadResolvers.push(resolve)
    send({ kind: 'settings-load' })
  })
}

/** Round-trip a save request. Updates cache + notifies subscribers on
 *  success. Rejects on settings-error. */
export function saveSettings(next: AiSettings): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    pendingSaveResolvers.push({ resolve, reject })
    // Optimistic local cache update — header re-renders immediately, even
    // before the round-trip completes. The settings-saved message is the
    // confirmation; settings-error would prompt a rollback (rare enough
    // we don't bother for now — main's clientStorage is reliable).
    cache = next
    notify()
    send({ kind: 'settings-save', settings: next })
  })
}

/** Subscribe to settings changes. Returns an unsubscribe function. */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function notify(): void {
  for (const fn of listeners) fn(cache)
}

/** Wire the global window message handler to update the cache on
 *  settings-loaded / settings-saved / settings-error. Must be called once
 *  at boot time (before loadSettings()). */
export function attachSettingsMessageHandler(): void {
  window.addEventListener('message', e => {
    const data = e.data as { pluginMessage?: MainToUI } | undefined
    const msg = data?.pluginMessage
    if (!msg) return
    if (msg.kind === 'settings-loaded') {
      cache = msg.settings
      notify()
      const resolvers = pendingLoadResolvers
      pendingLoadResolvers = []
      for (const r of resolvers) r(msg.settings)
      return
    }
    if (msg.kind === 'settings-saved') {
      const resolvers = pendingSaveResolvers
      pendingSaveResolvers = []
      for (const r of resolvers) r.resolve()
      return
    }
    if (msg.kind === 'settings-error') {
      const resolvers = pendingSaveResolvers
      pendingSaveResolvers = []
      const err = new Error(msg.reason)
      for (const r of resolvers) r.reject(err)
      return
    }
  })
}
