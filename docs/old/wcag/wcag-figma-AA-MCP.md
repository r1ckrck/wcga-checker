# WCAG 2.1 AA — Figma Audit Guidelines

> 31 criteria sorted into 4 categories. Items can appear in multiple categories.
> **Component Inspect** = testable on individual components via Figma MCP.

---

## Categories

| Category | Description |
|----------|-------------|
| **Component Inspect** | Can be tested on individual components/frames via Figma MCP. Primary test mode. |
| **Manual** | Requires human judgement or involves interaction/behavior that Figma cannot represent statically. Flagged as checklist items for the user. |
| **Page Level** | Must be evaluated in context of a full page/screen layout, not isolated components. |
| **Journey Level** | Must be evaluated across multiple pages/screens for consistency and flow. |

---

## Component Inspect

> Testable on individual components via Figma MCP — contrast, sizing, labels, states, text usage.

| # | Name | Level | What to Inspect |
|---|------|-------|-----------------|
| 1.4.1 | Use of Color | A | Color is not the sole means of conveying information. Error states have icon + text alongside color. Status indicators have text/icon support. |
| 1.4.3 | Contrast (Minimum) | AA | **Normal text ≥ 4.5:1. Large text (≥18pt / ≥14pt bold) ≥ 3:1.** Check all text layers against their background. Exceptions: disabled, logotypes, decorative. |
| 1.4.5 | Images of Text | AA | Text is real text layers, not rasterized/flattened images. Exceptions: logotypes. |
| 1.4.11 | Non-text Contrast | AA | UI component boundaries and states ≥ **3:1** (button borders, input outlines, toggle states, checkbox marks, meaningful icons). |
| 1.4.12 | Text Spacing | AA | Text layers use: line-height ≥1.5×, paragraph spacing ≥2×, letter-spacing ≥0.12×, word-spacing ≥0.16× font size. No clipping or overlap risk. |
| 2.4.7 | Focus Visible | AA | Interactive elements (buttons, links, inputs, toggles, tabs) have a designed visible focus state that is distinct against the background. |
| 3.3.1 | Error Identification | A | Error states exist: erroneous fields are visually identified AND have a text error message. Not just a red border. |
| 3.3.2 | Labels or Instructions | A | Every form field has a visible label (not placeholder-only). Required fields are indicated. Helper text exists where input format matters. |
| 3.3.3 | Error Suggestion | AA | Error messages include correction hints (e.g., "Enter email as name@example.com" not just "Invalid email"). |

---

## Manual

> Requires human judgement — interaction behavior, motion, gestures, or temporal aspects that Figma cannot represent statically. Presented as a checklist to the user.

| # | Name | Level | What to Verify |
|---|------|-------|----------------|
| 1.3.3 | Sensory Characteristics | A | Instructions don't rely solely on shape, color, size, or position — requires human judgement on final content. |
| 1.2.1 | Audio-only & Video-only (Prerecorded) | A | Media player UI includes space for transcript or text alternative. |
| 1.2.2 | Captions (Prerecorded) | A | Video player UI includes caption display area and toggle. |
| 1.2.4 | Captions (Live) | AA | Live media UI includes caption display area. |
| 1.2.5 | Audio Description (Prerecorded) | AA | Media player includes audio description toggle/control. |
| 1.4.10 | Reflow | AA | Design works at 320px width without horizontal scrolling. Content stacks/reflows. Exceptions: tables, maps, diagrams. |
| 1.4.13 | Content on Hover or Focus | AA | Tooltips/popovers are: (1) dismissible without moving pointer, (2) hoverable — user can mouse into popup, (3) persistent — stays until trigger lost or user dismisses. |
| 2.1.1 | Keyboard | A | Every interactive element has a keyboard-accessible alternative. No drag-only, swipe-only, or hover-only interactions without alternatives. |
| 2.2.1 | Timing Adjustable | A | Time-limited UI (session timeout, countdown, auto-carousel) includes controls to extend, adjust, or disable. |
| 2.2.2 | Pause, Stop, Hide | A | Auto-playing content (carousels, animations, live feeds) has visible pause/stop/hide controls. |
| 2.3.1 | Three Flashes or Below Threshold | A | No animation or transition flashes >3 times/second. Check all animation specs and loading indicators. |
| 2.5.1 | Pointer Gestures | A | Multi-finger or path-based gestures have single-tap/click alternatives in the UI. |
| 2.5.4 | Motion Actuation | A | Shake, tilt, or motion-based features have a UI button alternative. Motion can be disabled. |

---

## Page Level

> Must be evaluated in context of a full page/screen, not isolated components.

| # | Name | Level | What to Evaluate |
|---|------|-------|------------------|
| 1.3.1 | Info and Relationships | A | Page-wide visual hierarchy is clear — headings, lists, groups, and sections are structurally distinct. Not just styled differently. |
| 1.3.2 | Meaningful Sequence | A | Page reading order flows logically (top→bottom, left→right or locale-appropriate). No confusing layout jumps. |
| 1.3.4 | Orientation | AA | Page layout works in both portrait and landscape (unless orientation is essential). |
| 1.4.1 | Use of Color | A | Across the full page, no information is conveyed by color alone. |
| 1.4.3 | Contrast (Minimum) | AA | All text on the page meets contrast ratios — including overlays, banners, and text on images. |
| 1.4.4 | Resize Text | AA | Page layout accommodates 200% text scaling without truncation, overlap, or loss of content. |
| 1.4.11 | Non-text Contrast | AA | All interactive elements and meaningful graphics on the page meet 3:1 contrast. |
| 2.4.1 | Bypass Blocks | A | Repeated elements (header, nav, sidebar) — skip navigation is accounted for. |
| 2.4.3 | Focus Order | A | Visual layout establishes a logical tab sequence across the full page. |

---

## Journey Level

> Must be evaluated across multiple pages/screens for consistency, flow, and multi-step interactions.

| # | Name | Level | What to Evaluate |
|---|------|-------|------------------|
| 2.4.5 | Multiple Ways | AA | More than one way to reach any page (nav menu + search, breadcrumbs + sitemap, etc.). |
| 3.2.3 | Consistent Navigation | AA | Navigation components appear in the same relative position on every screen. Menu order is stable. |
| 3.2.4 | Consistent Identification | AA | Same-function components use identical icons, labels, and placement everywhere (search, close, settings, etc.). |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA | Critical flows (payments, deletions, legal agreements) include confirmation dialogs, review screens, or undo mechanisms. |

---

## Summary

| Category | Count | Description |
|----------|-------|-------------|
| Component Inspect | 9 | Automated via Figma MCP |
| Manual | 13 | User checklist — interaction/behavior/content |
| Page Level | 9 | Full screen context required |
| Journey Level | 4 | Cross-screen consistency |
| **Unique criteria** | **31** | **Full AA coverage at Figma stage** |
