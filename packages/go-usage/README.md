# opencode-go-usage

OpenCode TUI plugin showing your [OpenCode Go](https://opencode.ai/v2/docs/console/go/)
usage against the three windows that gate you, in the sidebar and the home
footer.

```
OpenCode Go
Rolling    ░░░░░░░░░░   0%     2h 18m
Weekly     ███████░░░   87%    30h  0m
Monthly    ██████████ 100%   16d 16h
```

Each row is one window: the label hard left, the bar and percentage centred, the
reset countdown hard right.

The footer carries a one-line monthly summary. Run `/usage` (alias `/go-usage`, or
`Ctrl+G`) to show or hide the block. Showing it also re-checks, which is what
resumes polling after a rejected credential or a missing subscription stopped it.

## Why these three windows

Go meters a percentage per window, not a dollar budget you can see directly. The
underlying limits are monthly dollar amounts, and the shorter windows are
derived from them: rolling 5-hour is 20%, weekly is 50%, monthly is 100%. There
is no daily window, so this plugin does not invent one.

## No API key required

The plugin reuses the credential OpenCode already holds. Run `/connect` in
OpenCode and pick **OpenCode Go** (or `opencode auth login -p opencode-go`), and
OpenCode writes the key into its own auth store. The plugin reads it from there.

Credential resolution order:

1. `OPENCODE_API_KEY` in the environment, if you prefer to set it explicitly
2. OpenCode's `auth.json`, under the `opencode-go` provider key, falling back to
   the legacy `opencode` key
3. `OPENCODE_API_KEY` in a project `.env` file, since OpenCode does not load
   `.env` itself

So there is no separate Console service-account key to create, and no second
secret to manage.

## Install

There is no one-line installer yet. `opencode plugin add` cannot reach a package
that lives in a subdirectory of a larger repository, so clone and place the
folder yourself.

```sh
git clone --depth 1 https://github.com/kevin940726/agent-skills.git
```

Then copy `packages/go-usage` into a plugins directory. Global is the usual
choice, since Go usage is identical in every project:

```sh
# global, applies everywhere
cp -r agent-skills/packages/go-usage ~/.config/opencode/plugins/go-usage

# or per project
cp -r agent-skills/packages/go-usage /path/to/project/.opencode/plugins/go-usage
```

On Windows the global path is `%USERPROFILE%\.config\opencode\plugins\go-usage`.

Restart OpenCode, or run `opencode service restart` if the service is already
running.

Install it in exactly one place. Two registrations, whether a global copy and a
registered checkout or two checkouts, both declare the id `go-usage`, and the
second fails with `Duplicate plugin ID: go-usage` while the first silently keeps
serving, so edits to the one you are working in stop taking effect with nothing
to indicate why.

No build step and no `npm install` are needed. The compiled TUI entrypoint is
committed, and `@opentui/solid` and `solid-js` resolve from the host at runtime.

### Why not `opencode plugin add`

The obvious command does not work yet:

```sh
# documented, but fails
opencode plugin add 'github:kevin940726/agent-skills#main::path:packages/go-usage'
# -> Could not read package.json: ENOENT .../git-cloneXXXX/package.json
```

The `::path:` subdirectory selector is ignored. npm 11 reads `package.json` from
the repository root, where this package does not exist, and `plugin add` uses
Bun, which fails later at git-dep preparation. A git dependency whose
repository root *is* the package installs fine, so the selector is the only
broken part. The OpenCode docs describe `::path:` as supported; it is not, with
npm 11 or with the Bun build inside `plugin add`.

Until that changes, this package needs a repository of its own for
`opencode plugin add github:you/opencode-go-usage` to work.

### Registering a local path instead

If you keep a checkout, skip the copy and point config at it:

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["./packages/go-usage"]
}
```

Relative paths resolve from the config file holding the entry, which makes this
the better option while developing.

Neither process needs restarting, but the two sides need different things before
an edit is live.

The **server** reads `index.ts` directly and re-reads it on change. The
**terminal client** loads `./tui`, which `package.json` maps to the compiled
`tui/index.js`, so a `tui.tsx` edit needs `npm run build` first. The build is
committed to the repository precisely because installing from GitHub does not
run one.

The logging only covers the server half. Every `loading plugin` line in
`~/.local/share/opencode/log/opencode.log` is `role=server` with `entrypoint`
pointing at `index.ts`; the client's load of the `./tui` entry is not logged, in
any run, at any role. So a `role=server` line tells you the server reloaded and
its absence tells you nothing about the client. `opencode plugin` offers list,
add, check, update and remove, and none of them report a reload.

A build that exits zero and an import that does not throw are both weaker than
they look. Four defects in this plugin passed both and were only caught by
calling `setup()` and rendering the slots: a helper defined and never called, a
`layer()` result used as if it were a config object, a `this` that was not what
a `ref` callback received, and a name that was not in scope. Look at the running
UI.

## Behavior

- Polls every 5 minutes, and only while it has a usable credential.
- A rejected credential or a missing subscription stops the poll rather than
  retrying a dead endpoint. `/usage` re-checks and resumes if that changed.
- The request sets `redirect: "error"`, so the bearer header can never be
  forwarded to another origin.
- The token is stripped from any error text before it is displayed.
- State is held in memory only. Nothing is written to disk.
- A 403 carrying `EntitlementError` is reported as "not subscribed" rather than
  as a generic failure, so a missing subscription is not mistaken for a bad key.

## The endpoint

`GET https://opencode.ai/zen/go/v1/usage`, on the same surface as the Go
inference routes. It is not in the published docs, so treat the response shape
as a contract to validate rather than a guarantee: the plugin checks every field
and degrades to a readable message instead of rendering garbage.

## Development

Source lives in this repo, not in `node_modules`.

```sh
cd packages/go-usage
npm install
npm run build   # tui.tsx -> tui/index.js
```

`npm run build` is required after changing `tui.tsx`. The `./tui` export points
at the compiled `tui/index.js`, because raw JSX has no DOM output until the
Solid transform runs. `index.ts`, the server entrypoint, ships as TypeScript
source and needs no build.

`@opentui/*` and `solid-js` are declared as dependencies so npm installs them
when this package is installed from GitHub, but `build.tui.mjs` keeps them
external. The host owns the renderer instance, and bundling a second copy of
Solid produces "No renderer found" at render time.

`tui/index.js` is committed on purpose. Installing from GitHub does not run a
build, so shipping the compiled entry is what makes a fresh install work. If
you edit `tui.tsx`, rebuild and commit it, otherwise consumers keep the old
artifact.

Test it in place by registering the local path:

```jsonc title="opencode.jsonc"
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["./packages/go-usage"]
}
```

## Credits

The credential-resolution approach and the `EntitlementError` disambiguation
follow [opencode-quota](https://github.com/slkiser/opencode-quota) (MIT), which
solved OpenCode Go quota for OpenCode 1 first. Its published v4 does not load on
OpenCode 2, which is why this exists.

## License

MIT
