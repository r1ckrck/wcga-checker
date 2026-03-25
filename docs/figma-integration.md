# Figma MCP Integration

> Two connection modes. The skill must support both.

---

## Connection Modes

### Figma Desktop MCP
- Runs locally alongside the **Figma desktop app**
- User selects a component/frame in the app → agent reads it directly
- No URL or node ID needed — works off the **current selection**
- Requires Figma desktop running with Dev Mode MCP enabled

### Figma Remote MCP
- User provides a **Figma node URL** (e.g., `https://figma.com/design/<file-key>/<file-name>?node-id=1-2`)
- Agent extracts file key and node ID from the URL to query the API
- Works without the desktop app — fully remote

### Connection Requirement
> The skill **only** accepts Figma MCP connections.
> If a user provides a screenshot or image, reject it and ask for a Figma MCP connection or node URL.

---

## Available Tools (Figma Desktop MCP)

> 6 tools. All accept an optional `nodeId` — if omitted, the **currently selected node** is used.

### Tool Reference

| Tool | Purpose | WCAG Use |
|------|---------|----------|
| `get_design_context` | **Primary tool.** Returns React+Tailwind code with all child nodes, colors, typography, layout. Each node has `data-node-id` and `data-name` attributes. | Core data source for all 9 WCAG checks. |
| `get_metadata` | Returns top-level node only as XML — type (`symbol`/`instance`/`frame`), name, dimensions. **Does not include children.** | Validation only — determine if selection is a component, page, or detached frame. |
| `get_variable_defs` | Returns token name→value map (e.g., `neutrals/white: #ffffff`). | Resolve CSS var references from design context (e.g., `var(--neutrals/white)` → `#ffffff`). |
| `get_screenshot` | Generates a visual screenshot of the node. | Visual classification of ambiguous nodes. Output references. |
| `get_figjam` | Returns FigJam board data. **Only works for FigJam files.** | Not relevant for WCAG audits. |
| `create_design_system_rules` | Generates design system rules prompt for a repo. | Not relevant for WCAG audits. |

### Node ID Handling

All tools accept `nodeId` in these formats:
- **Direct ID:** `"123:456"` or `"123-456"`
- **From URL:** extract from `?node-id=1-2` → use `"1:2"`
- **Branch URLs:** `figma.com/design/:fileKey/branch/:branchKey/:fileName` → use `branchKey` as fileKey
- **Omitted:** uses currently selected node in desktop app

---

## Actual Output Formats

### `get_metadata` → XML (top-level only)

```xml
<instance id="2443:1455" name="header" x="0" y="0" width="375" height="138" />
```

- Returns `<symbol>`, `<instance>`, or `<frame>` tag
- No children — only the selected node itself
- Useful for: node type, name, dimensions

### `get_design_context` → React+Tailwind Code

Returns full component code with all children. Key patterns to extract data from:

```
Backgrounds:    bg-[var(--primary/brand-asset,#002953)]    → class bg-[...]
                bg-[#hex] or bg-[rgba(...)]

Text colors:    text-[color:var(--neutrals/white,white)]   → class text-[color:...]
                text-[rgba(255,255,255,0.4)]

Font size:      text-[length:var(--font_size/body,14px)]   → class text-[length:...]
                text-[14px]

Line height:    leading-[var(--font_size/body-line-height,22px)]  → class leading-[...]

Font weight:    font-['Rubik:Medium',sans-serif]           → from font family string
                font-[var(--body-weight,normal)]

Node identity:  data-node-id="2443:1455"                   → unique node ID
                data-name="search/main"                     → layer name

Images:         <img src={imgVector} />                     → rasterized/vector asset

Structure:      DOM nesting = parent-child relationships
```

- Text content appears as `<p>` tag children (e.g., `<p>Sign in</p>`)
- CSS variables reference tokens that `get_variable_defs` resolves
- Fallback values appear after the comma: `var(--token,fallback)`

### `get_variable_defs` → Token Map (JSON)

```json
{
  "primary/brand-asset": "#002953",
  "neutrals/white": "#ffffff",
  "font_size/body": "14",
  "font_size/body-line-height": "22",
  "primary/body": "Font(family: \"family\", style: body-weight, size: font_size/body, weight: 400, lineHeight: font_size/body-line-height, letterSpacing: 0)",
  "dimensions/corner-radius": "4"
}
```

- Maps token names to resolved values
- Use to resolve `var(--token-name)` references in design context
- Font tokens include composite values with size, weight, line height, letter spacing

### `get_screenshot` → Image

- PNG screenshot of the component as rendered in Figma
- Used for visual classification and output references

