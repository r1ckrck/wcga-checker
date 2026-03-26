# WCAG 2.1 Criteria Verification

> Cross-reference of every threshold, formula, and rule in the skill against the actual WCAG 2.1 specification.
> Verified: 2026-03-26

---

## 9 Automated Criteria

| # | Criterion | Level |
|---|-----------|-------|
| 1.4.1 | Use of Color | A |
| 1.4.3 | Contrast (Minimum) | AA |
| 1.4.5 | Images of Text | AA |
| 1.4.11 | Non-text Contrast | AA |
| 1.4.12 | Text Spacing | AA |
| 2.4.7 | Focus Visible | AA |
| 3.3.1 | Error Identification | A |
| 3.3.2 | Labels or Instructions | A |
| 3.3.3 | Error Suggestion | AA |

---

## 1.4.3 Contrast (Minimum) — Level AA

**Files:** `agents/contrast-agent.md`, `scripts/contrast-ratio.py`

| Spec says | Our implementation | Verdict |
|---|---|---|
| Normal text: **4.5:1** | `threshold 4.5:1` | Correct |
| Large text: **3:1** | `threshold 3:1` | Correct |
| Large = ≥18pt = **24px** | `fontSize ≥ 24px` | Correct |
| Large = ≥14pt bold = **18.67px** | `fontSize ≥ 18.67px` | Correct (14×1.333=18.662, rounded) |
| Bold = CSS 700+ | `numeric ≥700, or string exactly "Bold"` | Correct |
| Luminance: `0.2126R + 0.7152G + 0.0722B` | Same coefficients | Correct |
| sRGB threshold: **0.04045** | `0.04045` | Correct (May 2021 corrected value) |
| Linearization: `v/12.92` or `((v+0.055)/1.055)^2.4` | Same formula | Correct |
| Ratio: `(L1+0.05)/(L2+0.05)` | Same formula | Correct |

---

## 1.4.11 Non-text Contrast — Level AA

**File:** `agents/contrast-agent.md`

| Spec says | Our implementation | Verdict |
|---|---|---|
| UI components: **3:1** against adjacent colors | `--threshold 3` | Correct |

---

## 1.4.12 Text Spacing — Level AA

**Files:** `agents/typography-agent.md`, `scripts/text-spacing-check.py`

| Spec says | Our implementation | Verdict |
|---|---|---|
| Line height ≥ **1.5×** font size | `font_size * 1.5` | Correct |
| Letter spacing ≥ **0.12×** font size | `font_size * 0.12` | Correct |
| Word spacing ≥ **0.16×** font size | `font_size * 0.16` | Correct |
| Paragraph spacing ≥ **2×** font size | `font_size * 2` | Correct |
| Skip paragraph for single-line | `if not single_line` | Correct |

---

## 1.4.1 Use of Color — Level A

**File:** `agents/variant-agent.md`

| Spec says | Our implementation | Verdict |
|---|---|---|
| Color not sole visual means | Diffs error variant — flags if ONLY color changes, passes if border/icon/text/layout also change | Correct |

---

## 1.4.5 Images of Text — Level AA

**File:** `agents/typography-agent.md`

| Spec says | Our implementation | Verdict |
|---|---|---|
| Use real text, not images of text | Flags images that may contain text based on size heuristic | Correct (heuristic) |
| Logotype exception | `isExempt` for logo/brand names → pass | Correct |

---

## 2.4.7 Focus Visible — Level AA

**File:** `agents/variant-agent.md`

| Spec says | Our implementation | Verdict |
|---|---|---|
| Focus indicator must be **visible** (no minimum size/contrast in 2.1) | Checks if focus variant has ANY visible difference from default | Correct — tests 2.1 AA, not the stricter 2.2 enhanced focus (2.4.13) |

---

## 3.3.1 Error Identification — Level A

**File:** `agents/variant-agent.md`

| Spec says | Our implementation | Verdict |
|---|---|---|
| Item in error must be **identified** | Checks for visual indicator beyond color | Correct |
| Error must be **described in text** | Checks for added `<p>` tag | Correct |

---

## 3.3.2 Labels or Instructions — Level A

**File:** `agents/variant-agent.md`

| Spec says | Our implementation | Verdict |
|---|---|---|
| Labels or instructions provided for user input | Checks `hasExternalLabel`, flags placeholder-only | Correct |

---

## 3.3.3 Error Suggestion — Level AA

**File:** `agents/variant-agent.md`

| Spec says | Our implementation | Verdict |
|---|---|---|
| If error detected and suggestions known, provide them | Checks error text against vague blocklist, flags if no specific guidance | Correct (heuristic) |

---

## Observations

### Bold string detection (safe-side gap)

The contrast-agent matches string `"Bold"` exactly, but font weights like "Black" (900) or "ExtraBold" (800) would not match the string check. These would typically come through as numeric values from Figma, and even if they don't, this errs on the **safe side** — applies the stricter 4.5:1 threshold instead of 3:1, never missing a real failure.

### 1.4.12 interpretation (standard design-phase proxy)

The WCAG criterion technically requires content doesn't break when spacing is *overridden* to these values, not that current values meet them. Checking current values is the standard design-phase approach and the best available from Figma. If current values already meet the thresholds, overriding to them causes no change.
