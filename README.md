# agents-skills

A portable, version-controlled kit of curated agent skills. Clone it, run the
installer, and symlink the skills into `~/.agents/skills` so any agent client
(Claude Code, Codex, opencode, Copilot, Gemini) can use them.

## Install

**macOS / Linux / Git Bash (Windows):**
```sh
git clone <your-fork-url> agents-skills
cd agents-skills
./install.sh
```

**Windows (PowerShell):**
```powershell
git clone <your-fork-url> agents-skills
cd agents-skills
.\install.ps1
```

The installer:
- symlinks `skills/<name>` → `~/.agents/skills/<name>` (falls back to copy where
  symlinks are unsupported, e.g. Windows without Developer Mode),
- symlinks `memory/AGENTS.md` → `~/.agents/AGENTS.md`.
It is idempotent: re-running relinks/updates without creating duplicates.

## Layout
```
agents-skills/
├── README.md
├── LICENSE
├── install.sh                 # POSIX (macOS / Linux / Git Bash)
├── install.ps1                # Windows PowerShell
├── skills/                    # vendored, self-contained skills
├── memory/AGENTS.md           # global memory (never-block rule)
└── docs/superpowers/specs/    # design doc
```

## Skill kit

Folder names follow each upstream project's own naming.

**Planning / process** — `to-spec`, `to-tickets` (kit's "to-issues"), `prototype`, `implement`, `wayfinder`, `wizard`
**Debugging / triage** — `diagnosing-bugs` (kit also listed "diagnose"), `triage`
**Testing / review** — `tdd`, `code-review`
**Architecture** — `improve-codebase-architecture`, `codebase-design`, `domain-modeling`
**Git safety** — `resolving-merge-conflicts`, `setup-pre-commit`
**Web / UI** — `web-app-design`, `windows-app-design`, `frontend-design` (anthropics), `vercel-react-best-practices`, `vercel-react-native-skills`, `shadcn`
**Research** — `research`, `research-add-fields`, `research-add-items`, `research-deep`, `research-report`
**Knowledge / compress** — `caveman`, `compress`, `karpathy-guidelines`, `handoff` (mattpocock handoff)
**Grill** — `grill-me`, `grill-with-docs`, `grilling`, `wait-what`
**Authoring** — `skill-creator` (anthropics; kit also listed "write-a-skill"), `find-skills`
**File search (MCP)** — `fff` (fff-mcp file-search server; replaces grep/ripgrep for agents)

## Sourcing
Skills are **vendored copies** (self-contained, offline-capable). Provenance:
- `mattpocock/skills` — planning, debugging, testing, architecture, git, grill, handoff
- `anthropics/skills` — `frontend-design`, `skill-creator`
- Local personal skills (`~/.claude/skills`, the `bara` project, Codex plugin cache) —
  `web-app-design`, `windows-app-design`, `vercel-*`, `shadcn`, `research*`, `caveman`,
  `compress`, `karpathy-guidelines`, `find-skills`

## Intentionally excluded
superpowers pack, all backend / Supabase skills, `bara-ui` (app-specific),
and the custom Rust instruction (`rust-skills.md`).

## Naming notes
A few kit names had no separate upstream skill; closest equivalents were vendored:
`to-issues → to-tickets`, `diagnose → diagnosing-bugs`, `write-a-skill → skill-creator`.
`to-prd` had no upstream equivalent and was omitted.

## License
MIT.
