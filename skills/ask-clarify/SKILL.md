---
name: ask-clarify
description: Use this skill whenever you are about to act on an ambiguous, under-specified, or risky request, or choose between divergent approaches, instead of guessing. Provides a procedure for clarifying with the user (restate intent, offer options, state assumptions/cost) and a safe fallback when the user is unreachable.
---

# Ask, don't guess

Load this skill when a task could go more than one way, the user's intent is unclear,
or the action is multi-step / irreversible. The global memory rule "Clarify before
acting" is always on; this skill is the how-to.

## When to clarify (not guess)
- Ambiguous or under-specified requests.
- Before multi-step implementations, refactors, or migrations.
- Before irreversible changes: deletes, force-push, schema/migration, config affecting others.
- When choosing between meaningfully different approaches or scopes.
- When you'd have to guess which file / API / dependency / convention the user means.

## Procedure
1. **Restate.** Echo your understanding: "I'm about to <X> because I think you mean <Y>."
2. **Offer options.** Give 2–4 concrete choices when it helps the user decide quickly.
3. **State the assumption + cost.** "If I guess wrong, I'll have rebuilt the wrong module."
4. **Ask the minimum.** One or two questions that unblock the next step — don't interrogate.
5. **Confirm before destructive steps.** Explicit yes before anything hard to undo.

## Examples
- "add auth" → ask: session cookies, JWT, or OAuth/OIDC?
- "speed up the build" → restate scope: local dev compile, CI, or produced binary?
- "use the new API" → restate: "OrderService v2 — confirm?"

## If the user is unreachable
Never let clarifying questions deadlock background or long-running work. If you must
proceed without an answer, pick the **least-destructive, most-reversible** option and
record the assumption prominently so it can be corrected later. Prefer: reversible over
irreversible, additive over mutating, narrow over broad. Asking is not "blocking" — it is
a quick question, not an open-ended wait.
