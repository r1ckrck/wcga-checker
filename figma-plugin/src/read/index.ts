// Orchestrator: turn a selected SceneNode into a complete AuditDTO.
//
// Error-handling policy: surface as warning. This is the one read-pipeline
// module that DOES record failures — wrapped in `safe()` / `safeArray()`,
// any per-element extraction failure becomes an entry in `dto.warnings[]`,
// flowing through to the report's Warnings section. Per-element silent
// fallbacks happen one level down (text.ts, interactive.ts, etc.).

import type {
  AuditDTO,
  ComponentMeta,
  SupportedComponentType,
} from '../shared/dtos'
import { collect } from './traverse.ts'
import { buildTextElement } from './text.ts'
import { buildInteractiveElements } from './interactive.ts'
import { buildImageElements } from './image.ts'
import { buildFormInputElements } from './form-input.ts'
import { extractVariants } from './variants.ts'

const SUPPORTED: ReadonlyArray<SupportedComponentType> = [
  'COMPONENT',
  'COMPONENT_SET',
  'INSTANCE',
  'FRAME',
]

function isSupported(t: NodeType): t is SupportedComponentType {
  return (SUPPORTED as ReadonlyArray<string>).includes(t)
}

function buildMeta(root: SceneNode): ComponentMeta {
  if (!isSupported(root.type)) {
    throw new Error(`Unsupported root type: ${root.type}`)
  }
  return {
    id: root.id,
    name: root.name,
    type: root.type,
    width: Math.round(root.width),
    height: Math.round(root.height),
    pageId: figma.currentPage.id,
    pageName: figma.currentPage.name,
    modeName: null,
  }
}

export async function buildAuditDTO(root: SceneNode): Promise<AuditDTO> {
  const warnings: string[] = []
  const collected = collect(root)

  // Bug 6 — pass the audited root as a fallback surface so the background
  // sampler can resolve carousel cards / off-canvas content that doesn't
  // share the audit's bbox.
  const [texts, interactives, formInputs, variants] = await Promise.all([
    Promise.all(collected.texts.map(t => safe(() => buildTextElement(t, root), warnings))),
    safeArray(
      () => buildInteractiveElements(collected.vectors, collected.shapes, collected.instances, root),
      warnings
    ),
    safeArray(() => buildFormInputElements(collected.instances), warnings),
    safe(() => extractVariants(root), warnings),
  ])

  const images = buildImageElements(collected.imageBearing)

  return {
    component: buildMeta(root),
    texts: texts.filter((x): x is NonNullable<typeof x> => x !== null),
    interactives,
    images,
    formInputs,
    variants: variants ?? null,
    warnings,
  }
}

// Wrappers that record extraction errors as warnings instead of crashing the
// whole audit. We'd rather surface a partial DTO than nothing.

async function safe<T>(fn: () => Promise<T>, warnings: string[]): Promise<T | null> {
  try {
    return await fn()
  } catch (e) {
    warnings.push(`extraction failed: ${String(e)}`)
    return null
  }
}

async function safeArray<T>(fn: () => Promise<T[]>, warnings: string[]): Promise<T[]> {
  try {
    return await fn()
  } catch (e) {
    warnings.push(`extraction failed: ${String(e)}`)
    return []
  }
}
