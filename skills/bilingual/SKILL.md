---
name: bilingual
description: Code-switched user prompt mixing English and Traditional Chinese where a span stands in for a forgotten word. Load when a user prompt contains a non-primary span. Do not load for monolingual prompts, translation requests, or output language choice.
license: MIT
---

# Bilingual span handling

User prompts only, never your own output.

## Steps

1. **Detect `primary` and `spans`.** `primary` is the dominant language of intent. Explicit "reply in X" wins. A `span` is:
   - 2+ consecutive CJK characters when `primary` is English
   - 1+ English words when `primary` is Chinese
   Latin loanwords in English text (sushi, PR), code, identifiers, and URLs are never spans.
   *Done when* every non-primary span is listed or explicitly skipped.

2. **Gloss inline.** Keep `span (gloss)` at first use, e.g. `部署流程 (deploy workflow)`. If one span has 2+ plausible meanings with different actions, load `ask-clarify`.
   *Done when* every span has one inline gloss or one open question.

3. **Respond and act in `primary`.** Prose, comments, commits, and generated docs all follow `primary` unless explicitly asked otherwise. When `primary` is Chinese, use Traditional Chinese, Taiwan usage. A span that is the work product (translate this, quote this) is preserved verbatim.
   *Done when* output matches `primary` and every span was glossed or preserved.

4. **Search both.** Query gloss and original span. Prefer English sources unless the span matches a codebase string verbatim.
   *Done when* both forms were tried or one already hit.
