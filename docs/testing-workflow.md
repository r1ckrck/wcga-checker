# Component Audit — Testing Workflow

> Orchestration document. SKILL.md follows this to run a component audit.
> Phases 1–3 run in the main context. Phase 4 delegates to agents. Phase 5 assembles output per SKILL.md.

---

## Phase 1: Validate

Call `get_metadata()` on the current selection.

**If call fails** → MCP not connected. Tell user to connect Figma Desktop MCP or provide a node URL.

**If call succeeds** → check the XML tag returned:

| Tag | Action |
|-----|--------|
| `<symbol>` or `<instance>` | Full audit. Carry forward: `isComponent=true`, `componentName` from metadata `name` attribute. |
| `<frame>` with viewport dimensions or many children | Reject: "Please select a single component, not a full page." |
| `<frame>` simple | Warn: "Not a component. Variant tests (1.4.1, 2.4.7, 3.3.1, 3.3.3) will be skipped. Proceed?" Carry forward: `isComponent=false`. |
| `<canvas>` | Reject: "Please select a single component, not the canvas." |

Record `nodeId`, `fileKey`, `isComponent`, and `componentName` for later phases.

**Extracting `fileKey`:**
- If user provides URL → extract from `figma.com/design/:fileKey/...`
- If Desktop MCP → `fileKey` comes from the connected file context

All MCP tools in Phase 2 require `fileKey`.

---

## Phase 2: Collect

**Only phase that makes MCP calls.** Everything after works from collected data.

### Base calls (run in parallel)

```
Call 1: get_design_context(nodeId, fileKey)  → designContext (React+Tailwind code + screenshot)
Call 2: use_figma(fileKey, script)           → figmaData (all properties + variant IDs)
```

- `get_design_context` returns React+Tailwind code AND a screenshot — no separate `get_screenshot()` call needed
- `use_figma` runs the consolidated script that extracts textNodes, vectorNodes, imageNodes, instanceNodes, and variants
- `get_variable_defs()` is not needed — `use_figma` reads resolved fill values directly from nodes

> If `get_design_context` returns unexpected format, retry with the same `nodeId`.

### use_figma call requirements

- Must pass `skillNames: "figma-use"` and a `description` string
- Code uses `return` (not console.log) to send data back
- Code is NOT wrapped in async IIFE (auto-wrapped by the runtime)
- On error: stop, read error message, fix script, retry — don't blindly retry the same code

### Consolidated use_figma script

Replace `YOUR_NODE_ID` with the actual `nodeId` from Phase 1.

