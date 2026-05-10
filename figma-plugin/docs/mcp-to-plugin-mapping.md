# MCP Workflow → Figma Plugin API Mapping

> Companion to `figma-plugin-api-research.md`. Where the research doc explains the API surface, this doc explains the **delta**: what changes structurally between the current Claude-Code skill (MCP-driven) and the planned Figma plugin (Plugin-API-driven), and which parts need an honest rewrite.

The audit goal does not change: pick a component in Figma, get a WCAG 2.1 AA report. Everything below is about *how* that happens internally.

---

## 1. The big shift in one picture

### Today (skill)

```
┌─────────────────────────────────────────────────┐
│  Claude Code (single linear context)            │
│                                                 │
│  Phase 1 Validate ─ get_metadata                │
│  Phase 2 Collect  ─ get_design_context          │
│                     use_figma (raw nodes)       │
│  Phase 3 Parse    ─ Track A: figmaData          │
│                     Track B: CSS in designCtx   │
│  Phase 4 Test     ─ 4 agent subprocesses        │
│  Phase 5 Output   ─ markdown                    │
└─────────────────────────────────────────────────┘
```

### Tomorrow (plugin)

```
┌──────────────────────────┐    ┌─────────────────────────┐    ┌──────────────────┐
│  Figma main thread       │    │  Figma UI iframe        │    │  Backend server  │
│  (sandbox, no fetch)     │    │  (DOM + fetch)          │    │  (holds API key) │
│                          │    │                         │    │                  │
│  • Validate selection    │    │  • Renders report       │    │  • Visual review │
│  • Read node tree        │    │  • Handles "run audit"  │    │    LLM call only │
│  • Resolve variables     │ ──▶│  • Sends DTO + PNG to   │ ──▶│  • Returns       │
│  • Build DTO             │    │    backend for visual   │    │    observations  │
│  • Run deterministic     │    │  • Receives findings    │    │                  │
│    checks (contrast,     │    │    + visual obs         │    │                  │
│    spacing, variants)    │ ◀──│  • Posts result back    │ ◀──│                  │
│  • Export screenshot     │    │                         │    │                  │
└──────────────────────────┘    └─────────────────────────┘    └──────────────────┘
       postMessage                  fetch (HTTPS)                  Claude API
```

**Three contexts instead of one.** The skill's linear flow gets split across main thread (read/check), UI iframe (HTTP/render), and backend (LLM). This split is **non-negotiable** — Figma's two-thread model requires it.

---

## 2. Phase-by-phase mapping

| Skill phase | What it does today | What replaces it | Restructure level |
|---|---|---|---|
| **1. Validate** | Calls `get_metadata`, parses XML tag (`<symbol>`, `<frame>`, `<canvas>`), branches | Read `figma.currentPage.selection`, inspect `node.type` (`COMPONENT`, `INSTANCE`, `COMPONENT_SET`, `FRAME`, `PAGE`) | **Simpler.** No XML parse. Direct enum check. |
| **2. Collect** | Two MCP calls in parallel: `get_design_context` (React+Tailwind + screenshot) + `use_figma` (custom JS in MCP sandbox) | Single async traversal on main thread reading `fills`, `strokes`, `boundVariables`, text segments, variant tree directly. Plus `node.exportAsync()` for screenshot. | **Major rewrite.** Different inputs, but we get richer raw data. |
| **3. Parse** | Track A maps `figmaData` to schemas. Track B parses CSS strings from `designContext` for non-icon interactive elements + form inputs. | **Track B disappears entirely.** All data comes from real nodes. Build the same DTOs but from `figma.*` reads instead of CSS heuristics. | **Major rewrite.** Track B logic deleted, Track A becomes the only path. |
| **4. Test** | 4 Claude Code subagents run in parallel (contrast, typography, variant, visual-review) | 3 deterministic TypeScript modules in plugin (contrast, typography, variant) + 1 backend LLM call (visual-review). All in parallel via `Promise.all`. | **Significant.** 3 of 4 agents become pure functions; only visual-review stays LLM. |
| **5. Output** | Markdown assembled in chat | HTML rendered in the plugin UI iframe, same logical structure | Format change, logic unchanged. |

---

## 3. The three biggest restructures

### 3.1 Variant diffing (1.4.1, 2.4.7, 3.3.1, 3.3.3)

**Today:** Diff two strings of React+Tailwind code returned by `get_design_context` for `defaultVariant` vs `focusVariant`/`errorVariant`. Look for added/removed `<p>` tags, changed `bg-[...]` classes, etc.

