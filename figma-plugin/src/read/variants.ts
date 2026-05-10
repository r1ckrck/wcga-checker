// Extract VariantData from a selected component, instance, or component-set.
//
// Error-handling policy: silent fallback. Returns `null` for any non-variant
// selection, missing main-component lookup, or empty variant set. Per-
// component failures don't surface as warnings — the variant-audit flow
// simply doesn't render.

import type { VariantData, VariantInfo } from '../shared/dtos'

// Common naming for the focus / interaction-indicator state across design
// systems. Matches `Focus`, `Focused`, `Focus-visible`, plus the family of
// near-synonyms designers use interchangeably (`Active`, `Pressed`,
// `Selected`, `Keyboard`, etc). `\b` boundaries prevent false hits inside
// unrelated words (e.g. `inactive`, `unselected`).
const FOCUS_RE = /\b(focus(?:ed)?|focus[-_\s]?visible|active|pressed|selected|keyboard|kbd|tab|ring)\b/i
const ERROR_RE = /(error|invalid|error[-_\s]?state)/i

async function findComponentSet(node: SceneNode): Promise<ComponentSetNode | null> {
  if (node.type === 'COMPONENT_SET') return node
  if (node.type === 'COMPONENT' && node.parent?.type === 'COMPONENT_SET') {
    return node.parent
  }
  if (node.type === 'INSTANCE') {
    try {
      const main = await node.getMainComponentAsync()
      if (main && main.parent?.type === 'COMPONENT_SET') {
        return main.parent
      }
    } catch {
      return null
    }
  }
  return null
}

function classifyVariant(variant: ComponentNode): 'focus' | 'error' | 'other' {
  const name = variant.name
  const props = variant.variantProperties ?? {}
  const haystack = [name, ...Object.values(props)].join(' ')
  if (FOCUS_RE.test(haystack)) return 'focus'
  if (ERROR_RE.test(haystack)) return 'error'
  return 'other'
}

export async function extractVariants(selection: SceneNode): Promise<VariantData | null> {
  const compSet = await findComponentSet(selection)
  if (!compSet) return null
  const variantNodes = compSet.children.filter((c): c is ComponentNode => c.type === 'COMPONENT')
  if (variantNodes.length === 0) return null

  const variants: VariantInfo[] = variantNodes.map(v => ({
    id: v.id,
    name: v.name,
    properties: v.variantProperties ?? {},
  }))

  let focusVariantId: string | null = null
  let errorVariantId: string | null = null
  const otherVariantNames: string[] = []
  for (const v of variantNodes) {
    const kind = classifyVariant(v)
    if (kind === 'focus' && !focusVariantId) focusVariantId = v.id
    else if (kind === 'error' && !errorVariantId) errorVariantId = v.id
    else otherVariantNames.push(v.name)
  }

  return {
    componentSetId: compSet.id,
    componentSetName: compSet.name,
    defaultVariantId: compSet.defaultVariant?.id ?? variantNodes[0].id,
    variants,
    focusVariantId,
    errorVariantId,
    otherVariantNames,
  }
}
