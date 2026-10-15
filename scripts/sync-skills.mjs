#!/usr/bin/env node
// Sync skills from a curated manifest into the GLOBAL skills dir only.
// No dependencies. Requires Node >= 22 and `npx skills` on PATH.
//
// Global install. Each source runs 'npx skills add <source> -g' WITHOUT -y,
// so the CLI shows an interactive selection prompt (space-toggle individual
// skills). You choose what to install/skip, per source group.
// Global floats to HEAD at `ref`; review `npx skills ls -g` after.
//
// skills-lock.json here is a *manifest of curated upstream sources*, not a
// project lock. Per-project reproducibility is intentionally out of scope:
// always global scope only.
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve, dirname, isAbsolute } from 'path';
import { spawnSync } from 'child_process';

const DEFAULT_LOCK_PATH = './skills-lock.json';

function printHelp() {
  console.log(`Usage: sync-skills.mjs [--lock <url|path>] [--agent <name...>]
       [--skill <name...>] [--skip <name...>] [--dry-run]

  --lock  curated manifest: https://... URL or local path (default: ./skills-lock.json).
  --agent passed through to 'skills add' (--agent opencode --agent claude-code).
  --skill install only these curated skills (repeatable/comma list); non-interactive.
  --skip  install all curated skills EXCEPT these (repeatable/comma list).
  --all   install every curated skill (no picker, passes -y).
  --dry-run print groups and commands without installing.

  Interactive: TTY + no --skill/--skip/--all opens the picker (no -y).
  Non-TTY: prints copy-paste commands instead.
`);
}

const args = process.argv.slice(2);
const opts = { lock: null, agent: [], skillsOnly: [], skillsSkip: [], installAll: false, dry: false, help: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  const next = (flag) => {
    const v = args[++i];
    if (v === undefined || v.startsWith('-')) {
      console.error(`${flag} requires a value`);
      process.exit(1);
    }
    return v;
  };
  if (a === '--lock') opts.lock = next(a);
  else if (a.startsWith('--lock=')) opts.lock = a.slice(7);
  else if (a === '--agent' || a === '-a') { opts.agent.push(...next(a).split(/[, ]+/).filter(Boolean)); }
  else if (a.startsWith('--agent=')) opts.agent.push(...a.slice(8).split(/[, ]+/).filter(Boolean));
  else if (a === '--skill' || a === '-s') { opts.skillsOnly.push(...next(a).split(/[, ]+/).filter(Boolean)); }
  else if (a.startsWith('--skill=')) opts.skillsOnly.push(...a.slice(8).split(/[, ]+/).filter(Boolean));
  else if (a === '--skip') { opts.skillsSkip.push(...next(a).split(/[, ]+/).filter(Boolean)); }
  else if (a.startsWith('--skip=')) opts.skillsSkip.push(...a.slice(7).split(/[, ]+/).filter(Boolean));
  else if (a === '--all') opts.installAll = true;
  else if (a === '--dry-run') opts.dry = true;
  else if (a === '--help' || a === '-h') opts.help = true;
  else { console.error(`Unknown arg: ${a}`); printHelp(); process.exit(1); }
}
if (opts.help) { printHelp(); process.exit(0); }

