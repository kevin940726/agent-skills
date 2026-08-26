---
name: kit-setup
description: Set up the agent-skills kit after installing it — merge the kit's always-on conventions into your agent's global memory (AGENTS.md / CLAUDE.md). Load when the user installs or updates this kit, asks to "set up agent-skills" or "wire in the kit rules", or wants behaviors like fff search, clarify-before-acting, no-slop prose, or the security merge gate applied globally.
license: MIT
---

# Wire kit conventions into agent memory

This kit ships two layers. **Skills** load on demand, triggered by their
descriptions. **Conventions** (`AGENTS.md` beside this file) are always-on
defaults that apply to every task — they only work once merged into the
client's global memory file.

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
