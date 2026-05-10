# Design

The visual system that runs across every output — social posts, decks, posters, documents, video. One system, two modes (light and dark), many surfaces. This file describes the principles. Surface-specific values live in `surfaces/<surface>.md`. Tokens in machine-consumable form live in [`tokens.css`](./tokens.css).

---

## Philosophy

The system looks like the person making it: **detailed, intricate, dense, organized, planned, considered**. Every choice serves one of those traits or it doesn't belong.

The aesthetic borrows from **architectural drafting** — dimension lines, hairline frames, callout arrows, technical mono labels, elevation-style stack diagrams. Not because the work is architectural, but because drafting carries the planned, considered quality the system reaches for. A drafted plan is precise without being flashy; the lines are quiet because their precision is what speaks.

These traits are operational, not decorative. They influence every decision downstream:

- **Detailed** → small annotations, mono callouts, secondary captions are present, not omitted
- **Intricate** → many elements coexist on a surface; relationships between them are visible
- **Dense** → information per unit area is high; surfaces feel full, never sparse
- **Organized** → hierarchy is explicit through structure (named sections, numbered steps, frames), not just typography
- **Planned** → composition reads as designed, not arrived at; nothing looks defaulted
- **Considered** → every element earns its place; the answer to "could this be removed?" is "no"

When in doubt about a decision, the principle is: which choice better serves these traits?

---

## Color

### Light mode (default)

| Role | Value | Use |
|---|---|---|
| Background | `#F2EEE3` | Anchors every surface — warm off-white, never cold pure white |
| Foreground | `#111111` | Body text, structural lines, primary marks |
| Mute | `#7A7569` | Secondary text, annotations, captions |
| Hairline | `#1F1F1F @ 30%` on bg (≈ `#B3B0A8`) | Connectors, dividers, frame lines, grid lines |
| Accent | `#5C3F4E` (dusty plum) | One eye-magnet moment per piece. Never body. Never frames. Never wide fills. |

### Dark mode

| Role | Value | Logic |
|---|---|---|
| Background | `#111111` | Inverted from light |
| Foreground | `#F2EEE3` | Inverted from light |
| Mute | `#A8A39A` | Lifted warm grey for dark |
| Hairline | `#F2EEE3 @ 30%` on bg (≈ `#555350`) | Inverted hairline math |
| Accent | `#B89AAA` (light dusty rose) | Same hue as light accent, lifted for dark-bg visibility |

### Paper texture

Every surface gets a subtle paper-grain texture layered over the base color. Low opacity. Visible on close inspection, invisible at first glance. Adds the warmth and material quality that flat color can't carry. Same texture across modes; the underlying color carries the mode.

### Accent rule

The accent exists for **one moment per piece** — a key data point, an active state, a section anchor, the single number that matters. Its value comes from rarity. If the accent appears twice on a surface, it's appearing too often. If you can't name what the accent is doing on a piece, remove it.

### Color usage proportions

| Role | Rough share | Where |
|---|---|---|
| Background | Most of the surface | Negative space |
| Foreground | The next-largest share | Body, marks, structural lines |
| Mute | Smaller share | Annotations, secondary text, captions |
| Hairline | Smaller still | Connectors, dividers — present on most surfaces but never dominant |
| Accent | One moment | The single eye-magnet |

---

## Typography

Two faces, each picked on purpose.

| Role | Font | License | Notes |
|---|---|---|---|
| **Body** | **General Sans** by Indian Type Foundry | Free for commercial | Workhorse for body, captions, labels — anything **non-technical**. Variable weight (200–700). |
| **Mono** | **JetBrains Mono** | OFL — free everywhere | All **technical content** — code, file names, paths, tokens, dimension labels, numbered step markers, anything instructional. |

### Mono vs General Sans — when to use which

The split is **technical vs non-technical content**. Strong, deliberate.

