/**
 * OpenCode Go usage: credential resolution, fetch, and parse.
 *
 * Design notes
 *
 * The endpoint is `https://opencode.ai/zen/go/v1/usage`, part of the same
 * documented surface as the Go inference routes. It reports a percentage per
 * window, so there is no currency math here at all.
 *
 * Credentials come from OpenCode's own store first, through the client the host
 * hands the plugin (`credential.list`, the `GET /api/credential` route), so the
 * plugin never asks the user to create and manage a separate Console
 * service-account key. That route is the one surface that survives OpenCode 2's
 * storage change: OpenCode 2 keeps credentials in its own store and no longer
 * maintains OpenCode 1's `auth.json`, which is what the file fallback below is
 * left reading. An explicit environment variable still wins over both.
 *
 * Nothing here imports OpenCode, so this file stays testable on its own and
 * survives a change of client.
 */

import { readFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

export const USAGE_URL = "https://opencode.ai/zen/go/v1/usage"
export const TOKEN_ENV = "OPENCODE_API_KEY"
export const DEFAULT_POLL_MS = 5 * 60_000
export const REQUEST_TIMEOUT_MS = 10_000

/**
 * Integration ids OpenCode may have stored the Go credential under.
 * `opencode-go` is what `/connect` uses; `opencode` is the legacy alias.
 * Ordered by priority: the first id that yields a usable key wins.
 */
const AUTH_KEYS = ["opencode-go", "opencode"] as const

export type WindowKey = "rolling" | "weekly" | "monthly"

export const WINDOWS: ReadonlyArray<{ key: WindowKey; label: string }> = [
  { key: "rolling", label: "Rolling" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
]

export type Window = {
  key: WindowKey
  label: string
  /** 0-100. A rate-limited window reports 100, since it is fully consumed. */
  percentUsed: number
  resetsAt: string
}

export type UsageState =
  /** Parsed successfully. */
  | "ok"
  /** Authenticated, but this workspace has no Go subscription. */
  | "notSubscribed"
  /** 401: the stored credential is missing, stale, or rejected. */
  | "unauthenticated"
  /** No credential could be found anywhere. */
  | "unconfigured"
  /** Rate limited or a server-side fault. Safe to retry later. */
  | "retryable"
  /** Unexpected status or a changed response contract. */
  | "error"

export type UsageSnapshot = {
  state: UsageState
  windows: Window[]
  fetchedAt: number | null
  detail: string | null
}

export function emptySnapshot(overrides: Partial<UsageSnapshot> = {}): UsageSnapshot {
  return { state: "unconfigured", windows: [], fetchedAt: null, detail: null, ...overrides }
}

/** Candidate auth.json locations, most likely first. */
export function authPaths(): string[] {
  const home = homedir()
  const dirs = [
    process.env.XDG_DATA_HOME ? join(process.env.XDG_DATA_HOME, "opencode") : null,
    join(home, ".local", "share", "opencode"),
    process.env.LOCALAPPDATA ? join(process.env.LOCALAPPDATA, "opencode") : null,
    process.env.APPDATA ? join(process.env.APPDATA, "opencode") : null,
    join(home, "Library", "Application Support", "opencode"),
    join(home, ".opencode"),
  ]
  return [...new Set(dirs.filter((d): d is string => Boolean(d)))].map((dir) => join(dir, "auth.json"))
}

/**
 * Pull the Go API key out of OpenCode 1's already-parsed `auth.json`.
 *
 * Superseded by {@link tokenFromCredentials} for anything on OpenCode 2, which
 * stopped maintaining this file. Kept because the read is free and it is the only
 * fallback when the host hands the plugin no client.
 *
 * Accepts both credential type spellings: OpenCode 1 wrote `"api"`, OpenCode 2
 * writes `"key"`.
 */
export function tokenFromAuth(auth: unknown): string | null {
  if (!isRecord(auth)) return null
  for (const id of AUTH_KEYS) {
    const entry = auth[id]
    if (!isRecord(entry)) continue
    const { type, key: value } = entry
    const usable = type === undefined || type === "api" || type === "key"
    if (usable && typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

/**
 * Pull the Go API key out of the credential list behind `GET /api/credential`.
 *
 * This is the supported read, and the one that fixes the failure the file read
 * caused: OpenCode 2 keeps credentials in its own store, so `auth.json` holds a
 * key that was rotated and expired out from under it. A credential is a
 * discriminated union, so only `type: "key"` carries a bearer token; an `oauth`
 * or `external` entry is skipped.
 *
 * A credential the server marks inactive is skipped, and `opencode-go` is tried
 * before the legacy `opencode` id, so a workspace holding both resolves the way
 * the host would. A missing `active` field counts as active: the server always
 * sends it, so a false negative would cost more than a stale read.
 *
 * Accepts either the wrapped `{ data: [...] }` the HTTP route returns or a bare
 * array, because the generated client and the raw route do not agree on that.
 */
export function tokenFromCredentials(payload: unknown): string | null {
  const entries = isRecord(payload) && Array.isArray(payload.data) ? payload.data : payload
  if (!Array.isArray(entries)) return null

  for (const id of AUTH_KEYS) {
    for (const entry of entries) {
      if (!isRecord(entry) || entry.integrationID !== id) continue
      if (entry.active === false) continue
      const value = entry.value
      if (!isRecord(value) || value.type !== "key") continue
      const secret = typeof value.key === "string" ? value.key.trim() : ""
      if (secret) return secret
    }
  }
  return null
}

export async function readAuthToken(): Promise<string | null> {
  for (const path of authPaths()) {
    try {
      const parsed = JSON.parse(await readFile(path, "utf8")) as unknown
      const token = tokenFromAuth(parsed)
      if (token) return token
    } catch {
      // Missing or unreadable; try the next candidate.
    }
  }
  return null
}

export function resolveTokenFromEnv(): string | null {
  const value = process.env[TOKEN_ENV]?.trim()
  return value ? value : null
}

/** Loads the credential list the host's client exposes, e.g. `credential.list`. */
export type CredentialLoader = () => Promise<unknown>

/**
 * Environment override, then the host's credential store, then `auth.json`.
 *
 * The loader is injected rather than imported so this file keeps no dependency
 * on OpenCode and stays testable on its own. A loader that is absent, or that
 * throws because this host exposes no client, degrades to the file read rather
 * than failing the poll.
 *
 * Throws when the store read itself failed and nothing else resolved. That is
 * not the same as "no credential": the credential may exist and merely be
 * unreadable, and reporting that as a missing one sends the user to `/connect`
 * over a working login. A store that answers and holds no Go credential is not
 * an error, and returns null.
 */
export async function resolveToken(loadCredentials?: CredentialLoader): Promise<string | null> {
  const fromEnv = resolveTokenFromEnv()
  if (fromEnv) return fromEnv

  let storeFailure: unknown
  if (loadCredentials) {
    try {
      const fromStore = tokenFromCredentials(await loadCredentials())
      if (fromStore) return fromStore
    } catch (error) {
      // Held, not discarded: the file read below still has to run, because a
      // host with no client at all reaches this catch on every load.
      storeFailure = error
    }
  }

  const fromFile = await readAuthToken()
  if (fromFile) return fromFile

  if (storeFailure !== undefined) throw storeFailure
  return null
}

/** Never let a token reach an error string or a log line. */
export function redact(text: string, token: string | null): string {
  if (!token) return text
  return text.replaceAll(token, "[redacted]").slice(0, 200)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function normalizeWindow(key: WindowKey, label: string, value: unknown): Window | string {
  if (!isRecord(value)) return `${key} window is missing or malformed`
  const { status, percent, resetsAt } = value
  if (status !== "ok" && status !== "rate-limited") return `${key} status is not ok or rate-limited`
  if (typeof percent !== "number" || !Number.isFinite(percent) || percent < 0 || percent > 100) {
    return `${key} percent must be a number from 0 to 100`
  }
  if (typeof resetsAt !== "string" || Number.isNaN(Date.parse(resetsAt))) {
    return `${key} resetsAt must be an ISO timestamp`
  }
  return {
    key,
    label,
    // A rate-limited window is by definition fully consumed. Carried on the
    // percentage rather than as a separate flag, because that is the only
    // thing the bar renders. The API's own status is not surfaced separately.
    percentUsed: status === "rate-limited" ? 100 : percent,
    resetsAt: new Date(resetsAt).toISOString(),
  }
}

export function normalizeUsage(body: unknown): UsageSnapshot {
  if (!isRecord(body)) return emptySnapshot({ state: "error", fetchedAt: Date.now(), detail: "response was not an object" })
  const usage = body.usage
  if (!isRecord(usage)) return emptySnapshot({ state: "error", fetchedAt: Date.now(), detail: "response changed: no usage object" })

  const windows: Window[] = []
  for (const { key, label } of WINDOWS) {
    const result = normalizeWindow(key, label, usage[key])
    if (typeof result === "string") {
      return emptySnapshot({ state: "error", fetchedAt: Date.now(), detail: `response changed: ${result}` })
    }
    windows.push(result)
  }
  return { state: "ok", windows, fetchedAt: Date.now(), detail: null }
}

/** 403 with this body means "no Go subscription", not "bad credential". */
export function isNotSubscribed(status: number, body: unknown): boolean {
  if (status !== 403 || !isRecord(body)) return false
  const error = body.error
  return body.type === "error" && isRecord(error) && error.type === "EntitlementError"
}

/**
 * The server's own explanation for a rejected credential, when it sends one.
 *
 * Worth surfacing rather than swallowing: `api_key_expired` is the common case,
 * and the generic sentence points at `/connect`, which cannot renew a key the
 * console issued. Redacted and truncated by the caller before it is displayed.
 */
export function authErrorDetail(body: unknown): string | null {
  if (!isRecord(body)) return null
  const error = body.error
  if (!isRecord(error)) return null
  const message = error.message
  return typeof message === "string" && message.trim() ? message.trim() : null
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500
}

export async function fetchUsage(token: string, signal: AbortSignal): Promise<UsageSnapshot> {
  let response: Response
  try {
    response = await fetch(USAGE_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      // Refuse redirects so the bearer header can never reach another origin.
      redirect: "error",
      signal,
    })
  } catch {
    if (signal.aborted) throw new Error("aborted")
    return emptySnapshot({ state: "retryable", fetchedAt: Date.now(), detail: "network error" })
  }

  const text = await response.text().catch(() => "")
  let body: unknown
  try {
    body = text ? JSON.parse(text) : undefined
  } catch {
    body = undefined
  }

  if (response.status === 401) {
    const reason = authErrorDetail(body)
    return emptySnapshot({
      state: "unauthenticated",
      fetchedAt: Date.now(),
      detail: reason
        ? redact(reason, token)
        : "credential rejected. Run /connect in OpenCode and pick OpenCode Go",
    })
  }
  if (isNotSubscribed(response.status, body)) {
    return emptySnapshot({ state: "notSubscribed", fetchedAt: Date.now(), detail: "no Go subscription on this workspace" })
  }
  if (!response.ok) {
    const state: UsageState = isRetryableStatus(response.status) ? "retryable" : "error"
    return emptySnapshot({ state, fetchedAt: Date.now(), detail: `HTTP ${response.status}: ${redact(text, token)}` })
  }

  return normalizeUsage(body)
}

/**
 * Every numeric field in a countdown is padded to two columns, so the string
 * width does not change as the value ticks down. Without it "2h 18m" shrinks
 * to "1h 18m" and then "0h 18m" over two hours, shifting everything after it
 * in the sidebar by one column each time.
 *
 * Padded with a space rather than a zero. " 2h 18m" reads as time remaining,
 * where "02h 18m" reads as a time of day, and this figure counts down rather
 * than telling you when something happens. "now" and "unknown" are words
 * rather than numbers, so they are left alone here and right-aligned by
 * COUNTDOWN_WIDTH below.
 */
const pad2 = (value: number) => String(value).padStart(2, " ")

/**
 * Columns every countdown occupies, whatever the unit count.
 *
 * The two-unit forms are 7 columns by construction, but a sub-hour reset
 * renders as a single unit and is only 3. That difference is not cosmetic: the
 * sidebar lays each row out with space-between, and space-between only truly
 * centres the middle child when the two outer children are the same width. A
 * 3-column countdown beside a 7-column label slides the bar and percentage a
 * couple of columns, so the column shifts whenever one window drops under an
 * hour. Pinning the whole string to 7 keeps the label and countdown equal, so
 * the centred group stays centred.
 */
const COUNTDOWN_WIDTH = 7

/**
 * Right-aligns a countdown to COUNTDOWN_WIDTH. padStart rather than padEnd, so
 * the text hugs the right edge where the sidebar's space-between puts it, and
 * the trailing unit lines up across forms: "    45m", " 5h 45m" and "16d 16h"
 * all end on the same column.
 */
const fit = (text: string) => text.padStart(COUNTDOWN_WIDTH)

/**
 * Largest day count that still fits COUNTDOWN_WIDTH. pad2 only guarantees two
 * columns, so a three-digit day would push the countdown to 8 and break the
 * invariant the sidebar row alignment depends on: a 100+ day reset rendered one
 * column wider, which is exactly the per-row rounding that misaligns the bar
 * and percentage. No Go window is anywhere near 99 days, so clamping here costs
 * nothing real and keeps the layout sound against an unvalidated response.
 */
const DAYS_MAX = 99

/** Coarse "resets in 4h 12m". Recomputed on render, not on a timer. */
export function until(iso: string): string {
  const target = Date.parse(iso)
  if (Number.isNaN(target)) return fit("unknown")
  const ms = target - Date.now()
  if (ms <= 0) return fit("now")
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return fit(`${pad2(minutes)}m`)
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return fit(`${pad2(hours)}h ${pad2(minutes % 60)}m`)
  return fit(`${pad2(Math.min(DAYS_MAX, Math.floor(hours / 24)))}d ${pad2(hours % 24)}h`)
}

export function bar(percentUsed: number, width: number): string {
  const filled = Math.max(0, Math.min(width, Math.round((percentUsed / 100) * width)))
  return "█".repeat(filled) + "░".repeat(width - filled)
}
