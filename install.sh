#!/usr/bin/env bash
# agents-skills installer (POSIX: macOS, Linux, Git Bash on Windows)
# Symlinks (or copies) vendored skills into ~/.agents so any agent client can find them.
# Idempotent: re-running relinks/updates without creating duplicates.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${HOME}/.agents"

echo "Installing agents-skills into ${TARGET}"

mkdir -p "${TARGET}/skills" "${TARGET}/instructions"

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

# Custom instructions
for f in "${REPO}"/instructions/*; do
  [ -e "$f" ] || continue
  name="$(basename "$f")"
  link_or_copy "$f" "${TARGET}/instructions/${name}"
done

# Global memory
link_or_copy "${REPO}/memory/AGENTS.md" "${TARGET}/AGENTS.md"

echo "Done. Skills are available under ${TARGET}/skills/."