| Use Mono (JetBrains Mono) when | Use Body (General Sans) when |
|---|---|
| Code, file paths, function names | Body text, paragraphs, captions |
| Step labels (`1. OPEN`, `2. FILL FORM`) | Section titles |
| Tokens, hex values, technical numbers | Subtitles, descriptive labels |
| Dimension annotations on diagrams | Margin notes that aren't technical |
| Callout labels in flowcharts | Quotes, statements, prose |
| URLs, handles, hashes | Anything where a designer (not engineer) is the audience |

The rule: **if it's instructional, technical, or could appear in a terminal — it's mono.** Otherwise General Sans. The visible split between the two carries the design-engineer identity on every surface.

---

## Type hierarchy

Hierarchy comes from **font change + weight + color first, size second**. Size carries the final percentage of the work; font and weight carry the rest.

- One display moment per surface — the hero. Everything else works in body, caption, or mono.
- Body text earns its place quietly — foreground color, regular weight, comfortable reading scale.
- Section titles differentiate from body through font weight and tracking, not always through size.
- Subtitles and titles can share a size when font + weight + color separates them.
- Caption-scale text uses positive tracking to compensate for its smaller size.
- Mono shares scale with body when it sits inline; sits at caption scale when it's an annotation.

The principle is the *order of operations*: choose font, then weight, then color, then size — in that priority. Specific values per surface live in surface files.

---

## Spacing rhythm

Every surface uses a consistent **8-point scale**. Spacing values are members of the scale; arbitrary values are not used. The scale climbs through small steps for tight relationships and large steps for breathing room.

The scale is named as a system (`--space-1` through `--space-9` in [`tokens.css`](./tokens.css)). Specific step values per surface — which steps the surface uses, which step is the default gap — live in surface files. The principle: rhythm comes from a small set of values reused consistently. Density is achieved by tightening the steps, not by abandoning the scale.

---

## Layout principles

### Density

A composition should look full but never crowded. Every element earns its place. Negative space is **positioned** within the composition, not left over at the margins. Tight outer margins are a feature — the system's energy comes from edge-to-edge density.

### Hierarchy

Loud once, quiet everywhere else. One hero, one anchor, everything else in body / caption / mono. The accent is a hierarchy tool, not a decorative one — used once per piece on the single thing that should be the eye magnet.

### Grid

Every surface uses a column grid. Column count varies by surface; the principle is that columns exist and elements align to them. Inner gutters are tight, but with breathing room around frames and contained content. Specific column counts live in surface files.

### Edge-to-edge

Wide outer margins read as cautious. The system's confidence comes from filling the canvas. Margins exist to keep elements from touching the edge, not to frame the composition with negative space.

---

## Bottom-margin convention

Every visual surface — posters, decks, social posts, video frames, infographics — carries two marks in the bottom margin:

| Position | Mark | Style |
|---|---|---|
| **Bottom-left** | **Post slug** (`YYMMDD-title-slug`) | Mono, caption-scale, mute color — reads as a drafting reference number |
| **Bottom-right** | **Sign-off** | Display font, sign-off scale, foreground or mute |

The convention exists for consistency — a piece is recognizably part of the system at a glance. The pattern echoes architectural drafting, where reference numbers sit bottom-left and the drafter's mark sits bottom-right.

**Not a hard rule.** When the piece's composition genuinely doesn't accommodate one or both — a quote slide where the typography is the whole composition, a video frame mid-sequence, a single-image piece where the slug would interfere — skip it. The convention serves the piece, not the other way around.

Pure-text outputs (LinkedIn or X posts that are just copy in a markdown file) don't carry this — only visual surfaces.

---

## Motion principles

Motion makes the system alive. Lots of motion is welcome — surfaces should feel like they breathe, not like static slabs.

Every motion carries a reason:

- Drawing the eye to the moment that matters
- Signalling state — what just happened, what's about to
- Revealing structure as it lands, instead of all at once
- Letting a dense composition introduce itself in pieces
- Keeping a long-form video from feeling flat

