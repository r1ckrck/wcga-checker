# Contrast Agent

> Tests 1.4.3 (text contrast) and 1.4.11 (non-text contrast).
> Runs `scripts/contrast-ratio.py` for all calculations.

---

## Input

You will receive two lists:

**Text elements** — each with:
- `nodeId`, `nodeName`, `textContent`
- `fgColor` (hex or rgba, resolved)
- `bgColor` (hex or rgba, resolved from parent)
- `fontSize` (px), `fontWeight` (numeric like `400`/`700`, or string like `Medium`/`Bold`/`SemiBold`)

**Interactive elements** — each with:
- `nodeId`, `nodeName`
- `fillColor`, `borderColor` (hex or rgba, resolved)
- `parentBgColor` (hex or rgba, resolved)

---

## Process

### For each text element → 1.4.3

1. Run `scripts/contrast-ratio.py` with `fgColor` and `bgColor`
2. Determine threshold:
   - fontSize ≥ 24px → **large text** → threshold **3:1**
   - fontSize ≥ 18.67px AND fontWeight is bold (≥700, or `Medium`, `Bold`, `SemiBold`) → **large text** → threshold **3:1**
   - Otherwise → **normal text** → threshold **4.5:1**
3. Compare ratio to threshold → pass or flag

### For each interactive element → 1.4.11

1. If `borderColor` exists: run `scripts/contrast-ratio.py` with `borderColor` and `parentBgColor`
2. If `fillColor` exists: run `scripts/contrast-ratio.py` with `fillColor` and `parentBgColor`
3. Threshold is always **3:1**
4. Compare ratio → pass or flag

### Tap-out

- If `bgColor` or `parentBgColor` is `"unable to determine"` → return flag: "Unable to determine background"
- If any color is `"gradient"` or `"image"` → return flag: "Unable to calculate contrast — review manually"
- Do NOT attempt to compute contrast for unresolved colors

---

## Output

Return results as a structured list:

```
passes:
  - "1.4.3: All N text elements meet contrast minimums"
  - "1.4.11: All N interactive elements meet contrast minimums"

flags:
  - criterion: "1.4.3"
    nodeId: "I2443:1455;172:3194"
    nodeName: "Sign in"
    issue: "Contrast 2.8:1 — needs ≥4.5:1. Text rgba(255,255,255,0.4) on bg #002953"

  - criterion: "1.4.11"
    nodeId: "2015:3545"
    nodeName: "search/main"
    issue: "Border contrast 2.1:1 — needs ≥3:1. Border #ccc on bg #002953"

  - criterion: "1.4.3"
    nodeId: "2015:3537"
    nodeName: "Search text"
    issue: "Unable to determine background"
```

- One entry per element, not per criterion
- Passes can be summarized per criterion if all elements pass
- Flags must include nodeId, nodeName, calculated ratio, and required threshold
