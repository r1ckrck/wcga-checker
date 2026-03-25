# WCGA Figma Accessibility Tester

## Project Goal
Build a Claude Code skill that audits Figma designs for WCGA 2.1 Level AA accessibility compliance.

## What We're Building
A **Skill** (reusable Claude Code capability) that:
- Contains structured WCGA 2.1 AA design guidelines
- Uses the Figma MCP to analyze Figma designs
- Tests designs against AA standards
- Reports violations and recommendations
- Can be invoked via `/wcga-checker [figma-file]` by CLI agents
- Supports both Figma Remote MCP and Figma Desktop MCP
- Only accepts Figma MCP connections—reject image screenshots

## Project Structure
```
wcga-checker/
├── CLAUDE.md                    (project context)
├── SKILL.md                     (main skill instructions)
├── docs/
│   ├── wcag/
│   │   ├── wcag-full.md         (complete WCAG 2.1 reference)
│   │   ├── wcag-figma.md        (figma stage WCAG 2.1 reference)
│   │   ├── wcag-figma-AA.md     (figma stage AA criteria)
│   │   └── wcag-figma-AA-MCP.md (AA criteria sorted by test category)
│   ├── figma-integration.md     (Figma MCP tools + actual output formats)
│   ├── analysis-logic.md        (per-criterion test logic for 9 Component Inspect tests)
│   ├── testing-workflow.md      (end-to-end workflow: validate → collect → parse → test → output)
│   └── audit-format.md          (output format spec)
├── scripts/
│   ├── contrast-ratio.py        (WCAG contrast ratio calculator)
│   └── text-spacing-check.py    (WCAG text spacing validator)
└── agents/
    ├── contrast-agent.md        (1.4.3, 1.4.11 — runs contrast script)
    ├── typography-agent.md      (1.4.12, 1.4.5 — runs spacing script + image-of-text check)
    ├── variant-agent.md         (1.4.1, 2.4.7, 3.3.1, 3.3.2, 3.3.3 — variant/form analysis)
    └── visual-review-agent.md   (subjective screenshot analysis)
```

## Build Approach
**Step-by-step, systematic construction:**
1. Understand WCGA 2.1 and find related documents
2. Create a document to store all WCGA guidlines (wcag-full.md)
3. Filter relevant guidlines that applicable at a figma stage (wcag-figma.md)
4. Filter out AA guidlines. (wcag-figma-AA.md)
5. Categories whats possible via MCP and what needs additional work. (wcag-figma-AA-MCP.md)
6. Document Figma MCP integration methods (figma-integration.md)
7. Create analysis logic (analysis-logic.md)
8. Create testing workflow (testing-workflow.md)
9. Create any helper scripts (helpers/)
10. Create analysis format (audit-format.md)
11. Create a command to show things that needs to be tested manually.
12. Create a command to show things that needs to be tested at a page level.
13. Create a command to show things that needs to be tested at a journey level.
14. Create a command to show things that needs to be tested after figma stage.
14. Define skill structure & SKILL.md template (SKILL.md)
15. Test and refine

## Notes
- Maintain token efficiency without sacrificing function or detail
- Keep everything well structured and well formatted