```js
const nodeId = 'YOUR_NODE_ID';
const node = await figma.getNodeByIdAsync(nodeId);

if (!node) return { error: 'Node not found' };

const result = {
  nodeType: node.type,
  nodeName: node.name,
  width: Math.round(node.width),
  height: Math.round(node.height),

  textNodes: [],
  vectorNodes: [],   // icons — use for 1.4.11
  instanceNodes: [], // component instances
  imageNodes: [],    // nodes with IMAGE paint fills — use for 1.4.5

  variants: null
};

function fillToHex(fill) {
  if (!fill) return null;
  if (fill.type !== 'SOLID') return fill.type; // 'IMAGE', 'GRADIENT_LINEAR', etc.
  const { r, g, b } = fill.color;
  const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return (fill.opacity !== undefined && fill.opacity < 1)
    ? `${hex}@${Math.round(fill.opacity * 100)}%`
    : hex;
}

function getParentBg(n) {
  let p = n.parent;
  while (p) {
    // Skip BOOLEAN_OPERATION — it's a shape mask, not a layout container
    if (p.type !== 'BOOLEAN_OPERATION' && p.fills?.length > 0) {
      const solidFill = p.fills.find(f => f.type === 'SOLID' && f.visible !== false);
      if (solidFill) return fillToHex(solidFill);
    }
    p = p.parent;
  }
  return 'unable to determine';
}

function hasImageFill(n) {
  return n.fills?.some(f => f.type === 'IMAGE') ?? false;
}

const descendants = node.findAll(() => true);

for (const n of descendants) {
  if (n.type === 'TEXT') {
    result.textNodes.push({
      nodeId: n.id,
      nodeName: n.name,
      characters: n.characters?.slice(0, 60),
      fontSize: n.fontSize,
      fontWeight: n.fontWeight,
      fontFamily: n.fontName?.family,
      fontStyle: n.fontName?.style,
      lineHeight: n.lineHeight,       // { unit: "PIXELS"|"PERCENT"|"AUTO", value? }
      letterSpacing: n.letterSpacing, // { unit: "PIXELS"|"PERCENT", value }
      fgColor: n.fills?.length > 0 ? fillToHex(n.fills[0]) : 'none',
      bgColor: getParentBg(n),
      isSingleLine: !n.characters?.includes('\n')
    });
  } else if (n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION') {
    result.vectorNodes.push({
      nodeId: n.id,
      nodeName: n.name,
      type: n.type,
      fillColor: n.fills?.length > 0 ? fillToHex(n.fills[0]) : 'none',
      parentBgColor: getParentBg(n)
    });
  } else if (n.type === 'INSTANCE') {
    result.instanceNodes.push({
      nodeId: n.id,
      nodeName: n.name,
      mainComponentName: n.mainComponent?.name,
      width: Math.round(n.width),
      height: Math.round(n.height)
    });
  } else if (hasImageFill(n)) {
    // Raster image nodes — candidates for 1.4.5 image-of-text check
    result.imageNodes.push({
      nodeId: n.id,
      nodeName: n.name,
      width: Math.round(n.width),
      height: Math.round(n.height),
      isExempt: n.name.toLowerCase().includes('logo') || n.name.toLowerCase().includes('brand')
    });
  }
}

// Variant discovery
const sourceNode = node.type === 'INSTANCE' ? node.mainComponent : node;
if (sourceNode) {
  const compSet = sourceNode.parent?.type === 'COMPONENT_SET' ? sourceNode.parent : sourceNode;
  result.variants = {
    compSetId: compSet.id,
    compSetName: compSet.name,
    variants: compSet.children?.map(c => ({ name: c.name, id: c.id })) || []
  };
}

return result;
```

### use_figma output schema

```ts
{
  nodeType: string          // "INSTANCE" | "COMPONENT" | "FRAME" etc.
  nodeName: string
  width: number
  height: number

  textNodes: {
    nodeId: string
    nodeName: string
    characters: string      // first 60 chars
    fontSize: number
    fontWeight: number      // exact: 400, 500, 700 etc.
    fontFamily: string
    fontStyle: string       // "Regular" | "Medium" | "Bold" etc.
    lineHeight: { unit: "PIXELS" | "PERCENT" | "AUTO", value?: number }
    letterSpacing: { unit: "PIXELS" | "PERCENT", value: number }
    fgColor: string         // "#rrggbb" or "#rrggbb@N%" or "none"
    bgColor: string         // "#rrggbb" or "unable to determine"
    isSingleLine: boolean
  }[]

  vectorNodes: {
    nodeId: string
    nodeName: string
    type: "VECTOR" | "BOOLEAN_OPERATION"
    fillColor: string       // "#rrggbb" or "IMAGE" | "GRADIENT_LINEAR" etc. or "none"
    parentBgColor: string
  }[]

  instanceNodes: {
    nodeId: string
    nodeName: string
    mainComponentName: string
    width: number
    height: number
  }[]

  imageNodes: {
    nodeId: string
    nodeName: string
    width: number
    height: number
    isExempt: boolean       // true if name contains "logo" or "brand"
  }[]

  variants: {
    compSetId: string
    compSetName: string
    variants: { name: string, id: string }[]
  } | null
}
```

