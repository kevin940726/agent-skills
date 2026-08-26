---
name: kit-setup
description: Merges the kevin940726/agent-skills kit's always-on conventions into your agent's global memory (AGENTS.md / CLAUDE.md). Load when the user says "Set up kevin940726/agent-skills", installs or updates that GitHub repo, or asks for its rules (fff search, clarify-before-acting, no-slop prose, security merge gate) in global memory.
license: MIT
---

# Wire kit conventions into agent memory

This kit ships two layers. **Skills** load on demand, triggered by their
descriptions. **Conventions** (`AGENTS.md` beside this file) are always-on
defaults that apply to every task — they only work once merged into the
client's global memory file.

## When to run
- After the first install: skills work immediately, conventions apply only once merged.
- After each kit update: changed or new conventions land here first.
- On a new machine or client: the global memory file starts empty.

## If the kit needs installing or updating first
The CLI's skill/agent pickers need an interactive terminal. Run it headless
with flags instead:

```sh
npx skills add kevin940726/agent-skills -y -g --agent opencode
```

Repeat `--agent <slug>` per client (`opencode`, `claude-code`, `codex`, …) and
add `--skill <name>` to take a subset. Humans can drop the flags and use the
interactive picker.

## Procedure
1. **Read the source.** Open `AGENTS.md` next to this SKILL.md.
2. **Find the target.** The client's global memory file: opencode
   `~/.config/opencode/AGENTS.md`; Claude Code `~/.claude/CLAUDE.md`; Codex
   `~/.codex/AGENTS.md`. Create it if missing.
3. **Merge, dedupe first.** Append each convention section that isn't already
   covered. Keep memory entries as one-liners pointing at their skill — the
   skill carries the how-to, memory carries the trigger.
4. **Confirm before writing.** Show the diff and get an explicit yes.

*Done when* every convention lives in the global memory file (or the user declined some).

## Note
Skill descriptions already trigger the detailed workflows (`ask-clarify`,
`web-first`, `no-slop`, `security-review`, …). Memory adds always-on defaults;
don't copy full procedures into it.
