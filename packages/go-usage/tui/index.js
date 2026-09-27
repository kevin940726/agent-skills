// tui.tsx
import { createComponent as _$createComponent } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { memo as _$memo } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { For, Show, onCleanup } from "solid-js";

// status.ts
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
var USAGE_URL = "https://opencode.ai/zen/go/v1/usage";
var TOKEN_ENV = "OPENCODE_API_KEY";
var DEFAULT_POLL_MS = 5 * 6e4;
var REQUEST_TIMEOUT_MS = 1e4;
var AUTH_KEYS = ["opencode-go", "opencode"];
var WINDOWS = [
  { key: "rolling", label: "Rolling" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" }
];
function emptySnapshot(overrides = {}) {
  return { state: "unconfigured", windows: [], fetchedAt: null, detail: null, ...overrides };
}
function authPaths() {
  const home = homedir();
  const dirs = [
    process.env.XDG_DATA_HOME ? join(process.env.XDG_DATA_HOME, "opencode") : null,
    join(home, ".local", "share", "opencode"),
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, "opencode") : null,
    process.env.APPDATA ? join(process.env.APPDATA, "opencode") : null,
    join(home, "Library", "Application Support", "opencode"),
    join(home, ".opencode")
  ];
  return [...new Set(dirs.filter((d) => Boolean(d)))].map((dir) => join(dir, "auth.json"));
}
function tokenFromAuth(auth) {
  if (!auth || typeof auth !== "object") return null;
  const record = auth;
  for (const key of AUTH_KEYS) {
    const entry = record[key];
    if (!entry || typeof entry !== "object") continue;
    const { type, key: value } = entry;
    if (typeof value === "string" && value.trim() && (type === void 0 || type === "api")) {
      return value.trim();
    }
  }
  return null;
}
async function readAuthToken() {
  for (const path of authPaths()) {
    try {
      const parsed = JSON.parse(await readFile(path, "utf8"));
      const token = tokenFromAuth(parsed);
      if (token) return token;
    } catch {
    }
  }
  return null;
}
function resolveTokenFromEnv() {
  const value = process.env[TOKEN_ENV]?.trim();
  return value ? value : null;
}
async function resolveToken() {
  return resolveTokenFromEnv() ?? await readAuthToken();
}
function redact(text, token) {
  if (!token) return text;
  return text.replaceAll(token, "[redacted]").slice(0, 200);
}
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function normalizeWindow(key, label, value) {
  if (!isRecord(value)) return `${key} window is missing or malformed`;
  const { status, percent, resetsAt } = value;
  if (status !== "ok" && status !== "rate-limited") return `${key} status is not ok or rate-limited`;
  if (typeof percent !== "number" || !Number.isFinite(percent) || percent < 0 || percent > 100) {
    return `${key} percent must be a number from 0 to 100`;
  }
  if (typeof resetsAt !== "string" || Number.isNaN(Date.parse(resetsAt))) {
    return `${key} resetsAt must be an ISO timestamp`;
  }
  return {
    key,
    label,
    // A rate-limited window is by definition fully consumed. Carried on the
    // percentage rather than as a separate flag, because that is the only
    // thing the bar renders. The API's own status is not surfaced separately.
    percentUsed: status === "rate-limited" ? 100 : percent,
    resetsAt: new Date(resetsAt).toISOString()
  };
}
function normalizeUsage(body) {
  if (!isRecord(body)) return emptySnapshot({ state: "error", fetchedAt: Date.now(), detail: "response was not an object" });
  const usage = body.usage;
  if (!isRecord(usage)) return emptySnapshot({ state: "error", fetchedAt: Date.now(), detail: "response changed: no usage object" });
  const windows = [];
  for (const { key, label } of WINDOWS) {
    const result = normalizeWindow(key, label, usage[key]);
    if (typeof result === "string") {
      return emptySnapshot({ state: "error", fetchedAt: Date.now(), detail: `response changed: ${result}` });
    }
    windows.push(result);
  }
  return { state: "ok", windows, fetchedAt: Date.now(), detail: null };
}
function isNotSubscribed(status, body) {
  if (status !== 403 || !isRecord(body)) return false;
  const error = body.error;
  return body.type === "error" && isRecord(error) && error.type === "EntitlementError";
}
function isRetryableStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}
async function fetchUsage(token, signal) {
  let response;
  try {
    response = await fetch(USAGE_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      // Refuse redirects so the bearer header can never reach another origin.
      redirect: "error",
      signal
    });
  } catch {
    if (signal.aborted) throw new Error("aborted");
    return emptySnapshot({ state: "retryable", fetchedAt: Date.now(), detail: "network error" });
  }
  const text = await response.text().catch(() => "");
  let body;
  try {
    body = text ? JSON.parse(text) : void 0;
  } catch {
    body = void 0;
  }
  if (response.status === 401) {
    return emptySnapshot({
      state: "unauthenticated",
      fetchedAt: Date.now(),
      detail: "credential rejected. Run /connect in OpenCode and pick OpenCode Go"
    });
  }
  if (isNotSubscribed(response.status, body)) {
    return emptySnapshot({ state: "notSubscribed", fetchedAt: Date.now(), detail: "no Go subscription on this workspace" });
  }
  if (!response.ok) {
    const state = isRetryableStatus(response.status) ? "retryable" : "error";
    return emptySnapshot({ state, fetchedAt: Date.now(), detail: `HTTP ${response.status}: ${redact(text, token)}` });
  }
  return normalizeUsage(body);
}
var pad2 = (value) => String(value).padStart(2, " ");
var COUNTDOWN_WIDTH = 7;
var fit = (text) => text.padStart(COUNTDOWN_WIDTH);
var DAYS_MAX = 99;
function until(iso) {
  const target = Date.parse(iso);
  if (Number.isNaN(target)) return fit("unknown");
  const ms = target - Date.now();
  if (ms <= 0) return fit("now");
  const minutes = Math.round(ms / 6e4);
  if (minutes < 60) return fit(`${pad2(minutes)}m`);
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return fit(`${pad2(hours)}h ${pad2(minutes % 60)}m`);
  return fit(`${pad2(Math.min(DAYS_MAX, Math.floor(hours / 24)))}d ${pad2(hours % 24)}h`);
}
function bar(percentUsed, width) {
  const filled = Math.max(0, Math.min(width, Math.round(percentUsed / 100 * width)));
  return "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
}