Aliveness comes from motion that **means something**. Plenty of motion moments per piece are fine when each one earns its place. Motion without reason reads as decoration and breaks the tone.

The character is **mechanical, considered, deliberate** — drafting tools sliding into position, not playful bounces. Easing leans toward measured (in / out, in-out) rather than expressive (back, elastic). Duration calibrated to be noticed without delaying. The system's motion language is the typography's language: precise, planned, deliberate.

---

## Motifs

Recurring visual devices that make a piece visibly part of this system.

| Motif | Description |
|---|---|
| **Paper texture** | Subtle grain overlay on every background, both modes |
| **Hairline frames** | Hairline lines framing sections, in foreground at low opacity |
| **Italic role-label (top-left)** | Small italic label naming the slide's role in the sequence — _e.g., "install this", "quick reference", "process"_ — in General Sans Italic, caption-scale, top-left margin |
| **Numbered / lettered sub-sections** | `01` / `02` / `03` or `A` / `B` / `C` in mono with positive tracking |
| **Margin notes** | Caption-scale annotations close to the element they describe, hairline-connected |
| **Stack diagrams** | Horizontal slabs separated by hairlines, used for layered systems |
| **Process flows** | Numbered steps in mono with arrows between — `1. OPEN → 2. FILL → 3. EXTRACT` |
| **Dimension lines** | Architectural-style measurement marks (`├──── span ────┤`) annotating something on the canvas |
| **Callout arrows** | Thin lines connecting a label to the element it describes; label can be in mono (technical) or General Sans Italic (commentary) |
| **Code blocks** | Mono on a tinted background (foreground at low opacity) with a hairline border |
| **Tabular data** | Caption-scale, mono or tracked General Sans, hairline rows, no zebra-striping |
| **Sign-off mark** | Display-font wordmark / monogram / glyph in the bottom-right margin of every visual surface |

---

## Iconography

### Primary set: Phosphor Duotone

Phosphor Duotone is the workhorse — single-weight strokes for the outline, secondary fill behind. The duotone construction matches the architectural-drafting motif: a clean line carrying structure, a quieter shape carrying weight.

**Color mapping** — icon colors derive from palette tokens, not hard-coded:

| Mode | Outline (primary) | Fill (secondary) |
|---|---|---|
| Light bg | Foreground `#111111` | Mute `#7A7569` |
| Dark bg | Foreground `#F2EEE3` | Mute `#A8A39A` |

One SVG per icon. Color applied via CSS variables (`--icon-primary`, `--icon-secondary`) — the same file works on both backgrounds. Tokens declared in [`tokens.css`](./tokens.css).

### Custom SVGs for gaps

When Phosphor doesn't have what we need, draw it ourselves matching Phosphor's duotone construction — outer line at full weight, secondary fill behind. Same stroke width, same corner radii, same level of geometric reduction. The custom icon should be indistinguishable from Phosphor at a glance.

### Logos

Sometimes the brand color matters and the logo lifts from the official source unchanged — when the logo is the subject of the piece, when recognition matters. Sometimes the logo recedes into the system and gets redrawn in the system's palette — when it's a credit, a stack item, a footnote. The choice is per-piece.

### Local storage workflow

Every icon used in this system lives in one canonical local location:

```
~/Documents/Projects/assistant/assets/icons/
├── phosphor/         # Pulled per-icon from phosphoricons.com
├── custom/           # SVGs we drew (gap-fillers, in Phosphor style)
└── logos/            # Brand logos (as-is or recolored)
```

One canonical location. Used by every surface — Remotion, decks, documents, posters. No re-downloads, no duplicates across post folders. Naming: kebab-case, descriptive (`arrow-right.svg`, `claude-logo.svg`).

Remotion accesses these via a symlink from `renderer/public/icons/` to `../../assets/icons/`. Other consumers reference by absolute path or copy in if portability matters.

### Hand-drawn illustrations

