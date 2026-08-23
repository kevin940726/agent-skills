---
name: fff
description: Guidance for working in the FFF.nvim (Fast File Finder) Neovim plugin repository — a Rust + Lua high-performance file picker. Use when editing, building, debugging, or discussing fff / FFF.nvim, or when the user references it.
---

# FFF.nvim (Fast File Finder)

High-performance file picker for Neovim, inspired by blink.cmp's fuzzy matching.
It is NOT a completion plugin — a standalone file finder with fuzzy search and
frecency scoring, intended as a drop-in replacement for telescope, fzf-lua, and
snacks.picker. Performance-critical work is in Rust; Neovim-specific work is in Lua.

## Development Commands
Always prefer Makefile commands over raw cargo/bun/node when possible.
- `make build` — build everything
- `make lint` — Rust linting and analysis
- `make format` — format all code
- `make test` — run unit tests (limited coverage; mostly integration)

There is no traditional test suite. Test via:
- Lua e2e: `nvim -l <test_file>` loads any Lua test file
- Inline Rust unit tests for standalone, single-function logic

## Coding rules
- Reduce comment size: concise 1–2 liners, max 4 lines only for truly unnatural concepts.
- No module-level or top-of-file comments; no comment longer than 2 lines unless asked.
- Utility functions go at the end of the file.
- Do not add doc comments to private structs/functions.
- Do not make structs public if they can be private.
- Prefer struct methods over free functions; if a file has >2 `impl` blocks, split it.
- Be very careful with locking — double-check with the human before anything that may
  hold a mutex/rwlock for a long time.

## Architecture
Three main components:
- Rust binary holding global file-picker state (index of all files)
- Background thread with a filesystem watcher updating the index in real time
- Lua UI layer rendering the picker, handling input, calling Rust via FFI

Two databases:
- Frecency database (LMDB) tracking file access patterns for scoring
- Query history database tracking previous searches

### Key files
- `lua/fff.lua` — entry point, delegates to main.lua
- `lua/fff/main.lua` — public API (`find_files`, `search`, `change_directory`)
- `lua/fff/core.lua` — init, autocmds, global state
- `lua/fff/picker_ui.lua` — UI rendering, layout, keymaps
- `lua/fff/file_picker/preview.lua` — file preview with syntax highlighting
- `lua/fff/file_picker/image.lua` — image preview (snacks.nvim integration)
- `lua/fff/conf.lua` — default config
- `lua/fff/rust/init.lua` — loads compiled Rust shared library

### Rust side (`lua/fff/rust/`)
- `lib.rs` — FFI bindings, global state (`FILE_PICKER`, `FRECENCY`)
- `file_picker.rs` — core `FilePicker`, indexing, background watcher
- `frecency.rs` — frecency database (LMDB) and scoring
- `query_tracker.rs` — search query history
- `score.rs` — fuzzy match scoring (frizbee)
- `git.rs` — git status caching / repo detection
- `background_watcher.rs` — filesystem watcher thread

## Lua guidance
- Document types of public functions in every module.
- Validate user input in public functions with `vim.validate()`.
- Reuse existing functions where possible.
- When adding UI features, NEVER break core navigation/selection/preview — only add on top.
- After large changes, run a Lua test that opens Neovim at `~/dev/lightsource` and opens
  the picker to verify UI across real code.
- When adding highlights/shortcuts/configurable UI options, update both the Neovim config
  and the README with the new options.
- Test UI rendering for both `prompt_position="bottom"` and `prompt_position="top"` — the
  rendering logic differs (bottom is the reverse order of top; navigation is the same).

## Stability contract
Top-level Rust, Lua, C, and bun APIs must not introduce breaking changes under any
circumstance.

## Optional: MCP server
The repo ships `.mcp.json` defining an `fff` MCP server (`stdio`,
command `./target/release/fff-mcp`). It requires building the release binary first
(`make build`); enable it only when the user wants fff exposed as a tool.
