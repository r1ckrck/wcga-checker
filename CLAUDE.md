# WCAG Figma Accessibility Tester

> This folder lives inside `.claude/skills/` when deployed. This CLAUDE.md is for active development only.

## Goal
Build a Claude Code skill that audits Figma designs for WCAG 2.1 Level AA compliance via the Figma MCP. No screenshots—MCP only.

## Project Structure
```
wcga-checker/
├── SKILL.md                     (main skill definition & orchestration)
├── docs/
│   ├── wcag/
│   │   ├── wcag-full.md         (complete WCAG 2.1 reference)
│   │   ├── wcag-figma.md        (criteria applicable at Figma stage)
│   │   ├── wcag-figma-AA.md     (AA criteria only)
│   │   └── wcag-figma-AA-MCP.md (AA criteria by test category)
│   ├── figma-integration.md     (Figma MCP tools + output formats)
│   ├── analysis-logic.md        (per-criterion test logic, 9 Component Inspect tests)
│   ├── testing-workflow.md      (5-phase workflow + all data schemas)
│   └── audit-format.md          (output format spec + example)
├── scripts/
│   ├── contrast-ratio.py        (WCAG contrast ratio calculator)
│   └── text-spacing-check.py    (WCAG text spacing validator)
└── agents/
    ├── contrast-agent.md        (1.4.3, 1.4.11)
    ├── typography-agent.md      (1.4.12, 1.4.5)
    ├── variant-agent.md         (1.4.1, 2.4.7, 3.3.1, 3.3.2, 3.3.3)
    └── visual-review-agent.md   (subjective visual analysis)
```

## Current Status
**Documentation & specs: complete. Implementation: not started.**

| Layer | Status |
|-------|--------|
| WCAG reference docs (`docs/wcag/`) | ✅ Done |
| Figma integration doc | ✅ Done |
| Analysis logic, workflow, audit format | ✅ Done |
| Agent instruction files (4) | ✅ Done |
| Helper scripts (contrast + spacing) | ✅ Done |
| SKILL.md | ✅ Done |
| CLI sub-commands (page / journey / dev) | ❌ Not started |
| End-to-end testing & refinement | ❌ Not started |

## Remaining Build Steps
11. Create `/wcga-page` command — page-level audit instructions
12. Create `/wcga-journey` command — journey-level audit instructions
13. Create `/wcga-dev` command — post-figma / dev-handoff checks
14. Create `/wcga-manual` command — manual-only verification checklist
15. Test and refine against real Figma files

## Notes
- Token-efficient docs without sacrificing accuracy
- All test logic lives in agent files; SKILL.md orchestrates
- Supports both Figma Desktop MCP and Figma Remote MCP
