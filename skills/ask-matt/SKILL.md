---

name: ask-matt
description: Ask which skill or flow fits your situation. A router over the skills in this kit. User-invoked only — type /ask-matt when you are unsure which skill to reach for.
license: MIT
disable-model-invocation: true
---

# Ask Matt

You don't remember every skill, so ask.

A **flow** is a path through the skills. Most paths run along one **main flow**, and a few **on-ramps** merge onto it. Everything else is standalone, or a vocabulary layer that runs underneath. This router only points at skills that actually ship in this kit.

## The main flow: idea to ship

The route most work travels. You have an idea and want it built.

1. **`/grill-with-docs`** sharpens the idea by interview. Start here whenever you are **working in a working directory**: it is stateful, retaining what it learns in `CONTEXT.md` and ADRs. No working directory? Use **`/grill-me`** (stateless) instead. Both run the same **`/grilling`** primitive; `grill-with-docs` is the one that leaves a paper trail.
2. **Branch: can you settle every question in conversation?** If a question needs a runnable answer (state, business logic, a UI you have to see), detour through a prototype, bridged by **`/handoff`** in both directions.
   - **`/handoff`** out, open a fresh session against that file,
   - **`/prototype`** to answer the question with throwaway code,
   - **`/handoff`** back what you learned.
3. **Branch: is this a multi-session build?**
   - **Yes** to **`/to-spec`** (turn the thread into a spec), then **`/to-tickets`** to split it into tracer-bullet tickets declaring their **blocking edges**. Then **`/implement`** each ticket (it drives **`/tdd`** internally, then runs **`/code-review`** before committing).
   - **No** to **`/implement`** right here.

   Reach for **`/tdd`** on its own to build a behaviour test-first, and **`/code-review`** on its own to review a branch or PR against a fixed point.

### Context hygiene

Keep steps 1-3 in one unbroken context window so the grilling, spec, and tickets build on the same thinking. Each `/implement` then starts fresh from its ticket.

## On-ramps

A starting situation that generates work, then merges onto the main flow.

- **Bugs and requests piling up** to **`/triage`**. It moves raw issues (bug reports, incoming requests) through triage roles and produces agent-ready issues, which **`/implement`** later picks up. Tickets `/to-tickets` produced are already agent-ready, so do not triage them.
- **Something is broken** to **`/diagnosing-bugs`**. For the hard ones: it refuses to theorise until it has a tight feedback loop, then fixes with a regression test. Its post-mortem hands off to **`/improve-codebase-architecture`** when the real finding is that there is no good seam to lock the bug down.
- **A huge, foggy effort** (greenfield or a feature too big for one session) to **`/wayfinder`**. It charts a shared map of decision tickets on the issue tracker and resolves them one at a time, producing decisions not deliverables. When the map clears, it hands off to **`/to-spec`**, not straight to `/implement`.

## Codebase health

Not feature work, just upkeep.

- **`/improve-codebase-architecture`** surfaces deepening opportunities; picking one generates an idea to take into the main flow. **`/codebase-design`** is the bench you design the chosen one on.

## Vocabulary underneath

Two references that run beneath the other skills, each the single source of truth for its vocabulary.

- **`/domain-modeling`**: sharpen the project's domain language, resolve an overloaded word, record a hard-to-reverse decision as an ADR.
- **`/codebase-design`**: the deep-module vocabulary (module, interface, depth, seam, adapter) for designing a module's shape.

## Phase boundaries

A phase is a chunk of work: the grilling, the implementation, the QA. At a boundary you have five options, fuzziest decision first:

- **Continue**: stay put. Rule this out first; it costs nothing.
- **`/clear`**: empty the window when nothing here matters to what is next.
- **`/handoff`**: write a portable markdown file, for a new harness, new directory, colleague, or a side task mid-phase.
- **Subagent**: send a tightly-scoped task to its own window, get a report back.
- **`/compact`**: compress this context and seed a fresh session. The default at the bottom of the tree.

Make the decision at a boundary; mid-phase, continue or split the rest into subagents.

## Standalone

Off the main flow entirely.

- **`/grill-me`**: the relentless interview, stateless. Use when not in a working directory.
- **`/grilling`**: the interview primitive itself. Reach for it directly only when you want the interview with no wrapper.
- **`/wait-what`**: corrective for a message that did not land. Use mid-conversation to re-pitch what was just said.
- **`/resolving-merge-conflicts`**: works an in-progress merge or rebase conflict hunk by hunk, resolving by intent, never `--abort`.
- **`/prototype`**: a small throwaway program that answers one design question.
- **`/research`** family: **`/research`** (outline + preliminary research), **`/research-add-fields`**, **`/research-add-items`**, **`/research-deep`** (parallel deep agents), **`/research-report`** (markdown report). Delegate reading legwork to a background agent; keep working while it reads.
- **`/wizard`**: steps only a human can take (provisioning, credentials, CI secrets, one-off migrations). Generates an interactive bash script.
- **Knowledge and output quality**: **`/caveman`** (ultra-compressed mode), **`/compress`** (compress memory files), **`/karpathy-guidelines`** (avoid overcomplication).
- **Authoring**: **`/skill-creator`** (create/improve skills), **`/find-skills`** (discover installable skills).
- **Agent behaviour**: **`/ask-clarify`** (clarify before guessing), **`/web-first`** (fetch current sources before answering), **`/no-slop`** (write without AI slop).
- **File search**: **`/fff`** (fff-mcp file-search server; prefer over grep/ripgrep).
- **Git safety**: **`/setup-pre-commit`** (Husky + lint-staged hooks).
- **Web and UI**: **`/web-app-design`**, **`/frontend-design`**, **`/vercel-react-best-practices`**, **`/vercel-react-native-skills`**, **`/shadcn`**.
