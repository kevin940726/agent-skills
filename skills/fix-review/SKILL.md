---
name: fix-review
description: Apply findings from a code-review report. Fix findings that are cheap, safe, and either important or subtractive. Propose important but risky fixes instead of applying them. Use when the user asks to fix review findings, apply review feedback, or when the ready pipeline calls it.
license: MIT
---

# Fix review

Apply findings from a review without turning the fix pass into a rewrite. Run
this only when the user asks to fix review findings or the `ready` skill calls
it.

## Input

Use the most recent `code-review` report in context. If there is no report,
stop and run `code-review` first. Use the same scope as the report. Do not widen
it.

## Verify first

A review finding is a hypothesis. For each finding, reproduce it or cite the
exact code path and failure mode. Drop a finding you cannot verify, and say why.
A style preference is not a failure mode.

## Classify

Mark each verified finding:

- **Cheap**: at most two files, at most 30 changed lines, and no public API,
  schema, migration, or dependency change.
- **Safe**: behavior-preserving by construction, or a test fails before the fix
  and passes after it. A green suite alone is not proof, because it may not
  cover the change.
- **Important**: a concrete correctness, security, or data-loss failure. Naming,
  style, and preference are not important.
- **Structural**: the fix deletes code or encodes a documented repository rule in
  a type, test, or lint check.

## Lanes

| Lane | Condition | Action |
|---|---|---|
| Auto-fix | cheap AND safe AND (important OR structural) | Change the code now. |
| Propose | important AND NOT (cheap AND safe) | Write a patch or a precise proposal with a reproduction. Do not change the working tree. |
| Defer | everything else | Report the finding and the missing condition. |

An important fix that is neither cheap nor safe is a new untested change.
Applying it silently invalidates the review that found it. The next reader
cannot tell a verified fix from a guess. Put it in the propose lane instead.

A safe and cheap fix that is neither important nor structural is churn. It
adds diff, merge conflicts, and review noise without removing a failure or
enforcing a rule. Defer it.

## Apply

- Fix the smallest root cause. Do not add a guard for the symptom.
- Keep one concern per commit or patch.
- Stop at 10 auto-fixes or 50 changed lines, whichever comes first. Report the
  rest.
- If a fix stops being safe while you apply it, move it to the propose lane.

## Verify

Run the narrowest test that covers each batch. If a fix changes behavior, it is
not safe. Move it to propose, or add the test that proves the behavior.

After any behavioral fix, the original review is stale. Ask for a re-review of
the final tree before you call the change ready.

## Report

Use this table:

| Finding | Evidence | Lane | Action | Proof |
|---|---|---|---|---|

Then list:

- Fixed: the finding, the change, and the test.
- Proposed: the finding, the reproduction, the patch location, and why it is not
  safe or cheap.
- Deferred: the finding and the missing condition.
- Re-review: needed or not, and why.

Do not claim a fix without a test or a direct check.
