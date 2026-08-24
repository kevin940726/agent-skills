---
name: web-first
description: Before building custom code or stating a best practice, check the web — does an existing library, framework feature, or pattern already solve it (don't reinvent), and is the current approach still best? Prefer adopting a battle-tested solution over writing your own. Load for any task that could be solved by prior art, anything non-trivial built from scratch, or anything whose currency you're unsure of.
license: MIT
---

# Check the web before you build

Before writing custom code or endorsing a practice, confirm two things: it isn't
already solved, and it's still current. Adopting beats reinventing.

## When to load
- Building anything non-trivial from scratch (function, component, script, pipeline).
- Stating or reaching for a "best practice" you didn't verify.
- Unsure a library/API/pattern is current or idiomatic for the version in play.

Skip only for stable facts you're certain of, or when the user says "from memory".

## Find prior art
1. **Broad pass:** one websearch for the capability + ecosystem (e.g. "python parse xlsx", "react data fetch 15").
2. **Deep pass:** open the top 2-3 — official docs, a pinned GitHub/SO thread, a reputable write-up. Prefer official + recent over old blogs.
3. **Adopt vs build:** if a maintained library or stdlib feature covers it, use it; hand-roll only when adoption cost exceeds build cost or nothing fits.
4. **Verify currency:** note the version/date read; if a source is a different major than the user's, say so.

*Done when* you can name the existing solution (or confirm none fits) and state adopt-vs-build.

## Present
Compact cited table — one row per finding:

| Need | Existing solution / answer | Source | Version | Verified | Confidence |
|------|---------------------------|--------|---------|----------|------------|
| parse xlsx | `openpyxl` (maintained) | [docs](https://openpyxl.readthedocs.io) | — | 2026-08-24 | High |

- **Source:** real clickable URL. No URL, no claim.
- **Confidence:** High (official/source), Med (popular, uncited), Low (conflicting/old) — say so and let the user pick.
- **Verified:** today's date, so stale guidance surfaces later.
- Attribute accurately: quote exactly or paraphrase clearly; every claim traces to a real source.

## Cache recurring findings
If a lookup will recur, save to `memory/references/<topic>.md` (Verified date + table); reuse via `fff` before re-fetching.
