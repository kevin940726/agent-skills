# Kit conventions (AGENTS.md)

Always-on rules for any agent using this kit. Your agent merges this into its
global memory via the `kit-setup` skill (opencode: `~/.config/opencode/AGENTS.md`,
Claude Code: `~/.claude/CLAUDE.md`, Codex: `~/.codex/AGENTS.md`). Edit the
sections below to match your own defaults.

## What this repo is
`agents-skills`: version-controlled portable kit of curated agent skills. Skills in `skills/<name>/`, installed into `~/.agents/skills/` by the Agent Skills CLI (`npx skills add`).

## Non-blocking by default
- Run never-finish tasks (servers, REPLs, `while True` loops, open-ended waits) in the background; ask the user to say when done. Don't hold their turn.
- When you need a decision or an in-game action, ask — don't spin-wait for it.

## Clarify before acting
Ambiguous/risky request: ask, don't guess. Don't build on assumptions. Big/irreversible step: restate understanding, confirm. Unreachable: take least-destructive, most-reversible option, note assumption. Full procedure + examples: load `ask-clarify` skill.

## File search (fff)
File search/grep in git-indexed dir: use fff MCP (`ffgrep`, `fffind`, `fff-multi-grep`) over shell `grep`/`ripgrep`. Load `fff` skill for install/registration.

## Write without AI slop
Any prose you output (chat, summaries, docs, emails, commit/PR): apply `no-slop` skill. No em-dashes, filler, intensifiers, hollow claims, clickbait headings. Concrete detail over generic. Applies to your own replies too.

## Fetch before you act
Before building custom code or stating a best practice, check the web for prior art and current battle-tested solutions — don't reinvent; adopt. Also confirm version-specific facts (lib/API usage, "latest" comparisons). Load `web-first` skill.

## Gate merges on security
Before merging or pushing a branch that touches auth, data, or the network, load `security-review` and act on its verdict.

## Using skills
Task match vendored skill: load via client skill mechanism before respond/act.
