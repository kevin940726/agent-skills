#!/usr/bin/env bash
# agents-skills OFFLINE FALLBACK installer (POSIX: macOS, Linux, Git Bash on Windows)
# Symlinks (or copies) vendored skills into ~/.agents so opencode / any
# agent-compatible client can find them. Prefer `npx skills add kevin940726/agent-skills`
# for multi-agent installs (Claude Code, Cursor, Codex, Copilot, Gemini, ...).
# Idempotent: re-running relinks/updates without creating duplicates.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${HOME}/.agents"

echo "Installing agents-skills into ${TARGET}"

mkdir -p "${TARGET}/skills"

link_or_copy() {
  local src="$1" dst="$2"
  if [ -L "$dst" ] || [ -e "$dst" ]; then
    rm -rf "$dst"
  fi
  if ln -s "$src" "$dst" 2>/dev/null; then
    return 0
  fi
  # Fallback: copy (e.g. filesystems without symlink support)
  cp -R "$src" "$dst"
}

# Skills
for d in "${REPO}"/skills/*/; do
  [ -d "$d" ] || continue
  name="$(basename "$d")"
  link_or_copy "$d" "${TARGET}/skills/${name}"
done

# Global memory
link_or_copy "${REPO}/memory/AGENTS.md" "${TARGET}/AGENTS.md"

echo "Done. Skills are available under ${TARGET}/skills/."
