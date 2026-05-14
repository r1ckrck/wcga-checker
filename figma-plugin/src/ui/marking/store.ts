// In-iframe cache + load/save bridge for marker state, mirrored after
// `src/ui/settings/store.ts`.
//
// The marking store coordinates four concerns:
//   1. The current file's `MarkersFile` (include + exclude lists)
//   2. The current Figma selection — pushed from main via `marker-state`
//      (any node type, not just supported audit roots)
//   3. The descendant-interactive list under the selection (commit 3 fills
//      this in — empty in commit 1)
//   4. The current load error, if any (e.g. `no-file-key` in untitled files)
//
// Subscribers fire whenever ANY of these change so the page can re-render
// from a single source of truth.

import type {
  AnyNodeSelectionInfo,
  DescendantInteractive,
  MainToUI,
  MarkersErrorReason,
  UIToMain,
} from '../../shared/protocol'
import {
  EMPTY_MARKERS_FILE,
  type MarkersFile,
} from '../../shared/markers.ts'

export interface MarkingState {
  fileKey: string | null
  markers: MarkersFile
  selection: AnyNodeSelectionInfo
  descendants: DescendantInteractive[]
  /** Last load-time error, if any. Cleared on the next successful load.
   *  `no-file-key` flips the page into read-only mode. */
  loadError: MarkersErrorReason | null
}

type Listener = (state: MarkingState) => void

const INITIAL_STATE: MarkingState = {
  fileKey: null,
  markers: EMPTY_MARKERS_FILE,
  selection: { kind: 'none' },
  descendants: [],
  loadError: null,
}

let state: MarkingState = INITIAL_STATE
const listeners = new Set<Listener>()

let pendingLoadResolvers: Array<(s: MarkingState) => void> = []
let pendingSaveResolvers: Array<{ resolve: () => void; reject: (e: Error) => void }> = []

function send(msg: UIToMain): void {
  parent.postMessage({ pluginMessage: msg }, '*')
}

function patch(next: Partial<MarkingState>): void {
  state = { ...state, ...next }
  for (const fn of listeners) fn(state)
}

/** Synchronous read of the cached marking state. Always returns the latest
 *  snapshot, even before the first load completes. */
export function getMarkingState(): MarkingState {
  return state
}

/** Subscribe to state changes. Returns an unsubscribe function. */
export function subscribeMarkers(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** Round-trip a load request through main. Resolves with the new state. */
export function loadMarkers(): Promise<MarkingState> {
  return new Promise<MarkingState>(resolve => {
    pendingLoadResolvers.push(resolve)
    send({ kind: 'markers-load' })
  })
}

/** Round-trip a save. Optimistic local update — cache is patched immediately
 *  so the UI reflects the new state before the round-trip completes. Resolves
 *  on `markers-saved`; rejects on `markers-error`. */
export function saveMarkers(next: MarkersFile): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    pendingSaveResolvers.push({ resolve, reject })
    patch({ markers: next })
    send({ kind: 'markers-save', markers: next })
  })
}

/** Tell main to start emitting `marker-state` on selection changes. Call this
 *  when the marking page becomes visible. Main also fires one synthetic emit
 *  immediately so the page paints without waiting for cursor movement. */
export function startMarkerWatch(): void {
  send({ kind: 'marker-watch', on: true })
}

/** Counterpart of `startMarkerWatch` — stops the descendant-collection cost
 *  when the marking page closes. */
export function stopMarkerWatch(): void {
  send({ kind: 'marker-watch', on: false })
}

/** Wire the message handler. Must be called once at boot before any
 *  load/save. Idempotent guard prevents double-binding. */
let attached = false
export function attachMarkerMessageHandler(): void {
  if (attached) return
  attached = true
  window.addEventListener('message', e => {
    const data = e.data as { pluginMessage?: MainToUI } | undefined
    const msg = data?.pluginMessage
    if (!msg) return

    if (msg.kind === 'markers-loaded') {
      patch({
        fileKey: msg.fileKey,
        markers: msg.markers,
        loadError: null,
      })
      const resolvers = pendingLoadResolvers
      pendingLoadResolvers = []
      for (const r of resolvers) r(state)
      return
    }
    if (msg.kind === 'markers-saved') {
      const resolvers = pendingSaveResolvers
      pendingSaveResolvers = []
      for (const r of resolvers) r.resolve()
      return
    }
    if (msg.kind === 'markers-error') {
      patch({ loadError: msg.reason })
      const resolvers = pendingSaveResolvers
      pendingSaveResolvers = []
      const err = new Error(msg.reason)
      for (const r of resolvers) r.reject(err)
      return
    }
    if (msg.kind === 'marker-state') {
      patch({
        selection: msg.selection,
        descendants: msg.descendantInteractives,
      })
      return
    }
  })
}
