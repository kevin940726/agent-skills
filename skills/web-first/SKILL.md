---
name: web-first
description: Use this skill whenever a question or implementation needs current, authoritative, or version-specific information — library/API usage, framework how-tos, best practices, "latest" or "most popular" comparisons, or anything you are not certain is still accurate. Always search the web for the most popular and latest battle-tested sources before answering or coding, then present the findings as a cited table with a confidence and version column. Trigger for coding/library questions by default; stay silent for chit-chat and stable facts. Skip only for facts you already know are stable and version-independent.
---

# Fetch before you act

Load this skill when the answer depends on information that may have changed, varies by
version, or comes from a source you should verify rather than guess. Guessing at a library
API or a "best practice" from memory wastes the user's time when a two-second search gives
the correct, current answer. Search first; answer or code second.

The point is not to show effort, it is to give the user the most popular and latest
battle-tested result instead of a plausible hallucination.

## Two-tier trigger
- **Auto-fetch (default):** coding, library/API, framework, config, or version-specific questions. Do the search before answering.
- **Stay silent:** pure chit-chat, stable version-independent facts you are certain about, or when the user says "from memory" / "don't search". No table, no fetch.
- **Session cache:** if you fetched the same thing minutes ago this session, reuse it instead of re-fetching.

## How to search
1. **Broad pass first.** One websearch to map the landscape and find the authoritative and popular sources.
2. **Deep pass on the top 2-3.** webfetch the official docs, a top Stack Overflow/GitHub thread, or a reputable write-up. Prefer official docs and pinned, recent versions over old blog posts.
3. **Rank by trust.** Official docs and source repos outrank uncited blogs. Note the version and date of what you read so the user knows if it is current.
4. **Flag mismatches.** If a source describes a different major version than the user is on, say so explicitly in the version column.

## Scope toggle (ask only if it matters)
- **Brief:** top 1 source, one row, enough to act.
- **Exhaustive:** full table with alternatives and trade-offs.
Default to brief for a direct how-to; offer exhaustive when the user is choosing between options. Don't over-fetch a simple ask.

## How to present the result
Always hand the user a compact, cited table:

| Topic | Recommendation / answer | Source | Version | Verified | Confidence | Why trusted |
|-------|------------------------|--------|--------|----------|------------|-------------|
| React 19 `useFormStatus` | Returns `{pending, data, method, action}` | [React docs](https://react.dev) | 19 | 2026-08-23 | High | Official, current major |
| Form lib choice | `react-hook-form` for uncontrolled, `formik` legacy | [npm trends](https://npmtrends.com) | — | 2026-08-23 | Med | Download rank, 12 mo |

Column rules:
- **Source:** a real, clickable URL. No URL, no claim.
- **Version:** the major/minor version the source describes; mark "≠ yours" if it differs.
- **Verified:** the date you read it (today). Surfaces stale guidance later.
- **Confidence:** High (official/docs/source), Med (popular but uncited), Low (conflicting/old). If Low, say so and let the user pick.
- **Why trusted:** one line weighing popularity vs authority.

## Quote and attribute accurately
If you quote a source, every word must match exactly (reuse the `no-slop` accurate-quote rule). Mark any needed edit with `[...]`. Name the speaker/medium when you introduce a quote. Paraphrase without quotes if you must clean up wording. Never invent a position.

## Cache reusable findings
When a fetch is likely to recur (a library you use often, a standing best-practice question), write it to `memory/references/<topic>.md`:

```
# <topic>
Verified: 2026-08-23
| Topic | Answer | Source | Version | Confidence |
...
```

Retrieve from there next time via the `fff` file-search tools before re-fetching. Stamp the verified date so stale entries are obvious.
