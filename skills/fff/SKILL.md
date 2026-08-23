---
name: fff
description: fff is a file-search MCP server for agents, meant to replace grep/ripgrep. Use it for any file or content search, finding code/text across a repo, or when the user references fff/FFF. Prefer the fff MCP tools (ffgrep, fffind, fff-multi-grep) over shell grep.
---

# fff — file search for agents

fff (dmtrKovalenko/fff) is a fast, frecency-ranked file-search toolkit that runs as a
long-lived process. Its **MCP server** (`fff-mcp`) gives any agent client a file-search
tool that is faster and far more token-efficient than grep/ripgrep, and is designed to
replace them for agents. Works with Claude Code, Codex, OpenCode, Cursor, Cline, etc.

## Tools the server exposes
Once registered, ask the agent to "use fff" and it gets:
- `ffgrep` — content search (plain/regex/fuzzy, context lines, cursor pagination)
- `fffind` — path/filename search (matches the whole repo-relative path, frecency-aware)
- `fff-multi-grep` — multi-pattern OR search

## Recommended agent prompt
Drop this into global/agent memory or a project `CLAUDE.md` / `AGENTS.md`:
> For any file search or grep in the current git-indexed directory, use fff tools.

## Install the binary
Linux/macOS:
```bash
curl -L https://dmtrkovalenko.dev/install-fff-mcp.sh | bash
```
Windows (PowerShell):
```powershell
irm https://raw.githubusercontent.com/dmtrKovalenko/fff/main/install-mcp.ps1 | iex
```
The scripts print the exact wiring instructions for your client and install the
`fff-mcp` binary (also published on GitHub Releases; Homebrew:
`brew install dmtrKovalenko/fff/fff-mcp`).

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