function isUrl(s) { return /^https?:\/\//i.test(s); }

async function loadLock(ref, baseDir) {
  if (!ref) ref = DEFAULT_LOCK_PATH;
  if (isUrl(ref)) {
    const res = await fetch(ref);
    if (!res.ok) throw new Error(`fetch ${ref}: HTTP ${res.status}`);
    return { lock: validateLock(await res.json()), origin: 'url', dir: baseDir };
  }
  const p = isAbsolute(ref) ? ref : resolve(baseDir, ref);
  const lock = validateLock(JSON.parse(await readFile(p, 'utf-8')));
  return { lock, origin: 'file', dir: dirname(p) };
}

function validateLock(j) {
  if (!j || j.version !== 1 || !j.skills || typeof j.skills !== 'object')
    throw new Error('lock must be {version: 1, skills: {...}}');
  return j;
}

function deriveFolder(skillPath) {
  let f = skillPath;
  if (f.endsWith('/SKILL.md')) f = f.slice(0, -9);
  else if (f.endsWith('SKILL.md')) f = f.slice(0, -8);
  if (f.endsWith('/')) f = f.slice(0, -1);
  return f;
}
function supportsSubpath(source) {
  if (source.startsWith('git@') || source.startsWith('ssh://')) return false;
  if (source.endsWith('.git')) return false;
  if (source.startsWith('http://') || source.startsWith('https://')) {
    try {
      const h = new URL(source).hostname;
      return h === 'github.com' || h === 'gitlab.com';
    } catch { return false; }
  }
  return true;
}
function isBareShorthand(s) {
  return !s.includes(':') && !s.startsWith('.') && !s.startsWith('/');
}
function getLocalSource(entry) {
  if (entry.sourceUrl) return entry.sourceUrl;
  const needsUrl = entry.sourceType === 'git' || entry.sourceType === 'gitlab';
  if (needsUrl && isBareShorthand(entry.source)) return null;
  return entry.source;
}
function buildSource(entry) {
  const source = getLocalSource(entry);
  if (!source) return null;
  const withRef = (s) => (entry.ref ? `${s}#${entry.ref}` : s);
  if (!entry.skillPath) return withRef(source);
  if (!supportsSubpath(source)) return withRef(source);
  const folder = deriveFolder(entry.skillPath);
  return withRef(folder ? `${source}/${folder}` : source);
}
function groupEntries(lock, curatedDir, fromUrl) {
  const groups = new Map();
  const skipped = [];
  for (const [name, entry] of Object.entries(lock.skills)) {
    if (entry.sourceType === 'node_modules') {
      skipped.push({ name, reason: 'node_modules: install npm deps then run `npx skills experimental_sync`' });
      continue;
    }
    if (entry.sourceType === 'local') {
      if (fromUrl) { skipped.push({ name, reason: 'local path needs a full clone, not a raw URL fetch' }); continue; }
      const abs = isAbsolute(entry.source) ? entry.source : resolve(curatedDir, entry.source);
      if (!existsSync(abs)) { skipped.push({ name, reason: `local path not found: ${entry.source}` }); continue; }
    }
    const src = buildSource(entry);
    if (!src) { skipped.push({ name, reason: 'legacy git/gitlab entry without sourceUrl; re-add to repair' }); continue; }
    if (!groups.has(src)) groups.set(src, []);
    groups.get(src).push(name);
  }
  return { groups, skipped };
}

function run(cmd, cargs, dry) {
  console.log(`$ ${cmd} ${cargs.join(' ')}`);
  if (dry) return true;
  const r = spawnSync(cmd, cargs, { stdio: 'inherit', shell: process.platform === 'win32' });
  return r.status === 0;
}

async function main() {
  const cwd = process.cwd();
  const curatedRef = opts.lock ?? DEFAULT_LOCK_PATH;
  let curated;
  try { curated = await loadLock(curatedRef, cwd); }
  catch (e) { console.error(`Cannot load curated manifest (${curatedRef}): ${e.message}`); process.exit(1); }

  const { lock, origin, dir: curatedDir } = curated;
  const { groups, skipped } = groupEntries(lock, curatedDir, origin === 'url');

  console.log(`Curated manifest: ${curatedRef} (${Object.keys(lock.skills).length} skills)`);
  for (const [src, names] of groups) console.log(`  group: ${src}\n    ${names.join(', ')}`);
  for (const s of skipped) console.log(`  skip: ${s.name} (${s.reason})`);

  if (opts.installAll) {
    for (const names of groups.values()) for (const n of names) if (!opts.skillsOnly.includes(n)) opts.skillsOnly.push(n);
  }
  const agentFlags = opts.agent.flatMap((g) => ['--agent', g]);
  const onlySet = new Set(opts.skillsOnly);
  const skipSet = new Set(opts.skillsSkip);
  const targeted = opts.skillsOnly.length > 0 || opts.skillsSkip.length > 0;

  let ok = true;
  for (const [src, curatedNames] of groups) {
    const kept = curatedNames.filter((n) => !skipSet.has(n) && (onlySet.size === 0 || onlySet.has(n)));
    if (kept.length === 0) { console.log(`  (skipping ${src}: no skills selected)`); continue; }
    let cargs;
    if (targeted) {
      // User explicitly chose via --skill/--skip; assume consent, run without TUI.
      cargs = ['skills', 'add', src, '-g', ...kept.flatMap((n) => ['--skill', n]), '-y', ...agentFlags];
    } else if (process.stdin.isTTY) {
      // Interactive: let the CLI open its picker. No -y, no --skill.
      cargs = ['skills', 'add', src, '-g', ...agentFlags];
    } else {
      // Non-interactive host (e.g. agent). Print the exact copy-paste command.
      cargs = ['npx', 'skills', 'add', src, '-g', ...kept.flatMap((n) => ['--skill', n]), '-y', ...agentFlags];
      console.log(`(no TTY detected: paste this command in your terminal)\n  ${cargs.join(' ')}\n`);
      continue;
    }
    if (!run('npx', cargs, opts.dry)) ok = false;
  }
  console.log('\nDone. Review installs with: npx skills ls -g');
  process.exit(ok ? 0 : 1);
}

main();