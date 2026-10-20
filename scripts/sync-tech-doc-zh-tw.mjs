#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { transformProse, looksLikeIdentifier } from '../skills/zh-tw-convert/scripts/convert-zh-tw.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const SKILL_DIR = path.join(REPO_ROOT, 'skills', 'tech-doc-zh-tw');
const CONVERTER = path.join(REPO_ROOT, 'skills', 'zh-tw-convert', 'scripts', 'convert-zh-tw.mjs');
const OPENCC_CONFIG = 's2twp.json';

const UPSTREAM = 'Fenng/tech-doc-style-chinese';
const PIN = 'b119d01c9bb7cd132b3c62fafdff34227c4410d1';
const SOURCE_FILES = [
  'SKILL.md',
  'references/api-status-copy.md',
  'references/controlled-technical-chinese.md',
  'references/project-overrides-example.md',
  'references/terminology-and-typography.md',
];

const DESCRIPTION =
  '在撰寫、改寫、校對或審閱繁體中文（台灣）技術文件、產品文案、介面文案、Markdown 文件、API 說明、操作手冊、疑難排解或維運文件時使用。採用克制、準確、可掃讀的繁體中文（台灣）技術寫作風格；保留原文事實、限制和機器可讀內容；按任務讀取術語排版、API 狀態文案、專案覆蓋或受控繁體中文技術寫作參考。';

const TITLE = '# 繁體中文（台灣）技術文件與產品文案規範';

const PREREQUISITE =
  '> 本 Skill 假設輸入為繁體中文。若來源含簡體中文，先使用 `zh-tw-convert` 轉換，再套用本 Skill 的規則。';

const TERMINOLOGY_ROUTE =
  '- 台灣術語與常見搭配：讀取 [台灣技術術語](references/taiwan-terminology.md)';

const PROSE_FIXES = [
  ['識別符號', '識別碼'],
  ['識別符', '識別碼'],
  ['控制元件', '控制項'],
  ['佔位符', '佔位符號'],
  ['連字元', '連字號'],
  ['釋出載體', '發佈管道'],
  ['故障排查', '疑難排解'],
  ['剋制', '克制'],
  ['引數', '參數'],
  ['對映', '對應'],
  ['接口', '介面'],
  ['響應', '回應'],
  ['運維', '維運'],
  ['示例', '範例'],
  ['樣例', '範例'],
  ['感嘆號', '驚嘆號'],
  ['許可權', '權限'],
  ['配置項', '設定項'],
  ['檢查器', '檢查工具'],
  ['合同', '契約'],
  ['移動', '行動'],
  ['借鑑', '借鏡'],
  ['併發', '並行'],
  ['構建', '建置'],
  ['幀', '影格'],
  ['依賴', '相依'],
  ['釋出', '發佈'],
  ['協議', '協定'],
  ['超時', '逾時'],
  ['語義', '語意'],
  ['倉庫', '版本庫'],
  ['獲取', '取得'],
  ['訪問', '存取'],
  ['令牌', '權杖'],
  ['校驗', '驗證'],
  ['平臺', '平台'],
  ['積累', '累積'],
  ['當前', '目前'],
  ['導航', '導覽'],
  ['站點', '網站'],
  ['地址', '位址'],
  ['幫助文本', '說明文字'],
  ['幫助團隊', '協助團隊'],
  ['實施人員', '實作人員'],
  ['缺少會改變結論的事即時', '缺少會改變結論的事實時'],
  ['直接映象介面定義的表頭', '直接沿用介面定義的表頭'],
  ['通過一站式能力', '透過一站式能力'],
  ['相依語境', '需依語境判斷'],
  ['安裝相依', '安裝相依套件'],
  ['寫入配置', '寫入設定'],
  ['配置存取權杖', '設定存取權杖'],
];

const SKILL_FIXES = [
  ['本 Skill 用於中文技術內容', '本 Skill 用於繁體中文（台灣）技術內容'],
  ['使用克制、直接、可執行的中文。', '使用克制、直接、可執行的繁體中文。'],
];

const UNWRAP_PARAGRAPH = /^需要批次處理時使用 `scripts\/unwrap_md_paragraphs\.py`。.*\n\n/m;

function fail(message, code = 2) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

function usage() {
  return [
    'Usage: node scripts/sync-tech-doc-zh-tw.mjs [options]',
    '',
    'Options:',
    '  --check            Build into a temp directory and exit 1 on drift',
    '  --opencc <path>    OpenCC CLI path (default: $OPENCC_BIN, then opencc)',
    '  -h, --help         Show this help',
  ].join('\n');
}

