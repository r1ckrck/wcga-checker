# Variant Agent

---

## Input

You receive `VariantData` and `FormInputElement[]` per the data schemas in `docs/testing-workflow.md`.

Key fields: `defaultCode`, `focusCode` (null if unavailable), `errorCode` (null if unavailable), `otherVariantNames`, `isComponent`, `componentName`, `variantDiscoverySkipped`.

---

## Process

**If `variantDiscoverySkipped=true`** → flag 1.4.1, 2.4.7, 3.3.1, 3.3.3 as: "Unable to test — provide component group URL to test variant criteria". Proceed to 3.3.2 only.

**If `focusCode` and `errorCode` are both null and `otherVariantNames` is empty** → no variants available. Flag 1.4.1, 2.4.7, 3.3.1, 3.3.3 as: "No variants available — no focus/error variants found in component group". Proceed to 3.3.2 only.

### 1.4.1 — Use of Color

If `errorCode` exists → diff against `defaultCode`:
1. Identify differences: changed `bg-[...]`, `text-[color:...]`, `border-[...]`, added/removed `<p>` tags, added/removed `<img>` tags
2. If error variant differs from default ONLY in color properties (`bg-[...]`, `text-[color:...]`) with no other visual change → **flag**
3. If variant also changes: border style, adds icon (`<img>`), adds text (`<p>`), changes layout → **pass**

If `errorCode` is null → **flag**: "No error variant designed"

For variants in `otherVariantNames` (hover, active, disabled) — no code available to diff. Flag: "Variant exists but cannot be tested without design context — select variant and re-run"

### 2.4.7 — Focus Visible

1. If `focusCode` exists → diff against `defaultCode`:
   - Look for added: border classes, outline, ring, `shadow-[...]`, `bg-[...]` change
   - If NO visible difference found → **flag**: "Focus variant exists but has no visible difference from default"
   - If visible difference found → **pass**
2. If `focusCode` is null → **flag**: "No focus variant designed"

### 3.3.1 — Error Identification

1. If `errorCode` exists → diff against `defaultCode`:
   - Check for a `<p>` tag in `errorCode` that doesn't exist in `defaultCode` → error message text
   - Check for visual indicator beyond color: added border, icon (`<img>`), changed border style
   - If error variant has ONLY color change, no text → **flag**: "Error state uses color only — needs text message"
   - If error variant has text but no visual indicator beyond color → **flag**: "Error state has text but relies on color alone for visual identification"
   - If both present → **pass**
2. If `errorCode` is null → **flag**: "No error variant designed"

### 3.3.2 — Labels or Instructions

For each `FormInputElement`:
1. Check `hasExternalLabel`:
   - true → **pass**
   - false → check `childTextNodes`:
     - If any item has `isInsideInput: true` → **flag**: "Placeholder only — no visible label"
     - If no text at all → **flag**: "No label or placeholder"
2. Check for required indicator: look for `*` in any sibling/nearby text, or a variant named `required` in `otherVariantNames`

### 3.3.3 — Error Suggestion

1. If `errorCode` is null → **flag**: "No error variant designed"
2. Find error message text (the `<p>` tag added in `errorCode` vs `defaultCode`)
3. Check content against vague blocklist:
   - `"invalid"`, `"error"`, `"wrong"`, `"incorrect"`, `"required"`, `"please fix"`, `"try again"`
4. If error text matches blocklist with no additional guidance → **flag**: "Error message is vague — needs specific correction hint"
5. If error text includes format examples, valid ranges, or specific instructions → **pass**

---

## Output

```
passes:
  - "2.4.7: Focus variant has visible border change"
  - "3.3.2: All form inputs have visible labels"

flags:
  - criterion: "1.4.1"
    nodeName: "<componentName>"
    issue: "No variants available — select variant in Figma and re-run"

  - criterion: "2.4.7"
    nodeName: "<componentName>"
    issue: "No focus variant designed"

  - criterion: "3.3.1"
    nodeName: "<componentName>"
    issue: "No error variant designed"

  - criterion: "3.3.2"
    nodeId: "<nodeId>"
    nodeName: "<nodeName>"
    issue: "Placeholder only — no visible label"

  - criterion: "3.3.3"
    nodeName: "<componentName>"
    issue: "No error variant designed"
```

- Variant-level tests (1.4.1, 2.4.7, 3.3.1, 3.3.3) report at component level — use `componentName` as nodeName, `—` for nodeId
- When the top guard triggers (no variants at all), all 4 variant-dependent criteria get the same "No variants available" message
- Label test (3.3.2) reports per form input element with nodeId
