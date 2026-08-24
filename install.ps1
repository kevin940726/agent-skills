# agents-skills OFFLINE FALLBACK installer (Windows PowerShell)
# Symlinks (mklink/junction) or copies vendored skills into $HOME/.agents so
# opencode / any agent-compatible client can find them. Prefer
# `npx skills add kevin940726/agent-skills` for multi-agent installs
# (Claude Code, Cursor, Codex, Copilot, Gemini, ...).
# Idempotent: re-running relinks/updates without duplicates.
$ErrorActionPreference = "Stop"

$Repo = Split-Path -Parent $MyInvocation.MyCommand.Definition
$Target = Join-Path $HOME ".agents"

Write-Output "Installing agents-skills into $Target"
New-Item -ItemType Directory -Force -Path (Join-Path $Target "skills") | Out-Null

# Detect symbolic-link capability (needs Developer Mode or admin on Windows)
$linkMode = $true
try {
    $tmp = Join-Path $env:TEMP ("symtest_" + [guid]::NewGuid().ToString("N"))
    $p = New-Item -ItemType SymbolicLink -Path $tmp -Target $Repo -ErrorAction Stop
    Remove-Item $p -Force
} catch {
    $linkMode = $false
    Write-Output "Symbolic links unavailable (enable Developer Mode or run as admin); falling back to copy."
}

function Link-Or-Copy($src, $dst) {
    if (Test-Path $dst) { Remove-Item -LiteralPath $dst -Force -Recurse }
    if ($script:linkMode) {
        try {
            New-Item -ItemType SymbolicLink -Path $dst -Target $src -ErrorAction Stop | Out-Null
            return
        } catch {
            if ((Get-Item $src).PSIsContainer) {
                cmd /c "mklink /J `"$dst`" `"$src`"" | Out-Null
                return
            }
        }
    }
    Copy-Item -LiteralPath $src -Destination $dst -Recurse -Force
}

# Skills
Get-ChildItem -LiteralPath (Join-Path $Repo "skills") -Directory | ForEach-Object {
    Link-Or-Copy $_.FullName (Join-Path $Target "skills\$($_.Name)")
}
# Global memory
Link-Or-Copy (Join-Path $Repo "memory\AGENTS.md") (Join-Path $Target "AGENTS.md")

Write-Output "Done. Skills are available under $Target/skills/."
