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

Record `nodeId`, `isComponent`, and `componentName` for later phases.

---

## Phase 2: Collect

**Only phase that makes MCP calls.** Everything after works from collected data.

### Base calls (run in parallel)

```
get_screenshot()      → screenshot
get_design_context()  → designContext (React+Tailwind code with all children)
get_variable_defs()   → tokenMap (token name→value)
```

> If `get_design_context` returns unexpected format, retry with the same `nodeId`.

### Variant discovery (if `isComponent=true`)

**Path A — Component group URL provided upfront:**
1. Call `get_metadata(componentGroupNodeId)` on the provided URL's node ID. Skip to step 4.

**Path B — Instance URL only:**
1. Extract the root element's `data-node-id` from `designContext` — this is the **master component ID** (`masterId`).
2. Call `get_metadata(masterId - 1)` and `get_metadata(masterId + 1)` in parallel.
3. If either returns a `<frame>` whose `name` matches `componentName` → use that node as the component set. Proceed to step 4.
   If neither does → pause and ask:
   > "Variant discovery couldn't find the component group automatically. Please paste the component group URL to test criteria 1.4.1, 2.4.7, 3.3.1, 3.3.3 — or type 'skip' to continue without variant tests."
   - User provides URL → call `get_metadata(componentGroupNodeId)`. Proceed to step 4.
   - User skips → set `variantDiscoverySkipped=true`. All variant-dependent criteria flagged as unable to test.

**Step 4 — Read variants from component set:**
Read the `<symbol>` children from the component set metadata. For each symbol's `name` attribute:
- Contains `focus`, `focused`, or `focus-visible` → `get_design_context(id)` → `focusCode`
- Contains `error`, `invalid`, or `error-state` → `get_design_context(id)` → `errorCode`
- Anything else → record in `otherVariantNames`

If `isComponent=false` → skip variant discovery entirely.

**Total: 3 base + up to 2 probe calls (Path B only) + up to 2 variant contexts = max ~7 MCP calls.**

---

## Phase 3: Parse

Turn designContext + tokenMap into structured data for agents.

### 3.1 — Resolve tokens

For every `var(--token-name,fallback)` in designContext:
- Look up `token-name` in tokenMap → use resolved value
- Not in map → use fallback after comma
- No fallback → flag "Unable to resolve"

If a resolved value matches `Font(...)` pattern (composite font token):
1. Parse inner fields: `size`, `weight`, `lineHeight`, `letterSpacing`
2. If a field references another token → resolve recursively
3. Apply extracted values to the text element (Tailwind classes override token values)

### 3.2 — Extract text elements

Every `<p>` tag in the code = a text element. For each, build a `TextElement`:

| Field | How to extract |
|-------|---------------|
| `textContent` | Inner text of the `<p>` tag |
| `fgColor` | `text-[color:...]` or `text-[rgba(...)]` class → resolve any `var()` per 3.1 |
| `bgColor` | Nearest ancestor `<div>` with `bg-[...]` class (walk up DOM) → resolve any `var()`. If none found → `"unable to determine"` |
| `fontSize` | `text-[length:...px]` or `text-[Npx]` class → numeric px value |
| `fontWeight` | `font-[...]` class → numeric value (e.g., `400`, `700`) or string from font-family (e.g., `"Bold"`, `"Medium"`). Pass raw value. |
| `lineHeight` | `leading-[...px]` or `leading-[var(...)]` class → resolve to numeric px. If `leading-[normal]` or value doesn't resolve to a number → `null` |
| `letterSpacing` | `tracking-[...]` class → px value. If no class → check composite font token. If neither → `null` |
| `paragraphSpacing` | Not in Tailwind classes. Check tokenMap for a `paragraph-spacing` token for this text style. If not found → `null` |
| `isSingleLine` | `true` if this `<p>` is the only `<p>` tag within its immediate parent container (no sibling `<p>` tags) |
| `nodeId` | `data-node-id` on the `<p>` tag itself, else on nearest parent `<div>` |
| `nodeName` | `data-name` on the same node as `nodeId`. If no `data-name` → use `textContent` truncated to 20 chars |

### 3.3 — Extract image elements

Every `<img>` tag. For each, build an `ImageElement`:

| Field | How to extract |
|-------|---------------|
| `nodeId` | `data-node-id` on nearest parent `<div>` |
| `nodeName` | `data-name` on the same node as `nodeId` |
| `width` | From `w-[Npx]` or `size-[Npx]` class on nearest parent `<div>`. If no class → from inline style. If neither → `null` |
| `height` | From `h-[Npx]` or `size-[Npx]` class on nearest parent `<div>`. If no class → from inline style. If neither → `null` |
| `isExempt` | `true` if `nodeName` contains (case-insensitive): `logo`, `logotype`, `brand`, `branding` |

### 3.4 — Extract interactive/form elements (screenshot-assisted)

