# WCAG AA Auditor — Figma Plugin

Single-component WCAG 2.1 Level AA audit, runs entirely inside Figma. Nine deterministic checks (1.4.1, 1.4.3, 1.4.5, 1.4.11, 1.4.12, 2.4.7, 3.3.1, 3.3.2, 3.3.3) plus two AI-augmented checks (visual review + image-of-text classification). The AI checks call your chosen provider — OpenRouter, Anthropic, or Google — using a key you paste once into the plugin's settings panel; the key is stored per-user in `figma.clientStorage` and never ships in source.

**No server. No env files. One folder.**

## Quick start

```bash
# 1. Install deps
npm install

# 2. Build (one-shot)
npm run build
# …or watch mode for development
npm run dev

# 3. Load the manifest in Figma Desktop:
#    Plugins → Development → Import plugin from manifest…
#    Pick figma-plugin/manifest.json
```

After importing once, run via **Plugins → Development → WCAG AA Auditor** or `⌥⌘P` to re-run the last plugin.

## First-run AI setup

Header shows **AI: not set up** with a small cog icon to its right. Click either to open the settings page:

1. Pick a provider (OpenRouter, Anthropic, or Google).
2. Paste your API key.
3. Pick a model (or leave the default).
4. **Save**. The page closes; header reads **AI: on**.

To turn AI off temporarily without losing the key, click the **AI: on** indicator. Click again to flip back. To wipe the key, open settings → **Clear key** (two-click confirm).

Deterministic checks always work — even with no key configured, you get the full Color & Contrast / Typography / Forms-and-errors / Variant audit / Manual sections. The AI sections render a *needs-setup* state with a button that opens settings.

## Provider notes

| Provider | Endpoint | Get a key | Notes |
|---|---|---|---|
| **OpenRouter** | `openrouter.ai/api/v1/chat/completions` | [openrouter.ai/keys](https://openrouter.ai/keys) | Gateway — one key reaches Claude, GPT, Gemini, Llama, etc. Best fallback option. |
| **Anthropic** | `api.anthropic.com/v1/messages` | [console.anthropic.com](https://console.anthropic.com) | Direct browser calls require the `anthropic-dangerous-direct-browser-access` header (we send it). The header name is intentionally provocative — Anthropic wants browser callers to acknowledge they're shipping the key client-side. |
| **Google** | `generativelanguage.googleapis.com/v1beta/models/.../generateContent` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | CORS support has been inconsistent from browser contexts. If calls fail with a network/CORS error, route Gemini models through OpenRouter instead. |

OpenAI is not a direct tab — `api.openai.com` blocks browser CORS. Reach GPT models via OpenRouter (e.g. `openai/gpt-4o-mini`).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | esbuild + HTML inliner in watch mode (~30 ms rebuild) |
| `npm run build` | one-shot production build (minified) |
| `npm run typecheck` | `tsc --noEmit` — strict mode |
| `npm test` | `node:test` over `src/**/__tests__/*.test.ts` (162 tests) |

## Iterate

| Action | How |
|---|---|
| Rebuild after a code change | save while `npm run dev` is running |
| Re-run plugin in Figma | `⌥⌘P` |
| Main thread console | right-click anywhere in Figma → **Plugins → Development → Open Console** |
| UI iframe console | right-click inside the plugin panel → **Inspect Element** |
| Copy a debug report | **Copy debug** button in the Results pane — paste into chat to triage |

## What the plugin tests

**Deterministic** (no AI):
- 1.4.3 Contrast (Minimum), 1.4.11 Non-Text Contrast — luminance ratio per text segment / interactive vs sampled background
- 1.4.5 Images of Text — name heuristic (the AI section catches the rest)
- 1.4.12 Text Spacing — line-height / letter-spacing thresholds, with a single-visual-line auto-pass for line-height
- 3.3.2 Labels or Instructions — external sibling label OR drawn inner-input-box geometric detection OR name fallback

**Variant audit** (opt-in via the "Run variant audit" button):
- 1.4.1 Use of Color, 2.4.7 Focus Visible, 3.3.1 Error Identification, 3.3.3 Error Suggestion — tree + property diff between default / focus / error variants

**AI-augmented** (BYO key, optional):
- 1.4.5 Image of Text — vision LLM classifies each large non-exempt image
- Visual Review — vision LLM observations on the rendered screenshot

**Manual** (always shown as a slim bottom note):
- 1.3.3 Sensory Characteristics
- 2.2.2 Pause, Stop, Hide
- 2.5.1 Pointer Gestures + Motion Actuation

## Layout

```
figma-plugin/
├── manifest.json             # documentAccess: dynamic-page; networkAccess: 3 provider domains
├── package.json
├── tsconfig.json
├── scripts/build.mjs         # esbuild + HTML inliner (CSS, JS, fonts, prompts, monogram, sprite)
├── assets/
│   ├── tokens.css            # design tokens (canonical; styles.css mirrors)
│   ├── monogram.svg
│   ├── design.md
│   ├── fonts/                # General Sans + JetBrains Mono (woff2, base64-inlined)
│   ├── icons/phosphor/       # duotone SVGs (sprited at build time)
│   └── prompts/              # AI system prompts (build-inlined as TS strings)
├── src/
│   ├── shared/
│   │   ├── dtos.ts
│   │   ├── protocol.ts       # main↔ui message contract
│   │   └── settings.ts       # AiSettings, DEFAULT_SETTINGS, parseSettings
│   ├── main/                 # figma.* sandbox — node traversal, screenshot export, clientStorage
│   ├── read/                 # pure functions over Figma scene → AuditDTO
│   ├── checks/               # deterministic WCAG checks
│   └── ui/                   # iframe — DOM, fetch, settings page, AI provider calls
│       ├── ai/               # provider abstraction (openrouter, anthropic, google)
│       ├── settings/         # settings page + clientStorage round-trip
│       └── (rest)
└── docs/                     # API research + MCP→plugin mapping
```

## Distribution

Zip the whole folder excluding build artefacts and dependencies:

```bash
zip -r /tmp/wcag-plugin.zip figma-plugin -x "*/node_modules/*" -x "*/dist/*"
```

Recipient unzips, runs `npm install && npm run build`, then imports `manifest.json` in Figma. Their key stays on their machine in `figma.clientStorage`.

## Design language

Design system in [`assets/design.md`](./assets/design.md). Key rules:
- **One accent moment** — purple is reserved for clickable affordances (button hover/focus, clickable element names, the "AI not set up" header pill, transient toast, armed clear-key button).
- **Display font sanctioned in two places only** — hero and sign-off.
- **8-point spacing scale** — all values come from `--space-1` … `--space-9` tokens.
- **Hairlines, never borders or drop shadows** — `var(--hairline)` at 30% opacity.
- **Icons are Phosphor Duotone**, color via `currentColor`.
- **Light / dark via `prefers-color-scheme`** — both modes share token names; only values flip.

Fonts (General Sans Variable + JetBrains Mono Regular/Medium/Bold) ship in `assets/fonts/` and are base64-inlined into `ui.html` at build time — no network fetch, no system fallback.
