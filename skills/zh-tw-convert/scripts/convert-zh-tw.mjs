#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_GLOSSARY = path.resolve(SCRIPT_DIR, '..', 'references', 'glossary.md');
const OVERRIDES_PATH = path.resolve(SCRIPT_DIR, '..', 'references', 'overrides.json');

const EXTENSIONS = new Set(['.md', '.mdx', '.markdown', '.txt']);
const SKIP_DIRS = new Set(['.git', 'node_modules', '.venv', 'vendor', '__pycache__']);
const REVIEW_TERMS = ['配置', '腳本', '倉庫', '依賴', '校驗', '介面', '生成', '文件'];

// Protected spans become private-use placeholders so OpenCC cannot touch them.
const OPEN = '\uE000';
const CLOSE = '\uE001';

function fail(message, code = 2) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

function usage() {
  return [
    'Usage: node scripts/convert-zh-tw.mjs <paths...> [options]',
    '',
    'Options:',
    '  --write             Write converted files (default: dry run)',
    '  --check             Exit 1 if any file would change, 0 if clean',
    '  --opencc <path>     OpenCC CLI path (default: $OPENCC_BIN, then opencc)',
    '  --config <name>     OpenCC config (default: s2twp.json, or $OPENCC_CONFIG)',
    '  --glossary <path>   Glossary reported with the result',
    '  --json              Print a machine-readable result',
    '  -h, --help          Show this help',
  ].join('\n');
}

function parseArgs(argv) {
  const opts = {
    paths: [],
    write: false,
    check: false,
    json: false,
    opencc: null,
    config: null,
    glossary: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--write') opts.write = true;
    else if (arg === '--check') opts.check = true;
    else if (arg === '--json') opts.json = true;
    else if (arg === '-h' || arg === '--help') {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else if (arg === '--opencc' || arg === '--config' || arg === '--glossary') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) fail(`${arg} needs a value\n\n${usage()}`);
      opts[arg.slice(2)] = value;
      i += 1;
    } else if (arg.startsWith('-')) {
      fail(`unknown flag: ${arg}\n\n${usage()}`);
    } else {
      opts.paths.push(arg);
    }
  }
  if (opts.paths.length === 0) fail(`no paths given\n\n${usage()}`);
  if (opts.write && opts.check) fail('--write and --check are mutually exclusive');
  return opts;
}

