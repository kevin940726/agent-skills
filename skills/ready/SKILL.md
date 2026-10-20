---
name: ready
description: Prepare a change for review or merge. Clean comments, review, fix safe findings, verify, and report.
license: MIT
disable-model-invocation: true
metadata:
  opencode/autoinvoke: "false"
---

# Ready

Make a change ready for review or merge. Run the stages in order. Do not run
two stages at the same time. Do not widen the scope between stages.

## Scope

Use the caller's argument as the fixed point: a commit, branch, tag, PR, or
path. If the caller gives no argument, use `main` and include the working tree.

Capture one diff command at the start. Pass that same scope to every stage.

## Pipeline

| Stage | Skill | Writes? | Done when |
|---|---|---|---|
| 1. Clean | `no-comments` | yes | It reports the deletion count, restored comments, and fixes. |
| 2. Review | `code-review` | no | The `## Standards` and `## Spec` reports are complete. |
| 3. Fix | `fix-review` | yes | It reports each fixed, proposed, and deferred finding. |
| 4. Verify | `verify` if installed. Otherwise run the narrowest tests and typecheck for the touched packages. | yes | Checks pass, or the failure is reported. |
| 5. Re-review | `code-review` | no | Only if stage 3 applied a behavioral fix. The final tree has a fresh report. |

Rules:

- Run stage 1 before stage 2. The review must read the cleaned diff.
- Delegate by skill name. Do not restate the rules of a skill that you call.
- If `fix-review` is not installed, skip stage 3 and say so. Do not improvise
  fixes from the review report.
- If `no-comments` or `code-review` is missing, stop and print the install
  command. Do not substitute a different workflow.
- To add a stage, add one row and one skill. Keep the order. Do not fold a new
  skill into an existing stage.

## Fix stage

Stage 3 delegates to `fix-review`. Pass the stage 2 report and the same scope.
Do not restate its lanes or its budget here.

## Invocation limits

`no-comments` is user-invoked. Some harnesses, including Claude Code, block a
skill from invoking another user-invoked skill. If stage 1 is blocked, stop and
ask the user to run the `no-comments` skill for the same scope. Resume at stage
2. Do not reimplement its rules.

`code-review` and `fix-review` are model-invoked, so every harness can reach
them.

## Report

Report in this order:

1. Clean: comments deleted, comments restored, fixes, and open constraints.
2. Review: the `## Standards` and `## Spec` sections. Do not merge or rerank
   them.
3. Fix: the fixed, proposed, and deferred findings from `fix-review`.
4. Verify: the commands that ran and the results.
5. Re-review: the fresh report, or a statement that no behavioral fix landed.
6. Open work: anything outside the scope.

Do not claim a finding is fixed without a test or a direct check.
