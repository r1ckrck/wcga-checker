# Figma Plugin — Implementation Plan

Decisions on each item from `REVIEW-standards-gap.md`. Scope stays: **single-component, design-stage**.

---

## Phase 1 — building

### Runners to add

| Item | Standards | Status |
|---|---|---|
| **Link Purpose** | WCAG 2.4.4 (A) | **Done.** New runner flags clickable text matching `read more`, `click here`, `learn more`, `more`, `details`, `here`, `view more`, `see more`, `tap here`, `click`, `tap`, `link`. Severity `warning`. New "Content & links" group. 35 new tests; 201 total pass. |
| **Touch Target (Minimum)** | WCAG 2.5.8 (AA, 2.2) | Pending. Interactive node bbox must be **at least 24×24 px**. Applies to `dto.clickables` + `dto.formInputs`. Classifier prereq built; implementation decisions locked below. |

### Manual notes to add

| Item | Standards | Status |
|---|---|---|
| **Timing Adjustable** | WCAG 2.2.1 (A) | Pending. New line in the manual-notes section, alongside 2.2.2. Covers OTP / form timeout cases. |
| **Pointer-gesture alternative** | WCAG 2.5.1 | Pending. Keep existing 2.5.1 manual note; standards cross-mapping / GIGW citation is deferred until the dedicated standards-mapping pass. |

### Scope claim update

Pending. WCAG 2.1 AA → WCAG 2.1/2.2 AA across README, CLAUDE.md, manifest, UI header after Touch Target ships. Required because 2.5.8 lives in WCAG 2.2.

### Deferred to Phase 2 — standards-mapping audit

Cross-mapping every check to all three standards (WCAG / GIGW / IS 17802) and refactoring `Finding.criterion` to support multiple SC labels is **deferred out of Phase 1**. Phase 1 stays focused on building runners. Once all Phase 1 runners exist, we'll do a dedicated pass:

- Audit each existing check — does it satisfy WCAG only, or also GIGW, or also IS 17802?
- Refactor `Finding` to support multiple `{ standard, clause }` entries
- Update UI to show all applicable standards on each finding card

This is its own multi-day chunk and shouldn't block Phase 1 momentum.

---

## Touch Target (Minimum) — implementation plan

**Status:** ready to build. This section documents the locked decisions before implementation.

### What it tests

WCAG 2.5.8 requires pointer targets to be at least **24×24 px**. The runner checks each target's bbox:

- Pass when `width >= 24` **and** `height >= 24`
- Flag when either dimension is `< 24`
- Strict numeric threshold: `23.99×24` fails
- No area-based pass: `16×24` fails because width is too small; `24×16` fails because height is too small

### What gets tested

Touch Target tests both interactive DTO streams:

| Source | Apply check? | Notes |
|---|---|---|
| `dto.clickables` | Yes | Buttons, links, tabs, chips, icon buttons, designer-included nodes, and other classifier-detected targets. TEXT-typed clickables are included when the classifier identifies them as standalone tap targets. |
| `dto.formInputs` | Yes | Form inputs ride their own DTO path and are tested directly. They are excluded from `dto.clickables`, so they should not double-report. |
| User-excluded nodes | No | Exclude marker wins. |

If a user Include-marks a parent target, descendants should be ignored by the audit. The Include-marked node is treated as the whole target for that branch.

### Interactive detection used by `dto.clickables`

Classifier priority:

1. Exclude marker -> skip
2. Component-name match: `Button`, `Btn`, `Link`, `IconButton`, `IconBtn`, `Chip`, `Tab`, `MenuItem`, `NavItem`, `ListItem`, `Checkbox`, `Radio`, `Switch`, `Toggle`, `Dropdown`, `Select`, `Combobox`
3. Interactive variants: `Hover`, `Focus`, `Pressed`, `Active`, `Selected`
4. Include marker -> force-classify

Form inputs do not use this path for Touch Target; they are tested from `dto.formInputs`.

### Runner behavior

