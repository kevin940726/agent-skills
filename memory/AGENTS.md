# Global Agent Memory (AGENTS.md)

Optional global agent memory. Copy (or symlink) this to `~/.agents/AGENTS.md`
to wire the kit's conventions into any agent client that reads it. Edit the
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
Question/impl needs current, authoritative, version-specific info (lib/API usage, best practices, "latest"/"most popular" compare, open-ended): search web for most popular + latest battle-tested sources before answer/code. Load `web-first` skill. Present as cited list/table. Skip only stable facts you certain about.

## Gate merges on security
Before merging or pushing a branch that touches auth, data, or the network, load `security-review` and act on its verdict.

## Using skills
Task match vendored skill: load via client skill mechanism before respond/act.
