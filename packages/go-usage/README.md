# opencode-go-usage

OpenCode TUI plugin showing your [OpenCode Go](https://opencode.ai/v2/docs/console/go/)
usage against the three windows that gate you, in the sidebar and the home
footer.

```
OpenCode Go
5h rolling ░░░░░░░░░░   0%
Weekly     █░░░░░░░░░░   1%
Monthly    █░░░░░░░░░░   1%
```

The footer carries a one-line monthly summary. Run `/go` (or `Ctrl+G`) to
refresh on demand and open a dialog with reset countdowns.

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

```sh
opencode plugin add 'github:kevin940726/agent-skills#main::path:packages/go-usage'
```

The `::path:` selector points at this package inside the monorepo, so no
publishing step is involved. Pin a commit hash instead of `main` if you want
reproducible installs.

To wire it up by hand, add the same spec to `plugins` in `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:kevin940726/agent-skills#main::path:packages/go-usage"]
}
```

## Behavior

- Polls every 5 minutes, and only while it has a usable credential.
- A rejected credential or a missing subscription stops the poll rather than
  retrying a dead endpoint. `/go` re-checks and resumes if that changed.
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
