/**
 * OpenCode Go usage: credential resolution, fetch, and parse.
 *
 * Design notes
 *
 * The endpoint is `https://opencode.ai/zen/go/v1/usage`, part of the same
 * documented surface as the Go inference routes. It reports a percentage per
 * window, so there is no currency math here at all.
 *
 * Credentials come from OpenCode's own auth store first. Running `/connect`
 * (or `opencode auth login -p opencode-go`) makes OpenCode write the Go key
 * into its data directory, so the plugin never asks the user to create and
 * manage a separate Console service-account key. An explicit environment
 * variable still wins, for people who prefer that.
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
 * Provider keys OpenCode may have written the Go credential under.
 * `opencode-go` is what `/connect` uses; `opencode` is the legacy alias.
 */
const AUTH_KEYS = ["opencode-go", "opencode"] as const

export type WindowKey = "rolling" | "weekly" | "monthly"

export const WINDOWS: ReadonlyArray<{ key: WindowKey; label: string }> = [
  { key: "rolling", label: "5h rolling" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
]

export type Window = {
  key: WindowKey
  label: string
  /** 0-100. Exhausted windows report 100. */
  percentUsed: number
  resetsAt: string
  exhausted: boolean
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

/** Pull the Go API key out of an already-parsed auth.json. */
export function tokenFromAuth(auth: unknown): string | null {
  if (!auth || typeof auth !== "object") return null
  const record = auth as Record<string, unknown>
  for (const key of AUTH_KEYS) {
    const entry = record[key]
    if (!entry || typeof entry !== "object") continue
    const { type, key: value } = entry as Record<string, unknown>
    if (typeof value === "string" && value.trim() && (type === undefined || type === "api")) {
      return value.trim()
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

/** Minimal .env reader, for the case where someone keeps the key in a file. */
export function parseDotEnv(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const body = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed
    const eq = body.indexOf("=")
    if (eq <= 0) continue
    const key = body.slice(0, eq).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue
    let value = body.slice(eq + 1).trim()
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

export function resolveTokenFromEnv(): string | null {
  const value = process.env[TOKEN_ENV]?.trim()
  return value ? value : null
}

export async function resolveToken(directory: string | undefined): Promise<string | null> {
  return resolveTokenFromEnv() ?? (await readAuthToken()) ?? (await readDotEnvToken(directory))
}

async function readDotEnvToken(directory: string | undefined): Promise<string | null> {
  if (!directory) return null
  try {
    return parseDotEnv(await readFile(join(directory, ".env"), "utf8"))[TOKEN_ENV]?.trim() || null
  } catch {
    return null
  }
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
  const exhausted = status === "rate-limited"
  return {
    key,
    label,
    // A rate-limited window is by definition fully consumed.
    percentUsed: exhausted ? 100 : percent,
    resetsAt: new Date(resetsAt).toISOString(),
    exhausted,
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
    return emptySnapshot({
      state: "unauthenticated",
      fetchedAt: Date.now(),
      detail: "credential rejected. Run /connect in OpenCode and pick OpenCode Go",
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

/** Coarse "resets in 4h 12m". Recomputed on render, not on a timer. */
export function until(iso: string): string {
  const target = Date.parse(iso)
  if (Number.isNaN(target)) return "unknown"
  const ms = target - Date.now()
  if (ms <= 0) return "now"
  const minutes = Math.round(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `${hours}h ${minutes % 60}m`
  return `${Math.floor(hours / 24)}d ${hours % 24}h`
}

export function bar(percentUsed: number, width = 10): string {
  const filled = Math.max(0, Math.min(width, Math.round((percentUsed / 100) * width)))
  return "█".repeat(filled) + "░".repeat(width - filled)
}
