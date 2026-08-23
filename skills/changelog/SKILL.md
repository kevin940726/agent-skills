---
name: changelog
description: Generate or update a changelog from git history. Load this skill when cutting a release, writing release notes, or asked for "what changed". Group commits by type (feat/fix/refactor/docs), link to commits or PRs, and write clean, specific entries that obey the no-slop rules.
---

# Changelog from git history

Load this skill when you cut a release, write release notes, or the user asks "what changed
since <tag or date>". It turns raw `git log` into a reader-facing changelog: grouped, linked,
and free of filler.

## When to run
- Before tagging a release or publishing.
- When the user asks for release notes or a changelog section.
- After a stint to summarize delivered work.

## Procedure
1. **Bound the range.** Take the commits since the last tag, release branch, or a date the
   user gives. Default to `git log <last-tag>..HEAD`.
2. **Group by intent.** Sort entries into Features, Fixes, Refactors, Docs, Chores, Breaking.
   Read the conventional-commit prefix (feat/fix/refactor/docs/chore) when present; otherwise
   infer from the message and diff.
3. **Write one line per change.** State the user-visible effect, not the commit subject
   verbatim. "Add CSV export to reports" beats "implement csv export function".
4. **Link.** Append the short hash or PR number so each entry is traceable.
5. **Surface breaking changes.** Put anything that requires a user or downstream action under
   a Breaking heading at the top.

## Output shape
```markdown
## 1.4.0 (2026-08-23)

### Breaking
- Drop Node 18 support; requires Node 20+ (#212)

### Features
- CSV export on the reports page (#198)
- Keyboard shortcuts for issue triage (#205)

### Fixes
- Fix token refresh race on slow networks (#203)
```

## Keep it clean
Apply the `no-slop` rules: no filler ("In this release we are pleased to"), no vague verbs
("improve performance" becomes "cut p95 load time from 1.2s to 400ms"). One concrete detail
per line beats three generic ones. Omit chores with no reader impact (dependency bumps with
no behavior change, lint fixes) unless the user wants them.
