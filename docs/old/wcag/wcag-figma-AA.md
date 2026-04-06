# WCAG 2.1 AA — Figma Stage Criteria

> AA conformance requires passing **all Level A + all Level AA** criteria.
> Filtered to Figma-stage only → **31 criteria** (14 A + 17 AA).

---

## Principle 1: Perceivable

### 1.2 Time-based Media

| # | Name | Level | What to Check in Figma |
|---|------|-------|------------------------|
| 1.2.1 | Audio-only & Video-only (Prerecorded) | A | Media player UI includes space for transcript or text alternative. |
| 1.2.2 | Captions (Prerecorded) | A | Video player UI includes caption display area and toggle control. |
| 1.2.4 | Captions (Live) | AA | Live media UI includes caption display area. |
| 1.2.5 | Audio Description (Prerecorded) | AA | Media player includes audio description toggle/control. |

### 1.3 Adaptable

| # | Name | Level | What to Check in Figma |
|---|------|-------|------------------------|
| 1.3.1 | Info and Relationships | A | Visual hierarchy is clear — headings look like headings, lists look like lists, form groups are visually grouped. Structure is apparent from design alone. |
| 1.3.2 | Meaningful Sequence | A | Reading/visual flow is logical top-to-bottom, left-to-right (or appropriate for locale). No confusing layout jumps. |
| 1.3.3 | Sensory Characteristics | A | No instruction relies solely on shape, color, size, or position (e.g., no "click the round icon" or "see the item on the right" without additional cues). |
| 1.3.4 | Orientation | AA | 🆕 Design has both portrait and landscape variants, or layout works in both. Only exempt if orientation is essential (e.g., piano app). |

### 1.4 Distinguishable

| # | Name | Level | What to Check in Figma |
|---|------|-------|------------------------|
| 1.4.1 | Use of Color | A | Information is never conveyed by color alone. Errors have icons + text (not just red). Charts use patterns/labels alongside colors. Status indicators have text/icon support. |
| 1.4.3 | Contrast (Minimum) | AA | **Normal text:** contrast ratio ≥ 4.5:1. **Large text** (≥18pt or ≥14pt bold): ≥ 3:1. Check all text against its background. Exceptions: disabled text, logotypes, decorative. |
| 1.4.4 | Resize Text | AA | Layout accommodates 200% text scaling without truncation, overlap, or loss of functionality. Design should use flexible containers. |
| 1.4.5 | Images of Text | AA | Text is rendered as real text layers, not rasterized/flattened. Exceptions: logotypes, text where specific visual presentation is essential. |
| 1.4.10 | Reflow | AA | 🆕 Design works at **320px width** (mobile) without horizontal scrolling. Content stacks/reflows. Exceptions: data tables, maps, diagrams, toolbars. |
| 1.4.11 | Non-text Contrast | AA | 🆕 UI component boundaries and states ≥ **3:1** contrast (button borders, input outlines, toggle states, checkboxes, icons conveying meaning). Graphical objects essential to understanding ≥ 3:1. |
| 1.4.12 | Text Spacing | AA | 🆕 Layout does not break when text spacing increases to: line-height 1.5×, paragraph spacing 2×, letter-spacing 0.12×, word-spacing 0.16× font size. No clipping or overlap. |
| 1.4.13 | Content on Hover or Focus | AA | 🆕 Tooltips, popovers, dropdown previews triggered by hover/focus: (1) **Dismissible** — can close without moving pointer, (2) **Hoverable** — user can mouse into the popup content, (3) **Persistent** — stays visible until trigger lost or user dismisses. |

---

## Principle 2: Operable

### 2.1 Keyboard Accessible

| # | Name | Level | What to Check in Figma |
|---|------|-------|------------------------|
| 2.1.1 | Keyboard | A | Every interactive element has a keyboard-accessible alternative designed. No drag-only, swipe-only, or hover-only interactions without alternatives. |

### 2.2 Enough Time

| # | Name | Level | What to Check in Figma |
|---|------|-------|------------------------|
| 2.2.1 | Timing Adjustable | A | Any time-limited UI (session timeout, countdown, auto-advancing carousel) includes controls to extend, adjust, or disable the timer. Warning UI is designed. |
| 2.2.2 | Pause, Stop, Hide | A | Auto-playing content (carousels, animations, live feeds, scrolling banners) has visible pause/stop/hide controls in the design. |

### 2.3 Seizures and Physical Reactions

| # | Name | Level | What to Check in Figma |
|---|------|-------|------------------------|
| 2.3.1 | Three Flashes or Below Threshold | A | No animation or transition flashes more than 3 times per second. Check all animation specs, loading indicators, and transitions. |

### 2.4 Navigable

| # | Name | Level | What to Check in Figma |
|---|------|-------|------------------------|
| 2.4.1 | Bypass Blocks | A | Repeated elements (header, nav, sidebar) — skip navigation link or pattern is accounted for in the design. |
| 2.4.3 | Focus Order | A | Visual layout establishes a logical tab sequence. No layout pattern that would create a confusing or illogical focus path. |
| 2.4.5 | Multiple Ways | AA | More than one navigation method to reach any page (e.g., nav menu + search, breadcrumbs + sitemap). |
| 2.4.7 | Focus Visible | AA | Every interactive element (buttons, links, inputs, toggles, tabs) has a designed visible focus state. Focus indicator is distinct and clearly visible against the background. |

### 2.5 Input Modalities 🆕

| # | Name | Level | What to Check in Figma |
|---|------|-------|------------------------|
| 2.5.1 | Pointer Gestures | A | 🆕 Multi-finger or path-based gestures (pinch-zoom, swipe, drag paths) have single-tap/click alternatives designed in the UI. |
| 2.5.4 | Motion Actuation | A | 🆕 Shake, tilt, or motion-based features have a UI button alternative designed. Motion can be disabled. |

---

## Principle 3: Understandable

### 3.2 Predictable

| # | Name | Level | What to Check in Figma |
|---|------|-------|------------------------|
| 3.2.3 | Consistent Navigation | AA | Navigation components appear in the same relative position on every screen. Menu order does not change between pages. |
| 3.2.4 | Consistent Identification | AA | Same-function components use identical icons, labels, and placement everywhere (e.g., search icon is always the same, close button is always ✕ in the same corner). |

### 3.3 Input Assistance

| # | Name | Level | What to Check in Figma |
|---|------|-------|------------------------|
| 3.3.1 | Error Identification | A | Error states are designed: erroneous fields are visually identified AND have a text description of the error. Not just a red border — include an error message. |
| 3.3.2 | Labels or Instructions | A | Every form field has a visible label (not placeholder-only). Required fields are indicated. Helper/instruction text is designed where input format matters. |
| 3.3.3 | Error Suggestion | AA | Error messages include actionable correction suggestions (e.g., "Enter email as name@example.com" not just "Invalid email"). |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA | Critical actions (payments, account deletion, legal agreements) have confirmation dialogs, review/summary screens, or undo mechanisms designed. |

---

## Principle 4: Robust

> No Principle 4 criteria apply at the Figma stage. All are programmatic (markup parsing, ARIA roles, status message coding).

---

## Summary

| Principle | A | AA | Total |
|-----------|---|-----|-------|
| 1. Perceivable | 6 | 10 | **16** |
| 2. Operable | 5 | 3 | **8** |
| 3. Understandable | 2 | 5 | **7** |
| 4. Robust | 0 | 0 | **0** |
| **Total** | **13** | **18** | **31** |

> **To fully qualify for AA at the Figma stage, all 31 criteria above must be addressed in the design.**
