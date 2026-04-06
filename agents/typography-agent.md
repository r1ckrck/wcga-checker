# Typography Agent

---

## Input

You receive `TextElement[]` and `ImageElement[]` per the data schemas in `docs/testing-workflow.md`.

Key fields used: `fontSize`, `lineHeight` (number, `"auto"`, or null), `letterSpacing` (number or null), `paragraphSpacing` (number or null), `isSingleLine` (boolean). Null means unable to determine — pass as omitted to the script. `"auto"` means no fixed constraint is set — automatic pass, do not test or flag.

---

## Process

### For each text element → 1.4.12

**Build script arguments:**
- Always pass: `--font-size <fontSize>`
- If `lineHeight` is a number → pass `--line-height <lineHeight>`
- If `lineHeight` is `"auto"` → skip (automatic pass)
- If `lineHeight` is null → omit (will be flagged as unable to determine)
- If `letterSpacing` is not null → pass `--letter-spacing <letterSpacing>`
- If `isSingleLine` is true → pass `--single-line`
- If `isSingleLine` is false and `paragraphSpacing` is not null → pass `--paragraph-spacing <paragraphSpacing>`

Run `scripts/text-spacing-check.py` with the assembled arguments.

The script checks:
| Property | Required minimum |
|----------|-----------------|
| Line height | ≥ 1.5 × fontSize |
| Letter spacing | ≥ 0.12 × fontSize |
| Paragraph spacing | ≥ 2 × fontSize (multi-paragraph only) |
| Word spacing | ≥ 0.16 × fontSize (if available) |

- Property omitted from args → script reports "not set → unknown" → flag as "Unable to determine"
- Property is 0 and minimum is > 0 → flag with actual vs required values

### For each image element → 1.4.5

1. If `isExempt` is true → pass (logotype exception)
2. If `width` > 50px AND `height` > 20px → plausibly text-sized → flag: "Image node may contain text — verify it uses real text layers"
3. If `nodeName` contains `text`, `heading`, `title`, `label`, `copy` → stronger signal → flag
4. Otherwise → pass

### Tap-out

- Missing property → flag that property only, still test the rest
- Do NOT skip the entire element if one property is missing

---

## Output

```
passes:
  - "1.4.12: All N text elements meet spacing minimums"
  - "1.4.5: No image-of-text detected (N logos exempted)"

flags:
  - criterion: "1.4.12"
    nodeId: "<nodeId>"
    nodeName: "<nodeName>"
    issue: "Letter spacing <actual>px (needs ≥<required>px for <fontSize>px text)"

  - criterion: "1.4.12"
    nodeId: "<nodeId>"
    nodeName: "<nodeName>"
    issue: "Line height — unable to determine"

  - criterion: "1.4.5"
    nodeId: "<nodeId>"
    nodeName: "<nodeName>"
    issue: "Image node (<w>×<h>) — verify uses real text layers, not rasterized text"
```

- One entry per element per failing property (a text element can have multiple flags)
- Include actual value and required value in every flag
