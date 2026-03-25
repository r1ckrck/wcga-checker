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
| `<symbol>` or `<instance>` | Full audit. Note component set ID for variant discovery. |
| `<frame>` with viewport dimensions or many children | Reject: "Please select a single component, not a full page." |
| `<frame>` simple | Warn: "Not a component. Variant tests (1.4.1, 2.4.7, 3.3.1, 3.3.3) will be skipped. Proceed?" |
| `<canvas>` | Reject: "Please select a single component, not the canvas." |

---

## Phase 2: Collect

**Only phase that makes MCP calls.** Everything after works from collected data.

### Base calls (run in parallel)

```
get_screenshot()      → screenshot
get_design_context()  → designContext (React+Tailwind code with all children)
get_variable_defs()   → tokenMap (token name→value)
```

> If `get_design_context` returns a Code Connect prompt instead of code, call it again with the same `nodeId`.

### Variant calls (if `<symbol>` or `<instance>`)

1. `get_metadata(componentSetId)` → list of variant node IDs and names
2. Find variants matching: `focus`, `focused`, `focus-visible`, `error`, `invalid`, `error-state`, `hover`, `active`, `disabled`
3. `get_design_context(focusVariantId)` → focusContext
4. `get_design_context(errorVariantId)` → errorContext

If detached frame → skip variant calls, flag variant tests as unable.

**Total: 3 base + up to 3 variant = max ~6 MCP calls.**

---

## Phase 3: Parse

Turn designContext + tokenMap into structured data for agents.

### 3.1 — Resolve CSS variables

For every `var(--token-name,fallback)` in designContext:
- Look up `token-name` in tokenMap → use resolved value
- Not in map → use fallback after comma
- No fallback → flag "Unable to resolve"

### 3.2 — Extract text elements

Every `<p>` tag in the code = a text element. For each, extract from Tailwind classes:

| Property | How to extract |
|----------|---------------|
| Text color | `text-[color:...]` or `text-[rgba(...)]` class |
| Font size | `text-[length:...px]` or `text-[Npx]` class |
| Line height | `leading-[...]` class |
| Font weight | `font-[...]` class → numeric: `400`=normal, `500`+=bold. String: `Medium`, `SemiBold`, `Bold`=bold. Pass as-is to contrast-agent, which handles both formats. |
| Letter spacing | `tracking-[...]` class if present. If no class, check tokenMap for a spacing token applied to this text style. If neither → pass as missing. |
| Paragraph spacing | Not in Tailwind classes. Check tokenMap for a paragraph-spacing token on this text style. If not found → pass as missing. |
| Node ID | `data-node-id` on nearest parent `<div>` |
| Node name | `data-name` on nearest parent `<div>` |
| Parent bg | nearest ancestor `<div>` with `bg-[...]` class (walk up DOM) |

### 3.3 — Extract image elements

Every `<img>` tag. For each: `data-name`, dimensions from classes.
Names containing `logo`, `logotype`, `brand`, `branding` → mark as exempt.

### 3.4 — Extract interactive/form elements (screenshot-assisted)

For remaining `<div>` elements:
1. Look at screenshot — visually identify buttons, inputs, toggles, search bars
2. Match to `<div>` nodes via `data-name` (e.g., `navigation/back`, `search/main`)
3. Confirm: has `bg-[...]`, border classes, text children?
4. Can't classify → skip, note in output

**For form inputs** (inputs, search bars, textareas): also extract:
- `childTextNodes` — find all `<p>` tags nested inside this `<div>`, record their text content and nesting depth
- `hasExternalLabel` — check if a `<p>` tag exists outside/above this `<div>` in DOM (sibling or ancestor's child) that reads as a label for this input

### 3.5 — Prepare variant diffs

If focusContext/errorContext collected:
- Diff default vs focus → note added/changed borders, outlines, backgrounds
- Diff default vs error → note added `<p>` tags, color changes, icons

---

## Phase 4: Test

Run **4 agents in parallel**. Pass each agent only the data it needs from Phase 3.

### → `agents/contrast-agent.md`

**Pass:** Text elements (fg color, bg color, font size, font weight) + Interactive elements (fill, border, parent bg)
**Returns:** Per-element pass/flag with ratio and threshold

### → `agents/typography-agent.md`

**Pass:** Text elements (fontSize, lineHeight, letterSpacing, paragraphSpacing — missing values passed as missing, not 0) + Image elements (name, dimensions, exempt flag)
**Returns:** Per-element per-property pass/flag + image-of-text flags

### → `agents/variant-agent.md`

**Pass:** Default code + variant codes (focus, error) + other variant names found (hover, active, disabled) + form input elements (nodeId, nodeName, childTextNodes, hasExternalLabel) + component info (isComponent, componentName)
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
| Variant doesn't exist | "Unable to test — no [focus/error] variant" |
| CSS var unresolvable | "Unable to resolve color/value" |
| Unexpected design context format | "Unable to parse design data" |
