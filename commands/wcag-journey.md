---
name: wcag-journey
description: Show the WCAG 2.1 AA checklist for journey-level checks across multiple screens
---

Output the following checklist. No Figma calls needed.

## WCAG AA — Journey-Level Checks

These require reviewing **multiple screens together** — not individual pages or components.

**2.4.5 Multiple Ways**
- [ ] Every screen can be reached by more than one method (e.g. nav menu + search, breadcrumbs + sitemap)
- [ ] Dead-end screens have a clear way back or forward

**3.2.3 Consistent Navigation**
- [ ] Navigation appears in the same position on every screen
- [ ] Menu item order does not change between screens
- [ ] Back, close, and cancel controls are always in the same location

**3.2.4 Consistent Identification**
- [ ] The same icon means the same thing everywhere (search, close, settings, share, etc.)
- [ ] Labels for the same action are identical across screens — no "Submit" on one and "Confirm" on another
- [ ] The same component variant is used for the same state everywhere

**3.3.4 Error Prevention (Legal, Financial, Data)**
- [ ] Payments and transfers have a review/summary screen before confirmation
- [ ] Destructive actions (delete, cancel subscription) have a confirmation dialog
- [ ] Legal agreements have a dedicated review step before acceptance
- [ ] Submitted forms have an undo or edit mechanism designed

---
Run `/wcag-checker` for component checks · `/wcag-page` for full-screen checks · `/wcag-dev` for implementation checks · `/wcag-manual` for manual-only checks
