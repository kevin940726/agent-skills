---

name: docs
description: Write or update documentation for code (README, API reference, module or function docs like JSDoc/TSDoc/docstrings). Load this skill when the user asks for docs, wants a new module documented, or a README is stale. Produce specific, example-driven docs that obey the no-slop rules.
license: MIT
---

# Docs for code

Load this skill when the user asks for documentation, wants a module or API documented, or a
README is stale. The output should let a new reader use the code without reading the source,
and should follow the `no-slop` rules: concrete, example-driven, no filler.

## When to run
- "Document this module / function / API."
- "Write or update the README."
- "Add JSDoc / TSDoc / docstrings."
- A public surface changed and the docs did not.

## Procedure
1. **Read the surface.** Identify the public exports, signatures, and the one job each does.
   Do not document internals that callers never touch.
2. **Lead with what it does.** One sentence on purpose, then the signature, then a runnable
   example. An example that compiles beats a paragraph of prose.
3. **Document parameters and returns.** For each public function: what each arg means, the
   return shape, and the failure modes (throws, returns null, error codes).
4. **Show the setup.** For a README: install, a minimal usage snippet, and the common next
   step. Skip the origin story and the feature laundry list.
5. **Flag drift.** If the code and an existing doc disagree, trust the code and say so, or
   ask. Never copy a stale sentence into the new doc.

## Output shape
For a function:
```markdown
## `parseQuery(input: string): Query`
Converts a URL query string into a typed `Query` object.

@param input - The raw query string, including the leading `?`.
@returns A `Query` with decoded, typed fields. Throws on malformed input.

\`\`\`ts
parseQuery("?page=2&sort=desc") // { page: 2, sort: "desc" }
\`\`\`
```

For a README, keep: what it is, install, one usage example, links to deeper docs.

## Keep it clean
Apply `no-slop`: no "powerful", "robust", "seamless"; no sentence that could sit on any
project's README unchanged. Replace a generic claim with the concrete behavior or an example.
Prefer one good example over a long description.
