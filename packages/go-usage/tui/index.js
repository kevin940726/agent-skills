// tui.tsx
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { memo as _$memo } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { createComponent as _$createComponent } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { For, Show } from "solid-js";

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
  { key: "rolling", label: "5h rolling" },
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
function parseDotEnv(raw) {
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const body = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const eq = body.indexOf("=");
    if (eq <= 0) continue;
    const key = body.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = body.slice(eq + 1).trim();
    if (value.length >= 2 && (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}
function resolveTokenFromEnv() {
  const value = process.env[TOKEN_ENV]?.trim();
  return value ? value : null;
}
async function resolveToken(directory) {
  return resolveTokenFromEnv() ?? await readAuthToken() ?? await readDotEnvToken(directory);
}
async function readDotEnvToken(directory) {
  if (!directory) return null;
  try {
    return parseDotEnv(await readFile(join(directory, ".env"), "utf8"))[TOKEN_ENV]?.trim() || null;
  } catch {
    return null;
  }
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
  const exhausted = status === "rate-limited";
  return {
    key,
    label,
    // A rate-limited window is by definition fully consumed.
    percentUsed: exhausted ? 100 : percent,
    resetsAt: new Date(resetsAt).toISOString(),
    exhausted
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
function until(iso) {
  const target = Date.parse(iso);
  if (Number.isNaN(target)) return "unknown";
  const ms = target - Date.now();
  if (ms <= 0) return "now";
  const minutes = Math.round(ms / 6e4);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}
function bar(percentUsed, width = 10) {
  const filled = Math.max(0, Math.min(width, Math.round(percentUsed / 100 * width)));
  return "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
}

// tui.tsx
var POLL_MS = DEFAULT_POLL_MS;
var tui_default = {
  id: "go-usage",
  setup(context) {
    const [snapshot, setSnapshot] = context.storage.memory("goUsage", {
      initial: emptySnapshot({
        detail: `connecting to OpenCode Go`
      })
    });
    let timer;
    let inFlight;
    const apply = (next) => setSnapshot((draft) => {
      draft.state = next.state;
      draft.windows = next.windows;
      draft.fetchedAt = next.fetchedAt;
      draft.detail = next.detail;
    });
    const stopPolling = () => {
      if (timer) clearInterval(timer);
      timer = void 0;
    };
    const startPolling = () => {
      if (timer) return;
      timer = setInterval(() => void refresh(), POLL_MS);
    };
    async function refresh() {
      inFlight?.abort();
      const controller = new AbortController();
      inFlight = controller;
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const token = await resolveToken(context.location?.directory);
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
    const monthlySummary = () => {
      const current = snapshot();
      if (current.state !== "ok") return null;
      const monthly = current.windows.find((w) => w.key === "monthly");
      if (!monthly) return null;
      return `Go ${monthly.percentUsed}% used`;
    };
    const line = (label, percentUsed) => `${label} ${bar(percentUsed)} ${String(percentUsed).padStart(3)}%`;
    const showDetail = () => {
      const current = snapshot();
      context.ui.dialog.show(() => (() => {
        var _el$ = _$createElement("box");
        _$insert(_el$, _$createComponent(Show, {
          get when() {
            return current.state === "ok";
          },
          get fallback() {
            return (() => {
              var _el$2 = _$createElement("text");
              _$insert(_el$2, () => current.detail ?? current.state);
              _$effect((_$p) => _$setProp(_el$2, "fg", context.theme.text.base, _$p));
              return _el$2;
            })();
          },
          get children() {
            return _$createComponent(For, {
              get each() {
                return current.windows;
              },
              children: (window) => (() => {
                var _el$3 = _$createElement("text");
                _$insert(_el$3, () => `${line(window.label, window.percentUsed)}   resets in ${until(window.resetsAt)}`);
                _$effect((_$p) => _$setProp(_el$3, "fg", context.theme.text.base, _$p));
                return _el$3;
              })()
            });
          }
        }));
        return _el$;
      })(), () => context.ui.dialog.clear());
    };
    const openDetail = async () => {
      await refresh();
      showDetail();
    };
    const disposables = [context.ui.slot({
      append: "sidebar.content",
      render: () => _$createComponent(Show, {
        get when() {
          return snapshot().state === "ok";
        },
        get children() {
          var _el$4 = _$createElement("box"), _el$5 = _$createElement("text");
          _$insertNode(_el$4, _el$5);
          _$insertNode(_el$5, _$createTextNode(`OpenCode Go`));
          _$insert(_el$4, _$createComponent(For, {
            get each() {
              return snapshot().windows;
            },
            children: (window) => (() => {
              var _el$7 = _$createElement("text");
              _$insert(_el$7, () => line(window.label, window.percentUsed));
              _$effect((_$p) => _$setProp(_el$7, "fg", context.theme.text.base, _$p));
              return _el$7;
            })()
          }), null);
          _$effect((_$p) => _$setProp(_el$5, "fg", context.theme.text.muted, _$p));
          return _el$4;
        }
      })
    }), context.ui.slot({
      append: "home.footer.status",
      render: () => _$createComponent(Show, {
        get when() {
          return monthlySummary();
        },
        children: (summary) => (() => {
          var _el$8 = _$createElement("text");
          _$insert(_el$8, summary);
          _$effect((_$p) => _$setProp(_el$8, "fg", context.theme.text.muted, _$p));
          return _el$8;
        })()
      })
    }), context.keymap.layer(() => ({
      mode: "global",
      priority: 10,
      commands: [{
        id: "go-usage.show",
        title: "Show OpenCode Go usage",
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
        run: openDetail
      }],
      bindings: ["go-usage.show"]
    }))];
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