Add `src/checks/runners/touch-target.ts` as a pure DTO runner and wire it into `runChecks`.

For each checked target:

- Emit `status: 'pass'` when both dimensions meet the threshold
- Emit `status: 'flag'` when width or height is below the threshold
- Use `criterion: '2.5.8'`
- Use `scope: 'element'`
- Preserve existing pass-finding behavior: per-element passes are emitted and shown in the collapsed pass disclosure

Suggested pass copy:

```ts
message: '2.5.8 — target size is at least 24 × 24 px.'
```

Suggested flag details:

```ts
details: {
  width,
  height,
  required: 24,
  nodeType,
  cornerRadius,
}
```

Severity: **severe**. This is a hard AA threshold.

### Shape metadata

Add the same visual metadata to both `ClickableElement` and `FormInputElement` because the runner treats both as interactive targets:

```ts
nodeType: string
cornerRadius: number | null
```

Extraction must be defensive:

- `nodeType` comes from the Figma node type
- `cornerRadius` is `null` when the node does not expose it or returns a mixed / non-numeric value

Existing test fixtures that construct these DTOs by hand must be updated, unless these fields are made optional.

### Finding visual

Use a concentric target-size visual:

- Outer outlined shape = required minimum, fixed at `24×24`
- Inner filled shape = actual target bbox, preserving actual aspect ratio
- Numeric stack: `current <w> × <h> px` and `needs ≥ 24 × 24 px`
- Severity dot at far right

The outer reference stays fixed at `24×24`. Example: a `48×16` target shows a wide filled rectangle larger than the reference on the x-axis, but shorter on the y-axis.

Shape matching uses Tier C:

| Target shape | Visual |
|---|---|
| Square bbox | square |
| Rectangular bbox | rectangle |
| `ELLIPSE` node | circle / oval |
| Rounded frame or rectangle with large radius | circle / oval / pill-like shape |

### UI integration

- Rename group title: **Content & links** -> **Interactive elements**
- Map both `2.4.4` and `2.5.8` into that group
- Add failure headline: `Small touch target`
- Add pass disclosure label: `Target size`
- Add `2.5.8` criterion title: `Target Size (Minimum)`

### Not included in Phase 1

- WCAG 2.5.5 AAA `44×44`
- Spacing exception for small targets with enough surrounding clear space
- Inline-text exception. True inline character-range links are not currently classified; standalone `TEXT` nodes classified as clickables are treated as tap targets and tested.
- Cross-standard labels / IS 17802 mapping. Focus on WCAG for this implementation; standards cross-mapping is deferred.

### Tests to add / update

- Clickable pass at `24×24`
- Clickable pass above threshold
- Width fail: `16×24`
- Height fail: `24×16`
- Both fail: `16×16`
- Fractional fail: `23.99×24`
- Form input pass / fail
- Mixed pass + flag in one DTO
- Passes survive aggregation and render in the collapsed pass disclosure
- Include-marked parent suppresses descendants
- Existing DTO fixtures updated for shape metadata

---

## Interactive-element detection — **built**

Lives in `src/read/interactivity.ts`. Built alongside the Link Purpose runner; first consumer is 2.4.4, next consumer will be 2.5.8.

**Exports:**
- `isClickableName(name)` — slash + camelCase morpheme matcher (pure, testable)
- `hasInteractiveVariants(compSet)` — checks variant set for Hover/Focus/Pressed states
- `normalizeLinkText(raw)` — text normalization for vague-text matching
- `buildClickableElements(root, instances, formInputIds)` — async builder

**DTO:** `ClickableElement[]` on `AuditDTO.clickables`.

**Design (original) below for reference:**

### Signals we'll use

Priority chain — first match wins, all firing signals recorded for the debug report.