function shellQuote(value) {
  if (process.platform !== 'win32') return value;
  return /[\s"]/.test(value) ? `"${value.replace(/"/g, '')}"` : value;
}

function runProcess(bin, args, options) {
  const base = { maxBuffer: 1024 * 1024 * 256, windowsHide: true, ...options };
  if (process.platform === 'win32') {
    return spawnSync([bin, ...args].map(shellQuote).join(' '), { ...base, shell: true });
  }
  return spawnSync(bin, args, base);
}

function spawnOpencc(bin, config, input) {
  return runProcess(bin, ['-c', config], { input: Buffer.from(input, 'utf8') });
}

function resolveOpencc(explicit) {
  const configured = explicit || process.env.OPENCC_BIN;
  const candidates = configured ? [configured] : ['opencc'];
  for (const bin of candidates) {
    const probe = runProcess(bin, ['--version'], { encoding: 'utf8' });
    if (probe.status === 0 && /opencc/i.test(`${probe.stdout}${probe.stderr}`)) return bin;
  }
  const source = configured
    ? `${explicit ? '--opencc' : 'OPENCC_BIN'} points at "${configured}", but it did not run`
    : 'the opencc command is not on PATH';
  fail(
    [
      `OpenCC CLI not found: ${source}.`,
      'Install OpenCC 1.x (https://github.com/BYVoid/OpenCC) and make opencc available,',
      'or pass --opencc <path> / set OPENCC_BIN. Do not convert by hand as a fallback.',
    ].join('\n'),
  );
}

function resolveConfig(opts, bin) {
  const config = opts.config || process.env.OPENCC_CONFIG || 's2twp.json';
  const probe = spawnOpencc(bin, config, '测试');
  if (probe.error || probe.status !== 0) {
    const detail = `${probe.stderr || ''}`.trim() || probe.error?.message || `exit ${probe.status}`;
    fail(
      [
        `OpenCC config "${config}" could not be loaded: ${detail}`,
        'Use the s2twp config shipped with OpenCC, or pass a valid --config value.',
      ].join('\n'),
    );
  }
  return config;
}

function loadOverrides() {
  if (!fs.existsSync(OVERRIDES_PATH)) return [];
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(OVERRIDES_PATH, 'utf8'));
  } catch (error) {
    fail(`cannot read ${OVERRIDES_PATH}: ${error.message}`);
  }
  const replacements = Array.isArray(parsed.replacements) ? parsed.replacements : [];
  for (const item of replacements) {
    if (typeof item.from !== 'string' || typeof item.to !== 'string' || item.from === '') {
      fail(`${OVERRIDES_PATH}: every replacement needs non-empty "from" and "to" strings`);
    }
  }
  return replacements;
}

function createMasker() {
  const spans = [];
  return {
    add(text) {
      spans.push(text);
      return `${OPEN}${spans.length - 1}${CLOSE}`;
    },
    restore(text) {
      let out = text;
      for (let i = spans.length - 1; i >= 0; i -= 1) {
        out = out.split(`${OPEN}${i}${CLOSE}`).join(spans[i]);
      }
      return out;
    },
  };
}

function maskInlineCode(text, masker) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] !== '`') {
      out += text[i];
      i += 1;
      continue;
    }
    let run = 0;
    while (text[i + run] === '`') run += 1;
    let cursor = i + run;
    let closeAt = -1;
    while (cursor < text.length) {
      if (text[cursor] !== '`') {
        cursor += 1;
        continue;
      }
      let closeRun = 0;
      while (text[cursor + closeRun] === '`') closeRun += 1;
      if (closeRun === run) {
        closeAt = cursor;
        break;
      }
      cursor += closeRun;
    }
    if (closeAt === -1) {
      out += text.slice(i, i + run);
      i += run;
      continue;
    }
    out += masker.add(text.slice(i, closeAt + run));
    i = closeAt + run;
  }
  return out;
}

function maskUrls(text, masker) {
  return text.replace(/https?:\/\/[^\s<>"'`]+/g, (raw) => {
    let url = raw.replace(/[.,;:!?。，；：！？]+$/, '');
    while (url.endsWith(')')) {
      const opens = (url.match(/\(/g) || []).length;
      const closes = (url.match(/\)/g) || []).length;
      if (opens >= closes) break;
      url = url.slice(0, -1).replace(/[.,;:!?。，；：！？]+$/, '');
    }
    return masker.add(url) + raw.slice(url.length);
  });
}

function maskLinkDestinations(text, masker) {
  return text.replace(/\]\(([^()\n]|\([^()\n]*\))*\)/g, (match) => {
    const destination = match.slice(2, -1);
    return `](${masker.add(destination)})`;
  });
}

function maskHtml(text, masker) {
  const withoutComments = text.replace(/<!--[\s\S]*?-->/g, (match) => masker.add(match));
  return withoutComments.replace(/<\/?[A-Za-z][^>\n]*>/g, (match) => masker.add(match));
}

function maskProse(text, masker) {
  let out = maskInlineCode(text, masker);
  out = maskUrls(out, masker);
  out = maskLinkDestinations(out, masker);
  return maskHtml(out, masker);
}

function maskFences(text, masker) {
  const lines = text.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const open = /^(\s{0,3})(`{3,}|~{3,})(.*)$/.exec(lines[i]);
    if (!open || (open[2][0] === '`' && open[3].includes('`'))) {
      out.push(lines[i]);
      i += 1;
      continue;
    }
    const fenceChar = open[2][0];
    const fenceLength = open[2].length;
    const block = [lines[i]];
    let j = i + 1;
    let closed = false;
    while (j < lines.length) {
      block.push(lines[j]);
      const close = /^\s{0,3}(`{3,}|~{3,})\s*$/.exec(lines[j]);
      if (close && close[1][0] === fenceChar && close[1].length >= fenceLength) {
        closed = true;
        break;
      }
      j += 1;
    }
    out.push(masker.add(block.join('\n')));
    if (!closed) break;
    i = j + 1;
  }
  return out.join('\n');
}

