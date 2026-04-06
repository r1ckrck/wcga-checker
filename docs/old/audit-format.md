# Audit Output Format

> How results are presented to the user after a component audit.
> Optimized for scanning — users will audit many components per session.

---

## Structure

```
1. Header         — component name, type, scope
2. Passes         — what's good (brief)
3. Flags          — issues + unable to determine (actionable)
4. Visual Review  — AI subjective observations from screenshot
5. Manual Check   — relevant items the user must verify themselves
6. Footer         — next steps
```

---

## 1. Header

```
## WCAG AA Audit: [component name]
[type: component | instance | detached frame] · [node ID] · [dimensions]
```

One line. Tells the user what was tested and where to find it.

---

## 2. Passes

```
### Passed
- 1.4.3 Contrast — all text meets minimum ratios
- 1.4.12 Text Spacing — all text meets spacing minimums
- 1.4.5 Images of Text — no image-of-text detected
```

One line per criterion. No detail needed — it passed.
If all 9 pass → `All 9 component-level criteria passed.`

---

## 3. Flags

```
### Flags
| # | Node | Issue |
|---|------|-------|
| 1.4.3 | "Sign in" (`I2443:1455;172:3194`) | Contrast 2.8:1 — needs ≥4.5:1. Text #rgba(255,255,255,0.4) on bg #002953 |
| 1.4.11 | "Search Bar" (`I2443:1455;172:1790`) | Border contrast 2.1:1 — needs ≥3:1 |
| 2.4.7 | — | No focus variant found — unable to test |
| 1.4.12 | "Search text" (`2015:3537`) | Line height 22px (1.57×) ✓, letter spacing 0 (needs ≥1.68px) ✗ |
```

Table format — scannable, one row per flag.
- **Node column:** layer name + node ID in parens so user can find it in Figma
- **Issue column:** what's wrong + what's needed, in one line
- Includes both measured failures AND unable-to-test items
- If no flags → `No issues found.`

---

## 4. Visual Review

```
### Visual Review (AI Observation)
> These are subjective observations from the screenshot — not measured WCAG results.

- Search placeholder text appears low contrast against white background
- Interactive icons (camera, voice, QR) appear small — verify touch target size
- "BAJAJ FINANCE LIMITED" branding text looks very small
```

Short bullets. Observational tone.
Clearly marked as opinion — the `>` blockquote disclaimer is always present.
If nothing to note → `No visual concerns observed.`

---

## 5. Manual Check

```
### Manual Verification
These items require human judgement and cannot be tested automatically:

- [ ] 2.1.1 Keyboard — interactive elements have keyboard alternatives
- [ ] 1.4.13 Hover/Focus Content — tooltips/popovers are dismissible, hoverable, persistent
```

Checkbox format — user can mentally check off as they verify.
Only show items **relevant to this component type:**
- Has interactive elements → show 2.1.1 Keyboard
- Has tooltips/popovers → show 1.4.13
- Has media player → show 1.2.1, 1.2.2, 1.2.4, 1.2.5
- Has auto-playing content → show 2.2.2
- Has time-limited UI → show 2.2.1
- Has animations → show 2.3.1
- Has gestures → show 2.5.1, 2.5.4
- Always show → 1.3.3 Sensory Characteristics

If none are relevant → `No manual checks apply to this component type.`

---

## 6. Footer

```
---
Run `/wcga-page` for page-level checks · `/wcga-journey` for journey-level checks
```

Always present. One line.

---

## Full Example

```
## WCAG AA Audit: header
instance · 2443:1455 · 375×138

### Passed
- 1.4.5 Images of Text — no image-of-text detected (logo exempted)
- 1.4.12 Text Spacing — all text meets spacing minimums

### Flags
| # | Node | Issue |
|---|------|-------|
| 1.4.3 | "9:41" (`I2443:1455;172:1753`) | Contrast 1.4:1 — needs ≥4.5:1. #rgba(255,255,255,0.4) on #002953 |
| 1.4.11 | "search/main" (`2015:3545`) | Input border not visible — needs ≥3:1 against background |
| 2.4.7 | — | No focus variant found — unable to test |
| 3.3.1 | — | No error variant found — unable to test |
| 3.3.2 | "search/main" (`2015:3545`) | Search input has placeholder only — no visible label |

### Visual Review (AI Observation)
> These are subjective observations from the screenshot — not measured WCAG results.

- "BAJAJ FINANCE LIMITED" branding text appears very small
- Search bar icons (camera, voice) appear close together

### Manual Verification
These items require human judgement and cannot be tested automatically:

- [ ] 2.1.1 Keyboard — search, sign in, cart, back button have keyboard alternatives
- [ ] 1.3.3 Sensory — no instructions rely solely on shape, color, or position

---
Run `/wcga-page` for page-level checks · `/wcga-journey` for journey-level checks
```

---

## Design Principles

- **One line per item** — if it takes two lines, shorten it
- **Node IDs always included** — user needs to find elements in Figma
- **No paragraphs** — bullets, tables, checkboxes only
- **No WCAG jargon beyond criterion numbers** — plain language
- **No severity levels** — everything is a flag, user decides priority
- **Consistent format** — every audit looks the same, easy to compare across components
