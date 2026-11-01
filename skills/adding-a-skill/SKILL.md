---
name: adding-a-skill
description: Standard procedure for adding a new skill to this agent-skills kit (third-party via skills-lock.json or a local custom skill). Use when curating a new skill, onboarding a new source repo, or whenever a skill is added/renamed/removed. Keeps the manifest, README counts, and install paths consistent.
license: MIT
disable-model-invocation: true
---

# Adding a skill to this kit

This kit has two layers: third-party skills pinned in `skills-lock.json`, and
local skills committed under `skills/`. Pick the right path, then update the
counts and tables in `README.md` so the docs never drift from the manifest.

## Before you start

1. Decide the layer:
   - **Third-party / upstream**: the skill lives in someone else's repo and is
     installed via the Agent Skills CLI. Add it to `skills-lock.json`.
   - **Local / custom**: the skill is authored here. Add a directory under
     `skills/`.
2. Check for duplicates: search `skills-lock.json` and `skills/` for the skill
   name and any upstream alias.
3. Prefer the upstream name. If this repo renames it (e.g. `compress` →
   `caveman-compress`), record the mapping in the README locked-skills note.

## Adding a third-party skill

1. **Install into a throwaway project to get a lock entry.** The CLI computes
   the `computedHash` only in project scope, and this repo intentionally stays
   global-only. So:

   ```sh
   mkdir /tmp/skill-probe && cd /tmp/skill-probe
   npx skills add <owner/repo> --skill <skill-name>
   ```

   This creates `./skills-lock.json` with the entry for that skill.

2. **Copy the entry** from `/tmp/skill-probe/skills-lock.json` into this repo's
   `skills-lock.json`, preserving alphabetical order of the `skills` object.
   The entry shape is:

   ```json
   "<skill-name>": {
     "source": "<owner/repo>",
     "sourceType": "github",
     "skillPath": "<folder>/SKILL.md",
     "computedHash": "<sha256>"
   }
   ```

   Add `ref` only when pinning to a tag/commit; add `sourceUrl` only for git
   hosts that need an explicit URL.

3. **Update README.md**:
   - Bump the entry count in the first paragraph and the `skills-lock.json`
     comment (e.g. `52 entries` → `53 entries`).
   - Add or update the source line in the "Locked skills" list, including the
     skill name and the running count for that source.
   - If this is a new source repo, add a new bullet.

4. **Verify**: `node scripts/sync-skills.mjs --dry-run` and confirm the new
   skill appears in its source group. Remove the probe directory.

## Adding a local skill

1. Create `skills/<skill-name>/SKILL.md` with valid frontmatter (`name`,
   `description`, and `license`). Match the tone and structure of existing
   skills in `skills/`.
2. If the skill needs supporting files, keep them inside
   `skills/<skill-name>/`.
3. **Update README.md**:
   - Bump `skills/` count in the Layout block.
   - Add a row to the "Local skills" table with a one-line description and
     provenance.
   - Add dependency rows if the skill needs another skill or external tool.
4. If the skill is explicit-only (`disable-model-invocation: true`) or opts
   into OpenCode slash via `metadata["opencode/slash"]: "true"`, run
   `node scripts/sync-opencode-commands.mjs` to regenerate wrappers.

## Renaming or removing a skill

- **Rename**: add under the new name, leave a note in README, update any
  cross-references in `skills/` and `conventions/`.
- **Remove a third-party skill**: delete its entry from `skills-lock.json`,
  update README counts and source lines, and tell consumers to run
  `npx skills rm <name> -g`.
- **Remove a local skill**: delete `skills/<name>/`, update README table and
  counts. Consumers re-run the installer.

## Final checks

- `git diff --stat` shows only intended files.
- Counts in README match `Object.keys(lock.skills).length` and the number of
  directories under `skills/`.
- `node scripts/sync-skills.mjs --dry-run` succeeds.
- Commit with a clear message; do not open a PR without human review.