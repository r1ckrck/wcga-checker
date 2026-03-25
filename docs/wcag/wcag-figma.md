# WCAG 2.1 — Figma Stage Criteria

> Filtered from 78 total criteria → **35 criteria** relevant at the Figma/design stage.
> Includes visual design, component states, interaction logic, content design, layout, navigation, and touch/pointer decisions.

---

## Filtering Logic

**Included** if the designer decides/controls it in Figma:
- Visual properties (color, contrast, typography, spacing, sizing)
- Component states (hover, focus, active, disabled, error)
- Interaction behavior (toast timing, tooltip rules, animation, auto-play)
- Content (labels, headings, link text, error messages, instructions)
- Layout (reflow, orientation, reading order, hierarchy)
- Navigation (consistent placement, multiple paths, focus order intent)
- Touch/pointer (target sizes, gesture alternatives)

**Excluded** if it's purely code implementation:
- Programmatic determination (ARIA, semantic HTML, roles)
- Markup parsing/validation
- Language tagging in code
- Screen reader notification mechanics
- Final content that would be authored after development

---

## Principle 1: Perceivable

### 1.2 Time-based Media

| # | Name | Level | Figma Relevance |
|---|------|-------|-----------------|
| 1.2.1 | Audio-only & Video-only (Prerecorded) | A | If the design includes media players, designer must design space/UI for transcript or text alternative. |
| 1.2.2 | Captions (Prerecorded) | A | Designer must account for caption display area in video player UI. |
| 1.2.4 | Captions (Live) | AA | If live media is part of the product, caption UI must be designed. |
| 1.2.5 | Audio Description (Prerecorded) | AA | Designer must include audio description toggle/control in media player UI. |

### 1.3 Adaptable

| # | Name | Level | Figma Relevance |
|---|------|-------|-----------------|
| 1.3.1 | Info and Relationships | A | Visual hierarchy (headings, lists, tables, form groupings) must be clearly designed so structure is apparent — not just styled differently but structurally distinct. |
| 1.3.2 | Meaningful Sequence | A | Layout and reading order must make logical sense visually. Designer controls the visual flow. |
| 1.3.3 | Sensory Characteristics | A | Instructions in the design must not rely solely on shape, color, size, or location (e.g., "click the red button" or "the option on the left"). |
| 1.3.4 | Orientation | AA | 🆕 Designs must support both portrait and landscape unless orientation is essential. |

### 1.4 Distinguishable

| # | Name | Level | Figma Relevance |
|---|------|-------|-----------------|
| 1.4.1 | Use of Color | A | Color must not be the only way to convey info (e.g., error states need icons/text alongside red, chart data needs patterns not just colors). |
| 1.4.3 | Contrast (Minimum) | AA | Text ≥ **4.5:1**. Large text (≥18pt / ≥14pt bold) ≥ **3:1**. Directly measurable in Figma. |
| 1.4.4 | Resize Text | AA | Design must accommodate text scaling to 200% — layout should not break or truncate. |
| 1.4.5 | Images of Text | AA | Use real text layers, not rasterized/flattened text. Exceptions: logotypes, essential presentation. |
| 1.4.6 | Contrast (Enhanced) | AAA | Text ≥ **7:1**. Large text ≥ **4.5:1**. |
| 1.4.8 | Visual Presentation | AAA | Text blocks: max 80 chars wide, not justified, line-height ≥1.5×, paragraph spacing ≥1.5× line spacing. |
| 1.4.9 | Images of Text (No Exception) | AAA | No images of text except pure decoration or essential. |
| 1.4.10 | Reflow | AA | 🆕 Design must work at 320px width (vertical scroll) / 256px height (horizontal scroll) without two-direction scrolling. Exceptions: tables, maps, diagrams. |
| 1.4.11 | Non-text Contrast | AA | 🆕 UI components (buttons, inputs, toggles) and meaningful graphics ≥ **3:1** contrast against adjacent colors. Includes borders, icons, state indicators. |
| 1.4.12 | Text Spacing | AA | 🆕 Design must tolerate: line-height ≥1.5×, paragraph spacing ≥2×, letter-spacing ≥0.12×, word-spacing ≥0.16× font size — without breaking layout. |
| 1.4.13 | Content on Hover or Focus | AA | 🆕 Tooltips/popovers triggered by hover/focus must be designed as: **dismissible**, **hoverable** (user can mouse into the tooltip), **persistent** (stays until trigger lost or user dismisses). |

---

## Principle 2: Operable

### 2.1 Keyboard Accessible

| # | Name | Level | Figma Relevance |
|---|------|-------|-----------------|
| 2.1.1 | Keyboard | A | All interactive elements must be designed with keyboard interaction in mind. If a design relies on drag-only, swipe-only, or hover-only interactions, keyboard alternatives must be designed. |

### 2.2 Enough Time

| # | Name | Level | Figma Relevance |
|---|------|-------|-----------------|
| 2.2.1 | Timing Adjustable | A | If design includes time limits (session timeout, countdown, auto-advance carousel), designer must include UI for extending/adjusting/disabling the timer. |
| 2.2.2 | Pause, Stop, Hide | A | Auto-playing content (carousels, animations, live feeds) must have visible pause/stop/hide controls designed into the UI. |

### 2.3 Seizures and Physical Reactions

| # | Name | Level | Figma Relevance |
|---|------|-------|-----------------|
| 2.3.1 | Three Flashes or Below Threshold | A | Animations/transitions must not flash >3 times/second. Designer controls animation specs. |
| 2.3.3 | Animation from Interactions | AAA | 🆕 If interaction triggers motion animation (parallax, zoom, sliding), design must include a way to disable it (e.g., reduced motion preference). |

