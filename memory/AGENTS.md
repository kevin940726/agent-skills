# Personal Agents — Global Memory (AGENTS.md)

`agents-skills` installer symlink this to `~/.agents/AGENTS.md`. Wires project-wide conventions for any agent client reading it.

## What this repo is
`agents-skills`: version-controlled portable kit of curated agent skills. Skills in `skills/<name>/`, symlinked/copied to `~/.agents/skills/`.

## NEVER BLOCK THE USER
- No wait on never-finish tasks (servers, REPLs, `while True` loops, open-ended waits). Long observer: run background, ask user to say when done.
- Need decision/hint action: just ASK. No spin wait.

## Clarify before acting
Ambiguous/risky request: ask, don't guess. Don't build on assumptions. Big/irreversible step: restate understanding, confirm. Unreachable: take least-destructive, most-reversible option, note assumption. Full procedure + examples: load `ask-clarify` skill.

## File search (fff)
File search/grep in git-indexed dir: use fff MCP (`ffgrep`, `fffind`, `fff-multi-grep`) over shell `grep`/`ripgrep`. Load `fff` skill for install/registration.

## Write without AI slop
Any prose you output (chat, summaries, docs, emails, commit/PR): apply `no-slop` skill. No em-dashes, filler, intensifiers, hollow claims, clickbait headings. Concrete detail over generic. Applies to your own replies too.

## Fetch before you act
Question/impl needs current, authoritative, version-specific info (lib/API usage, best practices, "latest"/"most popular" compare, open-ended): search web for most popular + latest battle-tested sources before answer/code. Load `web-first` skill. Present as cited list/table. Skip only stable facts you certain about.

## Using skills
Task match vendored skill: load via client skill mechanism before respond/act.
