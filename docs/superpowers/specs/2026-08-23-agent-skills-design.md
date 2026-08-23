# Design: Personal Agent Skills Repo (`agents-skills`)

- **Date:** 2026-08-23
- **Status:** Implemented (curated kit vendored; installers + docs written)

## Goal
A portable, version-controlled skills root the user can `git clone` + symlink on any
machine (macOS + Windows). Replaces scattered global skills with a curated, offline kit.

## Locked decisions
- **Distribution:** `git clone` + symlink into `~/.agents` (generic, not client-specific).
- **Target dir:** `~/.agents/skills`, `~/.agents/AGENTS.md`.
- **Skill sourcing:** VENDORED COPIES (self-contained, offline).
- **Repo name:** `agents-skills` (name collisions are not a concern).
- **Excluded:** superpowers pack (all of it), ALL backend (Supabase),
  `bara-ui` (app-specific, kept local only), and the custom Rust instruction (`rust-skills.md`).

## Curated kit philosophy
A personal-development kit that swaps the superpowers pack for
`mattpocock` / `anthropics` / `vercel` / `shadcn` equivalents, plus the user's own
custom skills (caveman, compress, karpathy-guidelines, research, grill-*).

## Final curated kit (vendored)
| Group | Skills (source) |
|-------|-----------------|
| Planning/process | mattpocock: to-spec, to-tickets (kit "to-issues"), prototype, implement, wayfinder, wizard |
| Debugging/triage | mattpocock: diagnosing-bugs (kit "diagnose"), triage |
| Testing/review | mattpocock: tdd, code-review |
| Architecture | mattpocock: improve-codebase-architecture, codebase-design, domain-modeling |
| Git safety | mattpocock: resolving-merge-conflicts, setup-pre-commit |
| Web/UI | web-app-design, windows-app-design (local); anthropics frontend-design; vercel vercel-react-best-practices, vercel-react-native-skills; shadcn shadcn |
| Research | research, research-add-fields, research-add-items, research-deep, research-report (local) |
| Knowledge/compress | caveman, compress, karpathy-guidelines, handoff (mattpocock) |
| Grill | grill-me, grill-with-docs, grilling, wait-what (mattpocock) |
| Authoring | anthropics skill-creator (kit "write-a-skill"); find-skills |
| File search (MCP) | fff (fff-mcp file-search server; replaces grep/ripgrep for agents) |
| Agent behavior | ask-clarify (clarify-before-acting procedure: restate intent, offer options, safe fallback) |
| Global memory | memory/AGENTS.md (wires never-block + clarify-before-acting rules) |

> Note: `handoff` here = mattpocock/skills handoff (knowledge/compress group), **not** the
> superpowers handoff (which is excluded). The custom Rust instruction (`rust-skills.md`)
> was originally planned but is **excluded** at the user's request.

## Repo layout
```
agents-skills/
├── README.md
├── LICENSE                       # MIT
├── install.sh                    # POSIX: Mac + Git Bash (ln -s, idempotent)
├── install.ps1                   # PowerShell: Windows native (mklink/junction, copy fallback)
├── skills/                       # vendored skills, one folder each (36 total)
├── memory/AGENTS.md
└── docs/superpowers/specs/       # this design doc
```

## Installer behavior
- Symlink `skills/*` → `~/.agents/skills/<name>` (fallback copy if symlinks unsupported).
- Symlink `memory/AGENTS.md` → `~/.agents/AGENTS.md`.
- Idempotent: re-run relinks/updates, no duplicates.

## Naming deviations from the original kit list
The locked kit list referenced a few names with no separate upstream skill. Resolved by
vendoring the closest equivalent and documenting the mapping in the README:
- `to-issues` → `to-tickets` (mattpocock names it `to-tickets`)
- `diagnose` → `diagnosing-bugs`
- `write-a-skill` → `skill-creator` (anthropics)
- `to-prd` → omitted (no upstream equivalent found in mattpocock/skills)
- `rust-skills.md` → omitted (custom Rust instruction, excluded at user's request)

## Open items
- The legacy `C:\Users\User\work\skills` directory (now empty) remains locked by the
  original opencode session; delete it after relaunching the session in `agents-skills`.
- `npx skills` is NOT required — this is a pure symlink model.
