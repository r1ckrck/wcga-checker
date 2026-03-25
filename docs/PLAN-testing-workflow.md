# PLAN: testing-workflow.md

> Temporary planning document. Covers the 9 Component Inspect guidelines only.
> Updated after testing actual MCP tool outputs.

---

## The 9 Tests and What They Actually Need

| Test | What it needs | How it's tested |
|------|--------------|-----------------|
| **1.4.3** Contrast | `<p>` tags: fg color, parent bg color, font size, weight | Script — luminance math |
| **1.4.11** Non-text Contrast | Interactive elements: fill/border color, parent bg color | Script — luminance math |
| **1.4.12** Text Spacing | `<p>` tags: fontSize, lineHeight, letterSpacing, paragraphSpacing | Script — ratio math |
| **1.4.5** Images of Text | `<img>` tags: `data-name`, dimensions | Check — pattern match |
| **1.4.1** Use of Color | Component variants: diff between states | Agent — variant comparison |
| **2.4.7** Focus Visible | Component variants: focus state exists + is distinct | Agent — variant comparison |
| **3.3.1** Error Identification | Component variants: error state has text + visual cue | Agent — variant comparison |
| **3.3.2** Labels | Form inputs: label `<p>` outside input vs placeholder `<p>` inside | Agent — DOM analysis |
| **3.3.3** Error Suggestion | Component variants: error text isn't vague | Agent — content check |

**Two groups:**
- **Node-level tests** (1.4.3, 1.4.11, 1.4.12, 1.4.5, 3.3.2) — test individual elements
- **Variant-level tests** (1.4.1, 2.4.7, 3.3.1, 3.3.3) — test component state variants

---

## MCP Tool Calls

| Call | What we get | When |
|------|-------------|------|
| `get_metadata()` | Top-level node: type (`symbol`/`instance`/`frame`), name, dimensions | Phase 1 — validation only |
| `get_metadata(componentSetId)` | List of variant nodes with IDs and names | Phase 2 — discover variant IDs |
| `get_screenshot()` | Visual image of component | Phase 2 — classification + output |
| `get_design_context()` | Full React+Tailwind code, all children, all styles | Phase 2 — primary data source |
| `get_variable_defs()` | Token name→value map | Phase 2 — resolve CSS vars |
| `get_design_context(variantId)` | Full code for a specific variant | Phase 2 — variant comparison (1 per variant) |

**Principle: if data isn't available after these calls, flag as "Unable to test" and move on.**

---

## Workflow

### Phase 1: Validate

1. Call `get_metadata()` on selection
   - Fails → MCP not connected, guide user
   - Returns data → proceed
2. From the XML tag type:
   - `<symbol>` or `<instance>` → component, full audit
   - `<frame>` with viewport dimensions (1440×900, 375×812, etc.) or many children → reject: "Select a single component, not a page."
   - `<frame>` simple → warn: "Not a component. Variant tests (1.4.1, 2.4.7, 3.3.1, 3.3.3) will be skipped. Proceed?"
3. If `<instance>` or `<symbol>` — note the component set it belongs to (for variant discovery later)

### Phase 2: Collect

```
get_screenshot()                    → visual reference
get_design_context()                → full code with all children
get_variable_defs()                 → token map
get_metadata(componentSetId)        → list variant IDs and names (if component)
get_design_context(focusVariantId)  → focus variant code (if exists)
get_design_context(errorVariantId)  → error variant code (if exists)
```

3 base calls + up to 3 for variants = max ~6 calls total.
If detached frame → skip the last 3, flag variant tests as unable.

### Phase 3: Parse & Classify

**Goal:** Turn the React+Tailwind code into structured test data.

#### Step 1 — Parse design context code

Extract from the React+Tailwind output:
- Every `<p>` tag → text content, `data-node-id`, and its Tailwind classes
- Every `<img>` tag → `data-name`, dimensions from classes
- Every `<div>` with `data-name` → layer name, Tailwind classes
- DOM nesting → parent-child relationships

Resolve all CSS vars using the token map:
- `var(--neutrals/white,white)` → look up `neutrals/white` in token map → `#ffffff`
- If token not in map → use the fallback value after the comma

#### Step 2 — Classify elements

**Data-certain (from code):**
- `<p>` tags → `TEXT` — extract: text color from `text-[color:...]`, font size from `text-[length:...]` or `text-[Npx]`, line height from `leading-[...]`, font weight from `font-[...]`
- `<img>` tags → `IMAGE` — extract: `data-name`, size from classes

**Screenshot-assisted (for remaining `<div>` elements):**
1. Look at the screenshot — identify interactive elements and form inputs visually
2. Match to `<div>` nodes using `data-name` attributes and position in DOM
3. Names like `navigation/back`, `search/main`, `navigation/cart` are strong signals
4. Confirm: does the node have `bg-[...]` (fill), border classes (stroke), text children?

