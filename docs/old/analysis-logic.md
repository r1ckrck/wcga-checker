# Component Inspect — Analysis Logic

> How each Component Inspect criterion is tested using Figma MCP tools.
> Assumes: user selects a single component (not a page/screen).

---

## Shared First Step (All Criteria)

```
1. get_screenshot() → visual reference of the component (used to visually verify findings and connect the dots between data and what the user sees)
2. get_metadata() → get full component tree (all child node IDs, types, names, sizes)
3. get_design_context() → get detailed properties for the component and key children
4. get_variable_defs() → get bound design tokens (colors, spacing)
```

This gives us a **visual reference**, **node tree**, **visual properties**, and **tokens** to work with. The screenshot is critical — it lets the agent see the component as a human would, bridging the gap between raw node data and visual intent.

---

## 1.4.1 Use of Color

**Goal:** Color is not the only way information is conveyed.

**How:**
1. Find component variants (from design context) — look for error/success/warning/active/inactive states
2. For each state variant, compare to the default state:
   - If the ONLY difference between states is a color change → **Flag**
   - Check if state variants also include: icon change, text change, border style change, or other visual cue
3. Check if there are any color-coded elements (tags, badges, status dots) — look for small colored nodes without accompanying text

**Automation level:** Partial — can detect state variants that differ only in color. Cannot fully judge all info-conveying patterns. Flag for review.

---

## 1.4.3 Contrast (Minimum)

**Goal:** Text contrast ≥ 4.5:1 (normal) / ≥ 3:1 (large text).

**How:**
1. From metadata, identify all TEXT nodes
2. For each TEXT node, from design context get:
   - **Foreground:** text fill color (hex/rgba)
   - **Background:** walk up the parent chain until a node with a solid fill is found — that's the effective background
   - **Font size** (px → pt: multiply by 0.75) and **font weight**
3. Handle opacity: multiply node opacity × fill opacity through the parent chain
4. Calculate contrast ratio using luminance formula
5. Determine threshold:
   - ≥18pt OR (≥14pt AND bold) → **large text** → threshold 3:1
   - Otherwise → **normal text** → threshold 4.5:1
6. **Flag:** any text node below its threshold

**Edge cases to flag for manual review:**
- Gradient backgrounds → check at multiple points
- Image backgrounds → cannot calculate, flag
- Semi-transparent text over complex backgrounds → flag

**Automation level:** High — fully automatable for solid colors. Edge cases flagged.

---

## 1.4.5 Images of Text

**Goal:** Text is real text, not rasterized images.

**How:**
1. From metadata, find all nodes with `fills[].type = IMAGE`
2. From the screenshot (get_screenshot), these image nodes may contain text
3. Check if image nodes are large enough to plausibly contain text (width > 50px, height > 20px)
4. Check node name — names containing `text`, `heading`, `title`, `label`, `copy` alongside image fills are suspicious
5. Exempt: nodes named `logo`, `logotype`, `brand` (logotype exception)
6. **Flag:** image-fill nodes that are suspiciously text-like

**Automation level:** Partial — can detect image fills in text-like positions/names. Cannot OCR the image to confirm text content. Flag for review.

---

## 1.4.11 Non-text Contrast

**Goal:** UI component boundaries and meaningful graphics ≥ 3:1 contrast.

**How:**
1. From metadata, identify interactive elements: buttons, inputs, toggles, checkboxes, dropdowns (by name patterns or component type)
2. For each interactive element, from design context get:
   - **Stroke/border color** — if present, calculate contrast against the background behind the component (walk up parent chain)
   - **Fill color** — calculate contrast against adjacent/parent background
3. For state indicators (checkbox marks, toggle handles), get their fill color vs the control's background
4. Calculate contrast ratio, threshold = **3:1**
5. **Flag:** any interactive element boundary or state indicator below 3:1

**Automation level:** High — fully automatable for solid colors. Same edge cases as 1.4.3.

---

## 1.4.12 Text Spacing

**Goal:** Text properties meet minimum spacing requirements.

**How:**
1. From metadata, identify all TEXT nodes
2. From design context, for each TEXT node get:
   - `fontSize`
   - `lineHeight` → check ≥ 1.5 × fontSize
   - `letterSpacing` → check ≥ 0.12 × fontSize
   - `paragraphSpacing` → check ≥ 2 × fontSize
   - Word spacing → if available, check ≥ 0.16 × fontSize
