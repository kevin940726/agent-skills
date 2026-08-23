---
name: web-first
description: Use this skill whenever a question or implementation needs current, authoritative, or version-specific information — library/API usage, framework how-tos, best practices, "latest" or "most popular" comparisons, or anything you are not certain is still accurate. Always search the web for the most popular and latest battle-tested sources before answering or coding, then present the findings as a cited list or table. Trigger even for open-ended questions; skip only for facts you already know are stable and version-independent.
---

# Fetch before you act

Load this skill when the answer depends on information that may have changed, varies by
version, or comes from a source you should verify rather than guess. Guessing at a library
API or a "best practice" from memory wastes the user's time when a two-second search gives
the correct, current answer. Search first; answer or code second.

The point is not to show effort, it is to give the user the most popular and latest
battle-tested result instead of a plausible hallucination.

## When to fetch first (not guess)
- Library, API, or CLI usage you are not 100% certain about, or that differs by version.
- Anything version-specific: "how do I do X in React 19", "the v3 config format".
- Best-practice or "what should I use" questions: state management, build tools, auth, ORMs.
- Open-ended or comparative questions: "most popular", "latest", "battle-tested", "vs".
- Anything where being wrong is costly: security, config that affects others, migrations.
- Anything published after your training data, or that changes fast (SDKs, model APIs).

## When you can skip the fetch
- Stable, version-independent facts you are certain about (basic language syntax, well-known algorithms).
- The user explicitly says "from memory" or "don't search".
- You just fetched the same thing minutes ago in this session (reuse the result).

## How to search
1. **Broad pass first.** One websearch to map the landscape and find the authoritative and popular sources.
2. **Deep pass on the top 2-3.** webfetch the official docs, a top Stack Overflow/GitHub thread, or a reputable write-up. Prefer official docs and pinned, recent versions over old blog posts.
3. **Rank by trust.** Official docs and source repos outrank uncited blogs. Note the version and date of what you read so the user knows if it is current.
4. **Flag mismatches.** If a source describes a different major version than the user is on, say so explicitly.

## How to present the result
Always hand the user a compact, cited summary. Use a table:

| Topic | Recommendation / answer | Source | Why it's trusted |
|-------|------------------------|--------|------------------|
| React 19 `useFormStatus` | Returns `{pending, data, method, action}` | [React docs](https://react.dev) | Official, current major version |
| Form lib choice | `react-hook-form` for uncontrolled, `formik` legacy | [npm trends](https://npmtrends.com) | Download rank, last 12 months |

Rules for the table:
- Every row carries a real, clickable source URL. No URL, no claim.
- Quote the source accurately if you quote at all (see `no-slop`); mark any change with `[...]`.
- Add a one-line "why trusted" so the user can weigh popularity vs authority.
- Keep it short; expand only on the rows the user cares about.

## If you are not sure which source wins
Say so in the table with a "confidence" note (high/medium/low) and let the user pick.
Searching is not "blocking" — it is a quick background step, then you present and ask.
