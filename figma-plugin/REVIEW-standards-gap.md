# Plugin Standards Gap Review

> Audit of the Figma plugin against the workshop notes, GIGW 3.0, and IS 17802. Plugin today covers **WCAG 2.1 AA only**. Indian law mandates all three.

---

## Coverage at a glance

| Standard | Plugin coverage | What's missing |
|---|---|---|
| **WCAG 2.1 / 2.2 AA** | ~10 SCs covered well (1.4.1, 1.4.3, 1.4.5, 1.4.11, 1.4.12, 2.4.7, 3.3.1, 3.3.2, 3.3.3) + 3 manual notes | **5 design-stage-checkable SCs missed**: 2.4.4, 3.1.2, 2.5.8, 1.4.4 (partial), 2.4.6. Plus **2.2.1** as a manual-note addition. |
| **GIGW 3.0** | 0 dedicated checks | **9 India-specific checks** — Unicode/script, language toggle, sovereign branding, input format hints, navigation/component consistency |
| **IS 17802** | 0 dedicated checks | **5 ICT-broader checks** — touch target, Indic language plumbing, ISL video slot, biometrics fallback, pointer-gesture alternative |

Plugin's hand-off model (single-component, design-stage) means a meaningful chunk of GIGW/IS 17802 stays out of reach (runtime, document-level, hardware). The list below is only what's realistically checkable in Figma.

---

## 1. Workshop-revealed WCAG gaps

These SCs were raised in the workshop but aren't in the plugin today. Framing here is **what the spec actually says**, not the presenter's design opinions.

| SC | Spec text (paraphrased) | Workshop signal | Design-stage check |
|---|---|---|---|
| **2.4.4** Link Purpose (In Context) — A | The purpose of each link can be determined from the link text alone, or with surrounding context. | "Read more, read more, read more" | Flag link/button text matching a vague list: `read more`, `click here`, `learn more`, `details`, `here`, `more`. Codified in W3C techniques G91, H30. **~1 day.** |
| **3.1.2** Language of Parts — AA | The human language of each passage/phrase can be programmatically determined. | "Sabdhan Rahe, Safe Rahe" code-mixing | Detect Unicode-range mixing within a single text node (Latin + Devanagari/Tamil/etc.). Plugin emits a metadata requirement: each mixed-language run needs a `lang` annotation at handoff. **Medium effort.** |
| **2.5.8** Target Size (Minimum) — AA *(WCAG 2.2)* | Pointer-input target ≥ **24×24 CSS px** (with spacing/inline/essential exceptions). | "Touch targets large enough" | Interactive-node bbox ≥ 24×24. Also expose **2.5.5 (AAA, 44×44)** behind a strictness toggle for teams targeting AAA. **~2 hrs.** Note: this requires the plugin's scope claim to move from WCAG 2.1 AA to WCAG 2.2 AA. |
| **1.4.4** Resize Text — AA | Text can be resized up to **200%** without assistive tech and without loss of content or functionality. | Workshop discussed text legibility | At design stage: flag text nodes that would clip / overflow / lose function when scaled 2×. Heuristic: text inside fixed-height containers (no auto-layout vertical resize, no min-content), and text constrained by fixed-width siblings. **The "200% without loss" check is mostly runtime — the design-stage signal is overflow risk in fixed containers.** |
| **2.4.6** Headings and Labels — AA | Headings and labels **describe topic or purpose**. | Generic labels in the live audit | Flag empty, near-empty, or non-descriptive labels: blank strings, single-character labels, layer-name-as-label (`Button`, `Label`, `Field`, `Input`, `Text 1`), and labels that are pure punctuation or placeholder copy (`Lorem`, `xxx`, `tbd`). |

> **Manual-note refinements:** **2.2.1 Timing Adjustable** (Level A — spec says time limits must be turn-off-able, adjustable, or extendable; no specific seconds in the spec) and **2.2.2 Pause/Stop/Hide** (already in your manual bullet — covers auto-advancing carousels, blinking content > 5s). Worth splitting 2.2.1 out as its own manual line since it covers OTP/form-timeout cases the workshop discussed extensively.

---

## 2. GIGW 3.0 — beyond WCAG

GIGW Section 5.2 *is* WCAG, but Sections 5.1, 5.3, 5.4 add genuinely new Indian requirements. Below are the ones checkable from a Figma node tree.

### Tier 1 — add these first

