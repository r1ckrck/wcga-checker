// Main-thread orchestrator. Runs inside Figma's plugin sandbox.
//
// Error-handling policy: surface what matters, swallow what doesn't.
//   - Audit-level failures (DTO build, check run) become `audit-error`
//     messages so the UI can render them.
//   - Per-node export failures (variant thumbs, image candidates) are
//     silently dropped via `tryExportAll` — the UI tolerates missing
//     entries and renders without those visuals.
//   - The top-level message handler wraps every dispatch in try/catch +
//     `figma.notify` so unexpected throws never leave the user staring
//     at a dead plugin.

import type { MainToUI, SelectionInfo, UIToMain, SupportedNodeType } from '../shared/protocol'
import type { AuditDTO } from '../shared/dtos'
import {
  DEFAULT_SETTINGS,
  parseSettings,
  SETTINGS_STORAGE_KEY,
  type AiSettings,
} from '../shared/settings.ts'
import { buildAuditDTO } from '../read/index.ts'
import { runChecks, runVariantChecks } from '../checks/orchestrator.ts'
import { tryExportAll } from './try-export-all.ts'

// Bug 4 — store the last successfully-built DTO so the user can opt into a
// variant audit later without re-traversing the tree. Cleared on each new
// run-audit / on errors.
let lastDTO: AuditDTO | null = null

const SUPPORTED_TYPES: ReadonlyArray<SupportedNodeType> = [
  'COMPONENT',
  'COMPONENT_SET',
  'INSTANCE',
  'FRAME',
]

figma.skipInvisibleInstanceChildren = true

const PLUGIN_WIDTH = 420
const MIN_HEIGHT = 240
const MAX_HEIGHT = 800

figma.showUI(__html__, {
  width: PLUGIN_WIDTH,
  height: MIN_HEIGHT,
  themeColors: false,
  title: 'WCAG AA Auditor',
})

function isSupported(type: NodeType): type is SupportedNodeType {
  return (SUPPORTED_TYPES as ReadonlyArray<string>).includes(type)
}

function classifySelection(): SelectionInfo {
  const sel = figma.currentPage.selection
  if (sel.length === 0) return { kind: 'none' }
  if (sel.length > 1) return { kind: 'multiple', count: sel.length }

  const node = sel[0]
  if (!isSupported(node.type)) {
    return { kind: 'unsupported', nodeType: node.type, nodeName: node.name }
  }

  return {
    kind: 'ok',
    id: node.id,
    name: node.name,
    type: node.type,
    width: Math.round(node.width),
    height: Math.round(node.height),
  }
}

function send(msg: MainToUI): void {
  figma.ui.postMessage(msg)
}

// Export at 2x scale — readable for vision LLM without exploding payload size.
// Returns null on failure so visual review can degrade gracefully in the UI.
async function exportScreenshot(node: SceneNode): Promise<Uint8Array | null> {
  try {
    return await node.exportAsync({
      format: 'PNG',
      constraint: { type: 'SCALE', value: 2 },
    })
  } catch {
    return null
  }
}

// Bug 7 — only check images that are large enough to plausibly carry UI text.
// Anything smaller than this is likely a tiny icon-as-image and not worth a
// round-trip to the LLM.
const IMAGE_OF_TEXT_MIN_LONGEST_SIDE = 100

// Sniff a PNG/JPEG/WEBP/GIF MIME from the first few bytes of an image asset.
// Figma doesn't tell us what format `getBytesAsync` returns — it's whatever
// the designer originally uploaded — so we need to identify it ourselves
// before constructing the data URL the vision LLM expects.
function detectImageMime(b: Uint8Array): 'png' | 'jpeg' | 'webp' | 'gif' | null {
  if (b.length < 12) return null
  // PNG  — 89 50 4E 47
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png'
  // JPEG — FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  // GIF  — 47 49 46 38
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'gif'
  // WEBP — "RIFF" .... "WEBP"
  if (
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return 'webp'
  return null
}

interface ImageCandidate {
  id: string
  name: string
  /** Raw image asset bytes pulled via `figma.getImageByHash().getBytesAsync()`.
   * NOT a screenshot of the node — that would composite sibling layers
   * (overlays, badges, captions) into the result and produce false
   * "image-of-text" positives for cards/banners. The bytes here are the
   * original upload, format depends on what the designer placed. */
  bytes: Uint8Array
  /** Wire format for the data URL — derived from the byte signature
   * (PNG/JPEG/WEBP/GIF magic bytes). Sent through to the server so the
   * vision LLM gets the correct `data:image/<mime>;base64,…` prefix. */
  mimeType: 'png' | 'jpeg' | 'webp' | 'gif'
}

/**
 * Export 2× PNG thumbs for whichever variant ids the DTO surfaces. Keyed by
 * node id so the UI can look up exactly the variants it needs to render
 * (default / focus / error). Individual export failures fall through silently
 * — the renderer tolerates missing keys.
 */
async function buildVariantThumbs(
  variants: { defaultVariantId: string; focusVariantId: string | null; errorVariantId: string | null } | null
): Promise<Record<string, Uint8Array>> {
  if (!variants) return {}
  const ids = [variants.defaultVariantId, variants.focusVariantId, variants.errorVariantId]
    .filter((id): id is string => typeof id === 'string')
  const entries = await tryExportAll<string, readonly [string, Uint8Array]>(
    ids,
    async id => {
      const node = await figma.getNodeByIdAsync(id)
      if (!node || !('exportAsync' in node)) return null
      const png = await (node as SceneNode).exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 2 },
      })
      return [id, png] as const
    }
  )
  const out: Record<string, Uint8Array> = {}
  for (const [id, png] of entries) out[id] = png
  return out
}