### Variant discovery (if `isComponent=true`)

If `figmaData.variants` is not null:

1. Scan `variants.variants[]` names for state keywords
2. Matching rules (handle both simple names like `focus` and property-based names like `state=focus`):
   - Contains `focus` / `focused` / `focus-visible` → `focusVariantId`
   - Contains `error` / `invalid` / `error-state` / `form` (when no explicit error variant) → `errorVariantId`
   - All other variant names → `otherVariantNames[]`
3. If `focusVariantId` or `errorVariantId` found → conditional calls (parallel):
   ```
   Call 3: get_design_context(focusVariantId, fileKey)  → focusCode
   Call 4: get_design_context(errorVariantId, fileKey)  → errorCode
   ```
4. If no matching variants → set `focusCode=null`, `errorCode=null` → variant-dependent criteria flagged as unable to test

If `figmaData.variants` is null (not a component) → skip, flag variant criteria.

If `isComponent=false` → skip variant discovery entirely.

### Fallback: use_figma unavailable

If `use_figma` fails (e.g., View seat, rate limit): flag as "use_figma unavailable" and fall back to CSS parsing from `get_design_context` for what's possible. Icon fills and exact typography will be flagged as unable to determine.

**Total: 2 base + 0-2 conditional = 2-4 MCP calls.**

---

## Phase 3: Parse

Turn collected data into structured schemas for agents. Two processing tracks:

- **Track A** — From `use_figma` output (`figmaData`): exact values for text, icons, and images
- **Track B** — From `get_design_context` code (`designContext`): CSS parsing for non-icon interactive elements and form inputs

### Track A — From use_figma output (exact values)

#### 3.1 — Build TextElement[] from `figmaData.textNodes`

Direct field mapping with these conversions:

| Field | Source | Conversion |
|-------|--------|-----------|
| `nodeId` | `textNode.nodeId` | Direct |
| `nodeName` | `textNode.nodeName` | Direct |
| `textContent` | `textNode.characters` | Direct (first 60 chars) |
| `fgColor` | `textNode.fgColor` | If `#rrggbb@N%` → pre-blend with bgColor (see blending rule below). If plain `#rrggbb` → direct. If `"none"` → `"unable to resolve"`. If `"IMAGE"` or starts with `"GRADIENT"` → `"unable to resolve"` (non-solid text fill) |
| `bgColor` | `textNode.bgColor` | Direct (`#rrggbb` or `"unable to determine"`) |
| `fontSize` | `textNode.fontSize` | Direct (px number) |
| `fontWeight` | `textNode.fontWeight` | Direct (number like 400, 700) |
| `lineHeight` | `textNode.lineHeight` | If `unit=PIXELS` → `value`. If `unit=PERCENT` → `(value / 100) × fontSize`. If `unit=AUTO` → `"auto"` (automatic pass — no fixed constraint, user overrides can apply) |
| `letterSpacing` | `textNode.letterSpacing` | If `unit=PIXELS` → `value`. If `unit=PERCENT` → `(value / 100) × fontSize` |
| `paragraphSpacing` | n/a | Always `null` (not available from use_figma at node level) |
| `isSingleLine` | `textNode.isSingleLine` | Direct |

**Blending rule (semi-transparent colors):**

```
If fgColor = "#rrggbb@N%" and bgColor is a resolved hex:
  alpha = N / 100
  effective_r = fg_r × alpha + bg_r × (1 - alpha)
  effective_g = fg_g × alpha + bg_g × (1 - alpha)
  effective_b = fg_b × alpha + bg_b × (1 - alpha)
  fgColor = "#" + hex(round(effective_r)) + hex(round(effective_g)) + hex(round(effective_b))

If fgColor has @N% but bgColor is "unable to determine":
  → flag: "Semi-transparent text on unknown background — verify contrast manually"
```

#### 3.2 — Build icon InteractiveElement[] from `figmaData.vectorNodes`

