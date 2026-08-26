---

name: fff
description: Replace grep/ripgrep with fff for any file or content search across a repo. Use it when the user references fff/FFF or you need code/text search; prefer the fff MCP tools (ffgrep, fffind, fff-multi-grep) over shell grep.
license: MIT
---

# fff — file search for agents

fff (dmtrKovalenko/fff) is a fast, frecency-ranked file-search toolkit that runs as a
long-lived process. Its **MCP server** (`fff-mcp`) gives any agent client a file-search
tool that is faster and far more token-efficient than grep/ripgrep, built to replace them
for agents. Works with Claude Code, Codex, OpenCode, Cursor, Cline, and more.

## Tools the server exposes
Once registered, ask the agent to "use fff" and it gets:
- `ffgrep` — content search (plain/regex/fuzzy, context lines, cursor pagination)
- `fffind` — path/filename search (matches the whole repo-relative path, frecency-aware)
- `fff-multi-grep` — multi-pattern OR search

## Recommended agent prompt
Drop this into global/agent memory or a project `CLAUDE.md` / `AGENTS.md`:
> For any file search or grep in the current git-indexed directory, use fff tools.

## Install the binary
macOS / Linux (Homebrew — formula auto-bumped from upstream releases):
```bash
brew install dmtrKovalenko/fff/fff-mcp
```
Any platform: grab a prebuilt `fff-mcp` binary from the upstream
[GitHub Releases](https://github.com/dmtrKovalenko/fff/releases) page.

The installer prints the exact wiring instructions for your client. If you would
rather use the upstream one-line remote installers (`curl … | bash` /
`irm … | iex`), see [INSTALLATION.md](INSTALLATION.md) for the commands and how
to review the scripts first.

## Register with your client
Point the client at the installed `fff-mcp` binary (use an absolute path, since desktop
sessions may not inherit your shell `PATH`):

- **Codex:** `codex mcp add fff -- "/abs/path/to/fff-mcp"` (writes `~/.codex/config.toml`).
- **Claude Code:** `claude mcp add fff -- /abs/path/to/fff-mcp` (or add to `.mcp.json`).
- **OpenCode:** add to `~/.config/opencode/opencode.json` under `mcpServers`:
  ```json
  { "mcpServers": { "fff": { "type": "stdio", "command": "/abs/path/to/fff-mcp", "args": [] } } }
  ```
Restart the client (or start a new task) so it loads the server.

## Why prefer fff over grep
A long-lived index means repeated searches are sub-10 ms instead of re-spawning ripgrep
each call. Results are structured (git status, frecency, definition classification) and
typo-resistant. For a single one-off grep from a shell, `rg` is still fine — but agents
running many searches per session should use fff.