function parseArgs(argv) {
  const opts = { check: false, opencc: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--check') opts.check = true;
    else if (arg === '-h' || arg === '--help') {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else if (arg === '--opencc') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) fail(`${arg} needs a value\n\n${usage()}`);
      opts.opencc = value;
      i += 1;
    } else {
      fail(`unknown argument: ${arg}\n\n${usage()}`);
    }
  }
  return opts;
}

function runOpencc(bin, text, config = OPENCC_CONFIG) {
  const result = spawnSync(bin, ['-c', config], {
    input: Buffer.from(text, 'utf8'),
    maxBuffer: 1024 * 1024 * 64,
  });
  if (result.error || result.status !== 0) {
    const detail = `${result.stderr || ''}`.trim() || result.error?.message || `exit ${result.status}`;
    fail(`OpenCC failed: ${detail}`);
  }
  return result.stdout.toString('utf8');
}

function resolveOpencc(explicit) {
  const configured = explicit || process.env.OPENCC_BIN;
  const candidates = configured ? [configured] : ['opencc'];
  for (const bin of candidates) {
    const result = spawnSync(bin, ['--version'], { encoding: 'utf8' });
    if (result.status === 0 && /opencc/i.test(`${result.stdout}${result.stderr}`)) return bin;
  }
  fail(
    [
      configured
        ? `OpenCC not usable: ${configured} did not run.`
        : 'OpenCC not found: the opencc command is not on PATH.',
      'Pass --opencc <path> or set OPENCC_BIN.',
    ].join('\n'),
  );
}

async function download(relative) {
  const url = `https://raw.githubusercontent.com/${UPSTREAM}/${PIN}/${relative}`;
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    fail(`network unavailable while fetching ${url}: ${error.message}`);
  }
  if (!response.ok) fail(`fetch failed: ${url} -> HTTP ${response.status}`);
  return response.text();
}

function isCjk(char) {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(char);
}

function isProseSpan(body) {
  return [...body].some(isCjk) && !looksLikeIdentifier(body);
}

function mapInlineCode(text, visit) {
  const lines = text.split('\n');
  let fence = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceMatch = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) fence = null;
      continue;
    }
    if (fenceMatch) {
      fence = fenceMatch[1];
      continue;
    }

    let out = '';
    let i = 0;
    while (i < line.length) {
      if (line[i] !== '`') {
        out += line[i];
        i += 1;
        continue;
      }
      let run = 0;
      while (line[i + run] === '`') run += 1;
      let cursor = i + run;
      let closeAt = -1;
      while (cursor < line.length) {
        if (line[cursor] !== '`') {
          cursor += 1;
          continue;
        }
        let closeRun = 0;
        while (line[cursor + closeRun] === '`') closeRun += 1;
        if (closeRun === run) {
          closeAt = cursor;
          break;
        }
        cursor += closeRun;
      }
      if (closeAt === -1) {
        out += line.slice(i, i + run);
        i += run;
        continue;
      }
      const body = line.slice(i + run, closeAt);
      out += '`'.repeat(run) + visit(body) + '`'.repeat(run);
      i = closeAt + run;
    }
    lines[index] = out;
  }
  return lines.join('\n');
}

function convertInlineCodeProse(text, opencc, fix) {
  const spans = [];
  mapInlineCode(text, (body) => {
    if (isProseSpan(body)) spans.push(body);
    return body;
  });
  if (spans.length === 0) return text;

  const converted = runOpencc(opencc, spans.join('\n')).split('\n').map((span) => fix(span));
  if (converted.length !== spans.length) {
    fail(`inline code conversion changed the span count: ${spans.length} -> ${converted.length}`);
  }
  let index = 0;
  return mapInlineCode(text, (body) => (isProseSpan(body) ? converted[index++] : body));
}

function applyFixes(text, fixes) {
  return transformProse(text, (prose) => {
    let out = prose;
    for (const [from, to] of fixes) {
      if (from === to) continue;
      out = out.split(from).join(to);
    }
    return out;
  });
}

function splitFrontmatter(text) {
  const match = /^---\n[\s\S]*?\n---\n/.exec(text);
  if (!match) fail('SKILL.md: no frontmatter found in the upstream source');
  return text.slice(match[0].length);
}

function buildSkill(text) {
  const body = splitFrontmatter(text);
  const heading = /^# .*$/m.exec(body);
  if (!heading) fail('SKILL.md: no level-1 heading found');
  const rewritten = `${body.slice(0, heading.index)}${TITLE}${body.slice(heading.index + heading[0].length)}`;
  const trimmed = rewritten.replace(/^\s+/, '').replace(/\s+$/, '');
  return [
    '---',
    'name: tech-doc-zh-tw',
    `description: ${DESCRIPTION}`,
    'license: MIT',
    '---',
    '',
    PREREQUISITE,
    '',
    trimmed,
    TERMINOLOGY_ROUTE,
    '',
  ].join('\n');
}

