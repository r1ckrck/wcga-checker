# Contrast Agent

---

## Input

You receive `TextElement[]` and `InteractiveElement[]` per the data schemas in `docs/testing-workflow.md`.

---

## Process

### For each text element → 1.4.3

1. Determine threshold:
   - fontSize ≥ 24px → **large text** → threshold **3:1**
   - fontSize ≥ 18.67px AND fontWeight is bold (numeric ≥700, or string exactly `"Bold"`) → **large text** → threshold **3:1**
   - Otherwise → **normal text** → threshold **4.5:1**
2. Run `scripts/contrast-ratio.py` with `fgColor`, `bgColor`, and `--threshold <threshold>`
3. Script returns `pass: true/false` — flag if false

### For each interactive element → 1.4.11

1. If `borderColor` exists → run `scripts/contrast-ratio.py` with `borderColor`, `parentBgColor`, and `--threshold 3`
2. If `fillColor` exists → run `scripts/contrast-ratio.py` with `fillColor`, `parentBgColor`, and `--threshold 3`
3. If neither `fillColor` nor `borderColor` exists → flag: "Unable to determine element color — verify ≥3:1 manually"
4. Script returns `pass: true/false` — flag if false

### Tap-out

- `bgColor` or `parentBgColor` is `"unable to determine"` → flag: "Unable to determine background"
- Any color is `"gradient"` or `"image"` → flag: "Unable to calculate contrast — review manually"
- Do NOT compute contrast for unresolved colors

---

## Output

Return results as a structured list:

```
passes:
  - "1.4.3: All N text elements meet contrast minimums"
  - "1.4.11: All N interactive elements meet contrast minimums"

flags:
  - criterion: "1.4.3"
    nodeId: "<nodeId>"
    nodeName: "<nodeName>"
    issue: "Contrast <ratio>:1 — needs ≥<threshold>:1. Text <fgColor> on bg <bgColor>"

  - criterion: "1.4.11"
    nodeId: "<nodeId>"
    nodeName: "<nodeName>"
    issue: "Border contrast <ratio>:1 — needs ≥3:1. Border <borderColor> on bg <parentBgColor>"

  - criterion: "1.4.11"
    nodeId: "<nodeId>"
    nodeName: "<nodeName>"
    issue: "Unable to determine element color — verify ≥3:1 manually"
```

- One entry per element, not per criterion
- Passes summarized per criterion if ALL elements pass that criterion
- Flags must include nodeId, nodeName, calculated ratio, and required threshold
