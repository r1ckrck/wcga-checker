// Message contract between the main-thread sandbox (src/main) and the UI iframe (src/ui).
// Both halves import these types so wire format stays in sync.

import type { AuditDTO } from './dtos'
import type { Finding, FindingsReport } from '../checks/findings.ts'
import type { AiSettings } from './settings.ts'

export type UIToMain =
  | { kind: 'init' }
  | { kind: 'run-audit' }
  | { kind: 'run-variant-audit' }
  | { kind: 'select-node'; nodeId: string }
  | { kind: 'resize'; height: number }
  // ── Settings (per-user AI key + provider, persisted via figma.clientStorage) ──
  | { kind: 'settings-load' }
  | { kind: 'settings-save'; settings: AiSettings }

export type MainToUI =
  | { kind: 'state'; selection: SelectionInfo }
  | {
      kind: 'audit-result'
      dto: AuditDTO
      findings: FindingsReport
      // PNG bytes from node.exportAsync. Uint8Array survives postMessage cleanly.
      // null when the export failed — UI skips visual review with a clear message.
      screenshot: Uint8Array | null
      // Bug 7 — large non-exempt images that should go through the AI image-of-
      // text check. Empty when nothing in the component qualifies. The `bytes`
      // field carries the *raw image asset* (via figma.getImageByHash), NOT
      // a screenshot of the node — see `buildImageCandidates` in main/index.ts
      // for why. `mimeType` reflects the original upload format.
      imageCandidates: Array<{
        id: string
        name: string
        bytes: Uint8Array
        mimeType: 'png' | 'jpeg' | 'webp' | 'gif'
      }>
      // Per-variant thumbnails for default / focus / error states. Used by the
      // UI to render the variant-comparison strips for 1.4.1, 2.4.7, 3.3.1.
      // Keyed by node id so the renderer can pick whichever pair it needs.
      // Individual exports may fail silently — keys missing means "no thumb".
      variantThumbs: Record<string, Uint8Array>
    }
  | {
      kind: 'variant-result'
      passes: Finding[]
      flags: Finding[]
      unableToTest: Finding[]
    }
  | { kind: 'audit-error'; error: string }
  | { kind: 'variant-error'; error: string }
  // ── Settings round-trip ────────────────────────────────────────────────
  | { kind: 'settings-loaded'; settings: AiSettings }
  | { kind: 'settings-saved' }
  | { kind: 'settings-error'; reason: string }

export type SelectionInfo =
  | { kind: 'none' }
  | { kind: 'multiple'; count: number }
  | { kind: 'unsupported'; nodeType: string; nodeName: string }
  | {
      kind: 'ok'
      name: string
      type: SupportedNodeType
      id: string
      width: number
      height: number
    }

export type SupportedNodeType =
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'INSTANCE'
  | 'FRAME'
