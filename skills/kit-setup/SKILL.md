---
name: kit-setup
description: Merges the kevin940726/agent-skills kit's always-on conventions into your agent's global memory (AGENTS.md / CLAUDE.md). Load when the user says "Set up kevin940726/agent-skills", installs or updates that GitHub repo, or asks for its rules (fff search, clarify-before-acting, no-slop prose, security merge gate) in global memory.
license: MIT
---

# Wire kit conventions into agent memory

Two layers ship with this kit. **Skills** load on demand, triggered by their
descriptions. **Conventions** (`AGENTS.md` beside this file) are always-on
defaults that only take effect once merged into each client's global memory
file. The user runs `npx skills add kevin940726/agent-skills` themselves;
this skill handles everything after install.

## When to run
- After the first install: skills work immediately, conventions apply only once merged.
- After each kit update: changed or new conventions land here first.
- On a new machine or client: the global memory file starts empty.

## Procedure
1. **Read the source.** Open `AGENTS.md` next to this SKILL.md.
2. **Infer installed clients.** Scan each client's global skill directory for
   folders unique to this kit (`kit-setup`, `ask-clarify`, `web-first`):
   opencode `~/.config/opencode/skills`, Claude Code `~/.claude/skills`,
   Codex `~/.codex/skills`, Gemini CLI `~/.gemini/skills`, plus the shared
   `~/.agents/skills`. Each hit maps to that client's memory file:
   `~/.config/opencode/AGENTS.md`, `~/.claude/CLAUDE.md`,
   `~/.codex/AGENTS.md`, `~/.gemini/GEMINI.md`.
3. **Dedupe before appending.** For each convention section, search the target
   memory file for a rule already covering the same behavior — match on intent,
   not wording ("Ask before risky actions" covers "Clarify before acting").
   Append only what has no equivalent, as one-liners pointing at their skill;
   the skill carries the how-to.
4. **Show, then write.** Report per file: appended, skipped-as-covered, and
   near-misses worth discussing. Write only after an explicit yes to the diff.

*Done when* every convention lives in each detected memory file — appended or
already covered — with the user's approval.

## Nothing found?
No kit folders in any scanned directory means the kit isn't installed here.
Tell the user to run `npx skills add kevin940726/agent-skills` first, then retry.
