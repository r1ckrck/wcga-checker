---
name: wcga-page
description: Show the WCAG 2.1 AA checklist for page-level checks
---

Output the following checklist. No Figma calls needed.

## WCAG AA — Page-Level Checks

These require reviewing the **full screen design** — not individual components.

**1.3.1 Info and Relationships**
- [ ] Headings are visually distinct from body text and from each other (H1 > H2 > H3)
- [ ] Lists look like lists — not just indented or spaced text
- [ ] Form fields and labels are visually grouped
- [ ] Table headers are visually distinct from data cells

**1.3.2 Meaningful Sequence**
- [ ] Reading order flows top → bottom, left → right with no confusing jumps
- [ ] Sidebar or aside content is clearly separated from main content

**1.3.4 Orientation**
- [ ] Layout works in both portrait and landscape
- [ ] No content is hidden or broken in the other orientation

**1.4.1 Use of Color**
- [ ] No information across the page is conveyed by color alone
- [ ] Status indicators (badges, alerts, tags) have text or icon support alongside color
- [ ] Charts use patterns, labels, or shapes — not just different fill colors

**1.4.4 Resize Text**
- [ ] No fixed-height containers that would clip text at 200% zoom
- [ ] Text does not overlap adjacent content when scaled up
- [ ] No horizontal scrolling required for text content at 200% zoom

**2.4.1 Bypass Blocks**
- [ ] A skip navigation pattern is accounted for in the design
- [ ] Repeated header/nav blocks don't require tabbing through them on every page

**2.4.3 Focus Order**
- [ ] Visual layout implies a logical tab order — top to bottom, left to right
- [ ] Modal dialogs trap focus inside when open
- [ ] No element appears visually after another but would be focused before it

---
Run `/wcga-checker` for component checks · `/wcga-journey` for cross-screen checks · `/wcga-dev` for implementation checks · `/wcga-manual` for manual-only checks