/**
 * Identify and fetch image assets the AI image-of-text check should evaluate.
 * Skips logo/brand-exempt images (already a pass) and tiny images (decorative
 * icon-as-image fills not worth a round-trip).
 *
 * IMPORTANT: We pull the **raw asset bytes** via `figma.getImageByHash().
 * getBytesAsync()` — NOT a screenshot via `node.exportAsync()`. A node with
 * an image fill can also have child layers (e.g. a "media" frame with a
 * Lorem-Ipsum pill on top); `exportAsync` would composite those children
 * into the result and the vision LLM would correctly but uselessly flag
 * them as UI text. The raw asset bytes are the original upload — no
 * compositing, no overlays — exactly what 1.4.5 needs to judge.
 */
async function buildImageCandidates(dto: { images: Array<{ id: string; name: string; width: number; height: number; isExempt: boolean; imageHash: string | null }> }): Promise<ImageCandidate[]> {
  const eligible = dto.images.filter(
    img =>
      !img.isExempt &&
      Math.max(img.width, img.height) >= IMAGE_OF_TEXT_MIN_LONGEST_SIDE &&
      img.imageHash !== null
  )
  return tryExportAll(eligible, async img => {
    const hash = img.imageHash
    if (!hash) return null
    const image = figma.getImageByHash(hash)
    if (!image) return null
    const bytes = await image.getBytesAsync()
    const mimeType = detectImageMime(bytes)
    if (!mimeType) return null
    return { id: img.id, name: img.name, bytes, mimeType }
  })
}

function postCurrentState(): void {
  send({ kind: 'state', selection: classifySelection() })
}

figma.on('selectionchange', postCurrentState)
figma.on('currentpagechange', postCurrentState)

figma.ui.onmessage = async (msg: UIToMain) => {
  try {
    switch (msg.kind) {
      case 'init':
        postCurrentState()
        return
      case 'run-audit': {
        const sel = figma.currentPage.selection
        if (sel.length !== 1) {
          lastDTO = null
          send({ kind: 'audit-error', error: 'Select exactly one component, instance, or frame.' })
          return
        }
        const node = sel[0]
        try {
          const dto = await buildAuditDTO(node)
          // Run deterministic checks, screenshot export, image-of-text
          // candidates, and per-variant thumbs in parallel — all four are
          // independent. Individual failures fall through to empty/null.
          const [findings, screenshot, imageCandidates, variantThumbs] = await Promise.all([
            runChecks(dto),
            exportScreenshot(node),
            buildImageCandidates(dto),
            buildVariantThumbs(dto.variants),
          ])
          lastDTO = dto
          send({ kind: 'audit-result', dto, findings, screenshot, imageCandidates, variantThumbs })
        } catch (e) {
          lastDTO = null
          send({ kind: 'audit-error', error: String(e) })
        }
        return
      }
      case 'run-variant-audit': {
        if (!lastDTO) {
          send({ kind: 'variant-error', error: 'No audit yet — run an audit first.' })
          return
        }
        try {
          const buckets = await runVariantChecks(lastDTO)
          send({
            kind: 'variant-result',
            passes: buckets.passes,
            flags: buckets.flags,
            unableToTest: buckets.unableToTest,
          })
        } catch (e) {
          send({ kind: 'variant-error', error: String(e) })
        }
        return
      }
      case 'select-node': {
        // Click-to-select from the findings UI. Read-only side effect: we
        // change the canvas selection + viewport but never re-run the audit
        // (results stay sticky on the originally-audited component).
        try {
          const node = await figma.getNodeByIdAsync(msg.nodeId)
          if (!node || !('absoluteBoundingBox' in node)) return
          const scene = node as SceneNode
          figma.currentPage.selection = [scene]
          figma.viewport.scrollAndZoomIntoView([scene])
        } catch {
          // Node deleted or otherwise unreachable — silent no-op.
        }
        return
      }
      case 'resize': {
        const h = Math.round(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, msg.height)))
        figma.ui.resize(PLUGIN_WIDTH, h)
        return
      }
      // ── Per-user AI settings (figma.clientStorage) ────────────────────
      // The UI iframe can't read clientStorage directly — only the main
      // thread has access. UI sends settings-load/save; we round-trip via
      // settings-loaded/saved (or settings-error on the rare clientStorage
      // failure). DEFAULT_SETTINGS surface on first launch / parse miss.
      case 'settings-load': {
        try {
          const raw = await figma.clientStorage.getAsync(SETTINGS_STORAGE_KEY)
          send({ kind: 'settings-loaded', settings: parseSettings(raw) })
        } catch (e) {
          // clientStorage failure is exceptional but possible (quota,
          // permissions). Surface as a recoverable settings-error rather
          // than a generic audit-error.
          send({ kind: 'settings-error', reason: `failed to load settings: ${String(e)}` })
          send({ kind: 'settings-loaded', settings: DEFAULT_SETTINGS })
        }
        return
      }
      case 'settings-save': {
        try {
          // Defensive re-parse: trust the wire shape but coerce missing /
          // wrong-typed fields against defaults so a malformed save can't
          // corrupt clientStorage.
          const next: AiSettings = parseSettings(msg.settings)
          await figma.clientStorage.setAsync(SETTINGS_STORAGE_KEY, next)
          send({ kind: 'settings-saved' })
        } catch (e) {
          send({ kind: 'settings-error', reason: `failed to save settings: ${String(e)}` })
        }
        return
      }
    }
  } catch (e) {
    figma.notify(`Error: ${String(e)}`, { error: true, timeout: 4000 })
  }
}
