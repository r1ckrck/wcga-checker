---
name: wcag-dev
description: Show the WCAG 2.1 AA checklist for post-Figma implementation checks
---

Output the following checklist. No Figma calls needed.

## WCAG AA — Dev / Implementation Checks

These cannot be verified in Figma — review the **built implementation**.

**Semantic Structure**
- [ ] Headings use `<h1>`–`<h6>` in the correct order — not styled `<div>`s
- [ ] Lists use `<ul>`, `<ol>`, `<li>` — not just spaced or indented elements
- [ ] Buttons use `<button>`, links use `<a href>` — not `<div onClick>`
- [ ] Every form input has an associated `<label for>` element

**Name, Role, Value (4.1.2)**
- [ ] Every interactive element has an accessible name (visible label, `aria-label`, or `aria-labelledby`)
- [ ] Icon-only buttons have an `aria-label`
- [ ] Custom components (dropdowns, sliders, tabs) have the correct ARIA role
- [ ] State changes are communicated via `aria-expanded`, `aria-selected`, `aria-checked`, etc.

**Keyboard (2.1.1)**
- [ ] Every interactive element is reachable by Tab key
- [ ] Enter/Space activates buttons; Enter follows links
- [ ] Modals trap focus inside and return focus to the trigger on close
- [ ] Custom widgets follow ARIA keyboard patterns

**Focus Visible (2.4.7)**
- [ ] `outline: none` is not used without a custom focus replacement
- [ ] Focus indicator meets ≥3:1 contrast against its background

**Status Messages (4.1.3)**
- [ ] Success/error toasts use `role="alert"` or `aria-live` so screen readers announce them
- [ ] Form validation errors are linked to their input via `aria-describedby`
- [ ] Loading states are announced via `aria-busy` or a live region

**Reflow (1.4.10)**
- [ ] No horizontal scroll at 320px viewport width
- [ ] All content and functionality is accessible at 320px

**Resize Text (1.4.4)**
- [ ] At 200% browser zoom, no text is clipped, truncated, or overlapping

**Images and Media**
- [ ] Meaningful images have descriptive `alt` text
- [ ] Decorative images have `alt=""` or `role="presentation"`
- [ ] Videos have captions; audio has a transcript

---
Run `/wcag-checker` for component checks · `/wcag-page` for full-screen checks · `/wcag-journey` for cross-screen checks · `/wcag-manual` for manual-only checks
