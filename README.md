# agent-skills

This repo holds a personal set of agent skills. It stores third-party skills
as pointers in `skills-lock.json` (52 entries). Thirteen skills live here as files.
Ten are custom, one is derived from upstream, and two have no installable upstream.

Works with Claude Code, opencode, Codex, Cursor, Copilot, Gemini, and any
client supported by the [Agent Skills CLI](https://github.com/vercel-labs/skills).

# Install

Paste this to your agent:

```
Fetch https://raw.githubusercontent.com/kevin940726/agent-skills/main/INSTALL.md and follow it.
```

Always global scope. Project installs are unsupported. By default each source
group runs an interactive per-skill picker (no auto-accept). Add --all to install
every curated skill without prompts.

For consumers: nothing auto-installs. Follow the same script and pick what
you want; for updates run `npx skills update -g` and review results.

OpenCode 2 users can optionally run
`node scripts/sync-opencode-commands.mjs` after installing. It writes shallow
slash-command wrappers so explicit-only skills such as `arena` and skills that
opt in with `metadata["opencode/slash"]` such as `fix-review` are visible in
OpenCode's command interface without changing the skill files.

See [INSTALL.md](INSTALL.md) for the full process, conventions merge, and
maintainer-vs-consumer notes.

## Layout

```
agent-skills/
├── skills-lock.json          # 52 third-party skills: source + hash each (curated manifest)
├── skills/                   # 13 local skills (no installable upstream)
├── conventions/AGENTS.md     # always-on rules, merged per INSTALL.md
├── scripts/sync-skills.mjs   # global installer (interactive | --all)
├── scripts/sync-opencode-commands.mjs # optional OpenCode command wrappers
├── scripts/sync-tech-doc-zh-tw.mjs # regenerate tech-doc-zh-tw from its pin
├── INSTALL.md                # install instructions
└── packages/                 # agent-specific settings, consumed elsewhere
    └── go-usage/             # OpenCode TUI plugin, installed from GitHub
```

## Two layers

- **Skills** load on demand — their descriptions decide when. Third-party
  ones resolve from the lock; local ones are committed files.
- **Conventions** (`conventions/AGENTS.md`) are always-on defaults that
  apply to every task. They only take effect once merged into client memory
  (INSTALL.md step), which skills alone never do.

## 🧩 Local skills

| Skill | What it does (one line) | Provenance |
|-------|-------------------------|------------|
| `ask-clarify` | Clarify before acting; also loads on pushback and question-mark prompts. | custom |
| `bilingual` | Handle EN/Traditional Chinese code-switched prompts with inline gloss. | custom |
| `changelog` | Generate release notes from git history, grouped by type and linked. | custom |
| `docs` | Write/update README, API reference, JSDoc; example-driven, no-slop. | custom |
| `fff` | fff-mcp file-search setup; prefer over grep/ripgrep for agents. | custom-written, upstream has no `SKILL.md` |
| `fix-review` | Triage review findings: auto-fix cheap and safe, propose risky important fixes. | custom |
| `rabbit-hole` | Watch for scope creep; check prior art before going deeper. | custom |
| `ready` | Clean, review, fix safe findings, and verify a change before merge. | custom |
| `security-review` | Pre-merge vuln gate (secrets, injection, authz, XSS, CVEs). | custom |
| `tech-doc-zh-tw` | Traditional Chinese (Taiwan) technical-writing rules; delegates Simplified conversion to `zh-tw-convert`. | derived from `Fenng/tech-doc-style-chinese`, MIT |
| `web-app-design` | Modern web interface guidelines (Vercel). | distilled from upstream `command.md`; not installable |
| `web-first` | Check the web for prior art before building custom code. | custom |
| `zh-tw-convert` | Convert Simplified Chinese docs and skills to Taiwan Traditional with OpenCC; preserves code, URLs, and identifiers. | custom; glossary adapted from the oil-ui zh-TW port |

### Skill dependencies

| Skill | Needs |
|---|---|
| `tech-doc-zh-tw` | `zh-tw-convert` for Simplified Chinese source |
| `zh-tw-convert` | OpenCC 1.x (tested with 1.4.2) with `s2twp.json` on PATH, or `OPENCC_BIN` |

## 🔗 Locked skills

Grouped by source repo. Two local names differ from upstream:
`compress` → `caveman-compress`, `no-slop` → `unslop` (poteto/noodle).

- [mattpocock/skills](https://github.com/mattpocock/skills) — 27: planning, debugging, architecture, grill, writing, triage set
- [backnotprop/pstack](https://github.com/backnotprop/pstack) — 10: `architect`, `arena`, `bro`, `create-verification-skill`, `figure-it-out`, `how`, `no-comments`, `principle-fix-root-causes`, `principle-redesign-from-first-principles`, `why`
- [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) — 5: `vercel-composition-patterns`, `vercel-react-best-practices`, `vercel-react-native-skills`, `vercel-react-view-transitions`, `web-design-guidelines`
- [anthropics/skills](https://github.com/anthropics/skills) — 2: `frontend-design`, `skill-creator` (Apache-2.0)
- [shadcn-ui/ui](https://github.com/shadcn-ui/ui) — 2: `shadcn`, `migrate-radix-to-base`
- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) — 2: `caveman`, `caveman-compress`
- [anomalyco/opentui](https://github.com/anomalyco/opentui) — 1: `opentui`
- [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) — 1: `karpathy-guidelines`
- [0xpili/simplified-technical-english](https://github.com/0xpili/simplified-technical-english) — 1: `simplified-technical-english`
- [poteto/noodle](https://github.com/poteto/noodle) — 1: `unslop` (Remove AI writing patterns from prose)

## Client plugins

Skills are agent-agnostic. Plugins are not: there is no cross-client plugin
discovery, so anything under `packages/` targets one client and says so in its
path.

**[`go-usage`](packages/go-usage/)**, an OpenCode TUI plugin showing OpenCode Go
usage against the rolling 5-hour, weekly, and monthly windows. It reuses the
credential OpenCode already holds from `/connect`, so there is no extra API key
to manage.

`opencode plugin add` cannot install a subdirectory of a larger repository, so
this one is registered by path instead. See
[its install notes](packages/go-usage/README.md#install) for the working steps
and the reason the obvious command fails.

This repo is where it is developed and tracked, not where it is consumed. There
is deliberately no plugin registration in the repo root config: a registration
here and one in your global config would both declare the id `go-usage`, and the
second to load fails while the first keeps serving silently. Register the local
path in your global config instead, so the checkout you are editing is the one
that runs.

## 🔒 Security audits

The Agent Skills CLI runs third-party scans (Gen Agent Trust Hub, Socket, Snyk)
during install. Known flags and why they're accepted:

- `caveman-compress`, `skill-creator` — LOW-severity Socket anomalies (no malware found):
  `caveman-compress` pipes file text to a local `claude` call, so run it only on non-secret
  files; `skill-creator`'s eval viewer renders local eval artifacts as HTML.
- `fff` — flags the upstream `curl | bash` installer, now documented in its
  `INSTALLATION.md`; the skill leads with Homebrew / GitHub Releases instead.
- `web-first`, `research`, `triage`, and similar — Snyk "medium" for reading
  third-party web/repo content at runtime; inherent to what those skills do.

## License

MIT.
