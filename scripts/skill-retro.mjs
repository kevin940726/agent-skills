#!/usr/bin/env node
// Skill usage retro from OpenCode's local session database.
// Usage: node scripts/skill-retro.mjs [--days 30] [--json] [--db PATH]
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"

const args = process.argv.slice(2)
const opts = { days: 30, json: false, db: null, help: false }
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  const next = () => {
    const v = args[++i]
    if (v === undefined) {
      console.error(`${a} requires a value`)
      process.exit(1)
    }
    return v
  }
  if (a === "--days") opts.days = Number(next())
  else if (a.startsWith("--days=")) opts.days = Number(a.slice(7))
  else if (a === "--json") opts.json = true
  else if (a === "--db") opts.db = next()
  else if (a.startsWith("--db=")) opts.db = a.slice(5)
  else if (a === "--help" || a === "-h") opts.help = true
  else {
    console.error(`Unknown arg: ${a}`)
    process.exit(1)
  }
}

if (opts.help) {
  console.log(`Usage: node scripts/skill-retro.mjs [--days N] [--json] [--db PATH]

Reads OpenCode's local session database and reports which skills the agent
actually loaded through the skill tool. Default window: 30 days.

Environment:
  OPENCODE_DB  Override the database path.
`)
  process.exit(0)
}

if (!Number.isFinite(opts.days) || opts.days <= 0) {
  console.error("--days must be a positive number")
  process.exit(1)
}

const dbPath = opts.db || process.env.OPENCODE_DB || join(homedir(), ".local", "share", "opencode", "opencode.db")
if (!existsSync(dbPath)) {
  console.error(`OpenCode database not found: ${dbPath}`)
  process.exit(1)
}

const since = Date.now() - opts.days * 86_400_000
const db = new DatabaseSync(dbPath, { readOnly: true })

const legacyRows = db
  .prepare(
    `select
       coalesce(json_extract(p.data, '$.state.input.name'), json_extract(p.data, '$.state.input.id')) as skill,
       p.session_id as session_id,
       p.time_created as ts,
       json_extract(p.data, '$.callID') as call_id,
       json_extract(p.data, '$.state.status') as status,
       coalesce(s2.directory, s1.directory) as directory,
       coalesce(s2.parent_id, s1.parent_id) as parent_id
     from part p
     left join session_v2 s2 on s2.id = p.session_id
     left join session s1 on s1.id = p.session_id
     where json_extract(p.data, '$.type') = 'tool'
       and json_extract(p.data, '$.tool') = 'skill'
       and coalesce(json_extract(p.data, '$.state.input.name'), json_extract(p.data, '$.state.input.id')) is not null`,
  )
  .all()

const v2Rows = db
  .prepare(
    `select
       coalesce(json_extract(j.value, '$.state.input.name'), json_extract(j.value, '$.state.input.id')) as skill,
       m.session_id as session_id,
       coalesce(json_extract(j.value, '$.time.created'), m.time_created) as ts,
       json_extract(j.value, '$.id') as call_id,
       json_extract(j.value, '$.state.status') as status,
       coalesce(s2.directory, s1.directory) as directory,
       coalesce(s2.parent_id, s1.parent_id) as parent_id
     from session_message m, json_each(json_extract(m.data, '$.content')) j
     left join session_v2 s2 on s2.id = m.session_id
     left join session s1 on s1.id = m.session_id
     where m.type = 'assistant'
       and json_extract(j.value, '$.type') = 'tool'
       and json_extract(j.value, '$.name') = 'skill'
       and coalesce(json_extract(j.value, '$.state.input.name'), json_extract(j.value, '$.state.input.id')) is not null`,
  )
  .all()

const seen = new Set()
const rows = []
for (const row of [...legacyRows, ...v2Rows]) {
  const key = row.call_id ? `${row.session_id}:${row.call_id}` : `${row.session_id}:${row.ts}:${row.skill}`
  if (seen.has(key)) continue
  seen.add(key)
  rows.push(row)
}

const skills = new Map()
for (const row of rows) {
  const name = String(row.skill)
  let item = skills.get(name)
  if (!item) {
    item = {
      skill: name,
      calls: 0,
      sessions: new Set(),
      projects: new Set(),
      mainCalls: 0,
      subagentCalls: 0,
      errors: 0,
      firstAt: row.ts,
      lastAt: row.ts,
      windowCalls: 0,
      windowSessions: new Set(),
      windowMainCalls: 0,
      windowSubagentCalls: 0,
      windowErrors: 0,
      windowLastAt: 0,
    }
    skills.set(name, item)
  }
  item.calls++
  item.sessions.add(row.session_id)
  if (row.directory) item.projects.add(row.directory)
  if (row.parent_id) item.subagentCalls++
  else item.mainCalls++
  if (row.status && row.status !== "completed") item.errors++
  if (row.ts < item.firstAt) item.firstAt = row.ts
  if (row.ts > item.lastAt) item.lastAt = row.ts
  if (row.ts >= since) {
    item.windowCalls++
    item.windowSessions.add(row.session_id)
    if (row.parent_id) item.windowSubagentCalls++
    else item.windowMainCalls++
    if (row.status && row.status !== "completed") item.windowErrors++
    if (row.ts > item.windowLastAt) item.windowLastAt = row.ts
  }
}

function roots() {
  return [
    join(homedir(), ".agents", "skills"),
    join(homedir(), ".claude", "skills"),
    join(homedir(), ".config", "opencode", "skills"),
  ]
}