| Priority | Signal | Source |
|---|---|---|
| 1 | **Component-name regex** | Match `node.name` and (for instances) main-component / component-set name against an allowlist: `Button`, `Btn`, `Link`, `IconButton`, `IconBtn`, `Tap`, `Chip`, `Tab`, `MenuItem`, `NavItem`, `ListItem`, `Checkbox`, `Radio`, `Switch`, `Toggle`, `Dropdown`, `Select`, `Combobox`. Exclude containers: `ButtonGroup`, `Tabs`, `Menu`, `Toolbar`, `Navigation`. Split slash-notation names (`Button/Primary/Large`) and match any segment. |
| 2 | **Interactive variants** | Main component has variant property values like `Hover`, `Focus`, `Pressed`, `Active`, `Disabled`. Reuse `src/read/variants.ts`. |
| 3 | **Form input** | Reuse `buildFormInputElement` from `src/read/form-input.ts`. Form inputs are tap targets. |

### Signals we're **not** using

| Signal | Why dropped |
|---|---|
| **Reactions / prototyping** | Most designs aren't fully prototyped — relying on this would catch almost nothing. |
| **Icon detection** (current `interactive.ts`) | That code finds non-text contrast targets, not clickable elements. An icon detected this way is just as likely to be decorative. Using it here produces false positives. See limitation below. |
| **Visual heuristics** (shape + label inside) | Too noisy. |
| **AI vision classifier** | Defer — revisit if false-negative rate hurts. |

### Output shape

```ts
type InteractivityClassification = {
  isInteractive: boolean;
  signals: Array<'component-name' | 'variant-states' | 'form-input'>;
};
```

Touch-target runner applies the 24×24 check only when `isInteractive === true`.

### Known limitation

**Unwrapped icons** — a raw `Vector` or icon instance with no Button/IconButton wrapper, no interactive variant states, and no name signal will **not** be classified as interactive. If the designer hasn't given any intent signal, we don't invent one. Documenting in the README under "what the plugin doesn't catch."

### Open questions

| # | Question | Tentative |
|---|---|---|
| 1 | Module naming — keep classifier in `src/read/interactive.ts`? It already collides with the existing icon-detection module. | Add new module `src/read/interactivity.ts`; rename old (see Notes below). |
| 2 | Confidence levels in output? | Drop. Boolean is enough since we removed the medium-confidence icon signal. |
| 3 | User-extendable regex via settings? | Not in Phase 1. Hard-code, revisit if teams ask. |

---

## Other open questions

### Q — IS 17802 5.11: "ISL slot annotation required on video components"

User doesn't understand what this means yet. Need further explanation before deciding. **Action: explain ISL slot annotation, then decide whether to add.**

### Q — Numeric-ID anti-pattern flag

GIGW PDF-tagging itself is dev-stage and skipped, but the workshop's underlying complaint was real: files / links / labels named like `001223`, raw dates, or random number runs (the "PDF document 1, PDF document 2" anti-pattern).

**Idea:** pass all text through a heuristic that flags long random-number runs or continuous numeric strings used as link/button/heading text. Output finding copy: *"This looks like an opaque ID, not a meaningful label."*

Open question: does this produce real signal, or too many false positives (prices, dates, OTP samples)? **Come back to it after Phase 1.**

---

## Skipping — and why

### WCAG

| SC | Reason skipped |
|---|---|
| **1.4.4** Resize Text | Dev-stage concern (browser zoom / reflow). Plugin can't check meaningfully at Figma stage. |
| **2.4.6** Headings & Labels | Content-level. Designers don't author final label copy in Figma. |
| **3.1.2** Language of Parts | Content-level. Lives in build, not Figma. |

### GIGW 3.0

| Clause | Reason skipped |
|---|---|
| **5.1.13 / 5.10.1** Unicode-Indian fonts | Dev / font-pipeline concern. Out of plugin's control. |
| **5.2.45** Indian input format hints | Content-level. |
| **5.4.10** Language toggle present | Page / structure-level. Plugin tests single components. |
| **5.2.42 / 5.2.43** Consistent nav & component identification | Page / structure-level. |

### IS 17802

| Clause | Reason skipped |
|---|---|
| Unicode-Indian fonts (dup of GIGW) | Same — dev-pipeline. |
| **5.3** Biometric fallback | Structure / flow-level. |

