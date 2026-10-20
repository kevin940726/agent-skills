# Install

Always global scope. This kit never installs skills into a project checkout.

Dry-run first:

```sh
node scripts/sync-skills.mjs --dry-run
```

Interactive (picker per source, no auto-accept):

```sh
node scripts/sync-skills.mjs [--agent opencode] [--agent claude-code]
```

Install all (no prompts):

```sh
node scripts/sync-skills.mjs --all
```

Selected only / exclude a few:

```sh
node scripts/sync-skills.mjs --skill ask-clarify,fff
node scripts/sync-skills.mjs --skip caveman-compress
```

Notes: `--agent` accepted zero, one, or many. No `--all` flags `-y` implicitly via
`--skill`/`--skip`.

## Agent execution (non-interactive)

An agent has no terminal. Use one of:

- Install all: `node scripts/sync-skills.mjs --all`
- Curated subset: `node scripts/sync-skills.mjs --skill a,b` or `--skip x,y`
- Interactive only with a human terminal.

With no TTY and no target flags, the script prints exact commands to paste
instead of running. Pass `--all` / `--skill` / `--skip` when you want the
agent to run the install for you. If the command emits a "(no TTY detected)"
list, copy those commands to your shell.

## Update

Update everything already installed:

```sh
npx skills update -g -y
```

Update only the curated lock-derived source list:

```sh
node scripts/sync-skills.mjs --dry-run && node scripts/sync-skills.mjs --all
```

Re-pin one skill if an update breaks it:

```sh
npx skills rm <name> -g
npx skills add owner/repo#<tag> --skill <name> -g
```

## Common flows

1. Fresh machine (human)
   - `node scripts/sync-skills.mjs --dry-run`
   - Read source groups.
   - `node scripts/sync-skills.mjs` and toggle skills per picker.

2. Fresh machine (agent, one shot)
   - Agent tells you it ran `node scripts/sync-skills.mjs --all`.
   - Confirm the reported list; refine with `--skip x` if needed.

3. Single new skill you added to this repo
   - Add or edit `skills/`.
   - `git commit`.
   - Consumer: `npx skills add kevin940726/agent-skills` or update script.

4. Refresh conventions
   - Read `conventions/AGENTS.md`.
   - For each rule, check your global memory file.
   - Append the missing rules as one line pointing to each skill.
   - Show the diff and write only after approval.

5. Orphaned (removed) upstream skill
   - Leave it as `skills/<name>/` with README provenance `orphaned`.
   - To remove globally: `npx skills rm <name> -g`.
   - Do not expect upstream updates.

## Merge the conventions (always-on rules)

Skills load on demand; rules do not. Apply `conventions/AGENTS.md` manually.

For each rule, check your global memory file for a rule with the same behavior
(match on intent, not wording). Append missing rules as one line each pointing
at its skill. Show the diff and write only after approval:

- Clarify before acting (`ask-clarify`)
- File search via fff MCP (`fff`)
- Prose without AI slop (`no-ai-slop`)
- Web-first prior art (`web-first`)
- Security gate on merges (`security-review`)

File locations: opencode `~/.config/opencode/AGENTS.md`,
Claude Code `~/.claude/CLAUDE.md`, Codex `~/.codex/AGENTS.md`,
Gemini `~/.gemini/GEMINI.md`.

Repeat after pulling a convention update or on a new machine or client.

## Maintainers vs consumers

- Maintainers edit `skills/` or `conventions/` and commit. Nothing is pinned globally.
- Consumers add local skills with `npx skills add kevin940726/agent-skills`.
- Global updates (always floating) affect all consumers at the next update.
- `experimental_install` and project scope are intentionally unsupported.

## Orphaned (removed) vendored skills

Upstream sometimes removes or renames a skill. Example: our
`resolving-merge-conflicts` (gone upstream).

- Detection: running `npx skills update -g` reports path errors for that source.
- Keep option: leave `skills/<name>/` in the repo and mark provenance
  `orphaned; gone from upstream`. It is published via `npx skills add
  kevin940726/agent-skills`. It will not update from upstream.
- Remove option: delete `skills/<name>/` from the repo; consumers run
  `npx skills rm <name> -g`.
- Rename option: a renamed skill is not an orphan. Add under the new name and
  leave a note in README.
- Audit: the script skips local skills with missing paths silently. Run
  `npx skills ls -g` to verify; run `npx skills rm` to clean.

## Command reference

| Command | Purpose |
|---|---|
| `node scripts/sync-skills.mjs --dry-run` | Preview groups and commands. |
| `node scripts/sync-skills.mjs` | Interactive picker per source. |
| `node scripts/sync-skills.mjs --all` | Install everything without prompts. |
| `node scripts/sync-skills.mjs --skill a,b` | Install only named skills. |
| `node scripts/sync-skills.mjs --skip x,y` | All except named skills. |
| `npx skills ls -g` | List global installs. |
| `npx skills update -g -y` | Refresh all. |
| `npx skills rm <name> -g` | Remove one. |
| `npx skills add <owner/repo>#<tag> --skill <name> -g` | Pin one to a tag. |

## Optional: OpenCode slash command wrappers

OpenCode can load a skill from a fully typed `/skill-name`, but in current
OpenCode 2 builds the skill metadata forms are not enough to reliably register
the command in the slash autocomplete menu.

Use the bundled optional bridge:

```sh
node scripts/sync-opencode-commands.mjs --dry-run
node scripts/sync-opencode-commands.mjs
```

It scans the global skill roots (`~/.agents/skills`, `~/.claude/skills`) for
skills marked `disable-model-invocation: true`, and for skills that opt in with
this frontmatter:

```yaml
metadata:
  opencode/slash: "true"
```

It generates a small OpenCode command wrapper for each one under:

```sh
~/.config/opencode/commands/<skill-name>.md
```

The generated wrapper is shallow and preserves the original construction of the
skill:

```text
Use the `skill` tool with name="<skill-name>", then follow its instructions
for the task: $ARGUMENTS
```

Filter or remove generated wrappers:

```sh
node scripts/sync-opencode-commands.mjs --skill arena,bro
node scripts/sync-opencode-commands.mjs --skip wayfinder
node scripts/sync-opencode-commands.mjs --clean
```

`--clean` only deletes command files whose names match a discovered skill that
requests a wrapper and was filtered out. It leaves unrelated commands alone.
A skill requests a wrapper when it is explicit-only or sets
`metadata["opencode/slash"]` to `"true"`.

This step is optional. The canonical skill files remain under `.agents/`;
the wrappers only improve OpenCode command-catalog discoverability.

## Notes

- `local` entries need a full clone, not a raw URL fetch of the manifest.
- `node_modules` entries: install npm deps, then `npx skills experimental_sync`.
- Legacy `git` entries without `sourceUrl` are skipped; re-add via `npx skills add`.
- Skills published from this repo are discoverable with `npx skills add
  kevin940726/agent-skills`.
- README.md funnels humans and agents to this file; prefer this file as the
  canonical process doc.
