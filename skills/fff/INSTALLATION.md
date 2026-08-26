# Installing fff-mcp via the upstream one-line scripts

`SKILL.md` leads with package-manager installs (Homebrew, GitHub Releases)
because they avoid piping a remote script straight into a shell. If you prefer
the one-line installers below, review the script first — both live in the
upstream repo and are short, readable shell:

- Linux/macOS: [`install-mcp.sh`](https://github.com/dmtrKovalenko/fff/blob/main/install-mcp.sh)
- Windows: [`install-mcp.ps1`](https://github.com/dmtrKovalenko/fff/blob/main/install-mcp.ps1)

## Linux / macOS

```bash
curl -L https://dmtrkovalenko.dev/install-fff-mcp.sh | bash
```

## Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/dmtrKovalenko/fff/main/install-mcp.ps1 | iex
```

Either path installs the `fff-mcp` binary (default `~/.local/bin/fff-mcp`) and
prints the wiring instructions for your client. Then follow "Register with your
client" in [SKILL.md](SKILL.md).