function dropUnwrapParagraph(text, relative) {
  if (!UNWRAP_PARAGRAPH.test(text)) fail(`${relative}: the unwrap script paragraph was not found`);
  return text.replace(UNWRAP_PARAGRAPH, '');
}

function finish(text) {
  return `${text.replace(/\r\n/g, '\n').replace(/\s+$/, '')}\n`;
}

function buildFile(relative, converted, opencc) {
  const fixedSpan = (span) => applyFixes(span, PROSE_FIXES);
  let text = applyFixes(convertInlineCodeProse(converted, opencc, fixedSpan), PROSE_FIXES);
  if (relative === 'SKILL.md') return finish(buildSkill(applyFixes(text, SKILL_FIXES)));
  if (relative === 'references/terminology-and-typography.md') {
    return finish(dropUnwrapParagraph(text, relative));
  }
  return finish(text);
}

const VARIANT_ALLOWED = new Set(['台', '游', '群']);

function assertNoSimplified(relative, text, opencc) {
  const chars = [...new Set([...text].filter(isCjk))];
  if (chars.length === 0) return;
  const converted = runOpencc(opencc, chars.join('\n'), 's2t.json').split('\n');
  if (converted.length !== chars.length) fail(`${relative}: character probe lost sync`);
  const simplified = chars.filter(
    (char, index) => converted[index] !== char && !VARIANT_ALLOWED.has(char),
  );
  if (simplified.length === 0) return;
  fail(
    [
      `${relative}: Simplified characters survived generation: ${simplified.join(' ')}`,
      'Add them to the port rules in scripts/sync-tech-doc-zh-tw.mjs.',
    ].join('\n'),
  );
}

function compare(relative, expected, actualPath) {
  if (!fs.existsSync(actualPath)) return `missing  ${relative}`;
  const actual = fs.readFileSync(actualPath, 'utf8').replace(/\r\n/g, '\n');
  if (actual === expected) return null;
  const expectedLines = expected.split('\n');
  const actualLines = actual.split('\n');
  const index = expectedLines.findIndex((line, i) => line !== actualLines[i]);
  return [
    `drift    ${relative} (line ${index + 1})`,
    `  committed: ${actualLines[index] ?? '(end of file)'}`,
    `  expected:  ${expectedLines[index] ?? '(end of file)'}`,
  ].join('\n');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const opencc = resolveOpencc(opts.opencc);

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tech-doc-zh-tw-'));
  const sourceDir = path.join(workDir, 'source');
  fs.mkdirSync(path.join(sourceDir, 'references'), { recursive: true });

  for (const relative of SOURCE_FILES) {
    const body = await download(relative);
    fs.writeFileSync(path.join(sourceDir, relative), body, 'utf8');
  }

  const convert = spawnSync(
    process.execPath,
    [CONVERTER, sourceDir, '--write', '--config', OPENCC_CONFIG, '--opencc', opencc],
    {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 64,
    },
  );
  if (convert.status !== 0) {
    fail(`zh-tw-convert failed:\n${convert.stdout}${convert.stderr}`);
  }

  const results = new Map();
  for (const relative of SOURCE_FILES) {
    const converted = fs.readFileSync(path.join(sourceDir, relative), 'utf8');
    const built = buildFile(relative, converted, opencc);
    assertNoSimplified(relative, built, opencc);
    results.set(relative, built);
  }

  if (opts.check) {
    const problems = [];
    for (const [relative, expected] of results) {
      const problem = compare(relative, expected, path.join(SKILL_DIR, relative));
      if (problem) problems.push(problem);
    }
    fs.rmSync(workDir, { recursive: true, force: true });
    if (problems.length > 0) {
      process.stderr.write(`${problems.join('\n')}\n`);
      process.stderr.write(`\n${problems.length} file(s) drifted; run node scripts/sync-tech-doc-zh-tw.mjs\n`);
      process.exit(1);
    }
    process.stdout.write(`${results.size} files match the pinned upstream commit\n`);
    return;
  }

  for (const [relative, body] of results) {
    const target = path.join(SKILL_DIR, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body, 'utf8');
    process.stdout.write(`wrote ${path.posix.join('skills/tech-doc-zh-tw', relative)}\n`);
  }
  fs.rmSync(workDir, { recursive: true, force: true });
}

await main();
