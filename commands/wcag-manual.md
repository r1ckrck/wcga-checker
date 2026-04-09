---
name: wcag-manual
description: Show the WCAG 2.1 AA checklist for criteria that cannot be tested by AI or MCP
---

Output the following checklist. No Figma calls needed.

## WCAG AA — Manual Checks

These cannot be tested automatically — they require human judgement or live interaction testing.

**1.2.1 Audio-only & Video-only (Prerecorded)**
- [ ] Media player UI includes a space or control for a transcript or text alternative

**1.2.2 Captions (Prerecorded)**
- [ ] Video player UI includes a caption display area and a caption toggle control

**1.2.4 Captions (Live)**
- [ ] Live media UI includes a caption display area

**1.2.5 Audio Description (Prerecorded)**
- [ ] Media player includes an audio description toggle or control

**1.3.3 Sensory Characteristics**
- [ ] No instruction refers to an element by shape, color, size, or position alone (e.g. "tap the round button" or "see the item on the right")

**1.4.10 Reflow**
- [ ] Design works at 320px width without horizontal scrolling
- [ ] Content stacks or reflows — nothing hidden or cut off at narrow widths
- [ ] Exception: data tables, maps, and diagrams are exempt

**1.4.13 Content on Hover or Focus**
- [ ] Tooltips and popovers can be dismissed without moving the pointer (e.g. Escape key)
- [ ] The user can move their pointer into the tooltip/popover without it disappearing
- [ ] The tooltip/popover stays visible until the user moves focus away or dismisses it

**2.1.1 Keyboard**
- [ ] Every interactive element has a keyboard-accessible alternative designed
- [ ] No interaction is drag-only, swipe-only, or hover-only without an alternative

**2.2.1 Timing Adjustable**
- [ ] Any time-limited UI (session timeout, countdown, auto-advancing carousel) has controls to extend, adjust, or disable the timer

**2.2.2 Pause, Stop, Hide**
- [ ] Auto-playing content (carousels, animations, live feeds, scrolling banners) has visible pause, stop, or hide controls

**2.3.1 Three Flashes**
- [ ] No animation or transition flashes more than 3 times per second
- [ ] Check all loading indicators, transitions, and animation specs

**2.5.1 Pointer Gestures**
- [ ] Multi-finger or path-based gestures (pinch, swipe, drag paths) have a single-tap or click alternative

**2.5.4 Motion Actuation**
- [ ] Shake, tilt, or device-motion features have a UI button alternative
- [ ] Motion-based interactions can be disabled

---
Run `/wcag-checker` for component checks · `/wcag-page` for full-screen checks · `/wcag-journey` for cross-screen checks · `/wcag-dev` for implementation checks