Larger anchor pieces — hero illustrations, diagram artwork — live in `~/Documents/Projects/assistant/assets/illustrations/`, separate from icons. Different category (anchor visual, not functional mark), different storage.

---

## Personal mark / sign-off

Every visual surface bookends with the **sign-off mark** in the bottom-right margin. The mark is rendered in the display font.

Form — three options to lock:

| Option | What it is |
|---|---|
| **Wordmark** | A short word in the display font — the handle, a chosen tag |
| **Monogram** | Two letters in the display font — initials, kerned tightly |
| **Glyph** | A single character with strong personality |

The sign-off is one of the two sanctioned places the display font appears (the other is the hero). Two appearances per piece, mirroring each other across the canvas — opening with display at the top of the hierarchy, closing with display at the bottom.

---

## Asset naming

### Pattern

`YYMMDD-title-slug` — date compressed, dash, descriptive title.

| Type | Pattern | Example |
|---|---|---|
| Multi-file piece (carousel, deck) | `YYMMDD-title-slug/` (folder) | `260430-design-engineer-stack/` |
| Single-file piece (LI / X post, standalone image) | `YYMMDD-title-slug.<ext>` | `260430-deleted-the-abstraction.md` |
| Sequenced parts within a piece | `01.<ext>`, `02.<ext>`, … | `01.png`, `02.png` |
| Source files (components, compositions) | descriptive component name | `hero-title.tsx`, `step-number.tsx` |

### On-output appearance

The slug also appears printed on the visual output itself — bottom-left, mono, caption-scale — per the bottom-margin convention. The piece carries its own reference number, drafting-style.

### Casing

- Files and folders: **kebab-case**
- Components and compositions: **PascalCase** (per Remotion convention)
- Descriptive over abstract: a future search should find a file by its meaning, not its position

---

## Anti-patterns

| Don't | Why |
|---|---|
| Drop shadows | Cheapens. The system relies on hairlines and weight, not soft layering. |
| Default fonts | If we wanted system fonts we wouldn't have a design system. |
| Multiple accents on one piece | One color decision per piece. Every additional color halves its impact. |
| Plum on body, frames, or wide fills | Accent value comes from rarity. Reserve it for the single eye-magnet moment per piece. |
| Display font at body, caption, or in-between scales | The display font is sanctioned at exactly two scales — hero and sign-off. Anything else dilutes the rarity. |
| Mono for non-technical text | Mono carries technical meaning. Using it for body or quotes breaks the design-engineer identity. |
| Center-aligned body text | Reads as decorative. Body always left-aligned. |
| Pure white background | Cold, generic, kills the warm anchor. |
| Pure black foreground (light mode) | Too harsh against off-white. Always near-black. |
| Wide outer margins | The system's energy comes from edge-to-edge density. |
| Gradients | Out of system. |
| Skipping the paper texture | Flat color reads sterile. The grain is part of the warmth. |
| Skipping the sign-off | Every visual surface bookends with the mark. |

---

## Application by surface

Surface-specific patterns live in dedicated files. Each file inherits everything in this document and adds the values, grid specs, and templates particular to its medium.

| Surface | File | Status |
|---|---|---|
| Social — Instagram, LinkedIn, X | [`surfaces/social.md`](./surfaces/social.md) | Populated |
| Decks — PowerPoint, Keynote, HTML | [`surfaces/deck.md`](./surfaces/deck.md) | Stub |
| Documents — PDF, markset deliverables | [`surfaces/document.md`](./surfaces/document.md) | Stub |
| Posters — large-format, infographics | [`surfaces/poster.md`](./surfaces/poster.md) | Stub |

Token values consumable in code: [`tokens.css`](./tokens.css).

---

## Still to refine

| Item | Note |
|---|---|
| Sign-off form | Pick one of wordmark / monogram / glyph and lock the artwork |
| Code-block tinted-bg exact value | "Foreground at low opacity" needs a numeric hex once tested on real surfaces |
