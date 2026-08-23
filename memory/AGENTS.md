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
When a request is ambiguous, under-specified, or could reasonably go more than one way,
**ask the user for clarification before acting — do not guess and build on assumptions.**
A short clarifying question is cheaper than a long, wrong implementation.

Prefer asking before:
- starting multi-step implementations or refactors,
- making irreversible or hard-to-undo changes (deletes, force-pushes, migrations, schema changes),
- choosing between meaningfully different approaches or scopes,
- guessing which file, API, dependency, or convention the user actually means.

How to ask well:
- Be specific and crisp; offer 2–4 concrete options when it helps the user decide.
- State your assumption and the cost of getting it wrong, then let the user confirm.
- Ask the fewest questions that unblock the next step — don't interrogate.

### Restate before acting
Before any large or irreversible step, briefly echo your understanding first:
"I'm about to <do X> because I think you mean <Y> — correct me if I've got it wrong."
This catches misreads early, before effort is sunk into the wrong path.

### Examples
- User: "add auth." → Guessing JWT vs session vs OAuth is a rabbit hole. Ask:
  "Which auth model — session cookies, JWT, or OAuth/OIDC?"
- User: "speed up the build." → Don't blindly rewrite the hottest module. Restate scope:
  "By 'speed up', do you mean local dev compile, CI, or the produced binary?"
- User: "use the new API." → Ambiguous which client/version. Restate: "I'll wire
  OrderService v2 (the only 'new' one I see) — confirm?"

### If the user is unreachable
Asking must never deadlock background or long-running work. If you cannot get an answer
(and the step is safe to attempt), proceed using the **least-destructive, most-reversible**
option and clearly record the assumption you made, so the user can correct it later.
Prefer: reversible over irreversible, additive over mutating, narrow over broad.

It is fine to proceed without asking when the step is cheap, reversible, and low-risk,
or when the user has already specified the intent clearly. Asking is not "blocking" —
it is a quick question, not an open-ended wait.

## File search (fff)
For any file search or grep in the current git-indexed directory, prefer the fff MCP
tools (`ffgrep`, `fffind`, `fff-multi-grep`) over shell `grep`/`ripgrep`. Load the
`fff` skill for install/registration details.

## Using skills
When a task matches a vendored skill, load it via the client's skill mechanism
**before** responding or taking action.