---

## Mark Interactive Elements — feature spec

Designer-driven override for the interactivity classifier. Lets the user (a) force-include nodes the classifier missed and (b) force-exclude nodes the classifier wrongly flagged.

### Storage
- `figma.clientStorage` — per-user, per-machine
- Key: `wcag-auditor.markers.v1`
- Shape: `{ [fileKey: string]: { include: string[]; exclude: string[] } }`
- Silent prune of missing node IDs on each plugin run

### Header button
- Position: between AI indicator and settings cog
- Phosphor cursor icon + "Mark" text label
- Click → opens marking page (full-panel takeover like settings)

### Marking page

**Selection card (top)** — shows the current Figma selection; state pill `● Include` / `● Exclude` / none for Neutral.

**Primary CTAs** — two side-by-side buttons: **Include** · **Exclude**.
- Never disabled when something is selected
- Clicking the opposite CTA replaces the current flag (no two-step)
- Active CTA filled in its color; inactive outlined
- **Reset** text-link below, visible only when state ≠ Neutral

**Empty state** (nothing selected) — both CTAs disabled, "Select a node" message, no Reset.

**List** — visible when selection is Neutral OR Exclude. Hidden when Include.
- Rows: classifier-detected + Include-marked nodes within the selection subtree
- Row layout: leading dot · node name · `[Inc] [Exc] [↺]` controls
- Click name → jump to node in Figma (select + zoom)
- Same toggle semantics as top CTAs; reset is an icon-only button
- "auto" pill on classifier-detected rows the user hasn't explicitly marked

### Color tokens
- Include = accent purple (existing `--accent`)
- Exclude = muted amber (desaturated, not destructive red)
- Neutral = default outlined
- Auto = dashed-outline pill

### Classifier integration (deferred — separate task)
`buildClickableElements` gains a fifth signal `'user-marker'`:
- If node id ∈ `exclude` → never classified as clickable (overrides all other signals)
- If node id ∈ `include` → always classified as clickable
- Otherwise existing signals apply

---

## Phase 2 — metadata generator (deferred)

Extend the plugin into a **design-stage handoff spec generator** for things only a designer can author:

- Alt text per image (with type: logo / decoration / informational / infographic)
- ARIA name per interactive element
- Tab order
- `lang` annotation per text node (for code-mixed content)
- ISL slot on video (pending Q2)
- PDF-export accessibility annotations

Come back to this after Phase 1 lands. Worth a dedicated planning doc when we start.

---

## Notes & follow-ups (track during Phase 1 implementation)

### Audit classifier — widen Include-suppression to ALL descendants
**Status:** deferred follow-up.

Today `buildClickableElements`' ancestry dedup drops a descendant only when that descendant **also classified** — i.e., a classified ancestor (e.g., Include-marked Card) suppresses its classified children. This catches the "Button inside Include-marked Card" case but lets unclassified descendants (raw vectors, chevrons that don't match the name regex) slip through and still get checked individually.

Desired rule: when a node is Include-marked, **every** node inside its subtree should be skipped by the audit, classifier hit or not. The Include node is the whole story for that branch.

Implementation sketch: in `classifyOne`, walk parents to the audit root; if any ancestor is in `markers.include`, return `null` unconditionally (before any signal checks). Equivalent to "the Include marker absorbs everything inside it."

Bundle with the next audit-touching change so we update tests once.



### Expand interactivity classifier with icon-wrapper detection
After the marking feature lands, fold these rules into `src/read/interactivity.ts` so they participate in normal audits (not just the marking page):

**Rule 1 — Icon-wrapper frame.** A FRAME or GROUP that looks like a tap-target wrapper around an icon:
- Type is FRAME or GROUP
- Aspect ratio between 0.7 and 1.4 (roughly square)
- Width and height both 16–80 px
- Contains at least one VECTOR / BOOLEAN_OPERATION / icon instance
- No TEXT descendants (excludes labelled buttons — those already pass via name regex)
- Not already classified by existing signals