**Tomorrow:** No code strings exist. Two options:

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. Tree diff on real nodes** | Walk both variant subtrees, compare by `name` + position, detect added/removed text nodes, fill changes, stroke changes, child count delta | Closer to ground truth; works without any code-gen | More code to write; matching nodes across variants is fuzzy |
| **B. Property-level diff** | Compare per-node properties (fills, strokes, effects, child text content) using stable child traversal | Simpler, deterministic | Misses structural changes (a new icon node) unless we also diff structure |

> **Recommendation:** A combined approach. Diff (a) child node count + types as a structural signal, (b) per-matched-node fills/strokes/text changes as a property signal. Both feed the same rules.

This is the **single biggest port effort** in the project. Plan ~30% of build time here.

### 3.2 Form input detection (3.3.2)

**Today:** Heuristic CSS parse — find `<p>` tags near `<div>` with `data-name` containing "input"/"field", check sibling order to infer "external label" vs "placeholder only."

**Tomorrow:** Direct node access is much better.

| What we look for | How |
|---|---|
| Is this a form input? | InstanceNode where `mainComponent.name` matches `Input`, `TextField`, `Search`, `Combobox` (or check `componentPropertyDefinitions` for known input shape) |
| Visible label? | Sibling TextNode in the same parent frame, *outside* the input's bounding box, positioned above or to the left |
| Placeholder only? | TextNode *inside* the input's bounding box (use `absoluteBoundingBox` containment) |
| Required indicator? | TextNode containing `*` adjacent to the label, OR variant property `Required = true` in `componentProperties` |

> **Cleaner abstraction:** stop parsing layout from CSS. Use real geometry (`absoluteBoundingBox`) and real component metadata (`componentProperties`).

### 3.3 The four "agents" collapse to three modules + one API call

**Today:** All 4 agents are LLM-driven Claude Code subagents.

**Tomorrow:**

| Agent | Becomes | Reason |
|---|---|---|
| Contrast (1.4.3, 1.4.11) | **TS module in plugin.** Pure math. | No LLM needed. The Python script's logic ports directly. |
| Typography (1.4.5, 1.4.12) | **TS module in plugin.** Pure math + name heuristics. | Same. |
| Variant (1.4.1, 2.4.7, 3.3.1, 3.3.2, 3.3.3) | **TS module in plugin.** Tree/property diff + rule checks. | LLM was unnecessary even today; this was just convenient in the skill context. |
| Visual review (subjective) | **Backend LLM call** with screenshot. | Genuinely needs LLM judgment. Sole reason the backend exists. |

> **Implication.** The backend server's job shrinks dramatically. It exists for **one** reason: to hold the Claude API key and proxy a single visual-review prompt. ~30 lines of code.

---

## 4. Per-criterion mapping

| Criterion | Today (data source → check) | Tomorrow (data source → check) |
|---|---|---|
| **1.4.1 Use of Color** | `get_design_context` code diff between default/error variants → LLM agent | Variant tree diff + property-level color-only-change detection → TS module |
| **1.4.3 Contrast (Min)** | `use_figma` exact fg/bg hex → Python script | `getStyledTextSegments` + `Variable.resolveForConsumer` + ancestor-bg walk → TS module |
| **1.4.5 Image of Text** | `use_figma` IMAGE-fill nodes → Python heuristic | `findAllWithCriteria({types:['RECTANGLE'...]})` filtered by `fills` containing `IMAGE` paint → same heuristic in TS |
| **1.4.11 Non-Text Contrast** | `use_figma` vector fills + interactive element CSS → Python script | Direct node fills/strokes for interactive instances + vector nodes → TS module |
| **1.4.12 Text Spacing** | `use_figma` lineHeight/letterSpacing → Python script | `getStyledTextSegments` per text run → TS module |
| **2.4.7 Focus Visible** | Code diff default vs focus variant → LLM agent | Variant tree property diff (added/changed: stroke, effect (drop shadow), background fill) → TS module |
| **3.3.1 Error Identification** | Code diff default vs error variant → LLM agent | Variant tree diff: detect added TextNode AND non-color visual change (stroke, icon InstanceNode, etc.) → TS module |
| **3.3.2 Labels or Instructions** | CSS sibling/child analysis → LLM agent | `absoluteBoundingBox` containment + sibling search + `componentProperties` → TS module |
| **3.3.3 Error Suggestion** | Extract error text via code diff → LLM agent | Find added TextNode in error variant subtree, run text content through vague-blocklist → TS module |
| **Visual Review** | Screenshot → LLM agent | Screenshot → backend LLM call |

