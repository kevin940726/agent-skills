# Personal Agents — Global Memory (AGENTS.md)

This file is symlinked into `~/.agents/AGENTS.md` by the `agents-skills` installer.
It wires project-wide conventions for any agent client that reads `~/.agents/AGENTS.md`.

## What this repo is
`agents-skills` is a version-controlled, portable kit of curated agent skills.
Skills live in `skills/<name>/` and are symlinked (or copied) into `~/.agents/skills/`.
Deliberately **excluded**: the superpowers pack, any backend (Supabase) skills, and
app-specific skills such as `bara-ui`.

## NEVER BLOCK THE USER
- Do NOT make the user wait on something that will never finish (servers, REPLs,
  `while True` loops, open-ended waits). For a long-running observer, run it as a
  background process and ask the user to tell you when it is done.
- If you need a decision, a hint, or an in-game action from the user, just **ASK**.
  Do not spin waiting for it.

## Custom instructions
- **Rust**: include `instructions/rust-skills.md` (vendored). It sets Cargo.toml
  defaults (edition 2024, rust-version 1.85, `lints`) and routes Rust questions
  through the rust-skills workflow.

## `/graphify`-style trigger
The user uses a `/graphify` convention (any input → knowledge graph) that is
maintained separately in `~/.claude/skills/graphify`. When the user types
`/graphify`, invoke that skill before doing anything else. (This kit does not
vendor graphify; it is referenced here for convention continuity.)

## Using skills
When a task matches a vendored skill, load it via the client's skill mechanism
**before** responding or taking action.
