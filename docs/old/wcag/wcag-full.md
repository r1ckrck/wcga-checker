# WCAG 2.1 — Complete Reference

> **Source:** W3C Recommendation — [w3.org/TR/WCAG21](https://www.w3.org/TR/WCAG21/)
> **Spec:** 4 Principles · 13 Guidelines · 78 Success Criteria

---

## Conformance Levels

| Level | Meaning |
|-------|---------|
| **A** | Minimum accessibility. Must satisfy all Level A criteria. |
| **AA** | Mid-range. Must satisfy all A + AA criteria. Most commonly required by law. |
| **AAA** | Highest. Must satisfy all A + AA + AAA criteria. Not recommended as blanket policy — not achievable for all content. |

Conformance applies to **full web pages only**. Multi-step processes require all pages to conform.

---

## What's New in 2.1 (vs 2.0)

WCAG 2.1 is backward-compatible with 2.0. It adds **17 new success criteria** and **1 new guideline** (2.5 Input Modalities), targeting three groups:

1. Users with cognitive/learning disabilities
2. Users with low vision
3. Users on mobile devices

**New criteria:** 1.3.4, 1.3.5, 1.3.6, 1.4.10, 1.4.11, 1.4.12, 1.4.13, 2.1.4, 2.2.6, 2.3.3, 2.5.1–2.5.6, 4.1.3

---

## Principle 1: Perceivable

*Information and UI components must be presentable in ways users can perceive.*

### 1.1 Text Alternatives

| # | Name | Level | Requirement |
|---|------|-------|-------------|
| 1.1.1 | Non-text Content | A | All non-text content has a text alternative serving equivalent purpose. Exceptions: controls/input (name describes purpose), time-based media (descriptive ID), tests (would be invalid as text), sensory (descriptive ID), CAPTCHA (alt forms provided), decoration (ignorable by AT). |

### 1.2 Time-based Media

| # | Name | Level | Requirement |
|---|------|-------|-------------|
| 1.2.1 | Audio-only & Video-only (Prerecorded) | A | Audio-only: text transcript. Video-only: text alternative or audio track. |
| 1.2.2 | Captions (Prerecorded) | A | Captions for all prerecorded audio in synced media. |
| 1.2.3 | Audio Description or Media Alternative (Prerecorded) | A | Audio description or text alternative for prerecorded video in synced media. |
| 1.2.4 | Captions (Live) | AA | Captions for all live audio in synced media. |
| 1.2.5 | Audio Description (Prerecorded) | AA | Audio description for all prerecorded video in synced media. |
| 1.2.6 | Sign Language (Prerecorded) | AAA | Sign language interpretation for prerecorded audio in synced media. |
| 1.2.7 | Extended Audio Description (Prerecorded) | AAA | Extended audio description when pauses are insufficient. |
| 1.2.8 | Media Alternative (Prerecorded) | AAA | Full text alternative for all prerecorded synced and video-only media. |
| 1.2.9 | Audio-only (Live) | AAA | Text alternative for live audio-only content. |

### 1.3 Adaptable

| # | Name | Level | Requirement |
|---|------|-------|-------------|
| 1.3.1 | Info and Relationships | A | Structure and relationships conveyed visually are programmatically determinable or available in text. |
| 1.3.2 | Meaningful Sequence | A | Correct reading sequence is programmatically determinable when sequence affects meaning. |
| 1.3.3 | Sensory Characteristics | A | Instructions don't rely solely on sensory characteristics (shape, color, size, location, orientation, sound). |
| 1.3.4 | Orientation | AA | 🆕 Content not restricted to single display orientation unless essential. |
| 1.3.5 | Identify Input Purpose | AA | 🆕 Input field purpose is programmatically determinable for user-info fields. |
| 1.3.6 | Identify Purpose | AAA | 🆕 Purpose of UI components, icons, and regions is programmatically determinable. |

### 1.4 Distinguishable

| # | Name | Level | Requirement |
|---|------|-------|-------------|
| 1.4.1 | Use of Color | A | Color is not the only visual means of conveying info, indicating action, prompting response, or distinguishing elements. |
| 1.4.2 | Audio Control | A | Auto-playing audio >3s has pause/stop or independent volume control. |
| 1.4.3 | Contrast (Minimum) | AA | Text contrast ratio ≥ **4.5:1**. Large text (≥18pt or ≥14pt bold) ≥ **3:1**. Exceptions: incidental, decorative, logotypes. |
| 1.4.4 | Resize Text | AA | Text resizable up to 200% without loss of content/functionality (except captions, images of text). |
| 1.4.5 | Images of Text | AA | Use real text instead of images of text. Exceptions: customizable, essential (logotypes). |
| 1.4.6 | Contrast (Enhanced) | AAA | Text contrast ratio ≥ **7:1**. Large text ≥ **4.5:1**. |
| 1.4.7 | Low or No Background Audio | AAA | Speech audio: no background, or background ≥20dB below foreground. |
| 1.4.8 | Visual Presentation | AAA | Blocks of text: user-selectable colors, max 80 chars wide, not justified, line-height ≥1.5×, paragraph spacing ≥1.5× line spacing, resizable to 200% without horizontal scroll. |
| 1.4.9 | Images of Text (No Exception) | AAA | Images of text only for decoration or where essential. |
| 1.4.10 | Reflow | AA | 🆕 Content reflows without two-direction scrolling at 320px wide (vertical) / 256px tall (horizontal). Exceptions: data tables, maps, diagrams, video, toolbars. |
| 1.4.11 | Non-text Contrast | AA | 🆕 UI components and graphical objects ≥ **3:1** contrast against adjacent colors. Exceptions: inactive, user-agent controlled, essential presentation. |
| 1.4.12 | Text Spacing | AA | 🆕 No loss of content/function when setting: line-height ≥1.5×, paragraph spacing ≥2×, letter-spacing ≥0.12×, word-spacing ≥0.16× font size. |
| 1.4.13 | Content on Hover or Focus | AA | 🆕 Additional content on hover/focus must be: **dismissible** (without moving pointer/focus), **hoverable** (pointer can move to it), **persistent** (stays until trigger removed or user dismisses). |

---

## Principle 2: Operable

*UI components and navigation must be operable.*

### 2.1 Keyboard Accessible

| # | Name | Level | Requirement |
|---|------|-------|-------------|
| 2.1.1 | Keyboard | A | All functionality operable via keyboard (except path-dependent input). |
| 2.1.2 | No Keyboard Trap | A | Focus can always be moved away using keyboard. User is advised if non-standard method needed. |
| 2.1.3 | Keyboard (No Exception) | AAA | All functionality operable via keyboard — no exceptions. |
| 2.1.4 | Character Key Shortcuts | A | 🆕 Single-character shortcuts must be: turnable off, remappable (to include modifier key), or active only on focus. |

### 2.2 Enough Time

| # | Name | Level | Requirement |
|---|------|-------|-------------|
| 2.2.1 | Timing Adjustable | A | Time limits can be turned off, adjusted (≥10×), or extended (warned ≥20s, extendable ≥10 times). Exceptions: real-time, essential, >20 hours. |
| 2.2.2 | Pause, Stop, Hide | A | Moving/blinking/scrolling (>5s, auto-start, with other content): user can pause/stop/hide. Auto-updating: user can pause/stop/hide/control frequency. |
| 2.2.3 | No Timing | AAA | Timing is not essential (except non-interactive synced media, real-time events). |
| 2.2.4 | Interruptions | AAA | Interruptions can be postponed/suppressed (except emergencies). |
| 2.2.5 | Re-authenticating | AAA | User can continue without data loss after re-auth. |
| 2.2.6 | Timeouts | AAA | 🆕 Users warned of inactivity timeout duration, unless data preserved >20 hours. |

### 2.3 Seizures and Physical Reactions

| # | Name | Level | Requirement |
|---|------|-------|-------------|
| 2.3.1 | Three Flashes or Below Threshold | A | Nothing flashes >3 times/second, or flash is below general + red flash thresholds. |
| 2.3.2 | Three Flashes | AAA | Nothing flashes >3 times/second (no threshold exception). |
| 2.3.3 | Animation from Interactions | AAA | 🆕 Motion animation from interaction can be disabled (unless essential). |

### 2.4 Navigable

| # | Name | Level | Requirement |
|---|------|-------|-------------|
| 2.4.1 | Bypass Blocks | A | Mechanism to bypass repeated content blocks. |
| 2.4.2 | Page Titled | A | Pages have descriptive titles. |
| 2.4.3 | Focus Order | A | Sequential navigation order preserves meaning and operability. |
| 2.4.4 | Link Purpose (In Context) | A | Link purpose determinable from link text + context. |
| 2.4.5 | Multiple Ways | AA | More than one way to locate a page in a set (except process steps). |
| 2.4.6 | Headings and Labels | AA | Headings and labels describe topic or purpose. |
| 2.4.7 | Focus Visible | AA | Keyboard focus indicator is visible. |
| 2.4.8 | Location | AAA | User's location within page set is available. |
| 2.4.9 | Link Purpose (Link Only) | AAA | Link purpose determinable from link text alone. |
| 2.4.10 | Section Headings | AAA | Section headings used to organize content. |

### 2.5 Input Modalities 🆕

| # | Name | Level | Requirement |
|---|------|-------|-------------|
| 2.5.1 | Pointer Gestures | A | 🆕 Multipoint/path-based gestures have single-pointer alternative (unless essential). |
| 2.5.2 | Pointer Cancellation | A | 🆕 Single-pointer actions: no down-event execution, or abort/undo available, or up-event reverses (unless essential). |
| 2.5.3 | Label in Name | A | 🆕 Accessible name contains the visible label text. Best practice: label at start of name. |
| 2.5.4 | Motion Actuation | A | 🆕 Device/user motion has UI alternative and can be disabled (unless essential or accessibility-supported). |
| 2.5.5 | Target Size | AAA | 🆕 Pointer targets ≥ **44×44 CSS px**. Exceptions: equivalent control available, inline text, user-agent controlled, essential. |
| 2.5.6 | Concurrent Input Mechanisms | AAA | 🆕 No restriction on input modalities (unless essential, security, or user settings). |

---

## Principle 3: Understandable

*Information and UI operation must be understandable.*

### 3.1 Readable

| # | Name | Level | Requirement |
|---|------|-------|-------------|
| 3.1.1 | Language of Page | A | Default page language is programmatically determinable. |
| 3.1.2 | Language of Parts | AA | Language of passages/phrases is programmatically determinable (except proper names, technical terms, vernacular). |
| 3.1.3 | Unusual Words | AAA | Mechanism to identify definitions of unusual words, idioms, jargon. |
| 3.1.4 | Abbreviations | AAA | Mechanism to identify expanded form of abbreviations. |
| 3.1.5 | Reading Level | AAA | Supplemental content available when text exceeds lower secondary reading level. |
| 3.1.6 | Pronunciation | AAA | Mechanism for pronunciation when meaning is ambiguous without it. |

### 3.2 Predictable

| # | Name | Level | Requirement |
|---|------|-------|-------------|
| 3.2.1 | On Focus | A | Receiving focus does not initiate context change. |
| 3.2.2 | On Input | A | Changing a setting does not auto-change context unless user is advised beforehand. |
| 3.2.3 | Consistent Navigation | AA | Repeated navigation occurs in same relative order (unless user-initiated change). |
| 3.2.4 | Consistent Identification | AA | Same-function components identified consistently across page set. |
| 3.2.5 | Change on Request | AAA | Context changes only by user request or can be turned off. |

### 3.3 Input Assistance

| # | Name | Level | Requirement |
|---|------|-------|-------------|
| 3.3.1 | Error Identification | A | Errors are auto-detected and described to user in text. |
| 3.3.2 | Labels or Instructions | A | Labels or instructions provided when user input is required. |
| 3.3.3 | Error Suggestion | AA | Correction suggestions provided when errors detected (unless security risk). |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA | Legal/financial/data submissions are reversible, checked for errors, or confirmed before submission. |
| 3.3.5 | Help | AAA | Context-sensitive help is available. |
| 3.3.6 | Error Prevention (All) | AAA | All submissions are reversible, checked, or confirmed. |

---

## Principle 4: Robust

*Content must be reliably interpreted by user agents and assistive technologies.*

### 4.1 Compatible

| # | Name | Level | Requirement |
|---|------|-------|-------------|
| 4.1.1 | Parsing | A | Markup has complete tags, proper nesting, no duplicate attributes, unique IDs. (Effectively always satisfied in HTML/XML per living standard updates.) |
| 4.1.2 | Name, Role, Value | A | All UI components: name and role programmatically determinable; user-settable states/properties programmatically settable; change notifications available to AT. |
| 4.1.3 | Status Messages | AA | 🆕 Status messages programmatically determinable via role/properties so AT can present them without receiving focus. |

---

## Summary

| Level | WCAG 2.0 | New in 2.1 | Total |
|-------|----------|------------|-------|
| A     | 25       | 5          | **30** |
| AA    | 13       | 7          | **20** |
| AAA   | 23       | 5          | **28** |
| **Total** | **61** | **17** | **78** |
