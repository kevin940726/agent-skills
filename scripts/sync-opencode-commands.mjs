#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function usage() {
  console.error(`Usage: node scripts/sync-opencode-commands.mjs [options]
  --dry-run
  --skill a,b
  --skip x,y
  --clean
  -h, --help
`);
}

const args = process.argv.slice(2);
if (args.includes('-h') || args.includes('--help')) { usage(); process.exit(0); }
const getFlag = name => args.includes(name);
const getOpt  = name => {
  const i = args.indexOf(name);
  return i>=0 ? args[i+1] : undefined;
};

const opts = {
  dry: getFlag('--dry-run'),
  clean: getFlag('--clean'),
  skillsOnly: getOpt('--skill')?.split(',').filter(Boolean) ?? [],
  skillsSkip: getOpt('--skip')?.split(',').filter(Boolean) ?? [],
};

const homes = [
  path.join(os.homedir(), '.agents', 'skills'),
  path.join(os.homedir(), '.claude', 'skills'),
];

function readFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  const m = normalized.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return '';
  return m[1];
}

function scalar(front, key) {
  const lines = front.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    const mm = ln.match(new RegExp('^' + key + ':\\s*(.*)$'));
    if (!mm) continue;
    const inline = mm[1].trim();
    const isBlockScalar = /^[>|][+-]?$/.test(inline);
    if (inline && !isBlockScalar) return inline.replace(/^["']/,'').replace(/["']$/,'');
    // folded / block scalars
    const out = [];
    for (let j=i+1;j<lines.length;j++) {
      if (!/^\s+/.test(lines[j])) break;
      const s = lines[j].trim();
      if (!s || s.startsWith('#')) continue;
      out.push(s);
    }
    if (out.length) return out.join(' ');
  }
  return '';
}

function disableModelInvocation(front) {
  return scalar(front,'disable-model-invocation').toLowerCase() === 'true';
}

function wantsOpencodeSlash(front) {
  const lines = front.split(/\r?\n/);
  let inMetadata = false;
  for (const ln of lines) {
    if (/^metadata:\s*$/.test(ln)) { inMetadata = true; continue; }
    if (!inMetadata) continue;
    if (/^\S/.test(ln)) { inMetadata = false; continue; }
    const m = ln.match(/^\s+opencode\/slash:\s*(.*)$/);
    if (!m) continue;
    return m[1].trim().replace(/^["']|["']$/g,'').toLowerCase() === 'true';
  }
  return false;
}

function wantsCommand(front) {
  return disableModelInvocation(front) || wantsOpencodeSlash(front);
}

const byName = new Map();
for (const root of homes) {
  if (!fs.existsSync(root)) continue;
  for (const entry of fs.readdirSync(root,{withFileTypes:true})) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(root, entry.name);
    const skillFile = path.join(dir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;
    const text = fs.readFileSync(skillFile,'utf8');
    const fm = readFrontmatter(text);
    const name = scalar(fm,'name') || entry.name;
    if (!byName.has(name)) byName.set(name,{dir,name,text,fm});
  }
}

const wrappable = Array.from(byName.values())
  .filter(({fm}) => wantsCommand(fm))
  .sort((a,b) => a.name.localeCompare(b.name));

const onlySet = new Set(opts.skillsOnly);
const skipSet = new Set(opts.skillsSkip);
const selected = wrappable.filter(({name}) => !skipSet.has(name) && (onlySet.size === 0 || onlySet.has(name)));

const cmdDir = path.join(os.homedir(), '.config', 'opencode', 'commands');
let wrote = 0;
if (!opts.dry) fs.mkdirSync(cmdDir,{recursive:true});

console.log(`Discovered ${wrappable.length} skills that request an OpenCode command; selected ${selected.length}.`);
const generatedNames = new Set(selected.map(({name})=>name));
// Only touch wrappers this script is responsible for. Do not remove unrelated
// user commands from ~/.config/opencode/commands when --clean is passed.
const cleanupNames = new Set(wrappable.map(({name})=>name).filter((name)=>!generatedNames.has(name)));

function clipDescription(desc, max = 220) {
  if (desc.length <= max) return desc;
  const cut = desc.slice(0, max);
  const sentenceEnd = Math.max(
    cut.lastIndexOf('. '),
    cut.lastIndexOf('! '),
    cut.lastIndexOf('? ')
  );
  if (sentenceEnd >= 100) return cut.slice(0, sentenceEnd + 1);
  const wordEnd = cut.lastIndexOf(' ');
  return `${cut.slice(0, wordEnd > 0 ? wordEnd : max).trimEnd()}…`;
}

for (const {name, fm} of selected) {
  let desc = scalar(fm,'description') || `Invoke the ${name} skill explicitly.`;
  desc = clipDescription(desc.replace(/\s+/g,' ').trim()).replace(/'/g,"''");
  const command = `---\ndescription: '${desc}'\n---\nUse the \`skill\` tool with name="${name}", then follow its instructions for the task: $ARGUMENTS\n`;
  const out = path.join(cmdDir, name + '.md');
  console.log(`${opts.dry ? '[dry] ' : ''}command: ${out}`);
  if (!opts.dry) fs.writeFileSync(out, command);
  wrote++;
}

if (opts.clean) {
  for (const entry of fs.readdirSync(cmdDir,{withFileTypes:true})) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const stem = entry.name.slice(0,-3);
    if (!cleanupNames.has(stem)) continue;
    const full = path.join(cmdDir, entry.name);
    if (opts.dry) console.log(`[dry] delete: ${full}`);
    else fs.rmSync(full);
  }
}

if (opts.dry) {
  console.log(`Dry run complete: ${selected.length} commands would be written.`);
} else {
  console.log(`Done: ${wrote} OpenCode command wrappers written to ${cmdDir}`);
}