function parseDescription(text) {
  const match = text.replace(/\r\n/g, "\n").match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return ""
  const lines = match[1].split("\n")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const m = line.match(/^description:\s*(.*)$/)
    if (!m) continue
    const inline = m[1].trim()
    if (inline && !/^[>|][+-]?$/.test(inline)) return inline.replace(/^["']|["']$/g, "")
    const out = []
    for (let j = i + 1; j < lines.length; j++) {
      if (!/^\s+/.test(lines[j])) break
      const value = lines[j].trim()
      if (value) out.push(value)
    }
    return out.join(" ")
  }
  return ""
}

const available = new Map()
for (const root of roots()) {
  if (!existsSync(root)) continue
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const file = join(root, entry.name, "SKILL.md")
    if (!existsSync(file)) continue
    try {
      const text = readFileSync(file, "utf8")
      const desc = parseDescription(text)
      const frontmatter = text.replace(/\r\n/g, "\n").match(/^---\s*\n([\s\S]*?)\n---/)
      const nameLine = frontmatter?.[1].match(/^name:\s*(.+)$/m)
      const skillName = nameLine ? nameLine[1].trim().replace(/^["']|["']$/g, "") : entry.name
      available.set(skillName, {
        skill: skillName,
        descriptionChars: desc.length,
        contextTokens: Math.ceil((skillName.length + desc.length) / 4),
        source: root,
      })
    } catch {
      available.set(entry.name, { skill: entry.name, descriptionChars: 0, contextTokens: 0, source: root })
    }
  }
}

const usedWindow = [...skills.values()]
  .filter((s) => s.windowCalls > 0)
  .sort((a, b) => b.windowCalls - a.windowCalls || a.skill.localeCompare(b.skill))

const neverWindow = [...available.values()]
  .filter((a) => !skills.get(a.skill)?.windowCalls)
  .map((a) => {
    const s = skills.get(a.skill)
    return {
      ...a,
      lastAt: s?.lastAt ?? null,
      callsAllTime: s?.calls ?? 0,
      daysSinceLast: s?.lastAt ? Math.floor((Date.now() - s.lastAt) / 86_400_000) : null,
    }
  })
  .sort((a, b) => {
    const da = a.daysSinceLast ?? Number.MAX_SAFE_INTEGER
    const db = b.daysSinceLast ?? Number.MAX_SAFE_INTEGER
    return db - da || b.contextTokens - a.contextTokens || a.skill.localeCompare(b.skill)
  })

const totals = {
  windowDays: opts.days,
  since: new Date(since).toISOString(),
  db: dbPath,
  usedSkills: usedWindow.length,
  usedCalls: usedWindow.reduce((n, s) => n + s.windowCalls, 0),
  usedSessions: new Set(usedWindow.flatMap((s) => [...s.windowSessions])).size,
  availableSkills: available.size,
  neverUsedInWindow: neverWindow.length,
}

const detail = usedWindow.map((s) => ({
  skill: s.skill,
  calls: s.windowCalls,
  sessions: s.windowSessions.size,
  mainCalls: s.windowMainCalls,
  subagentCalls: s.windowSubagentCalls,
  errors: s.windowErrors,
  lastUsed: new Date(s.windowLastAt).toISOString(),
  callsAllTime: s.calls,
  contextTokens: available.get(s.skill)?.contextTokens ?? null,
}))

const report = {
  totals,
  used: detail,
  neverUsedInWindow: neverWindow.map((a) => ({
    skill: a.skill,
    callsAllTime: a.callsAllTime,
    lastUsed: a.lastAt ? new Date(a.lastAt).toISOString() : null,
    daysSinceLast: a.daysSinceLast,
    contextTokens: a.contextTokens,
    source: a.source,
  })),
}

if (opts.json) {
  console.log(JSON.stringify(report, null, 2))
  process.exit(0)
}

const pad = (value, width) => String(value).padEnd(width)
const num = (value, width) => String(value).padStart(width)
const fmtDate = (iso) => (iso ? iso.slice(0, 10) : "never")

console.log(`Skill retro: last ${totals.windowDays} days (since ${totals.since.slice(0, 10)})`)
console.log(`${totals.usedSkills}/${totals.availableSkills} available skills used, ${totals.usedCalls} calls across ${totals.usedSessions} sessions`)
console.log("")
console.log(`${pad("Skill", 38)} ${num("Calls", 6)} ${num("Sess", 5)} ${num("Main", 5)} ${num("Sub", 5)} ${num("Err", 5)} ${num("Tok", 6)}  Last used`)
console.log("-".repeat(100))
for (const s of detail) {
  console.log(
    `${pad(s.skill, 38)} ${num(s.calls, 6)} ${num(s.sessions, 5)} ${num(s.mainCalls, 5)} ${num(s.subagentCalls, 5)} ${num(s.errors, 5)} ${num(s.contextTokens ?? "-", 6)}  ${fmtDate(s.lastUsed)}`,
  )
}

console.log("")
console.log(`Never used in window: ${neverWindow.length}`)
if (neverWindow.length > 0) {
  console.log(`${pad("Skill", 38)} ${num("All", 6)} ${num("Days", 6)} ${num("Tok", 6)}  Last used`)
  console.log("-".repeat(80))
  for (const s of neverWindow) {
    console.log(
      `${pad(s.skill, 38)} ${num(s.callsAllTime, 6)} ${num(s.daysSinceLast ?? "-", 6)} ${num(s.contextTokens, 6)}  ${fmtDate(s.lastAt ? new Date(s.lastAt).toISOString() : null)}`,
    )
  }
}