3. **Flag:** any text node that fails any of these ratios

**Note:** This criterion is about *tolerating* these spacings, not requiring them as defaults. In Figma, we check if the current values are at least at these minimums as a design best practice. If they're below, the design may break when users apply custom spacing.

**Automation level:** High — fully automatable. Pure math on text properties.

---

## 2.4.7 Focus Visible

**Goal:** Interactive elements have a visible focus state designed.

**How:**
1. From design context, identify if the component has **variants**
2. Check if a variant named/tagged as `focus`, `focused`, `hover` exists
3. If focus variant exists:
   - Compare focus variant to default state — there should be a visible difference (added border, outline, ring, background change)
   - Check that the focus indicator itself has ≥ 3:1 contrast against the adjacent background (borrow logic from 1.4.11)
4. **Flag if:** no focus variant exists for an interactive component, OR focus variant has no visible difference from default

**Automation level:** Partial — can check variant existence and name. Judging "visible difference" is tricky — check for added strokes, changed borders, or outline effects.

---

## 3.3.1 Error Identification

**Goal:** Error states exist with both visual identification AND text error message.

**How:**
1. Check if the component has variants — look for an `error`, `invalid`, `error-state` variant
2. If error variant exists, inspect it:
   - Does it have a TEXT node with error message content? (not just a color change)
   - Does it have a visual indicator beyond just color? (icon, border style change)
3. **Flag if:** no error variant exists for a form input component, OR error variant has only color change (no text message)

**Automation level:** Partial — can detect variant existence and check for text nodes in error state. Cannot judge if the error message is meaningful.

---

## 3.3.2 Labels or Instructions

**Goal:** Form fields have visible labels, not just placeholders.

**How:**
1. Identify if the component is a form input (by name: `input`, `field`, `text-field`, `select`, `dropdown`, `checkbox`, `radio`, `textarea`)
2. Check the component tree for a TEXT node that serves as a **label** — should be outside/above the input area, not inside it
3. Check if the only text is inside the input (placeholder-only pattern):
   - If a TEXT node exists only inside the input bounds and no TEXT node exists outside → **Flag** as placeholder-only
4. Check for required field indicator: look for `*`, `required`, or a required variant
5. **Flag if:** form input with no external label, or required field with no indicator

**Automation level:** Partial — can detect text node positions relative to input bounds. Naming conventions help identify labels vs placeholders.

---

## 3.3.3 Error Suggestion

**Goal:** Error messages include correction hints, not just "invalid".

**How:**
1. Find error variant (same as 3.3.1)
2. If error TEXT node exists, check content against a blocklist of vague error messages:
   - `"invalid"`, `"error"`, `"wrong"`, `"incorrect"`, `"required"`, `"please fix"`
3. Good error messages contain specific guidance: format examples, character limits, valid options
4. **Flag:** error text that matches vague blocklist without additional guidance

**Automation level:** Partial — blocklist catches obvious cases. Quality of suggestions needs human review.

---

## Summary

| # | Name | Automation | Key Tool | Needs Math | Needs Parent Context |
|---|------|-----------|----------|-----------|---------------------|
| 1.4.1 | Use of Color | Partial | get_design_context | No | Yes (variants) |
| 1.4.3 | Contrast (Minimum) | **High** | get_design_context | **Yes** (luminance) | **Yes** (parent bg) |
| 1.4.5 | Images of Text | Partial | get_metadata | No | No |
| 1.4.11 | Non-text Contrast | **High** | get_design_context | **Yes** (luminance) | **Yes** (parent bg) |
| 1.4.12 | Text Spacing | **High** | get_design_context | **Yes** (ratios) | No |
| 2.4.7 | Focus Visible | Partial | get_design_context | No | Yes (variants) |
| 3.3.1 | Error Identification | Partial | get_design_context | No | Yes (variants) |
| 3.3.2 | Labels or Instructions | Partial | get_metadata | No | Yes (node positions) |
| 3.3.3 | Error Suggestion | Partial | get_design_context | No | Yes (variants) |

### Key Dependencies
- **Parent background color** is needed for 1.4.3, 1.4.11 — must walk up the node tree to find the nearest solid fill
- **Variant inspection** is needed for 1.4.1, 2.4.7, 3.3.1, 3.3.3 — must check if component has state variants and compare them
- **Contrast math** is needed for 1.4.3, 1.4.11 — luminance formula + ratio calculation