### 2.4 Navigable

| # | Name | Level | Figma Relevance |
|---|------|-------|-----------------|
| 2.4.1 | Bypass Blocks | A | Repeated elements (headers, nav bars) — designer should account for skip navigation patterns. |
| 2.4.3 | Focus Order | A | Layout must establish a logical tab/focus sequence. Designer controls visual order which informs focus order. |
| 2.4.5 | Multiple Ways | AA | Navigation design must provide more than one way to reach pages (e.g., nav menu + search + sitemap). |
| 2.4.7 | Focus Visible | AA | Design must include visible focus indicator states for all interactive elements (buttons, links, inputs, etc.). |

### 2.5 Input Modalities 🆕

| # | Name | Level | Figma Relevance |
|---|------|-------|-----------------|
| 2.5.1 | Pointer Gestures | A | 🆕 If design uses pinch-zoom, multi-finger swipe, or path-based gestures, a single-tap/click alternative must be designed. |
| 2.5.4 | Motion Actuation | A | 🆕 If design uses shake-to-undo, tilt-to-scroll, etc., a UI button alternative must be designed. |
| 2.5.5 | Target Size | AAA | 🆕 Touch/click targets ≥ **44×44 CSS px**. Directly measurable in Figma. |

---

## Principle 3: Understandable

### 3.2 Predictable

| # | Name | Level | Figma Relevance |
|---|------|-------|-----------------|
| 3.2.3 | Consistent Navigation | AA | Navigation components must appear in the same relative position across all screens/pages. |
| 3.2.4 | Consistent Identification | AA | Same-function components (search, settings, close) must use consistent icons, labels, and placement across designs. |

### 3.3 Input Assistance

| # | Name | Level | Figma Relevance |
|---|------|-------|-----------------|
| 3.3.1 | Error Identification | A | Design must include error states — clearly showing which field has an error and a text description of the error (not just red border). |
| 3.3.2 | Labels or Instructions | A | All form inputs must have visible labels. Placeholder-only is not sufficient. Include helper text where needed. |
| 3.3.3 | Error Suggestion | AA | Error states should include suggested corrections in the design (e.g., "Email format: name@example.com"). |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA | For critical actions (payments, deletions, legal agreements), design must include confirmation dialogs, review screens, or undo mechanisms. |

---

## Principle 4: Robust

> No Principle 4 criteria are Figma-stage relevant. All 3 criteria (4.1.1, 4.1.2, 4.1.3) are purely about programmatic implementation — markup parsing, ARIA roles, and status message coding.

---

## Summary

| Level | Figma-Relevant | Total in WCAG 2.1 | Coverage |
|-------|----------------|-------------------|----------|
| A     | 14             | 30                | 47%      |
| AA    | 17             | 20                | 85%      |
| AAA   | 4              | 28                | 14%      |
| **Total** | **35**     | **78**            | **45%**  |

### Excluded Criteria (not Figma-stage)

| # | Name | Why Excluded |
|---|------|-------------|
| 1.1.1 | Non-text Content | Alt text is a content/code concern, not testable at Figma component level |
| 1.2.3 | Audio Description or Media Alternative | Content production, not design |
| 2.4.2 | Page Titled | Content-dependent — template titles are placeholders |
| 2.4.4 | Link Purpose (In Context) | Content-dependent — template link text is placeholder |
| 2.4.6 | Headings and Labels | Content-dependent — template headings/labels are placeholders |
| 2.5.3 | Label in Name | Content-dependent — template label text is not final |
| 1.2.6–1.2.9 | Sign Language, Extended Audio Desc, Media Alt, Live Audio | Content production / infrastructure |
| 1.3.5 | Identify Input Purpose | Programmatic (autocomplete attributes) |
| 1.3.6 | Identify Purpose | Programmatic (ARIA landmarks) |
| 1.4.2 | Audio Control | Implementation behavior |
| 1.4.7 | Low or No Background Audio | Audio production |
| 2.1.2 | No Keyboard Trap | Code implementation |
| 2.1.3 | Keyboard (No Exception) | Code implementation |
| 2.1.4 | Character Key Shortcuts | Code implementation |
| 2.2.3 | No Timing | Code implementation |
| 2.2.4 | Interruptions | Code implementation |
| 2.2.5 | Re-authenticating | Code implementation |
| 2.2.6 | Timeouts | Code implementation (though warning UI could be designed) |
| 2.3.2 | Three Flashes | Stricter version of 2.3.1, same design concern |
| 2.4.8 | Location | Breadcrumbs could be designed, but typically a dev pattern |
| 2.4.9 | Link Purpose (Link Only) | Stricter version of 2.4.4, same design concern |
| 2.4.10 | Section Headings | Structural, typically handled in code |
| 2.5.2 | Pointer Cancellation | Code event handling |
| 2.5.6 | Concurrent Input Mechanisms | Code implementation |
| 3.1.1–3.1.6 | All Readable criteria | Programmatic language tagging / content readability |
| 3.2.1 | On Focus | Code behavior |
| 3.2.2 | On Input | Code behavior |
| 3.2.5 | Change on Request | Code behavior |
| 3.3.5 | Help | Content strategy, not visual design |
| 3.3.6 | Error Prevention (All) | Stricter version of 3.3.4, same design concern |
| 4.1.1 | Parsing | Markup only |
| 4.1.2 | Name, Role, Value | ARIA / programmatic only |
| 4.1.3 | Status Messages | ARIA live regions, programmatic only |
