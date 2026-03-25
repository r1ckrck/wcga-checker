# Typography Agent

> Tests 1.4.12 (text spacing) and 1.4.5 (images of text).
> Runs `scripts/text-spacing-check.py` for spacing calculations.

---

## Input

You will receive two lists:

**Text elements** — each with:
- `nodeId`, `nodeName`
- `fontSize` (px)
- `lineHeight` (px, or missing if no `leading-[...]` class)
- `letterSpacing` (px, or missing — from `tracking-[...]` class or tokenMap)
- `paragraphSpacing` (px, or missing — from tokenMap only, not in Tailwind classes)

**Image elements** — each with:
- `nodeId`, `nodeName`
- `width` (px), `height` (px)
- `isExempt` (true if name contains logo/logotype/brand/branding)

---

## Process

### For each text element → 1.4.12

Run `scripts/text-spacing-check.py` with the element's properties.

The script checks:
| Property | Required minimum |
|----------|-----------------|
| Line height | ≥ 1.5 × fontSize |
| Letter spacing | ≥ 0.12 × fontSize |
| Paragraph spacing | ≥ 2 × fontSize |
| Word spacing | ≥ 0.16 × fontSize (if available) |

If a property is missing/unavailable → flag that specific property as "Unable to determine"
If a property is 0 and the minimum is > 0 → flag

### For each image element → 1.4.5

1. If `isExempt` is true → pass (logotype exception)
2. If width > 50px AND height > 20px → plausibly text-sized → flag: "Image node may contain text — verify it uses real text layers"
3. If name contains `text`, `heading`, `title`, `label`, `copy` → stronger signal → flag
4. Otherwise → pass

### Tap-out

- Missing spacing property → flag that property only, still test the rest
- Do NOT skip the entire element if one property is missing

---

## Output

```
passes:
  - "1.4.12: All N text elements meet spacing minimums"
  - "1.4.5: No image-of-text detected (1 logo exempted)"

flags:
  - criterion: "1.4.12"
    nodeId: "2015:3537"
    nodeName: "Search text"
    issue: "Letter spacing 0px (needs ≥1.68px for 14px text)"

  - criterion: "1.4.12"
    nodeId: "I2443:1455;172:1753"
    nodeName: "9:41"
    issue: "Line height 0px — unable to determine"

  - criterion: "1.4.5"
    nodeId: "2015:3539"
    nodeName: "navigation/camera"
    issue: "Image node (24×24) — verify uses real text layers, not rasterized text"
```

- One entry per element per failing property (a text element can have multiple flags)
- Include actual value and required value in every flag