// tui.tsx
var LABEL_WIDTH = Math.max(...WINDOWS.map((window) => window.label.length));
var BAR_WIDTH = 10;
var PERCENT_WIDTH = 3;
function CommandRoot(props) {
  const dispose = props.context.keymap.layer(() => ({
    mode: "global",
    priority: 10,
    commands: [{
      id: "go-usage.toggle",
      title: "Toggle OpenCode Go usage in the sidebar",
      group: "Go usage",
      bind: "ctrl+g",
      palette: true,
      slash: {
        name: "usage",
        aliases: ["go-usage"],
        arguments: false
      },
      enabled: () => true,
      suggested: true,
      run: props.run
    }],
    bindings: ["go-usage.toggle"]
  }));
  onCleanup(() => {
    if (typeof dispose === "function") dispose();
  });
  return null;
}
var tui_default = {
  id: "go-usage",
  setup(context) {
    console.log(`[go-usage] setup; location=${context.location?.directory ?? "-"}`);
    const [store, setStore] = context.storage.memory("goUsage", {
      initial: {
        snapshot: emptySnapshot({
          detail: `connecting to OpenCode Go`
        }),
        visible: true
      }
    });
    let timer;
    let inFlight;
    const apply = (next) => {
      console.log(`[go-usage] state=${next.state} windows=${next.windows.length} detail=${next.detail ?? "-"}`);
      setStore((draft) => {
        draft.snapshot.state = next.state;
        draft.snapshot.windows = next.windows;
        draft.snapshot.fetchedAt = next.fetchedAt;
        draft.snapshot.detail = next.detail;
      });
    };
    const stopPolling = () => {
      if (timer) clearInterval(timer);
      timer = void 0;
    };
    const startPolling = () => {
      if (timer) return;
      timer = setInterval(() => void refresh(), DEFAULT_POLL_MS);
    };
    async function refresh() {
      inFlight?.abort();
      const controller = new AbortController();
      inFlight = controller;
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const token = await resolveToken();
        if (!token) {
          apply(emptySnapshot({
            detail: `no credential found. Run /connect and pick OpenCode Go, or set ${TOKEN_ENV}`
          }));
          stopPolling();
          return;
        }
        const next = await fetchUsage(token, controller.signal);
        apply(next);
        if (next.state === "unauthenticated" || next.state === "notSubscribed" || next.state === "unconfigured") {
          stopPolling();
          return;
        }
        startPolling();
      } catch {
        if (!controller.signal.aborted) {
          apply(emptySnapshot({
            state: "retryable",
            fetchedAt: Date.now(),
            detail: "refresh failed"
          }));
        }
      } finally {
        clearTimeout(timeout);
        if (inFlight === controller) inFlight = void 0;
      }
    }
    const toggleVisible = () => {
      const next = !store.visible;
      setStore((draft) => {
        draft.visible = next;
      });
      if (next) void refresh();
    };
    const monthlySummary = () => {
      const current = store.snapshot;
      if (current.state !== "ok") return null;
      const monthly = current.windows.find((w) => w.key === "monthly");
      if (!monthly) return null;
      return `Go ${monthly.percentUsed}% used`;
    };
    const windowRow = (window) => (() => {
      var _el$ = _$createElement("box"), _el$2 = _$createElement("text"), _el$3 = _$createElement("text"), _el$4 = _$createElement("text");
      _$insertNode(_el$, _el$2);
      _$insertNode(_el$, _el$3);
      _$insertNode(_el$, _el$4);
      _$setProp(_el$, "flexDirection", "row");
      _$setProp(_el$, "width", "100%");
      _$setProp(_el$, "justifyContent", "space-between");
      _$setProp(_el$, "alignItems", "center");
      _$insert(_el$2, () => window.label.padEnd(LABEL_WIDTH));
      _$insert(_el$3, () => `${bar(window.percentUsed, BAR_WIDTH)} ${String(window.percentUsed).padStart(PERCENT_WIDTH)}%`);
      _$insert(_el$4, () => until(window.resetsAt));
      _$effect((_p$) => {
        var _v$ = context.theme.text.base, _v$2 = context.theme.text.base, _v$3 = context.theme.text.muted;
        _v$ !== _p$.e && (_p$.e = _$setProp(_el$2, "fg", _v$, _p$.e));
        _v$2 !== _p$.t && (_p$.t = _$setProp(_el$3, "fg", _v$2, _p$.t));
        _v$3 !== _p$.a && (_p$.a = _$setProp(_el$4, "fg", _v$3, _p$.a));
        return _p$;
      }, {
        e: void 0,
        t: void 0,
        a: void 0
      });
      return _el$;
    })();
    const diagnostic = () => {
      const current = store.snapshot;
      return current.detail ?? current.state;
    };
    const disposables = [context.ui.slot({
      append: "sidebar.content",
      // The <box> is unconditional and the visibility test below it is a plain
      // `{cond && ...}`, not a <Show>. A <Show> whose `when` is false resolves
      // to nothing, and the reconciler then throws `Orphan text error: "" must
      // have a <text> as a parent: __root__`. Wrapping it in a <box> does not
      // help; the throw just moves to the box. The inner <Show> is safe because
      // it always resolves to one branch or the other.
      //
      // While visible, always render the header and, on failure, a diagnostic
      // line. A block that renders nothing at all is indistinguishable from a
      // broken one.
      render: () => (() => {
        var _el$5 = _$createElement("box");
        _$setProp(_el$5, "flexDirection", "column");
        _$insert(_el$5, (() => {
          var _c$ = _$memo(() => !!store.visible);
          return () => _c$() && [(() => {
            var _el$6 = _$createElement("text");
            _$insertNode(_el$6, _$createTextNode(`OpenCode Go`));
            _$effect((_$p) => _$setProp(_el$6, "fg", context.theme.text.muted, _$p));
            return _el$6;
          })(), _$createComponent(Show, {
            get when() {
              return store.snapshot.state === "ok";
            },
            get fallback() {
              return (() => {
                var _el$8 = _$createElement("text");
                _$insert(_el$8, diagnostic);
                _$effect((_$p) => _$setProp(_el$8, "fg", context.theme.text.muted, _$p));
                return _el$8;
              })();
            },
            get children() {
              return _$createComponent(For, {
                get each() {
                  return store.snapshot.windows;
                },
                children: (window) => windowRow(window)
              });
            }
          })];
        })());
        return _el$5;
      })()
    }), context.ui.slot({
      append: "home.footer.status",
      // Same expression form and the same reason: this slot's root is itself
      // the conditional, so there is no enclosing <box> to absorb the throw.
      // `summary` is read once, since the guard and the child would otherwise
      // each call monthlySummary().
      render: () => {
        const summary = store.visible ? monthlySummary() : null;
        return (() => {
          var _el$9 = _$createElement("box");
          _$insert(_el$9, summary && (() => {
            var _el$0 = _$createElement("text");
            _$insert(_el$0, summary);
            _$effect((_$p) => _$setProp(_el$0, "fg", context.theme.text.muted, _$p));
            return _el$0;
          })());
          return _el$9;
        })();
      }
    }), context.ui.slot({
      append: "app",
      render: () => _$createComponent(CommandRoot, {
        context,
        run: toggleVisible
      })
    })];
    void refresh();
    return () => {
      stopPolling();
      inFlight?.abort();
      for (const dispose of disposables) {
        if (typeof dispose === "function") dispose();
      }
    };
  }
};
export {
  tui_default as default
};
