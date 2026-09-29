---
name: web-first
description: Check the web before building custom code, stating a best practice, or trusting vendored code — does prior art already solve it, is it still current, and does upstream confirm what the vendored copy claims? Prefer adopting a battle-tested solution over writing your own. Load for anything non-trivial from scratch, anything whose currency is unsure, or any read of vendored code/docs for API, types, or usage.
license: MIT
---

# Check the web before you build or trust vendored code

Before writing custom code, endorsing a practice, or quoting a vendored copy,
confirm three things: it isn't already solved, it's still current, and upstream
confirms what the vendored copy claims. Adopting beats reinventing; upstream
beats cache.

## When to load
- Building anything non-trivial from scratch (function, component, script, pipeline).
- Stating or reaching for a "best practice" you didn't verify.
- Unsure a library/API/pattern is current or idiomatic for the version in play.
- Reading vendored code/docs for reference: `node_modules/`, `.crates/`, `vendor/`, `.venv/`, `target/`, `dist/`, `build/` for API, types, signatures, or usage.

Skip only for stable facts you're certain of, or when the user says "from memory".

## Find prior art
1. **Broad pass:** one websearch for the capability + ecosystem (e.g. "python parse xlsx", "react data fetch 15").
2. **Deep pass:** open the top 2-3 — official docs, a pinned GitHub/SO thread, a reputable write-up. Prefer official + recent over old blogs.
3. **Adopt vs build:** if a maintained library or stdlib feature covers it, use it; hand-roll only when adoption cost exceeds build cost or nothing fits.
4. **Verify currency:** note the version/date read; if a source is a different major than the user's, say so.

*Done when* you can name the existing solution (or confirm none fits) and state adopt-vs-build.

## Prefer upstream over vendored cache

A vendored copy is a cache, not authority: it goes stale, ships generated or
minified output, and hides whether you are reading the locked version or a
local patch. Resolve upstream, then read upstream.

1. **Resolve identity from the manifest**, not the path: package name + locked version from `package.json` + lockfile, `Cargo.toml` + `Cargo.lock`, `go.mod`, `requirements`/`pyproject`, or equivalent.
2. **Fetch upstream at that version:** official docs plus the repo at the matching tag. Note the version/date read; if upstream's major differs from the locked one, say so.
3. **Treat the vendored copy as a hint:** use it to locate a symbol, then confirm signature, semantics, and examples upstream before citing or building on it.

Offline, forked, or locally patched with no reachable upstream is the only
exception: state you are reading a fork and name how it differs. If no manifest
is reachable, use the in-file version header if present, else state version
unknown and treat the local copy as authority.

## Present
Compact cited table — one row per finding:

| Need | Existing solution / answer | Source | Version | Verified | Confidence |
|------|---------------------------|--------|---------|----------|------------|
| parse xlsx | `openpyxl` (maintained) | [docs](https://openpyxl.readthedocs.io) | — | 2026-08-24 | High |

- **Source:** real clickable URL. No URL, no claim.
- **Confidence:** High (official/source), Med (popular, uncited), Low (conflicting/old) — say so and let the user pick.
- **Verified:** today's date, so stale guidance surfaces later.
- Attribute accurately: quote exactly or paraphrase clearly; every claim traces to a real source.

## Recommend and offer options
After the table:
1. **State your suggestion** — one line: which existing solution to adopt, or that none fits and custom is justified.
2. **Offer a questionnaire** — 2-4 concrete choices so the user decides fast, e.g.:
   - "Adopt `openpyxl` (maintained, covers parsing) — go with this?"
   - "Use stdlib `csv` instead (no dep) — lighter?"
   - "Hand-roll it (nothing fits) — proceed?"
   For a multi-question survey, load `to-questionnaire`.

## Cache recurring findings
If a lookup will recur, save to `memory/references/<topic>.md` (Verified date + table); reuse via `fff` before re-fetching.
