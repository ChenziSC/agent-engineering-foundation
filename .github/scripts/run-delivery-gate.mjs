import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SPEC_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/u;
const REVISION_PATTERN = /^[a-f0-9]{40}$/u;

function parseSpecIds(value) {
  const specIds = value.split(',').map((entry) => entry.trim()).filter(Boolean);
  if (specIds.length < 1 || specIds.length > 3 || new Set(specIds).size !== specIds.length) {
    throw new Error('Spec-IDs 必须声明 1～3 个不重复事项');
  }
  for (const specId of specIds) {
    if (!SPEC_ID_PATTERN.test(specId)) throw new Error('Spec-IDs 包含无效事项标识');
  }
  return [...specIds].sort((left, right) => left.localeCompare(right));
}

export function parsePullRequestAssociation(body) {
  const lines = String(body || '').split(/\r?\n/u);
  const specDeclarations = lines
    .map((line) => /^Spec-IDs:\s*(.+?)\s*$/u.exec(line))
    .filter(Boolean)
    .map((match) => match[1]);
  const exemptionDeclarations = lines
    .map((line) => /^Spec-Exemption:\s*(.+?)\s*$/u.exec(line))
    .filter(Boolean)
    .map((match) => match[1].trim());
  if (specDeclarations.length + exemptionDeclarations.length !== 1) {
    throw new Error('PR 描述必须且只能声明一行 `Spec-IDs: ...` 或 `Spec-Exemption: ...`');
  }
  if (specDeclarations.length === 1) return { mode: 'spec', specIds: parseSpecIds(specDeclarations[0]) };
  if (!exemptionDeclarations[0]) throw new Error('Spec-Exemption 必须是非空的既有豁免代码');
  return { mode: 'exemption', exemption: exemptionDeclarations[0] };
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
  const association = parsePullRequestAssociation(process.env.PR_BODY);
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
    '--required-check',
    requiredCheck,
  ];
  if (association.mode === 'spec') {
    args.push('--exclude', association.specIds.map((specId) => `specs/${specId}`).join(','));
    for (const specId of association.specIds) args.push('--spec-id', specId);
  } else {
    args.push('--exemption', association.exemption);
  }
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
