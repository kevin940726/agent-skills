# agents-skills

A portable, version-controlled kit of curated agent skills. Clone it, run the
installer, and symlink the skills into `~/.agents/skills` so any agent client
(Claude Code, Codex, opencode, Copilot, Gemini) can use them.

## Install

**macOS / Linux / Git Bash (Windows):**
```sh
git clone https://github.com/kevin940726/agent-skills.git agents-skills
cd agents-skills
./install.sh
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/kevin940726/agent-skills.git agents-skills
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
└── memory/AGENTS.md           # global agent memory / guidance
```

## Skill kit

One row per skill. Folder names follow each upstream project's own naming; the
**Source** column points at the provenance for vendored skills and marks our own.

| Skill | Category | What it does (one line) | Source |
|-------|----------|-------------------------|--------|
| `to-spec` | Planning / process | Turn the conversation into a spec and publish it to the issue tracker. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `to-tickets` | Planning / process | Break a plan/spec into tracer-bullet tickets, each declaring its blocking edges. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `prototype` | Planning / process | Build a throwaway prototype to answer a design question (state model or UI). | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `implement` | Planning / process | Build from a spec/tickets, driving TDD and closing with code-review. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `wayfinder` | Planning / process | Plan a large effort as a shared map of decision tickets; resolve one at a time. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `wizard` | Planning / process | Generate an interactive bash wizard for steps only a human can perform. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `diagnosing-bugs` | Debugging / triage | Disciplined loop for hard bugs/regressions (feedback loop, then fix + test). | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `triage` | Debugging / triage | Move issues/PRs through triage roles into agent-ready briefs. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `tdd` | Testing / review | Test-driven development: red-green-refactor, one vertical slice at a time. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `code-review` | Testing / review | Two-axis review (Standards + Spec) of the diff since a fixed point. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `improve-codebase-architecture` | Architecture | Scan for deepening opportunities, show a visual report, grill through one. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `codebase-design` | Architecture | Vocabulary for designing deep modules (behavior behind a small interface). | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `domain-modeling` | Architecture | Build/sharpen a project's domain model (terms, ADRs) in CONTEXT.md. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `resolving-merge-conflicts` | Git safety | Work a merge/rebase conflict hunk by hunk, resolving by intent, never --abort. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `setup-pre-commit` | Git safety | Set up Husky + lint-staged (Prettier), type-check, and tests as pre-commit hooks. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `web-app-design` | Web / UI | Industry-standard modern web interface guidelines (Vercel). | local |
| `frontend-design` | Web / UI | Production-grade UI generation guidance. | [anthropics/skills](https://github.com/anthropics/skills) |
| `vercel-react-best-practices` | Web / UI | React/Next.js performance optimization guidelines from Vercel Engineering. | local |
| `vercel-react-native-skills` | Web / UI | React Native/Expo best practices for performant mobile apps. | local |
| `shadcn` | Web / UI | shadcn/ui expert guidance (CLI, composition, theming, Tailwind). | local |
| `research` | Research | Investigate a question against primary sources; capture findings as a cited Markdown file. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `caveman` | Knowledge / compress | Ultra-compressed communication mode (~75% token saving, full accuracy). | local |
| `compress` | Knowledge / compress | Compress memory files (CLAUDE.md, todos) into caveman format to save tokens. | local |
| `karpathy-guidelines` | Knowledge / compress | Behavioral guidelines to reduce common LLM coding mistakes. | local |
| `handoff` | Knowledge / compress | Compact the conversation into a handoff doc for another agent. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `grill-me` | Grill | Relentless interview to sharpen a plan/design (stateless). | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `grill-with-docs` | Grill | Same interview, plus builds docs (ADRs + glossary) as you go. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `grilling` | Grill | The reusable interview primitive behind grill-me/grill-with-docs/triage. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `wait-what` | Grill | Re-pitch a message that didn't land, with the context the user was missing. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `skill-creator` | Authoring | Create/improve/evaluate agent skills, including evals. | [anthropics/skills](https://github.com/anthropics/skills) |
| `find-skills` | Authoring | Discover and install agent skills for a given need. | local |
| `writing-for-agents` | Writing for agents | Reference for writing docs agents consume (skills, AGENTS.md). | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `to-questionnaire` | Writing for agents | Turn a gap in someone else's head into a questionnaire for them to fill in. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `ask-matt` | Router | User-invoked router; points you at the right skill/flow in this kit. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `security-review` | Quality / shipping | Pre-merge vuln gate (secrets, injection, authz, XSS, CVEs) with cited sources. | custom |
| `changelog` | Quality / shipping | Generate release notes from git history, grouped by type and linked. | custom |
| `docs` | Quality / shipping | Write/update README, API reference, JSDoc; example-driven, no-slop. | custom |
| `fff` | File search (MCP) | fff-mcp file-search server; prefer over grep/ripgrep for agents. | [dmtrKovalenko/fff](https://github.com/dmtrKovalenko/fff) |
| `ask-clarify` | Agent behavior | Clarify with the user before acting instead of guessing. | custom |
| `no-slop` | Writing quality | Anti-slop prose rules: no em-dashes, filler, intensifiers, hollow claims. | custom |
| `web-first` | Agent behavior | Fetch current/authoritative sources before answering; cite as a table. | custom |

## Sourcing
Skills are **vendored copies** (self-contained, offline-capable). Provenance:
- [mattpocock/skills](https://github.com/mattpocock/skills) — planning, debugging, testing, architecture, git, grill, handoff, writing-for-agents, to-questionnaire, ask-matt, research
- [anthropics/skills](https://github.com/anthropics/skills) — `frontend-design`, `skill-creator`
- Local skills — `web-app-design`, `vercel-*`, `shadcn`, `caveman`,
  `compress`, `karpathy-guidelines`, `find-skills`
- Custom (this kit) — `ask-clarify`, `web-first`, `no-slop`, `security-review`, `changelog`, `docs`

## Naming notes
A few kit names had no separate upstream skill; closest equivalents were vendored:
`to-issues → to-tickets`, `diagnose → diagnosing-bugs`, `write-a-skill → skill-creator`.
`to-prd` had no upstream equivalent and was omitted.

## License
MIT.
