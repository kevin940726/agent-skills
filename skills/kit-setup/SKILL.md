---
name: kit-setup
description: Merge kevin940726/agent-skills conventions into client memory. Load on "Set up kevin940726/agent-skills", on installing or updating that repo, or when asked to add its rules (fff search, no-slop, security gate) to AGENTS.md / CLAUDE.md.
license: MIT
---

# Wire kit conventions into agent memory

The kit ships always-on **conventions** (`AGENTS.md` beside this file); they
take effect only once merged into each client's memory file. Installing stays
the user's job; this skill handles everything after.

## Procedure
1. **Read the source.** Open `AGENTS.md` next to this SKILL.md.
2. **Infer installed clients.** Scan global skill directories for folders unique
   to this kit (`kit-setup`, `ask-clarify`, `web-first`): opencode
   `~/.config/opencode/skills`, Claude Code `~/.claude/skills`, Codex
   `~/.codex/skills`, Gemini `~/.gemini/skills`, plus shared `~/.agents/skills`.
   Each hit maps to that client's memory file: `~/.config/opencode/AGENTS.md`,
   `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`.
3. **Mark each convention _covered_ or _missing_.** Search the target memory
   file for a rule already covering the same behavior — match on intent, not
   wording ("Ask before risky actions" covers "Clarify before acting"). Missing
   ones append as one-liners pointing at their skill; the skill carries the how-to.
4. **Show, then write.** Report per file: appended, _covered_, and near-misses
   worth discussing. Write only after an explicit yes to the diff.

*Done when* every convention is _covered_ or appended in every detected memory
file, with the user's approval.

## Nothing installed?
Zero kit folders across all scanned directories means the kit isn't here yet —
have the user run `npx skills add kevin940726/agent-skills`, then retry.