> **All 9 automated criteria except Visual Review become deterministic TypeScript.** The skill version was LLM-heavy because Claude Code couldn't run TS efficiently. The plugin can.

---

## 5. What gets better

| Improvement | Why it matters |
|---|---|
| **Mode-aware color resolution** | `Variable.resolveForConsumer(node)` returns the actually-rendered color in the active mode. The skill often returns variable *names* without resolution, leading to false positives in dark-mode files. |
| **No MCP round-trip latency** | A single audit makes 2–4 MCP calls today. Plugin reads happen in-process; entire audit can finish in <1s. |
| **Real geometry for layout heuristics** | `absoluteBoundingBox` containment beats CSS sibling-order guessing every time. |
| **Variant data is structured, not stringified** | `componentPropertyDefinitions` gives us the variant schema directly — no parsing variant names like `state=focus`. |
| **Run in Dev Mode** | Audit surfaces in the Inspect panel for engineers, not just designers. |
| **Live re-audit** | `figma.on('selectionchange')` lets the report update as the user navigates. |

---

## 6. What gets harder or lost

| Loss | Mitigation |
|---|---|
| **No React+Tailwind code to diff** | Replace string diff with node-tree diff (see §3.1). More code, but more accurate. |
| **No Code Connect mappings** | Not used today; if ever needed, call Figma REST API from the UI iframe. |
| **Single-file audits only** | Plugin runs in the current file. Multi-file workflows require either re-running per file or a REST-based v2. |
| **No pre-built screenshot annotations** | We have raw PNG bytes. If we want issue overlays, draw client-side on a canvas or render in HTML. |
| **No `figma.mixed` in MCP responses** | Plugin gives us mixed values for real. Every text-property read needs a `=== figma.mixed` branch handling per-segment data. |

---

## 7. New plugin pipeline (replaces the 5 phases)