| Clause | Check | What to inspect |
|---|---|---|
| **5.1.13 + 5.10.1** | **Unicode-only Indian fonts** | For any text node containing Devanagari / Tamil / Bengali / etc. codepoints, the font must be Unicode-compliant. Warn on legacy ISCII fonts (Krutidev, DV-TTSurekh, Shusha, Akruti). One-time font-name allowlist. |
| **5.4.10** | **Language toggle present** | Top-level frame contains a language-switcher component, with visible label in the target script ("हिन्दी" / "English"). Heuristic on layer names + text. |
| **5.2.45** | **Format hint on Indian inputs** | Form-input fields whose name matches `pan`, `aadhaar`, `aadhar`, `mobile`, `pincode`, `gstin`, `ifsc`, `date` must have a visible helper-text node with the correct format. PAN = `XXXXX1234X`, Aadhaar = `XXXX XXXX XXXX`, mobile = `+91 XXXXXXXXXX`, date = `DD/MM/YYYY`. Extends your existing form-input detection. |
| **5.2.42 / 5.2.43** | **Consistent nav & component identification** | Out of scope for single-component audit. Becomes meaningful if/when you add a frame-level or page-level audit mode. Worth a roadmap note. |

### Tier 2

| Clause | Check |
|---|---|
| **5.1.1 + 5.2.28** | If user marks the audit target as a **homepage** (small settings toggle), require National Emblem asset + "Government of India" / state name in title region |
| **5.1.12** | Sovereign footer link set on homepage frame: Accessibility / Privacy / Terms / Copyright / Sitemap / Help / Last-updated |
| **5.1.14** | Help link visible in header or footer |
| **5.2.34** | Pointer-gesture alternative for swipe/pinch/drag-only interactions — currently in manual bullet; could promote to variant-audit-style check if interactions are annotated |

### Tier 3 — handoff metadata

| Clause | Check |
|---|---|
| **5.2.16 + 5.4.9** | If a frame is tagged "for PDF export," require OCR'd HTML-alternative annotation in the spec |
| **5.2.29** | Reading order matches visual order — flag absolute-positioned children whose layer order conflicts with top-to-bottom geometric order |

---

## 3. IS 17802 — beyond WCAG

IS 17802 is far broader (web + mobile + hardware + documents + relay services). Most of it is runtime. The design-stage checks worth adding:

| Clause | Check |
|---|---|
| **4.2.12 + 5.10** | Same Unicode/Indic-language plumbing as GIGW 5.1.13 — single check serves both standards |
| **5.10.1** | Indian-language text input fields: hint the user that **Enhanced INSCRIPT** keyboard mapping is required (designer awareness, not enforceable in Figma) |
| **5.11** | If a frame contains a `video` component, require an annotation slot for **Indian Sign Language** overlay (not generic SL). Implement as required metadata on video components. |
| **5.3** | If frame uses biometric auth (face/fingerprint icon component), require a visible non-biometric fallback (PIN/OTP) on the same frame |
| **11.2.5** | Touch target ≥ 44 dp — same check as WCAG 2.5.5, dual-mapped |

> **Out of scope at design stage** — even being honest about IS 17802: RTT, caller ID, A/V sync, relay services, hardware reach ranges, closed-functionality kiosk operation. Don't pretend the plugin covers these. The README should say so explicitly.

---

## 4. What is *not* checkable in Figma — be honest in the README

The plugin is **single-component, design-stage**. The following GIGW/IS 17802 areas need to live in dev/runtime or handoff tooling and should be called out in the README so users don't assume coverage:

- PDF tagging & OCR (GIGW 5.2.16, 5.2.29; IS 17802 Clause 10)
- Programmatic name/role/value, status messages (runtime)
- Reflow at 320 px / text spacing user override (runtime browser)
- Time-out adjustability, real-time captioning, RTT, biometrics fallback (runtime)
- Bilingual content parity across pages (multi-page concern)
- Cross-page consistency of nav and components (5.2.42 / 5.2.43)
- Hardware accessibility (IS 17802 Clause 8)

---

## 5. Recommended priorities

If you want to land "GIGW + IS 17802 awareness" in the plugin without a rewrite, do it in three phases.

### Phase 1 — 2–3 days of work, large coverage gain

1. **2.4.4 Link Purpose** — vague-text runner against a regex list.
2. **2.5.8 Target Size (Minimum)** — bbox ≥ 24×24 on interactive nodes. Requires bumping plugin scope to WCAG 2.2.
3. **1.4.4 Resize Text** — fixed-container overflow heuristic (design-stage proxy for the runtime 200% check).
4. **2.4.6 Headings & Labels** — descriptiveness check against an empty/generic/placeholder allowlist.
5. **3.1.2 Language of Parts** — Unicode-range mixing detector + handoff-spec annotation requirement.
6. **2.2.1 Timing Adjustable** — add as a manual-note line alongside 2.2.2 (covers OTP/form-timeout cases the workshop emphasized).
7. **Unicode-Indian-font check (GIGW 5.1.13)** — font-name allowlist warning for Devanagari/Tamil/etc. text.
8. **Indian input format hint (GIGW 5.2.45)** — extend form-input regex with PAN/Aadhaar/mobile/pincode/date/IFSC/GSTIN patterns + helper-text presence check.

