# agents-skills

A portable, version-controlled kit of curated agent skills. Install it with the
Agent Skills CLI and any agent client (Claude Code, Codex, opencode, Copilot,
Gemini) picks the skills up automatically.

## Install

Install with the Agent Skills CLI (installs into every agent you have: Claude
Code, opencode, Cursor, Codex, Copilot, Gemini, …):

```sh
npx skills add kevin940726/agent-skills
```

The CLI detects your installed agents, lets you pick which skills to take, and
writes each into the correct location. Re-run to update.

Then tell your agent: **"Set up kevin940726/agent-skills."** That prompt loads
the `kit-setup` skill, which merges the kit's always-on conventions (fff search,
clarify-before-acting, no-slop prose, security gate) into your global memory
file — `AGENTS.md` / `CLAUDE.md`. Run it once after installing, again whenever
you update the kit, and on any new machine or client. Agents installing
headless should pass explicit flags (`-y -g --agent <client> --skill <name>…`),
since the CLI's pickers need a terminal and bare `-y` installs every skill.

## Layout
```
agents-skills/
├── README.md
├── LICENSE
└── skills/                    # vendored, self-contained skills
    └── kit-setup/AGENTS.md    # always-on conventions, merged into client memory by kit-setup
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
| `web-app-design` | Web / UI | Industry-standard modern web interface guidelines (Vercel). | [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md) |
| `frontend-design` | Web / UI | Production-grade UI generation guidance. | [anthropics/skills](https://github.com/anthropics/skills) |
| `vercel-react-best-practices` | Web / UI | React/Next.js performance optimization guidelines from Vercel Engineering. | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/SKILL.md) |
| `vercel-react-native-skills` | Web / UI | React Native/Expo best practices for performant mobile apps. | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-native-skills/SKILL.md) |
| `shadcn` | Web / UI | shadcn/ui expert guidance (CLI, composition, theming, Tailwind). | [shadcn-ui/ui](https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md) |
| `research` | Research | Investigate a question against primary sources; capture findings as a cited Markdown file. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `caveman` | Knowledge / compress | Ultra-compressed communication mode (~75% token saving, full accuracy). | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman/blob/main/skills/caveman/SKILL.md) |
| `compress` | Knowledge / compress | Compress memory files (CLAUDE.md, todos) into caveman format to save tokens. | [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman/blob/main/skills/caveman-compress/SKILL.md) |
| `karpathy-guidelines` | Knowledge / compress | Behavioral guidelines to reduce common LLM coding mistakes. | [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills/blob/main/skills/karpathy-guidelines/SKILL.md) |
| `handoff` | Knowledge / compress | Compact the conversation into a handoff doc for another agent. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `grill-me` | Grill | Relentless interview to sharpen a plan/design (stateless). | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `grill-with-docs` | Grill | Same interview, plus builds docs (ADRs + glossary) as you go. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `grilling` | Grill | The reusable interview primitive behind grill-me/grill-with-docs/triage. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `wait-what` | Grill | Re-pitch a message that didn't land, with the context the user was missing. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `skill-creator` | Authoring | Create/improve/evaluate agent skills, including evals. | [anthropics/skills](https://github.com/anthropics/skills) |
| `writing-for-agents` | Writing for agents | Reference for writing docs agents consume (skills, AGENTS.md). | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `to-questionnaire` | Writing for agents | Turn a gap in someone else's head into a questionnaire for them to fill in. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `ask-matt` | Router | User-invoked router; points you at the right skill/flow in this kit. | [mattpocock/skills](https://github.com/mattpocock/skills) |
| `security-review` | Quality / shipping | Pre-merge vuln gate (secrets, injection, authz, XSS, CVEs) with cited sources. | custom |
| `changelog` | Quality / shipping | Generate release notes from git history, grouped by type and linked. | custom |
| `docs` | Quality / shipping | Write/update README, API reference, JSDoc; example-driven, no-slop. | custom |
| `fff` | File search (MCP) | fff-mcp file-search server; prefer over grep/ripgrep for agents. | [dmtrKovalenko/fff](https://github.com/dmtrKovalenko/fff) |
| `ask-clarify` | Agent behavior | Clarify before acting; also loads on pushback ("wait", "but the user…") and question-mark prompts. | custom |
| `kit-setup` | Setup | Merge the kit's always-on conventions into the client's global AGENTS.md / CLAUDE.md. | custom |
| `no-slop` | Writing quality | Anti-slop prose rules: no em-dashes, filler, intensifiers, hollow claims. | [realrossmanngroup/no_ai_slop_writing_rules](https://github.com/realrossmanngroup/no_ai_slop_writing_rules/blob/main/skills/no-ai-slop/SKILL.md) |
| `web-first` | Agent behavior | Before building custom code or stating a best practice, check the web for prior art — don't reinvent; adopt a battle-tested solution. | custom |
| `rabbit-hole` | Agent behavior | Watch for scope creep; check prior art (web-first) and load ask-clarify before going deeper. | custom |

## Sourcing
Skills are **vendored copies** (self-contained, offline-capable). Each skill
folder carries its own `LICENSE` (or `LICENSE.txt`) and a `SOURCE` file noting
upstream provenance. Licenses: MIT (most), Apache-2.0 (anthropics), and `no-slop`
is included with attribution (its upstream specifies no license).

- [mattpocock/skills](https://github.com/mattpocock/skills) — `to-spec`, `to-tickets`, `prototype`, `implement`, `wayfinder`, `wizard`, `diagnosing-bugs`, `triage`, `tdd`, `code-review`, `improve-codebase-architecture`, `codebase-design`, `domain-modeling`, `resolving-merge-conflicts`, `setup-pre-commit`, `research`, `handoff`, `grill-me`, `grill-with-docs`, `grilling`, `wait-what`, `writing-for-agents`, `to-questionnaire`, `ask-matt`
- [anthropics/skills](https://github.com/anthropics/skills) — `frontend-design`, `skill-creator` (Apache-2.0)
- [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) — `vercel-react-best-practices`, `vercel-react-native-skills`
- [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) — `web-app-design`
- [shadcn-ui/ui](https://github.com/shadcn-ui/ui) — `shadcn`
- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) — `caveman`, `compress`
- [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) — `karpathy-guidelines`
- [dmtrKovalenko/fff](https://github.com/dmtrKovalenko/fff) — `fff`
- [realrossmanngroup/no_ai_slop_writing_rules](https://github.com/realrossmanngroup/no_ai_slop_writing_rules) — `no-slop` (upstream specifies no license; included with attribution)
- Custom (this kit, MIT) — `ask-clarify`, `web-first`, `rabbit-hole`, `security-review`, `changelog`, `docs`, `kit-setup`

## Naming notes
A few kit names had no separate upstream skill; closest equivalents were vendored:
`to-issues → to-tickets`, `diagnose → diagnosing-bugs`, `write-a-skill → skill-creator`.
`to-prd` had no upstream equivalent and was omitted.

## Security audits
The Agent Skills CLI runs third-party scans (Gen Agent Trust Hub, Socket, Snyk)
during install; results also live at
[skills.sh/kevin940726/agent-skills](https://skills.sh/kevin940726/agent-skills).
Known flags and why they're accepted:

- `compress`, `skill-creator` — LOW-severity Socket anomalies (no malware found):
  `compress` pipes file text to a local `claude` call, so run it only on non-secret
  files; `skill-creator`'s eval viewer renders local eval artifacts as HTML.
- `fff` — flags the upstream `curl | bash` installer, now documented in its
  `INSTALLATION.md`; the skill leads with Homebrew / GitHub Releases instead.
- `web-first`, `research`, `triage`, and similar — Snyk "medium" for reading
  third-party web/repo content at runtime; inherent to what those skills do.
- Vendored skills inherit their upstream ratings; this kit adds no executable
  code of its own beyond what upstream ships.

## License
MIT.