```
┌─ MAIN THREAD ────────────────────────────────────────────────────────┐
│                                                                       │
│  1. INIT                                                              │
│     figma.skipInvisibleInstanceChildren = true                        │
│     figma.showUI(...)                                                 │
│                                                                       │
│  2. ON "run audit" message from UI:                                   │
│                                                                       │
│     a. VALIDATE                                                       │
│        sel = figma.currentPage.selection                              │
│        accept: COMPONENT, INSTANCE, COMPONENT_SET, FRAME (with warn)  │
│        reject: empty, PAGE, multiple                                  │
│                                                                       │
│     b. COLLECT                                                        │
│        node = sel[0]                                                  │
│        textNodes      = node.findAllWithCriteria({types:['TEXT']})    │
│        vectorNodes    = node.findAllWithCriteria({types:['VECTOR',    │
│                          'BOOLEAN_OPERATION']})                       │
│        instanceNodes  = node.findAllWithCriteria({types:['INSTANCE']})│
│        imageBearing   = filter all nodes for fills containing IMAGE   │
│        variantTree    = resolveVariantSiblings(node)                  │
│                                                                       │
│     c. RESOLVE (async)                                                │
│        for each text node:                                            │
│          segments = getStyledTextSegments([...])                      │
│          for each segment: resolve fill via Variable.resolveForConsumer│
│        for each surface node:                                         │
│          resolve fills + ancestor backgrounds (variable-aware)        │
│                                                                       │
│     d. BUILD DTO                                                      │
│        TextElement[], InteractiveElement[], ImageElement[],           │
│        FormInputElement[], VariantData                                │
│                                                                       │
│     e. RUN CHECKS (parallel via Promise.all)                          │
│        contrastResults    = checkContrast(textEls, interactiveEls)    │
│        typographyResults  = checkTypography(textEls, imageEls)        │
│        variantResults     = checkVariants(variantData, formInputs)    │
│                                                                       │
│     f. EXPORT SCREENSHOT                                              │
│        png = await node.exportAsync({format:'PNG', scale:2})          │
│                                                                       │
│     g. POST TO UI                                                     │
│        figma.ui.postMessage({                                         │
│          deterministic: { contrast, typography, variant },            │
│          screenshot: png                                              │
│        })                                                             │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─ UI IFRAME ───────────────────────────────────────────────────────────┐
│                                                                       │
│  3. ON message from main:                                             │
│     a. Render deterministic findings immediately                      │
│     b. POST to backend: { dto, screenshotBase64 }                     │
│     c. Receive { observations[] }, render Visual Review section       │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─ BACKEND ─────────────────────────────────────────────────────────────┐
│                                                                       │
│  4. POST /audit                                                       │
│     a. Read API key from env                                          │
│     b. Call Claude with visual-review-agent prompt + screenshot       │
│     c. Return { observations: string[] }                              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 8. Files that port directly vs need rewriting

| File (skill) | New home | Effort |
|---|---|---|
| `SKILL.md` (orchestration) | Plugin's `main.ts` orchestration code | Rewrite — different runtime |
| `docs/testing-workflow.md` | Replaced by this doc + the plugin's `pipeline.ts` | Rewrite |
| `agents/contrast-agent.md` | `plugin/checks/contrast.ts` | Port logic, drop LLM framing |
| `agents/typography-agent.md` | `plugin/checks/typography.ts` | Port logic, drop LLM framing |
| `agents/variant-agent.md` | `plugin/checks/variant.ts` | **Significant rewrite** — code-diff → tree-diff |
| `agents/visual-review-agent.md` | `server/prompts/visual-review.txt` | Port verbatim as LLM system prompt |
| `scripts/contrast-ratio.py` | `plugin/checks/contrast.ts` (inline) | Port to TS — straightforward |
| `scripts/text-spacing-check.py` | `plugin/checks/typography.ts` (inline) | Port to TS — straightforward |
| `commands/wcag-page.md`, `wcag-journey.md`, `wcag-dev.md`, `wcag-manual.md` | Plugin UI tabs / modes (deferred to v1.1) | Out of scope for plugin v0 |

---

## 9. Decisions (resolved)

| # | Decision | Choice | Implication |
|---|---|---|---|
| 1 | Variant diffing approach | **Combined tree + property diff** | Both signals run on every variant compare; rules consume both. Highest fidelity, most code. |
| 2 | Mode handling | **Active mode only** | Audit reports the mode that's currently selected in the file. Multi-mode audit deferred. |
| 3 | Form input detection | **Name regex on main component** | Match `Input\|TextField\|Search\|Combobox\|Textarea\|Select` (configurable). |
| 4 | Backend hosting (v0) | **Localhost** | ~30-line Node/Express server. Move to Vercel later when sharing. |
| 5 | UI shape | **Rich functional dashboard** | Not a single button — a real results UI: filters, criterion grouping, jump-to-node, severity, screenshot pane. Designed for daily use, not a demo. |

---

## 10. Action items derived from this mapping

1. Port `contrast-ratio.py` and `text-spacing-check.py` to TypeScript modules — these are the most stable, mechanical part.
2. Write the **DTO builders** on main thread next — once those exist, every check becomes a pure function over DTOs.
3. Spike the **variant tree diff** early — highest unknown, biggest risk to schedule.
4. Build the **backend stub** in parallel — single endpoint, hardcoded prompt, returns mock observations until plumbing is done.
5. Stand up a **minimal plugin shell** (manifest, main, ui) so we have a real environment to run code against from week 1.
6. Validate against 3 representative components from a real BFL file before declaring v0 done.

---

## Appendix: side-by-side data flow

| Stage | Skill | Plugin |
|---|---|---|
| Identify component | `get_metadata` → XML parse | `figma.currentPage.selection[0]` |
| Get all text data | `use_figma` JS → `n.fills[0]`, `n.fontSize`, etc. | `node.findAllWithCriteria({types:['TEXT']})` + `getStyledTextSegments` |
| Resolve color | Read `fill.color` `0..1` floats, hex it | Same, but **resolve variables first** via `resolveForConsumer` |
| Find background | Walk parent chain in JS, find first SOLID fill | Same algorithm, plus `absoluteBoundingBox` overlap check |
| Get screenshot | Comes free in `get_design_context` | `node.exportAsync({format:'PNG'})` |
| Get variants | Read `parent.children` of COMPONENT_SET in `use_figma` | Same — `componentSet.children` |
| Diff variants | String diff on React+Tailwind code | Tree diff on real nodes |
| Run check | Spawn LLM subagent with prompt | Call TS function |
| Visual review | Spawn LLM subagent with screenshot | POST screenshot to backend → backend calls Claude |
| Render output | Markdown in chat | HTML in plugin UI iframe |

---

> **Bottom line.** The audit logic is mostly preserved. The orchestration and the variant agent are where significant rework happens. Three of the four old agents become pure deterministic code, which is **better** than the skill version — faster, cheaper, more reliable.
