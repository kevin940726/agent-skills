---
name: zh-tw-convert
description: Convert Simplified Chinese documents or skill folders to Taiwan Traditional Chinese with OpenCC s2twp. Preserve code, URLs, identifiers, and frontmatter keys. Use when asked to convert, localize, or port Chinese content to zh-TW.
license: MIT
---

# Convert to Taiwan Traditional Chinese

Convert Simplified Chinese (zh-CN) prose to Taiwan Traditional Chinese (zh-TW)
with OpenCC. This skill owns the conversion mechanics, protected spans, the
glossary, and verification. It does not own technical-writing style; apply the
repository's writing rules separately.

## Modes

| Mode | Scope |
|---|---|
| `doc` | One Markdown or text file, or a directory of them. |
| `skill` | A skill folder: `SKILL.md`, references, and prose assets. |

Pick the mode from the target, not from the wording of the request. Use `skill`
mode whenever the target contains a `SKILL.md`.

## Requirements

OpenCC 1.x must be installed and runnable:

```bash
opencc --version
printf '测试\n' | opencc -c s2twp.json
```

If either command fails, stop. Do not substitute a hand-written conversion.

The converter is `scripts/convert-zh-tw.mjs`. It has no npm dependencies:

```bash
node <skill>/scripts/convert-zh-tw.mjs <paths...> [--write] [--check] [--json]
```

Resolution order is `--opencc`, `OPENCC_BIN`, then `opencc` on `PATH`. The
config is `s2twp.json` unless `--config` or `OPENCC_CONFIG` overrides it.

## Workflow

1. **Inspect scope.** List the target files and note `SKILL.md`, tests, and
   generated files. Leave vendored directories and build output out of scope.
2. **Dry run.** Run without `--write`. The default reports every file that would
   change and writes nothing.
3. **Review the diff.** Run `git diff` or convert a copy and diff it. Check that
   only prose changed.
4. **Write.** Run again with `--write` after the diff is understood.
5. **Verify.** Run with `--check` on the converted tree. It must exit 0. Then
   confirm protected spans are byte-identical.
6. **Report.** Use the report section below.

`--json` prints a machine-readable result with per-file overrides, review terms,
and skipped paths. `--check` exits 1 when any file would change and 0 when the
tree is clean.

## Why s2twp

Use `opencc -c s2twp.json`. Do not use `s2t` or `s2tw` for prose.

`s2t` and `s2tw` are character-level conversions. They produce mainland
vocabulary written in Traditional glyphs: 軟件, 質量, 網絡, 信息. `s2twp` adds
the Taiwan phrase table and produces 軟體, 品質, 網路, 資訊. Glyph conversion
alone is not localization.

## Never convert

- Fenced code blocks and inline code, including info strings and backtick runs.
- URLs, link destinations, autolinks, and image paths.
- Frontmatter keys, the `name` value, identifiers, file paths, CLI flags, and
  JSON or YAML keys.
- License headers, product names, library names, and version strings.

The script masks these spans before conversion and restores them afterwards.
Do not edit or unmask them by hand to "finish" a sentence.

## Known limits

Masking covers common paths, filenames, CLI flags, URLs, code spans, and
frontmatter keys. Review these edge cases by hand and report them instead of
guessing:

- A path whose first segment is non-ASCII.
- A filename that touches Chinese text with no space or punctuation.
- Inline code that mixes prose and an identifier.
- An extension outside the common list.

## Skill mode

- Preserve `SKILL.md` frontmatter `name`. The script masks it; change it only
  when the user explicitly asks to rename the skill.
- Convert prose in `SKILL.md`, `references/**/*.md`, and other supported text
  files (`*.md`, `*.mdx`, `*.markdown`, `*.txt`).
- Do not rename files or directories.
- Do not rewrite tests by default. Search tests for Chinese literals and report
  the files and lines that assert on converted display text. Update them only
  when the user asks, and keep the assertion meaningful rather than deleting it.
- `agents/openai.yaml` is outside the converter's file types. If the user wants
  the interface localized, edit `display_name`, `short_description`, and
  `default_prompt` by hand, and leave YAML keys and `$skill` references intact.
- Leave scripts, configs, and machine-readable fixtures alone unless they carry
  user-facing prose.

## Glossary

Read `references/glossary.md` before reviewing a diff. It defines the term
choices, the confidence tiers, and the terms that require judgment.

`references/overrides.json` applies safe phrase-level fixes after OpenCC, for
example `程式程式碼` → `程式碼`. It is intentionally short and each entry has a
note. Do not add a blanket `文件` → `檔案` replacement: document versus file is
context-dependent, and the distinction belongs in the glossary.

The script reports review terms with counts: 配置, 腳本, 倉庫, 依賴, 校驗, 介面,
生成, 文件. Treat every hit as a question. Resolve it from the sentence, not from
a global replacement.

## Stop conditions

Stop and report instead of guessing when:

- OpenCC is missing, or `s2twp.json` cannot be loaded.
- An ambiguous term changes the meaning of the sentence.
- A test asserts on Chinese display text.
- A Chinese string is data: an error code, fixture value, serialized key, or API
  payload.
- The diff touches a protected span.

Files whose prose is already Traditional are reported unchanged. The script
checks this with OpenCC `s2t`, so running twice is stable. That check only means
there is no Simplified text left; it is not a translation review.

## Verification

- `node --check <skill>/scripts/convert-zh-tw.mjs` after changing the script.
- `--check` exits 0 on the converted tree.
- `git diff` shows prose changes only; code blocks, URLs, and frontmatter keys
  are identical.
- `git diff --stat` lists only the files you meant to change.

## Report

List:

- Files changed.
- Term report: overrides applied, review terms found, and glossary choices made.
- Skipped files and the reason.
- Ambiguous items left for manual review.
- Test files that assert on Chinese text and still need an update.

Conversion is one-way. Do not claim that `tw2sp` restores the source, and do not
describe the result as round-trip safe.