If can't confidently classify → skip. Note in output.

#### Step 3 — Extract parent backgrounds

For every `TEXT` and `INTERACTIVE` element:
- Walk up the DOM nesting to find the nearest ancestor with a `bg-[...]` class
- That's the effective background color
- If no ancestor has a background → flag "Unable to determine background"

#### Step 4 — Build test data

Structured per-element:

**For each TEXT element:**
```
nodeId, nodeName, textContent
fgColor (resolved), bgColor (resolved from parent)
fontSize, fontWeight, lineHeight, letterSpacing, paragraphSpacing
```

**For each INTERACTIVE element:**
```
nodeId, nodeName
fillColor, borderColor, parentBgColor (all resolved)
```

**For each IMAGE element:**
```
nodeId, nodeName
dimensions, isLogoOrBrand (from name)
```

**For variant comparisons:**
```
defaultCode vs focusCode → diff
defaultCode vs errorCode → diff
```

### Phase 4: Test

Run 4 subagents in parallel:

#### Contrast Agent → 1.4.3, 1.4.11
- **Input:** TEXT elements (fg/bg + font size/weight). INTERACTIVE elements (fill/border vs bg).
- **Runs:** `contrast-ratio.py` for each color pair
- **Output:** Per-element pass/flag with ratio

#### Typography Agent → 1.4.12, 1.4.5
- **Input:** TEXT elements (spacing props). IMAGE elements (name, dimensions).
- **Runs:** `text-spacing-check.py` for text. Name check for images (flag if not logo/brand and plausibly text-sized).
- **Output:** Per-element pass/flag

#### Variant Agent → 1.4.1, 2.4.7, 3.3.1, 3.3.2, 3.3.3
- **Input:** Default vs variant code diffs. Form input DOM structure.
- **Logic:**
  - 1.4.1 — compare state variants: if only color changes between states → flag
  - 2.4.7 — check focus variant exists and has visible difference (added border, outline, bg change)
  - 3.3.1 — check error variant has `<p>` with error text + visual indicator beyond color
  - 3.3.2 — check form inputs have a `<p>` label outside/above the input, not just inside (placeholder-only → flag)
  - 3.3.3 — check error text content against vague blocklist (`"invalid"`, `"error"`, `"required"`)
- **If no variants:** return "Unable to test" for 1.4.1, 2.4.7, 3.3.1, 3.3.3

#### Visual Review Agent → subjective screenshot analysis
- **Input:** Screenshot image only
- **Task:** Look at the component as a human would and flag anything that looks like an accessibility concern, even if code-based tests can't measure it
- **What to look for:**
  - Text that looks hard to read (even if it technically passes contrast)
  - Color appearing to be the only differentiator for information
  - Interactive elements that look too small or too close together
  - Visual hierarchy issues — unclear structure, confusing layout
  - Any element that looks like it might be an image of text
- **Output:** Short bullet observations. Clearly marked as subjective AI opinion, not WCAG pass/fail.
- **Tone:** Brief, observational. "The search placeholder text appears low contrast against white." Not "FAIL: 1.4.3 violation."

### Phase 5: Output

Order:
1. **Passes** — one line per criterion that passed
2. **Flags** — issues + unable-to-determine, combined
   - Each flag: criterion #, node name (`data-node-id`), short issue
3. **Visual Review** — subjective screenshot observations (marked as AI opinion)
4. **Manual checklist** — relevant Manual category items for this component type
5. **Footer** — "Run `/wcga-page` for page-level checks. `/wcga-journey` for journey-level."

Design:
- Short. One line per item where possible.
- Include `data-node-id` so user can find elements in Figma
- No paragraphs. No explanations unless needed.

---

## Scripts

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `contrast-ratio.py` | WCAG contrast ratio | Two colors (hex/rgba, already resolved) | Ratio, threshold, pass/fail |
| `text-spacing-check.py` | WCAG text spacing minimums | fontSize, lineHeight, letterSpacing, paragraphSpacing (px values) | Per-property: actual, required, pass/fail |

Color resolution (CSS vars → hex) happens in Phase 3, not in scripts. Scripts receive clean resolved values.

---

## Tap-out Rules

Don't try harder — just flag:
- Gradient/image background → "Unable to calculate contrast — review manually"
- Can't find parent bg in DOM → "Unable to determine background"
- Node can't be classified from code + screenshot → skip, note in output
- Variant doesn't exist → "Unable to test — no [focus/error] variant"
- CSS var can't be resolved (not in token map, no fallback) → "Unable to resolve color"
