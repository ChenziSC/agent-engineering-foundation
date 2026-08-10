import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SPEC_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/u;
const REVISION_PATTERN = /^[a-f0-9]{40}$/u;

export function parsePullRequestSpecIds(body) {
  const lines = String(body || '').split(/\r?\n/u);
  const declarations = lines
    .map((line) => /^Spec-IDs:\s*(.+?)\s*$/u.exec(line))
    .filter(Boolean)
    .map((match) => match[1]);
  if (declarations.length !== 1) {
    throw new Error('PR 描述必须且只能包含一行 `Spec-IDs: spec-id[,spec-id]`');
  }
  const specIds = declarations[0].split(',').map((value) => value.trim()).filter(Boolean);
  if (specIds.length < 1 || specIds.length > 3 || new Set(specIds).size !== specIds.length) {
    throw new Error('Spec-IDs 必须声明 1～3 个不重复事项');
  }
  for (const specId of specIds) {
    if (!SPEC_ID_PATTERN.test(specId)) throw new Error('Spec-IDs 包含无效事项标识');
  }
  return [...specIds].sort((left, right) => left.localeCompare(right));
}

function requiredEnvironment(name) {
  const value = process.env[name];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`缺少 ${name}`);
  return value.trim();
}

export function runDeliveryGate() {
  const baseSha = requiredEnvironment('BASE_SHA');
  const sourceSha = requiredEnvironment('SOURCE_SHA');
  const requiredCheck = requiredEnvironment('REQUIRED_CHECK');
  if (!REVISION_PATTERN.test(baseSha) || !REVISION_PATTERN.test(sourceSha)) {
    throw new Error('BASE_SHA 与 SOURCE_SHA 必须是不可变的 40 位小写 Commit SHA');
  }
  const specIds = parsePullRequestSpecIds(process.env.PR_BODY);
  const cli = path.resolve(process.cwd(), 'packages/harness/bin/agent-foundation.mjs');
  const args = [
    cli,
    'change',
    'gate',
    'check',
    '--target',
    '.',
    '--base',
    baseSha,
    '--source',
    sourceSha,
    '--phase',
    'delivery',
    '--exclude',
    specIds.map((specId) => `specs/${specId}`).join(','),
    '--required-check',
    requiredCheck,
  ];
  for (const specId of specIds) args.push('--spec-id', specId);
  const result = spawnSync(process.execPath, args, { cwd: process.cwd(), env: process.env, stdio: 'inherit' });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = runDeliveryGate();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
