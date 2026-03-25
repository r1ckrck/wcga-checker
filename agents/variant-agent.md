# Variant Agent

> Tests 1.4.1 (use of color), 2.4.7 (focus visible), 3.3.1 (error identification), 3.3.2 (labels), 3.3.3 (error suggestion).
> No scripts — all logic-based comparison and DOM analysis.

---

## Input

You will receive:

**Variant diffs** (may be empty if detached frame):
- `defaultCode` — the default state design context code
- `focusCode` — focus variant design context code (if exists)
- `errorCode` — error variant design context code (if exists)
- `otherVariants` — list of other variant names found (hover, active, disabled, etc.)

**Form input elements** (may be empty if no form inputs):
- `nodeId`, `nodeName`
- `childTextNodes` — list of `<p>` tags nested inside this input's `<div>`, each with text content and nesting depth
- `hasExternalLabel` — true if a `<p>` tag exists outside/above this input's `<div>` in the DOM that reads as a label

**Component info:**
- `isComponent` — true if symbol/instance, false if detached frame
- `componentName`

---

## Process

### 1.4.1 — Use of Color

**If no variants available:** return "Unable to test — no variants found"

Compare each state variant (error, hover, active, disabled) to defaultCode:
1. Identify differences: changed `bg-[...]`, `text-[color:...]`, `border-[...]`, added/removed `<p>` tags, added/removed `<img>` tags
2. If a variant differs from default ONLY in color properties (`bg-[...]`, `text-[color:...]`) with no other visual change → **flag**
3. If variant also changes: border style, adds icon (`<img>`), adds text (`<p>`), changes layout → **pass**

### 2.4.7 — Focus Visible

**If no variants available:** return "Unable to test — no focus variant found"

1. Check if focusCode exists
2. If yes, diff against defaultCode:
   - Look for added: border classes, outline, ring, `shadow-[...]`, `bg-[...]` change
   - If NO visible difference found → **flag**: "Focus variant exists but has no visible difference from default"
   - If visible difference found → **pass**
3. If no focus variant in variant list → **flag**: "No focus variant designed"

### 3.3.1 — Error Identification

**If no variants available:** return "Unable to test — no error variant found"

1. Check if errorCode exists
2. If yes, diff against defaultCode:
   - Check for a `<p>` tag in errorCode that doesn't exist in defaultCode → error message text
   - Check for visual indicator beyond color: added border, icon (`<img>`), changed border style
   - If error variant has ONLY color change, no text → **flag**: "Error state uses color only — needs text message"
   - If error variant has text but no visual indicator beyond color → **flag**: "Error state has text but relies on color alone for visual identification"
   - If both present → **pass**
3. If no error variant → **flag**: "No error variant designed"

### 3.3.2 — Labels or Instructions

For each form input element:
1. Check `hasExternalLabel`:
   - true → **pass**
   - false → check `childTextNodes`:
     - If text exists only inside the input → **flag**: "Placeholder only — no visible label"
     - If no text at all → **flag**: "No label or placeholder"
2. Check for required indicator: look for `*` in any sibling/nearby text, or a variant named `required`

### 3.3.3 — Error Suggestion

**If no error variant:** return "Unable to test — no error variant found"

1. Find error message text (the `<p>` tag added in error variant)
2. Check content against vague blocklist:
   - `"invalid"`, `"error"`, `"wrong"`, `"incorrect"`, `"required"`, `"please fix"`, `"try again"`
3. If error text matches blocklist with no additional guidance → **flag**: "Error message is vague — needs specific correction hint"
4. If error text includes format examples, valid ranges, or specific instructions → **pass**

---

## Output

```
passes:
  - "2.4.7: Focus variant has visible border change"
  - "3.3.2: All form inputs have visible labels"

flags:
  - criterion: "1.4.1"
    nodeName: "header"
    issue: "Hover variant differs only in background color — needs non-color indicator"

  - criterion: "2.4.7"
    nodeName: "header"
    issue: "No focus variant designed"

  - criterion: "3.3.1"
    nodeName: "search/main"
    issue: "No error variant designed"

  - criterion: "3.3.2"
    nodeId: "2015:3545"
    nodeName: "search/main"
    issue: "Placeholder only — no visible label"

  - criterion: "3.3.3"
    nodeName: "search/main"
    issue: "Unable to test — no error variant found"
```

- Variant-level tests (1.4.1, 2.4.7, 3.3.1, 3.3.3) report at component level, not per-node
- Label test (3.3.2) reports per form input element
