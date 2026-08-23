# Personal Agents — Global Memory (AGENTS.md)

This file is symlinked into `~/.agents/AGENTS.md` by the `agents-skills` installer.
It wires project-wide conventions for any agent client that reads `~/.agents/AGENTS.md`.

## What this repo is
`agents-skills` is a version-controlled, portable kit of curated agent skills.
Skills live in `skills/<name>/` and are symlinked (or copied) into `~/.agents/skills/`.
Deliberately **excluded**: the superpowers pack, any backend (Supabase) skills,
app-specific skills such as `bara-ui`, and the custom Rust instruction (`rust-skills.md`).

## NEVER BLOCK THE USER
- Do NOT make the user wait on something that will never finish (servers, REPLs,
  `while True` loops, open-ended waits). For a long-running observer, run it as a
  background process and ask the user to tell you when it is done.
- If you need a decision, a hint, or an in-game action from the user, just **ASK**.
  Do not spin waiting for it.

## Clarify before acting
When a request is ambiguous or risky, **ask instead of guessing** — don't build on
assumptions. Before large or irreversible steps, restate your understanding and confirm;
if you can't reach the user, take the least-destructive, most-reversible option and note
the assumption. Full procedure and examples: load the `ask-clarify` skill.

## File search (fff)
For any file search or grep in the current git-indexed directory, prefer the fff MCP
tools (`ffgrep`, `fffind`, `fff-multi-grep`) over shell `grep`/`ripgrep`. Load the
`fff` skill for install/registration details.

## Write without AI slop
For any prose you produce (chat replies, summaries, docs, emails, commit/PR text), apply
the `no-slop` skill: no em-dashes, filler phrases, intensifiers, hollow claims, or
clickbait headings. Prefer a concrete detail over a generic one. This applies to your own
replies too.

## Using skills
When a task matches a vendored skill, load it via the client's skill mechanism
**before** responding or taking action.
