---

name: ask-clarify
description: Clarify with the user instead of guessing. Load when a request is ambiguous, under-specified, risky, or could go more than one way; when the user pushes back or corrects (says "wait", "but the user…", "actually", "no I meant"); or when the user's message is a question (has a "?") — restate it and confirm the underlying intent before answering. Trigger even when the user doesn't explicitly ask to clarify.
license: MIT
---

# Clarify before acting

Load this skill when a task could go more than one way, the user's intent is unclear, or
the action is multi-step or irreversible. The global memory rule "Clarify before acting"
is always on; this skill is the how-to.

## When to clarify
- Ambiguous or under-specified requests.
- Before multi-step implementations, refactors, or migrations.
- Before irreversible changes: deletes, force-push, schema/migration, config affecting others.
- When choosing between meaningfully different approaches or scopes.
- When you would have to guess which file, API, dependency, or convention the user means.
- The user pushes back or corrects: "wait", "but the user…", "actually", "no, I meant".
- The user's message is a question (contains "?"): restate it in your own words and confirm intent before answering.

## Procedure
1. **Restate.** Echo your understanding: "I'm about to <X> because I think you mean <Y>."
2. **Offer options.** Give 2–4 concrete choices when it helps the user decide quickly.
3. **State the assumption and its cost.** "If I guess wrong, I'll have rebuilt the wrong module."
4. **Ask the minimum.** One or two questions that unblock the next step.
5. **Confirm before destructive steps.** Get an explicit yes before anything hard to undo.

*Done when* you've restated your understanding and the user confirmed it (or gave explicit go-ahead).

## Examples
- "add auth" → ask: session cookies, JWT, or OAuth/OIDC?
- "speed up the build" → restate scope: local dev compile, CI, or produced binary?
- "use the new API" → restate: "OrderService v2 — confirm?"

## If the user is unreachable
Keep background and long-running work moving. If you must proceed without an answer, pick
the least-destructive, most-reversible option and record the assumption prominently so it
can be corrected later. Prefer reversible over irreversible, additive over mutating, narrow
over broad. Asking is a quick question, not an open-ended wait.