function splitFrontmatter(text) {
  const match = /^---\n([\s\S]*?\n)?---(\n|$)/.exec(text);
  if (!match) return null;
  const head = match[1];
  const frontmatter = head === undefined ? '' : head.slice(0, -1);
  if (!/^[^\s:#][^:\n]*:/m.test(frontmatter)) return null;
  return {
    frontmatter,
    hasFrontmatterLine: head !== undefined,
    separator: match[2],
    body: text.slice(match[0].length),
  };
}

function maskFrontmatter(frontmatter, masker) {
  let blockIndent = null;
  return frontmatter
    .split('\n')
    .map((line) => {
      if (line.trim() === '') return line;
      const indent = /^\s*/.exec(line)[0].length;
      if (blockIndent !== null) {
        if (indent > blockIndent) return maskProse(line, masker);
        blockIndent = null;
      }
      if (/^\s*#/.test(line)) return line;
      const match = /^(\s*(?:-\s+)?)([^\s:#][^:]*?)(:)(\s.*|)$/.exec(line);
      if (!match) return maskProse(line, masker);
      const [, lead, rawKey, colon, rest] = match;
      const key = rawKey.trim().replace(/^["']|["']$/g, '');
      if (/^\s*[|>][+-]?\s*(#.*)?$/.test(rest)) blockIndent = indent;
      const maskedKey = masker.add(`${lead}${rawKey}${colon}`);
      if (key === 'name') return maskedKey + masker.add(rest);
      return maskedKey + maskProse(rest, masker);
    })
    .join('\n');
}

function maskBody(body, masker) {
  const fenced = maskFences(body, masker);
  return maskProse(fenced, masker);
}

function applyOverrides(text, replacements) {
  const counts = [];
  let out = text;
  for (const replacement of replacements) {
    const parts = out.split(replacement.from);
    const count = parts.length - 1;
    if (count > 0) {
      out = parts.join(replacement.to);
      counts.push({ from: replacement.from, to: replacement.to, count });
    }
  }
  return { text: out, counts };
}

function countTerm(text, term) {
  return text.split(term).length - 1;
}

function convertText(text, opencc, config, replacements, detectorConfig) {
  if (text.includes(OPEN) || text.includes(CLOSE)) {
    fail(`refusing to convert: input already contains U+E000/U+E001 placeholder characters`);
  }
  const masker = createMasker();
  const parts = splitFrontmatter(text);
  const masked = parts
    ? `---\n${parts.hasFrontmatterLine ? `${maskFrontmatter(parts.frontmatter, masker)}\n` : ''}---${parts.separator}${maskBody(parts.body, masker)}`
    : maskBody(text, masker);

  if (detectorConfig) {
    const probe = spawnOpencc(opencc, detectorConfig, masked);
    if (probe.status === 0 && probe.stdout.toString('utf8') === masked) {
      return { text, overrides: [], review: [], alreadyTraditional: true };
    }
  }

  const result = spawnOpencc(opencc, config, masked);
  if (result.error || result.status !== 0) {
    const detail = `${result.stderr || ''}`.trim() || result.error?.message || `exit ${result.status}`;
    fail(`OpenCC failed: ${detail}`);
  }

  const converted = result.stdout.toString('utf8');
  const overrides = applyOverrides(converted, replacements);
  const review = REVIEW_TERMS.map((term) => ({ term, count: countTerm(overrides.text, term) })).filter(
    (item) => item.count > 0,
  );
  return {
    text: masker.restore(overrides.text),
    overrides: overrides.counts,
    review,
    alreadyTraditional: false,
  };
}

function displayPath(absolute) {
  const relative = path.relative(process.cwd(), absolute);
  return relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) ? relative : absolute;
}

function collectFiles(inputs) {
  const files = [];
  const skipped = [];
  const seen = new Set();

  const push = (absolute) => {
    if (seen.has(absolute)) return;
    seen.add(absolute);
    files.push(absolute);
  };

  const walk = (directory) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        skipped.push({ path: displayPath(absolute), reason: 'symlink' });
      } else if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(absolute);
      } else if (entry.isFile()) {
        const extension = path.extname(entry.name).toLowerCase();
        if (EXTENSIONS.has(extension)) push(absolute);
        else skipped.push({ path: displayPath(absolute), reason: `unsupported extension ${extension || '(none)'}` });
      }
    }
  };

  for (const input of inputs) {
    const absolute = path.resolve(input);
    let stat;
    try {
      stat = fs.lstatSync(absolute);
    } catch {
      fail(`path not found: ${input}`);
    }
    if (stat.isSymbolicLink()) {
      skipped.push({ path: displayPath(absolute), reason: 'symlink' });
    } else if (stat.isDirectory()) {
      walk(absolute);
    } else if (stat.isFile()) {
      const extension = path.extname(absolute).toLowerCase();
      if (EXTENSIONS.has(extension)) push(absolute);
      else skipped.push({ path: displayPath(absolute), reason: `unsupported extension ${extension || '(none)'}` });
    } else {
      skipped.push({ path: displayPath(absolute), reason: 'not a regular file' });
    }
  }

  return { files, skipped };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const opencc = resolveOpencc(opts.opencc);
  const config = resolveConfig(opts, opencc);
  const replacements = loadOverrides();

  const glossary = path.resolve(opts.glossary || DEFAULT_GLOSSARY);
  if (!fs.existsSync(glossary)) fail(`glossary not found: ${opts.glossary || glossary}`);

  const configName = path.basename(config);
  const detectorConfig = configName.startsWith('s2') && configName !== 's2t.json' ? 's2t.json' : null;

  const { files, skipped } = collectFiles(opts.paths);
  if (files.length === 0) {
    const detail = skipped.map((item) => `${item.path} (${item.reason})`).join(', ');
    fail(`no convertible files found in: ${opts.paths.join(', ')}${detail ? `\nskipped: ${detail}` : ''}`);
  }

  const results = [];
  for (const file of files) {
    let original;
    try {
      original = fs.readFileSync(file, 'utf8');
    } catch (error) {
      fail(`cannot read ${displayPath(file)}: ${error.message}`);
    }
    const crlf = original.includes('\r\n');
    const withoutBom = original.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    const converted = convertText(withoutBom, opencc, config, replacements, detectorConfig);
    const output = crlf ? converted.text.replace(/\n/g, '\r\n') : converted.text;
    const changed = output !== original;
    if (changed && opts.write) {
      try {
        fs.writeFileSync(file, output, 'utf8');
      } catch (error) {
        fail(`cannot write ${displayPath(file)}: ${error.message}`);
      }
    }
    results.push({
      path: displayPath(file),
      changed,
      alreadyTraditional: converted.alreadyTraditional,
      overrides: converted.overrides,
      review: converted.review,
    });
  }

  const changedCount = results.filter((result) => result.changed).length;
  const mode = opts.check ? 'check' : opts.write ? 'write' : 'dry-run';

  if (opts.json) {
    process.stdout.write(
      `${JSON.stringify(
        {
          opencc,
          config,
          mode,
          glossary,
          files: results,
          skipped,
          summary: { files: results.length, changed: changedCount, clean: changedCount === 0 },
        },
        null,
        2,
      )}\n`,
    );
  } else {
    const lines = [];
    for (const result of results) {
      if (!result.changed) {
        if (opts.check) lines.push(`clean  ${result.path}`);
        continue;
      }
      const verb = opts.check ? 'dirty ' : opts.write ? 'wrote ' : 'would change ';
      lines.push(`${verb} ${result.path}`);
      for (const item of result.overrides) {
        lines.push(`  override ${item.from} -> ${item.to} x${item.count}`);
      }
      if (result.review.length > 0) {
        lines.push(`  review   ${result.review.map((item) => `${item.term} x${item.count}`).join(', ')}`);
      }
    }
    const summary =
      mode === 'check'
        ? `${results.length} files, ${changedCount} would change`
        : `${results.length} files, ${changedCount} changed${mode === 'dry-run' ? ' (dry run; pass --write to apply)' : ''}`;
    lines.push(summary);
    process.stdout.write(`${lines.join('\n')}\n`);
  }

  if (opts.check && changedCount > 0) process.exit(1);
}

main();
