# Audit Bug Report

> Bugs discovered during live audit of `header` component (node `2706:4554`, file `XDtsFF9aQiDJtZgqGFTBV4`).

---

## Bug 1 — Variant Discovery Fails in Remote MCP

**Affected file:** `docs/testing-workflow.md` — Phase 2, Variant Discovery

### What happens

Calling `get_metadata("0:1")` returns: *"The node ID provided was invalid."*
All variant-dependent criteria (1.4.1, 2.4.7, 3.3.1, 3.3.3) fall through to "Unable to test."

### Root cause (two problems)

**A — `0:1` is not queryable via remote MCP.**
`0:1` is the Figma document root. When connecting via a URL (remote MCP), only specific reachable node IDs can be queried. The document root is not one of them. This works in Desktop MCP (where the app controls selection context) but not in remote.

**B — `get_metadata` doesn't return children anyway.**
Even with Desktop MCP, `get_metadata` only returns the queried node itself — no children, no siblings. The integration doc confirms: *"Returns top-level node only — does not include children."* So even if `0:1` were valid, you'd get the page node metadata back, not a traversable tree.

The workflow was written assuming `get_metadata("0:1")` returns a full page tree. It doesn't.

### What does work

The master component lives in node namespace `172:xxxx`. Confirmed: `get_metadata("172:1752")` returns "System Bar" (a direct child of the master header component). The component set parent is somewhere in that namespace but isn't discoverable through blind ID probing.

### Fix

Replace the `get_metadata("0:1")` + sibling-scan approach in Phase 2 with one of:

- **Option A (simplest):** Accept variant node URLs as optional additional arguments. Let users pass `?focus-node-id=` and `?error-node-id=` alongside the primary URL.
- **Option B:** After getting the instance design context, attempt `get_design_context` on the master component by deriving its node ID. Check if the Figma MCP surfaces a `masterComponentId` or equivalent on instance nodes.

---

## Bug 2 — Icon Colors Not Passed to Contrast Agent

**Affected files:** `docs/testing-workflow.md` — Phase 3 parsing · `agents/contrast-agent.md`

### What happens

All icon-only `InteractiveElement` entries are flagged as "Unable to determine element color — verify ≥3:1 manually." The contrast agent never attempts to fetch SVG fills.

### Root cause

The SVG asset URLs are available in the design context as `<img src={imgVector} />` constants. The workflow says to fetch and parse them, but Phase 3 pre-resolves `fillColor` to `null` before handing off to the contrast agent. The agent receives:

```
fillColor: null
borderColor: null
```

With no `imgSrc` field and no URLs to fetch, it has no choice but to tap out. The fetch step is described in the contrast agent instructions but the data required to execute it is never passed.

### SVG assets ARE accessible

Every icon URL returns parseable SVG with fill values like:

```xml
<path fill="var(--fill-0, #E5EAF7)" />
```

The hex fallback is always present and usable. Confirmed for all six icons in the `header` component:

| Icon | Fill | Parent bg |
|------|------|-----------|
| `navigation/back` | `#E5EAF7` | `#002953` |
| `navigation/QR` | `#E5EAF7` | `#002953` |
| `navigation/profile` | `#E5EAF7` | `#002953` |
| `navigation/cart` | `#E5EAF7` | `#002953` |
| `navigation/camera` | `#666666` | `#ffffff` |
| `navigation/voice` | `#666666` | `#ffffff` |
| `navigation/search` | `#FF6700` | `#ffffff` |

### Fix

**1. Add `imgSrc` to the `InteractiveElement` schema** (`docs/testing-workflow.md`, Data Schemas section):

```
imgSrc: string | null   — src URL from <img> tag inside this element, or null if no <img>
```

**2. Update Phase 3 extraction** to populate `imgSrc` from the `<img>` src constant whenever `fillColor` cannot be resolved from CSS classes.

**3. Update `contrast-agent.md`** to explicitly handle the fetch step when `fillColor` is null and `imgSrc` is present:

> If `fillColor` is null and `imgSrc` is not null → fetch `imgSrc`, parse the first non-`none` `fill` attribute from `<path>`/`<g>` tags, use the hex fallback value (after the comma in `var(--fill-N, #hex)`). Then run contrast check as normal.

---

## Summary

| # | Bug | File | Impact |
|---|-----|------|--------|
| 1 | `get_metadata("0:1")` invalid in remote MCP; returns no children even if valid | `testing-workflow.md` | 4 criteria untestable (1.4.1, 2.4.7, 3.3.1, 3.3.3) |
| 2 | `imgSrc` not passed to contrast agent; `fillColor` pre-nulled | `testing-workflow.md` + `contrast-agent.md` | All icon 1.4.11 checks fall through to manual |