For remaining `<div>` elements:
1. Look at screenshot — visually identify buttons, inputs, toggles, search bars
2. Match to `<div>` nodes via `data-name`
3. Confirm: has `bg-[...]`, `border-[...]` classes, or text children?
4. Can't classify → skip, note in output

For each interactive element, build an `InteractiveElement`:

| Field | How to extract |
|-------|---------------|
| `nodeId` | `data-node-id` on the element's `<div>` |
| `nodeName` | `data-name` on the same `<div>` |
| `fillColor` | From `bg-[...]` class → resolve `var()`. For icon-only elements without a bg class: fetch the SVG asset URL from the `<img>` src, parse `fill` attributes from `<path>`/`<g>` tags (`fill="var(--fill-N, #hex)"` → use hex fallback; `fill="#hex"` → use directly; `fill="none"` → check `stroke` instead; multiple fills → use dominant color). If unparseable → `null` |
| `borderColor` | `border-[...]` color class → resolve `var()`. If no border class → `null` |
| `parentBgColor` | Nearest ancestor `<div>` with `bg-[...]` (walk up DOM, skip self). If none → `"unable to determine"` |
| `isIconOnly` | `true` if the element's primary content is an `<img>`/SVG with no sibling `<p>` text |

**For form inputs** (inputs, search bars, textareas): also build a `FormInputElement`:

| Field | How to extract |
|-------|---------------|
| `nodeId` | Same as InteractiveElement |
| `nodeName` | Same as InteractiveElement |
| `childTextNodes` | For each `<p>` tag nested inside this input's `<div>`: `{text: "...", isInsideInput: true}`. For `<p>` tags that are siblings (not nested) but visually associated: `{text: "...", isInsideInput: false}` |
| `hasExternalLabel` | `true` if ANY of: (a) a `<p>` tag is a prior sibling of this input's `<div>` in DOM, (b) a `<p>` tag is a child of the same parent `<div>` appearing before this input, (c) a nearby `data-name` contains `label` or `field` implying a label-input group. Otherwise `false`. |

---

## Data Schemas

Single source of truth for field names passed from Phase 3 to Phase 4 agents.

### TextElement

```
nodeId: string              — from data-node-id (see 3.2)
nodeName: string            — from data-name or textContent fallback
textContent: string         — inner text of the <p> tag
fgColor: string             — resolved hex (#RRGGBB) or rgba(...), or "gradient"/"image"/"unable to resolve"
bgColor: string             — resolved hex or rgba from nearest ancestor bg, or "unable to determine"
fontSize: number            — px value
fontWeight: number|string   — raw value: numeric (400, 700) or string ("Medium", "Bold")
lineHeight: number|null     — px value, or null if unable to determine
letterSpacing: number|null  — px value, or null if missing
paragraphSpacing: number|null — px value, or null if missing/not applicable
isSingleLine: boolean       — true if only <p> in its parent container
```

### InteractiveElement

```
nodeId: string
nodeName: string
fillColor: string|null      — resolved hex/rgba, or null if no fill
borderColor: string|null    — resolved hex/rgba, or null if no border
parentBgColor: string       — resolved hex/rgba, or "unable to determine"
isIconOnly: boolean         — true if primary content is an <img>/<svg> with no text
```

### ImageElement

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

```
defaultCode: string              — full designContext code for the default state
focusCode: string|null           — design context for focus variant, or null
errorCode: string|null           — design context for error variant, or null
otherVariantNames: string[]      — names of other discovered variants (hover, active, disabled, etc.)
isComponent: boolean             — from Phase 1 validation
componentName: string            — from Phase 1 metadata name attribute
variantDiscoverySkipped: boolean — true if user chose to skip when automatic discovery failed
```

---

## Phase 4: Test

Run **4 agents in parallel**. Pass each agent only its required data per the schemas above.

### → `agents/contrast-agent.md`

**Pass:** `TextElement[]` + `InteractiveElement[]`
**Returns:** Per-element pass/flag with ratio and threshold

### → `agents/typography-agent.md`

**Pass:** `TextElement[]` (missing values as `null`, not `0`) + `ImageElement[]`
**Returns:** Per-element per-property pass/flag + image-of-text flags

### → `agents/variant-agent.md`

**Pass:** `VariantData` + `FormInputElement[]`
**Returns:** Per-criterion result for 1.4.1, 2.4.7, 3.3.1, 3.3.2, 3.3.3

### → `agents/visual-review-agent.md`

**Pass:** Screenshot only
**Returns:** `observations` array — short bullets of visual concerns

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
| Variant discovery skipped by user | "Unable to test — provide component group URL to test 1.4.1, 2.4.7, 3.3.1, 3.3.3" |
| Specific variant doesn't exist among siblings | "No [focus/error] variant designed" |
| CSS var unresolvable + no fallback | "Unable to resolve color/value" |
| Unexpected design context format | "Unable to parse design data" |
| Icon color unparseable | "Unable to determine icon color — verify ≥3:1 manually" |