| Field | Source | Notes |
|-------|--------|-------|
| `nodeId` | `vectorNode.nodeId` | Direct |
| `nodeName` | `vectorNode.nodeName` | Direct |
| `fillColor` | `vectorNode.fillColor` | If `"IMAGE"` or starts with `"GRADIENT"` → `null` (tap out). Otherwise → direct hex |
| `borderColor` | n/a | Always `null` (icons don't have separate borders) |
| `parentBgColor` | `vectorNode.parentBgColor` | Direct |
| `isIconOnly` | n/a | Always `true` |

**Dedup rule:** If a VECTOR node's parent is a BOOLEAN_OPERATION that is also in the list, skip the child VECTOR — use only the BOOLEAN_OPERATION entry. This avoids double-counting sub-paths of composite icons.

#### 3.3 — Build ImageElement[] from `figmaData.imageNodes`

Direct passthrough — all fields map 1:1. This list contains ONLY nodes with IMAGE paint fills. Vectors/icons are NOT here — they are handled separately as InteractiveElement[] in 3.2.

### Track B — From get_design_context code (CSS parsing)

#### 3.4 — Build non-icon InteractiveElement[]

Same screenshot-assisted approach, but scoped to non-icon elements only:

1. Look at screenshot — visually identify buttons, inputs, toggles, search bars
2. Match to `<div>` nodes in designContext via `data-name`
3. Skip any elements already covered in vectorNodes (matched by `data-node-id`)
4. Extract:
   - `fillColor` from `bg-[...]` class → resolve `var(--token, fallback)` using fallback value
   - `borderColor` from `border-[...]` color class → resolve using fallback
   - `parentBgColor` by walking up ancestor `<div>` nodes for nearest `bg-[...]`
   - `isIconOnly`: `true` if primary content is an `<img>` with no sibling text

For CSS var resolution (without token map):
- `var(--token-name, #fallback)` → use `#fallback` directly
- No fallback → `"unable to resolve"`

#### 3.5 — Build FormInputElement[]

Parse from get_design_context code:
- Identify form inputs (search bars, text inputs) via screenshot + `data-name`
- Build `childTextNodes[]` from nested `<p>` tags: `{text: "...", isInsideInput: true}` for nested, `{text: "...", isInsideInput: false}` for visually associated siblings
- Determine `hasExternalLabel`: `true` if ANY of: (a) a `<p>` tag is a prior sibling of this input's `<div>`, (b) a `<p>` tag is a child of the same parent `<div>` appearing before this input, (c) a nearby `data-name` contains `label` or `field`. Otherwise `false`.

#### 3.6 — Build VariantData

| Field | Source |
|-------|--------|
| `defaultCode` | Full designContext from base `get_design_context` call |
| `focusCode` | From conditional `get_design_context(focusVariantId)`, or `null` |
| `errorCode` | From conditional `get_design_context(errorVariantId)`, or `null` |
| `otherVariantNames` | Non-focus, non-error variant names from `figmaData.variants` |
| `isComponent` | From Phase 1 |
| `componentName` | From Phase 1 |

---

## Data Schemas

Single source of truth for field names passed from Phase 3 to Phase 4 agents.

### TextElement

```
nodeId: string              — from use_figma textNodes
nodeName: string            — from use_figma textNodes
textContent: string         — first 60 chars of text content
fgColor: string             — resolved hex (#RRGGBB), pre-blended if semi-transparent. Source: use_figma textNodes
bgColor: string             — resolved hex from parent traversal (use_figma), or "unable to determine"
fontSize: number            — px value
fontWeight: number|string   — raw value: numeric (400, 700) or string ("Medium", "Bold")
lineHeight: number|null     — px value (converted from use_figma unit), or null if unable to determine
letterSpacing: number|null  — px value (converted from use_figma unit), or null if missing
paragraphSpacing: number|null — always null (not available from use_figma)
isSingleLine: boolean       — true if text contains no newlines
```

### InteractiveElement

Two sources feed this schema — icon elements from use_figma vectorNodes (Track A, 3.2) and non-icon interactive elements from designContext CSS parsing (Track B, 3.4).

```
nodeId: string
nodeName: string
fillColor: string|null      — for icons: exact hex from use_figma vectorNodes. For non-icon elements: from bg-[...] CSS class in designContext. null if no fill
borderColor: string|null    — resolved hex, or null if no border
parentBgColor: string       — resolved hex, or "unable to determine"
isIconOnly: boolean         — true if primary content is an icon/vector with no text
```

### ImageElement

Contains only nodes with IMAGE paint fills. Vector/SVG icons are excluded and handled separately as InteractiveElement[].

```
nodeId: string
nodeName: string
width: number|null          — px, or null if unable to extract
height: number|null         — px, or null if unable to extract
isExempt: boolean           — true if name matches logo/logotype/brand/branding
```

### FormInputElement

```
nodeId: string
nodeName: string
childTextNodes: [{text: string, isInsideInput: boolean}]
hasExternalLabel: boolean
```

### VariantData

Variants discovered via use_figma COMPONENT_SET traversal (not get_metadata page scan).

```
defaultCode: string         — full designContext code for the default state
focusCode: string|null      — design context for focus variant, or null
errorCode: string|null      — design context for error variant, or null
otherVariantNames: string[] — names of other discovered variants (hover, active, disabled, etc.)
isComponent: boolean        — from Phase 1 validation
componentName: string       — from Phase 1 metadata name attribute
```

---

## Phase 4: Test

Run **4 agents in parallel**. Pass each agent only its required data per the schemas above.

### → `agents/contrast-agent.md`

**Pass:** `TextElement[]` + `InteractiveElement[]`
**Returns:** Per-element pass/flag with ratio and threshold

TextElement[].fgColor is pre-blended hex — no rgba handling needed. Icon InteractiveElement[] have exact fills from use_figma.

### → `agents/typography-agent.md`

**Pass:** `TextElement[]` (missing values as `null`, not `0`) + `ImageElement[]`
**Returns:** Per-element per-property pass/flag + image-of-text flags

lineHeight and letterSpacing are pre-converted to px. imageNodes exclude vectors — no false positives on icons.

### → `agents/variant-agent.md`

**Pass:** `VariantData` + `FormInputElement[]`
**Returns:** Per-criterion result for 1.4.1, 2.4.7, 3.3.1, 3.3.2, 3.3.3

Variant IDs discovered from use_figma COMPONENT_SET traversal. Code strings from get_design_context.

### → `agents/visual-review-agent.md`

**Pass:** Screenshot only
**Returns:** `observations` array — short bullets of visual concerns

Screenshot included in get_design_context response — no separate call needed.

---

## Phase 5: Output

Collect results from all 4 agents. Assemble per the Output Format section in SKILL.md.

---

## Tap-out Rules

Don't try harder — flag and move on:

| Situation | Flag |
|-----------|------|
| Gradient/image background | "Unable to calculate contrast — review manually" |
| No parent bg found in DOM | "Unable to determine background" |
| Node can't be classified | Skip, note in output |
| Variant discovery failed | "Unable to discover variants — select variant and re-run" |
| Specific variant doesn't exist among siblings | "No [focus/error] variant designed" |
| CSS var unresolvable + no fallback | "Unable to resolve color/value" |
| Unexpected design context format | "Unable to parse design data" |
| use_figma call fails | "Unable to extract exact properties — review element values manually" |
| vectorNode.fillColor is IMAGE or GRADIENT | "Image/gradient fill — contrast cannot be measured" |
| fgColor has @N% but bgColor unresolvable | "Semi-transparent text on unknown background — verify contrast manually" |
| lineHeight unit is AUTO | Automatic pass — no fixed constraint set |