**Rule 2 — Lone icon instance.** An INSTANCE that's an icon and isn't already classified:
- Type is INSTANCE
- Main component name matches `/^icon|\\b(icon|ic)\\b/i` (e.g. `Icon/Info`, `ic_close`)
- No TEXT descendants
- Bbox size 12–80 px on both sides
- Not already classified

Both rules add a new `ClickableSignal` value (`'icon-wrapper'` and `'icon-instance'` respectively). Once shipped, the marking feature's "ambiguous candidate" surfacing becomes simpler — these auto-classify and only the truly-unknown stays for manual marking.

Loose vector (no wrapper at all) is intentionally not handled — documented limitation.


### Container-resilience runner — separate from typography readability
SC 1.4.12 is a **user-override resilience test** (does the design survive a forced 1.5× line-height / 200% font size / 0.12× letter-spacing without clipping or overlap?), not a designer-shipped minimum. Same logic applies to SC 1.4.4 (200% text resize) and SC 1.4.10 (reflow at 320 px).

Build a **dedicated container-resilience runner** distinct from any typography readability check:

- Inspect text-bearing containers for resize behavior — hug-contents / fixed / fill-parent
- Flag text nodes inside fixed-height frames (would clip at 1.5× line-height or 200% size)
- Flag text inside fixed-width containers with `textAutoResize === 'NONE'` (can't wrap, will overflow)
- Maps to multiple SCs: **1.4.4 · 1.4.10 · 1.4.12** (via the multi-standard label refactor)

This is where SC 1.4.12 will live properly. The current typography readability check (line-height / letter-spacing / paragraph-spacing) is **NOT** WCAG 1.4.12 and uses the `'typography'` criterion id — no SC code shown in the UI.

### Typography readability — current state
Lives in `src/checks/typography.ts` + `runners/typography.ts`. Floors are general design opinion, not codified:

| Property | Floor | Baseline |
|---|---|---|
| Line-height | ≥ 75% | font size |
| Letter-spacing | ≥ -6% | font size (negative tracking allowed up to -6%) |
| Paragraph-spacing | ≥ 70% | effective line-height (1.2× fontSize fallback when AUTO) |
| Word-spacing | *not checked* | Figma has no UI for it |

Criterion id: `'typography'` (not a WCAG SC). UI hides the code on these findings.


### Form-input regex needs expansion
Current regex in `src/read/regex.ts` covers `textfield`, `combobox`, `textarea`, `select`, `search`, and `input/<text-entry-suffix>` for: `text|email|password|search|amount|number|phone|tel|url|date|time|name`.

Missing common BFSI-domain names to add:
- `pan`, `aadhaar`, `aadhar`
- `address`, `pincode`
- `income`, `salary`
- `ifsc`, `gstin`, `account` (for bank-account fields)

Add as `input/<suffix>` entries to the existing regex. Worth doing in the same PR as the touch-target work since it also touches form-input detection.

### Rename `interactive.ts` / `InteractiveElement`
The current name is misleading — that module finds **non-text contrast targets** (vectors, shapes, icons), not clickable elements. Confusion will compound once we add the real interactivity classifier.

Proposed renames:
- `src/read/interactive.ts` → `src/read/non-text-contrast.ts` (or similar)
- `InteractiveElement` DTO → `NonTextContrastElement` (or similar)
- `buildInteractiveElements` → `buildNonTextContrastElements`

Refactor pass — touch the consumers (`contrast.ts` runner, `findings.ts`, UI rendering) in the same change. Worth doing before/alongside the new `interactivity.ts` so naming stays clean.

---

## Conventions for the implementation

### Cross-standard mapping in plugin UI

When a single check satisfies more than one standard (e.g., touch target = WCAG 2.5.8 + IS 17802 11.2.5), the finding card should list **all applicable SCs**, each labeled with its standard:

> **Standards:** WCAG 2.5.8 · IS 17802 11.2.5

Format: `<Standard> <Clause>`, separated by middle dot. Applies to every finding card that maps across standards.