These give you a credible "GIGW-aware" tier without leaving the WCAG idiom.

### Phase 2 — frame-level audit mode

Add a separate "Audit frame" path (vs current "Audit component") to enable:

- Language toggle present (5.4.10)
- Sovereign footer link set (5.1.12) — opt-in by audit target type
- Consistent nav / component identification (5.2.42 / 5.2.43)
- ISL video slot annotation (IS 17802 5.11)

Requires a new audit scope (already a documented gap — current scope is single component).

### Phase 3 — handoff metadata

Treat the plugin as a **handoff spec generator** for things only a designer can author:

- Required ARIA name per interactive element
- Required alt text per image (with type: logo / decoration / informational / infographic)
- Required tab order
- Per-text-node `lang` annotation for code-mixed content (feeds 3.1.2)
- PDF-export accessibility annotations (OCR-alt, reading order)
- Required ISL slot on video

---

## 6. Trade-offs to decide before building

| Decision | Option A | Option B |
|---|---|---|
| **Frame-level audit** | Add as second entry point, keep component audit intact | Refactor to scope-agnostic, more flexible but larger blast radius |
| **GIGW homepage checks** | User toggle in settings ("This is a govt site") | Auto-detect by emblem asset — fragile |
| **Indian-script font allowlist** | Hard-coded allowlist of known good fonts | Heuristic: presence of Devanagari codepoints + font's `name` not on known-bad list |
| **AI vs deterministic for label fuzziness** | Vague-link-text regex (deterministic, cheap, English-only) | AI judge (catches Hindi/regional generic labels) |
| **Standards branding** | Rename plugin "WCAG + GIGW + IS 17802 Auditor" | Keep WCAG branding, add a "Standards mode" toggle |

---

## TL;DR for the next session

The plugin is solid on WCAG 2.1 AA. The biggest, fastest wins are **five WCAG SCs surfaced by the workshop that aren't yet runners** (2.4.4, 2.5.8, 1.4.4, 2.4.6, 3.1.2) and **two GIGW-distinctive checks** (Unicode-Indian-font allowlist + Indian-input format hints). That alone moves the plugin from "WCAG checker" to "India-aware design-stage auditor" in ~3 days. Frame-level scope and handoff-spec metadata are the bigger-but-worth-it Phase 2 and Phase 3.

---

## Appendix A — Workshop points that are design opinion, not standard requirements

These came up in the workshop as recommendations but are **not** WCAG, GIGW 3.0, or IS 17802 violations. Useful as design-system guidance, but the plugin should not flag them as standards failures.

| Workshop claim | Why it's opinion |
|---|---|
| "Body font should be 18–24 px" | No WCAG / GIGW / IS 17802 SC sets a minimum body size. 1.4.4 governs resize behaviour up to 200%, not a starting size. |
| "Never use ALL CAPS" | No SC prohibits uppercase. Style-guide / legibility argument only. (Screen readers may mis-pronounce all-caps strings, but the fix is `aria-label` or text-transform CSS, not banning uppercase.) |
| "Use 'Contact Us' not 'Reach Us'" | 2.4.6 asks labels describe topic/purpose. "Reach Us" arguably satisfies that. No standard mandates specific label vocabulary. |
| "One CTA per zone" | Design opinion. No SC limits CTA count. |
| "Critical info shouldn't be footer-only" | Information-architecture opinion. No SC mandates header/hero placement. |
| "Use one font family across the site" | Brand/consistency opinion. No SC restricts font-family count. |
| "Carousels need a 20-second comprehension window" | 2.2.1 / 2.2.2 require the user to be able to **adjust / pause / stop / extend** timing. The spec sets no specific seconds-per-slide minimum. |
| "Don't use AI-generated images" | No SC. Comprehension concerns are addressed via 1.1.1 alt text, not banning the source. |
| "Don't offload accessibility to user-installed plugins" | Good practice. Not a codified SC. |
| "First impression is the last impression" / "20-second rule" | Rhetorical framing. |

These belong in a separate **design-system or brand-guidelines** doc, not the standards auditor.

---

## Appendix B — Items I flagged but couldn't cleanly cite

Two GIGW clauses I'd want to verify against the GIGW 3.0 PDF before shipping a runner for them. Both came from the research agent's summary; if you want them in Phase 2, I'll re-pull the source first.

- **GIGW 5.1.12** — "Sovereign footer link set" (Accessibility / Privacy / Terms / Sitemap / Help). Cited by the research agent but I haven't seen the literal clause text.
- **"Last reviewed / updated date" requirement** — I attributed this to GIGW content policy but couldn't pin the specific clause.
