#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CANONICALIZATION = 'canonical-json-v1';
const ACCEPTED_CANONICALIZATIONS = new Set([CANONICALIZATION, 'canonical-json-v1:recursive-key-sort:utf8']);
const REQUIRED_ARTIFACT_ROLES = ['spec', 'plan', 'tasks', 'validation-report'];
const TERMINAL_STATES = new Set(['archived', 'cancelled', 'superseded']);
const ACTIVE_STATES = new Set(['draft', 'planned', 'in-progress']);
const RELATION_FIELDS = ['parent', 'children', 'supersedes', 'superseded_by'];

export class SpecflowArchiveError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'SpecflowArchiveError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details) {
  throw new SpecflowArchiveError(code, message, details);
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertRecord(value, label) {
  if (!isRecord(value)) fail('invalid-receipt', `${label} 必须是对象`);
  return value;
}

function assertExactKeys(value, required, optional, label) {
  const record = assertRecord(value, label);
  const allowed = new Set([...required, ...optional]);
  const missing = required.filter((key) => !Object.hasOwn(record, key));
  const unknown = Object.keys(record).filter((key) => !allowed.has(key));
  if (missing.length || unknown.length) {
    fail('invalid-receipt', `${label} 字段不符合契约`, { missing, unknown });
  }
}

function assertString(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail('invalid-receipt', `${label} 必须是非空字符串`);
}

function assertStringArray(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.length === 0)) {
    fail('invalid-receipt', `${label} 必须是非空字符串数组或空数组`);
  }
}

function assertUniqueStringArray(value, label) {
  assertStringArray(value, label);
  if (new Set(value).size !== value.length) fail('invalid-relation', `${label} 不得包含重复值`);
}

function assertDigest(value, label) {
  if (typeof value !== 'string' || !/^sha256:[a-f0-9]{64}$/u.test(value)) {
    fail('invalid-digest', `${label} 不是合法 sha256 摘要`);
  }
}

function stripInlineComment(value) {
  let quote = null;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\' && quote === '"') {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character === '#' && (index === 0 || /\s/u.test(value[index - 1]))) return value.slice(0, index).trimEnd();
  }
  return value;
}

function parseScalar(raw, line) {
  const value = stripInlineComment(raw.trim());
  if (value === '') fail('invalid-yaml-subset', '缺少 YAML 标量值', { line });
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === '[]') return [];
  if (value === '{}') return {};
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(value)) return Number(value);
  if (value.startsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      fail('invalid-yaml-subset', '双引号字符串无效', { line });
    }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'")) fail('invalid-yaml-subset', '单引号字符串无效', { line });
    return value.slice(1, -1).replace(/''/gu, "'");
  }
  return value;
}

function tokenizeYaml(text) {
  const tokens = [];
  for (const [index, rawLine] of text.split(/\r?\n/u).entries()) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith('#')) continue;
    if (rawLine.includes('\t')) fail('invalid-yaml-subset', 'YAML 不允许 Tab 缩进', { line: index + 1 });
    const indent = rawLine.match(/^ */u)[0].length;
    if (indent % 2 !== 0) fail('invalid-yaml-subset', 'YAML 缩进必须是两个空格的倍数', { line: index + 1 });
    tokens.push({ indent, body: rawLine.trim(), line: index + 1 });
  }
  return tokens;
}

function splitMapping(body, line) {
  const match = body.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/u);
  if (!match) fail('invalid-yaml-subset', '只支持简单 Mapping Key', { line });
  return { key: match[1], rawValue: match[2] || '' };
}

function parseYamlTokens(tokens) {
  function parseBlock(start, indent) {
    const token = tokens[start];
    if (!token || token.indent !== indent) fail('invalid-yaml-subset', 'YAML 缩进层级不连续', { line: token?.line });
    return token.body === '-' || token.body.startsWith('- ') ? parseSequence(start, indent) : parseMapping(start, indent);
  }

  function readMappingEntry(target, token, rawBody, nextIndex, childIndent) {
    const { key, rawValue } = splitMapping(rawBody, token.line);
    if (Object.hasOwn(target, key)) fail('invalid-yaml-subset', 'YAML 包含重复 Key', { line: token.line, key });
    if (rawValue !== '') {
      target[key] = parseScalar(rawValue, token.line);
      return nextIndex;
    }
    const next = tokens[nextIndex];
    if (!next || next.indent <= token.indent) {
      target[key] = null;
      return nextIndex;
    }
    if (next.indent !== childIndent) fail('invalid-yaml-subset', 'YAML 子级缩进不连续', { line: next.line });
    const parsed = parseBlock(nextIndex, childIndent);
    target[key] = parsed.value;
    return parsed.next;
  }

  function parseMapping(start, indent, initial) {
    const value = initial || {};
    let index = start;
    while (index < tokens.length && tokens[index].indent === indent && !tokens[index].body.startsWith('-')) {
      const token = tokens[index];
      index = readMappingEntry(value, token, token.body, index + 1, indent + 2);
    }
    return { value, next: index };
  }

  function parseSequence(start, indent) {
    const value = [];
    let index = start;
    while (index < tokens.length && tokens[index].indent === indent && (tokens[index].body === '-' || tokens[index].body.startsWith('- '))) {
      const token = tokens[index];
      const rest = token.body.slice(1).trim();
      index += 1;
      if (!rest) {
        const parsed = parseBlock(index, indent + 2);
        value.push(parsed.value);
        index = parsed.next;
        continue;
      }
      if (/^[A-Za-z0-9_-]+:/u.test(rest)) {
        const item = {};
        index = readMappingEntry(item, token, rest, index, indent + 2);
        if (index < tokens.length && tokens[index].indent === indent + 2 && !tokens[index].body.startsWith('-')) {
          const parsed = parseMapping(index, indent + 2, item);
          index = parsed.next;
        }
        value.push(item);
      } else value.push(parseScalar(rest, token.line));
    }
    return { value, next: index };
  }

  if (tokens.length === 0) return {};
  if (tokens[0].indent !== 0) fail('invalid-yaml-subset', 'YAML 根级必须从零缩进开始', { line: tokens[0].line });
  const parsed = parseBlock(0, 0);
  if (parsed.next !== tokens.length) fail('invalid-yaml-subset', 'YAML 存在无法解析的剩余内容', { line: tokens[parsed.next]?.line });
  return parsed.value;
}

export function parseYamlSubset(text) {
  try {
    return JSON.parse(text);
  } catch {
    return parseYamlTokens(tokenizeYaml(text));
  }
}

function scalarToYaml(value) {
  if (value === null) return 'null';
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value) && value.length === 0) return '[]';
  if (isRecord(value) && Object.keys(value).length === 0) return '{}';
  return null;
}

function serializeMapping(record, indent) {
  const lines = [];
  const prefix = ' '.repeat(indent);
  for (const [key, value] of Object.entries(record)) {
    const scalar = scalarToYaml(value);
    if (scalar !== null) lines.push(`${prefix}${key}: ${scalar}`);
    else lines.push(`${prefix}${key}:`, ...serializeYamlLines(value, indent + 2));
  }
  return lines;
}

function serializeSequence(items, indent) {
  const lines = [];
  const prefix = ' '.repeat(indent);
  for (const item of items) {
    const scalar = scalarToYaml(item);
    if (scalar !== null) {
      lines.push(`${prefix}- ${scalar}`);
      continue;
    }
    if (isRecord(item)) {
      const entries = Object.entries(item);
      const [firstKey, firstValue] = entries[0];
      const firstScalar = scalarToYaml(firstValue);
      if (firstScalar !== null) lines.push(`${prefix}- ${firstKey}: ${firstScalar}`);
      else lines.push(`${prefix}- ${firstKey}:`, ...serializeYamlLines(firstValue, indent + 4));
      for (const [key, value] of entries.slice(1)) {
        const itemScalar = scalarToYaml(value);
        if (itemScalar !== null) lines.push(`${' '.repeat(indent + 2)}${key}: ${itemScalar}`);
        else lines.push(`${' '.repeat(indent + 2)}${key}:`, ...serializeYamlLines(value, indent + 4));
      }
      continue;
    }
    lines.push(`${prefix}-`, ...serializeYamlLines(item, indent + 2));
  }
  return lines;
}

function serializeYamlLines(value, indent) {
  if (Array.isArray(value)) return serializeSequence(value, indent);
  if (isRecord(value)) return serializeMapping(value, indent);
  fail('invalid-yaml-subset', '无法序列化不受支持的值');
}

export function stringifyYamlSubset(value) {
  return `${serializeYamlLines(value, 0).join('\n')}\n`;
}

export function canonicalJson(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort((left, right) => {
        const leftPoints = Array.from(left, (character) => character.codePointAt(0));
        const rightPoints = Array.from(right, (character) => character.codePointAt(0));
        for (let index = 0; index < Math.min(leftPoints.length, rightPoints.length); index += 1) {
          if (leftPoints[index] !== rightPoints[index]) return leftPoints[index] - rightPoints[index];
        }
        return leftPoints.length - rightPoints.length;
      })
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  fail('invalid-canonical-value', '规范化输入包含不支持的值');
}

function sha256(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

export function computeReceiptPayloadDigest(receipt) {
  const payload = structuredClone(receipt);
  delete payload.integrity;
  return sha256(canonicalJson(payload));
}

function receiptPayloadEquals(left, right) {
  const leftPayload = structuredClone(left);
  const rightPayload = structuredClone(right);
  delete leftPayload.integrity;
  delete rightPayload.integrity;
  return canonicalJson(leftPayload) === canonicalJson(rightPayload);
}

async function statOrNull(filePath) {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function acquireProcessLock(lockPath, code, message) {
  const content = `${process.pid}\n`;
  try {
    await writeFile(lockPath, content, { flag: 'wx' });
    return async () => rm(lockPath, { force: true }).catch(() => {});
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }

  const before = await lstat(lockPath);
  if (!before.isFile() || before.isSymbolicLink()) fail('unsafe-symlink', '锁文件必须是普通文件', { path: lockPath });
  const existing = await readFile(lockPath, 'utf8');
  const ownerPid = /^\d+\n$/u.test(existing) ? Number(existing.trim()) : null;
  let ownerAlive = true;
  if (Number.isSafeInteger(ownerPid) && ownerPid > 0) {
    try {
      process.kill(ownerPid, 0);
    } catch (error) {
      if (error.code === 'ESRCH') ownerAlive = false;
      else if (error.code !== 'EPERM') throw error;
    }
  }
  if (ownerAlive) fail(code, message);

  const after = await lstat(lockPath);
  if (after.dev !== before.dev || after.ino !== before.ino || (await readFile(lockPath, 'utf8')) !== existing) {
    fail(code, `${message}；锁文件在恢复检查期间发生变化`);
  }
  await rm(lockPath);
  try {
    await writeFile(lockPath, content, { flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') fail(code, message);
    throw error;
  }
  return async () => rm(lockPath, { force: true }).catch(() => {});
}

function resolveInside(root, relativePath, label) {
  if (typeof relativePath !== 'string' || !relativePath.startsWith('./')) {
    fail('unsafe-path', `${label} 必须使用事项目录内的 ./ 相对路径`, { path: relativePath });
  }
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, relativePath);
  const relative = path.relative(resolvedRoot, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    fail('unsafe-path', `${label} 越出事项目录或指向目录本身`, { path: relativePath });
  }
  return resolved;
}

async function assertNoSymlinkSegments(root, target) {
  let current = path.resolve(root);
  const relative = path.relative(current, path.resolve(target));
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const entry = await statOrNull(current);
    if (entry?.isSymbolicLink()) fail('unsafe-symlink', '归档路径包含 Symlink', { path: current });
    if (!entry) return;
  }
}

function validateKnowledgeProjection(projection) {
  assertExactKeys(projection, ['impact', 'decisions'], ['reason'], 'knowledge_projection');
  if (!['reviewed', 'none'].includes(projection.impact)) fail('invalid-receipt', 'Knowledge Projection impact 无效');
  if (!Array.isArray(projection.decisions)) fail('invalid-receipt', 'Knowledge Projection decisions 必须是数组');
  if (projection.impact === 'none') {
    assertString(projection.reason, 'knowledge_projection.reason');
    if (projection.decisions.length !== 0) fail('invalid-receipt', 'impact 为 none 时 decisions 必须为空');
  } else if (projection.decisions.length === 0) fail('invalid-receipt', 'impact 为 reviewed 时至少需要一个 decision');
  for (const decision of projection.decisions) {
    assertExactKeys(decision, ['action', 'knowledge_id', 'reason', 'evidence_refs'], ['target_knowledge_id'], 'knowledge decision');
    if (!['create', 'update', 'still-valid', 'supersede', 'retire'].includes(decision.action)) {
      fail('invalid-receipt', 'Knowledge decision action 无效');
    }
    assertString(decision.knowledge_id, 'knowledge_id');
    assertString(decision.reason, 'knowledge decision reason');
    assertStringArray(decision.evidence_refs, 'knowledge decision evidence_refs');
    if (decision.action === 'supersede') assertString(decision.target_knowledge_id, 'target_knowledge_id');
  }
}

export function validateReceiptStructure(receipt) {
  assertExactKeys(
    receipt,
    ['schema_version', 'receipt_id', 'spec_id', 'created_at', 'transition', 'authorization', 'snapshot', 'validation', 'knowledge_projection', 'relations_snapshot', 'integrity'],
    [],
    'Archive Receipt',
  );
  if (receipt.schema_version !== 1) fail('invalid-receipt', '只支持 Archive Receipt schema_version 1');
  assertString(receipt.receipt_id, 'receipt_id');
  assertString(receipt.spec_id, 'spec_id');
  assertString(receipt.created_at, 'created_at');
  if (Number.isNaN(Date.parse(receipt.created_at))) fail('invalid-receipt', 'created_at 不是有效时间');

  assertExactKeys(receipt.transition, ['from', 'to'], [], 'transition');
  if (!ACTIVE_STATES.has(receipt.transition.from) || !TERMINAL_STATES.has(receipt.transition.to)) {
    fail('invalid-transition', '首次终态必须从 Active 进入 Terminal');
  }

  assertExactKeys(receipt.authorization, ['confirmed', 'confirmed_at', 'authority', 'evidence_ref'], [], 'authorization');
  if (receipt.authorization.confirmed !== true) fail('authorization-required', '终态授权必须明确确认');
  assertString(receipt.authorization.confirmed_at, 'authorization.confirmed_at');
  assertString(receipt.authorization.authority, 'authorization.authority');
  assertString(receipt.authorization.evidence_ref, 'authorization.evidence_ref');

  assertExactKeys(receipt.snapshot, ['source_revision', 'base_revision', 'change', 'artifacts'], [], 'snapshot');
  assertString(receipt.snapshot.source_revision, 'snapshot.source_revision');
  assertString(receipt.snapshot.base_revision, 'snapshot.base_revision');
  assertExactKeys(receipt.snapshot.change, ['algorithm', 'scope', 'digest', 'excludes'], [], 'snapshot.change');
  if (receipt.snapshot.change.algorithm !== 'sha256') fail('invalid-receipt', '变更摘要算法必须是 sha256');
  if (!['merge-candidate', 'committed-range', 'none'].includes(receipt.snapshot.change.scope)) {
    fail('invalid-receipt', '变更摘要 scope 无效');
  }
  assertDigest(receipt.snapshot.change.digest, 'snapshot.change.digest');
  assertStringArray(receipt.snapshot.change.excludes, 'snapshot.change.excludes');

  if (!Array.isArray(receipt.snapshot.artifacts)) fail('invalid-receipt', 'snapshot.artifacts 必须是数组');
  const roles = new Set();
  for (const artifact of receipt.snapshot.artifacts) {
    assertExactKeys(artifact, ['role', 'path', 'digest'], [], 'artifact');
    if (!['spec', 'plan', 'tasks', 'validation-report', 'research'].includes(artifact.role) || roles.has(artifact.role)) {
      fail('invalid-receipt', 'artifact role 无效或重复', { role: artifact.role });
    }
    roles.add(artifact.role);
    assertString(artifact.path, 'artifact.path');
    assertDigest(artifact.digest, `artifact ${artifact.role} digest`);
  }
  const missingRoles = REQUIRED_ARTIFACT_ROLES.filter((role) => !roles.has(role));
  if (missingRoles.length) fail('invalid-receipt', '缺少必需归档产物', { missingRoles });

  assertExactKeys(receipt.validation, ['result', 'completed_conditions', 'unresolved_blockers', 'evidence_refs'], [], 'validation');
  if (!['pass', 'partial', 'fail'].includes(receipt.validation.result)) fail('invalid-receipt', 'validation.result 无效');
  assertStringArray(receipt.validation.completed_conditions, 'validation.completed_conditions');
  assertStringArray(receipt.validation.unresolved_blockers, 'validation.unresolved_blockers');
  assertStringArray(receipt.validation.evidence_refs, 'validation.evidence_refs');
  if (receipt.transition.to === 'archived' && (receipt.validation.result !== 'pass' || receipt.validation.unresolved_blockers.length)) {
    fail('archive-blocked', 'Archived 必须通过验证且不存在未解决 Blocker');
  }

  validateKnowledgeProjection(receipt.knowledge_projection);
  validateRelationsSnapshot(receipt.relations_snapshot, receipt.spec_id, 'relations_snapshot');

  assertExactKeys(receipt.integrity, ['algorithm', 'canonicalization', 'payload_digest'], [], 'integrity');
  if (receipt.integrity.algorithm !== 'sha256' || !ACCEPTED_CANONICALIZATIONS.has(receipt.integrity.canonicalization)) {
    fail('invalid-integrity-contract', `完整性契约必须使用 sha256 和受支持的 canonical-json-v1`);
  }
  assertDigest(receipt.integrity.payload_digest, 'integrity.payload_digest');
  return receipt;
}

async function computeArtifactDigest(specDir, artifact) {
  const artifactPath = resolveInside(specDir, artifact.path, `artifact ${artifact.role}`);
  await assertNoSymlinkSegments(specDir, artifactPath);
  const entry = await statOrNull(artifactPath);
  if (!entry?.isFile()) fail('artifact-missing', '归档产物不存在或不是普通文件', { role: artifact.role, path: artifact.path });
  return sha256(await readFile(artifactPath));
}

export async function verifyArchiveReceipt(specDir, receiptPath = './archive-receipt.yaml') {
  const root = path.resolve(specDir);
  const absoluteReceipt = resolveInside(root, receiptPath, 'Archive Receipt');
  await assertNoSymlinkSegments(root, absoluteReceipt);
  const entry = await statOrNull(absoluteReceipt);
  if (!entry?.isFile()) fail('receipt-missing', 'Archive Receipt 不存在', { path: receiptPath });
  const receipt = validateReceiptStructure(parseYamlSubset(await readFile(absoluteReceipt, 'utf8')));
  for (const artifact of receipt.snapshot.artifacts) {
    const actual = await computeArtifactDigest(root, artifact);
    if (actual !== artifact.digest) {
      fail('artifact-digest-mismatch', '归档产物摘要不一致', { role: artifact.role, path: artifact.path });
    }
  }
  const expectedPayloadDigest = computeReceiptPayloadDigest(receipt);
  if (expectedPayloadDigest !== receipt.integrity.payload_digest) {
    fail('receipt-digest-mismatch', 'Archive Receipt Payload 摘要不一致');
  }
  return {
    ok: true,
    command: 'verify-receipt',
    status: 'verified',
    specId: receipt.spec_id,
    transition: receipt.transition,
    receiptPath,
    payloadDigest: expectedPayloadDigest,
  };
}

export async function sealArchiveReceipt(specDir, candidatePath, receiptPath = './archive-receipt.yaml') {
  const root = path.resolve(specDir);
  const rootEntry = await statOrNull(root);
  if (!rootEntry?.isDirectory() || rootEntry.isSymbolicLink()) fail('unsafe-path', '事项目录必须是普通目录');
  const candidateAbsolute = resolveInside(root, candidatePath, '候选 Receipt');
  const outputAbsolute = resolveInside(root, receiptPath, 'Archive Receipt');
  if (candidateAbsolute === outputAbsolute) fail('invalid-arguments', '候选文件与不可覆盖 Receipt 不能是同一路径');
  await assertNoSymlinkSegments(root, candidateAbsolute);
  await assertNoSymlinkSegments(root, outputAbsolute);
  const candidate = parseYamlSubset(await readFile(candidateAbsolute, 'utf8'));
  assertRecord(candidate, '候选 Receipt');
  candidate.integrity = {
    algorithm: 'sha256',
    canonicalization: CANONICALIZATION,
    payload_digest: `sha256:${'0'.repeat(64)}`,
  };
  if (!candidate.snapshot || !Array.isArray(candidate.snapshot.artifacts)) {
    fail('invalid-receipt', '候选 Receipt 缺少 snapshot.artifacts');
  }
  for (const artifact of candidate.snapshot.artifacts) artifact.digest = await computeArtifactDigest(root, artifact);
  candidate.integrity.payload_digest = computeReceiptPayloadDigest(candidate);
  validateReceiptStructure(candidate);
  const serialized = stringifyYamlSubset(candidate);

  const existing = await statOrNull(outputAbsolute);
  if (existing) {
    const verified = await verifyArchiveReceipt(root, receiptPath);
    const current = parseYamlSubset(await readFile(outputAbsolute, 'utf8'));
    if (!receiptPayloadEquals(current, candidate)) {
      fail('immutable-receipt-conflict', 'Archive Receipt 已存在且与当前候选不同，拒绝覆盖');
    }
    return { ...verified, command: 'seal-receipt', status: 'unchanged', nextAction: 'update-meta-last' };
  }

  try {
    await writeFile(outputAbsolute, serialized, { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    fail('immutable-receipt-conflict', 'Archive Receipt 在写入期间已由其他进程创建，拒绝覆盖');
  }
  const verified = await verifyArchiveReceipt(root, receiptPath);
  return { ...verified, command: 'seal-receipt', status: 'sealed', nextAction: 'update-meta-last' };
}

function assertMetaKeys(value, required, optional, label) {
  const record = isRecord(value) ? value : fail('invalid-meta', `${label} 必须是对象`);
  const allowed = new Set([...required, ...optional]);
  const missing = required.filter((key) => !Object.hasOwn(record, key));
  const unknown = Object.keys(record).filter((key) => !allowed.has(key));
  if (missing.length || unknown.length) fail('invalid-meta', `${label} 字段不符合契约`, { missing, unknown });
  return record;
}

function assertDateOnly(value, label) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    fail('invalid-meta', `${label} 必须是有效 YYYY-MM-DD 日期`);
  }
}

function assertLocalArtifactPath(value, label) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('./') ||
    value === './' ||
    path.isAbsolute(value) ||
    value.split('/').includes('..')
  ) {
    fail('invalid-meta', `${label} 必须是事项目录内的 ./ 相对路径`, { path: value });
  }
}

function assertProjectScopePath(value, label) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    path.isAbsolute(value) ||
    value === '.' ||
    value.split(/[\\/]/u).includes('..')
  ) {
    fail('invalid-meta', `${label} 必须是项目内相对路径`, { path: value });
  }
}

export function validateSpecMetaStructure(meta, { expectedId } = {}) {
  assertMetaKeys(
    meta,
    ['id', 'title', 'status', 'created_at', 'updated_at', 'scope', 'relations', 'artifacts', 'freshness', 'active_context', 'authorization'],
    [],
    'Meta',
  );
  if (typeof meta.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,127}$/u.test(meta.id)) {
    fail('invalid-meta', 'Meta id 只能包含小写字母、数字和连字符');
  }
  if (expectedId && meta.id !== expectedId) fail('meta-spec-mismatch', 'Meta ID 与事项目录或生命周期证据不一致');
  assertString(meta.title, 'Meta title');
  if (!ACTIVE_STATES.has(meta.status) && !TERMINAL_STATES.has(meta.status)) fail('invalid-meta', 'Meta status 无效');
  assertDateOnly(meta.created_at, 'Meta created_at');
  assertDateOnly(meta.updated_at, 'Meta updated_at');
  if (meta.updated_at < meta.created_at) fail('invalid-meta', 'Meta updated_at 不得早于 created_at');
  assertUniqueStringArray(meta.scope, 'Meta scope');
  for (const [index, scopedPath] of meta.scope.entries()) assertProjectScopePath(scopedPath, `Meta scope[${index}]`);
  if (meta.scope.length === 0) fail('invalid-meta', 'Meta scope 至少包含一个项目路径');
  validateRelationsSnapshot(meta.relations, meta.id, 'Meta relations', 'invalid-meta');

  assertMetaKeys(
    meta.artifacts,
    ['spec', 'plan', 'tasks', 'research', 'validation_report'],
    ['archive_receipt', 'lifecycle_dir'],
    'Meta artifacts',
  );
  for (const key of ['spec', 'plan', 'tasks', 'validation_report']) assertLocalArtifactPath(meta.artifacts[key], `Meta artifacts.${key}`);
  if (meta.artifacts.research !== null) assertLocalArtifactPath(meta.artifacts.research, 'Meta artifacts.research');
  if (meta.artifacts.archive_receipt !== undefined && meta.artifacts.archive_receipt !== null) {
    assertLocalArtifactPath(meta.artifacts.archive_receipt, 'Meta artifacts.archive_receipt');
  }
  if (meta.artifacts.lifecycle_dir !== undefined && meta.artifacts.lifecycle_dir !== null) {
    assertLocalArtifactPath(meta.artifacts.lifecycle_dir, 'Meta artifacts.lifecycle_dir');
  }

  assertMetaKeys(meta.freshness, ['status', 'last_reviewed_at', 'refresh_triggers'], [], 'Meta freshness');
  if (!['current', 'review-required', 'stale'].includes(meta.freshness.status)) fail('invalid-meta', 'Meta freshness.status 无效');
  assertDateOnly(meta.freshness.last_reviewed_at, 'Meta freshness.last_reviewed_at');
  assertUniqueStringArray(meta.freshness.refresh_triggers, 'Meta freshness.refresh_triggers');
  assertMetaKeys(meta.active_context, ['summary', 'next_task_id'], [], 'Meta active_context');
  assertString(meta.active_context.summary, 'Meta active_context.summary');
  if (meta.active_context.next_task_id !== null) assertString(meta.active_context.next_task_id, 'Meta active_context.next_task_id');
  assertMetaKeys(meta.authorization, ['terminal_transition_confirmed'], [], 'Meta authorization');
  if (typeof meta.authorization.terminal_transition_confirmed !== 'boolean') {
    fail('invalid-meta', 'Meta authorization.terminal_transition_confirmed 必须是布尔值');
  }

  if (TERMINAL_STATES.has(meta.status)) {
    assertLocalArtifactPath(meta.artifacts.archive_receipt, '终态 Meta artifacts.archive_receipt');
    assertLocalArtifactPath(meta.artifacts.lifecycle_dir, '终态 Meta artifacts.lifecycle_dir');
    if (meta.authorization.terminal_transition_confirmed !== true) fail('invalid-meta', '终态 Meta 必须记录明确授权');
    if (meta.status === 'superseded' && meta.relations.superseded_by === null) {
      fail('invalid-meta', 'superseded Meta 必须声明 superseded_by');
    }
  } else {
    if (meta.authorization.terminal_transition_confirmed !== false) fail('invalid-meta', 'Active Meta 不得声明终态授权已确认');
    if (meta.artifacts.archive_receipt !== undefined && meta.artifacts.archive_receipt !== null) {
      fail('invalid-meta', 'Active Meta 不得把 Archive Receipt 登记为已投影产物');
    }
  }
  return meta;
}

function validateMeta(meta, specId) {
  return validateSpecMetaStructure(meta, { expectedId: specId });
}

async function mutateMetaAtomically(specDir, metaPath, mutate, { beforeRename } = {}) {
  const root = path.resolve(specDir);
  const absoluteMeta = resolveInside(root, metaPath, 'Meta');
  await assertNoSymlinkSegments(root, absoluteMeta);
  const lockPath = `${absoluteMeta}.specflow-lock`;
  const temporaryPath = `${absoluteMeta}.specflow-${process.pid}-${Date.now()}.tmp`;
  const releaseLock = await acquireProcessLock(lockPath, 'meta-locked', 'Meta 正由另一个 Specflow 进程更新');
  try {
    const original = await readFile(absoluteMeta, 'utf8');
    const current = parseYamlSubset(original);
    const mutation = await mutate(current);
    if (!mutation.changed) return mutation.result;
    await writeFile(temporaryPath, stringifyYamlSubset(mutation.meta), { flag: 'wx' });
    if (beforeRename) await beforeRename();
    if ((await readFile(absoluteMeta, 'utf8')) !== original) fail('meta-concurrent-change', 'Meta 在状态最后写前发生变化');
    await rename(temporaryPath, absoluteMeta);
    const written = parseYamlSubset(await readFile(absoluteMeta, 'utf8'));
    if (canonicalJson(written) !== canonicalJson(mutation.meta)) fail('meta-write-verification-failed', 'Meta 回读校验失败');
    return mutation.result;
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => {});
    await releaseLock();
  }
}

async function readReceipt(specDir, receiptPath) {
  await verifyArchiveReceipt(specDir, receiptPath);
  return parseYamlSubset(await readFile(resolveInside(specDir, receiptPath, 'Archive Receipt'), 'utf8'));
}

function receiptMetaIsFinalized(meta, receipt, receiptPath) {
  return (
    meta.status === receipt.transition.to &&
    meta.artifacts.archive_receipt === receiptPath &&
    meta.authorization.terminal_transition_confirmed === true &&
    canonicalJson(meta.relations) === canonicalJson(receipt.relations_snapshot)
  );
}

export async function applyReceiptTransition(
  specDir,
  receiptPath = './archive-receipt.yaml',
  metaPath = './meta.yaml',
  options = {},
) {
  const root = path.resolve(specDir);
  const receipt = await readReceipt(root, receiptPath);
  return mutateMetaAtomically(
    root,
    metaPath,
    (metaValue) => {
      const meta = validateMeta(metaValue, receipt.spec_id);
      if (receiptMetaIsFinalized(meta, receipt, receiptPath)) {
        return {
          changed: false,
          meta,
          result: {
            ok: true,
            command: 'apply-receipt-meta',
            status: 'unchanged',
            specId: receipt.spec_id,
            transition: receipt.transition,
          },
        };
      }
      if (meta.status === receipt.transition.to) {
        fail('terminal-meta-inconsistent', 'Meta 已是目标终态，但 Receipt 路径、授权或关系快照不一致');
      }
      if (meta.status !== receipt.transition.from) {
        fail('invalid-transition', 'Meta 当前状态与 Receipt 起始状态不一致', {
          current: meta.status,
          expected: receipt.transition.from,
        });
      }
      meta.status = receipt.transition.to;
      meta.updated_at = receipt.created_at.slice(0, 10);
      meta.relations = structuredClone(receipt.relations_snapshot);
      meta.artifacts.archive_receipt = receiptPath;
      if (!Object.hasOwn(meta.artifacts, 'lifecycle_dir')) meta.artifacts.lifecycle_dir = './lifecycle';
      meta.authorization.terminal_transition_confirmed = true;
      return {
        changed: true,
        meta,
        result: {
          ok: true,
          command: 'apply-receipt-meta',
          status: 'updated',
          specId: receipt.spec_id,
          transition: receipt.transition,
        },
      };
    },
    options,
  );
}

export async function finalizeArchiveReceipt(
  specDir,
  candidatePath,
  { receiptPath = './archive-receipt.yaml', metaPath = './meta.yaml', beforeMetaRename } = {},
) {
  const receipt = await sealArchiveReceipt(specDir, candidatePath, receiptPath);
  const meta = await applyReceiptTransition(specDir, receiptPath, metaPath, { beforeRename: beforeMetaRename });
  return {
    ok: true,
    command: 'finalize-receipt',
    status: meta.status === 'unchanged' && receipt.status === 'unchanged' ? 'unchanged' : 'finalized',
    specId: receipt.specId,
    transition: receipt.transition,
    receipt: receipt.status,
    meta: meta.status,
  };
}

export function computeLifecycleEventDigest(event) {
  const payload = structuredClone(event);
  if (payload.integrity) delete payload.integrity.event_digest;
  return sha256(canonicalJson(payload));
}

function assertRelationValue(field, value, label) {
  if (['parent', 'superseded_by'].includes(field)) {
    if (value !== null) assertString(value, label);
    return;
  }
  assertUniqueStringArray(value, label);
}

function validateRelationsSnapshot(relations, specId, label, errorCode = 'invalid-receipt') {
  if (errorCode === 'invalid-meta') assertMetaKeys(relations, RELATION_FIELDS, [], label);
  else assertExactKeys(relations, RELATION_FIELDS, [], label);
  const relationString = (value, field) => {
    if (typeof value !== 'string' || !value.length) fail(errorCode, `${label}.${field} 必须是非空字符串或 null`);
  };
  const relationArray = (value, field) => {
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.length)) {
      fail(errorCode, `${label}.${field} 必须是字符串数组`);
    }
    if (new Set(value).size !== value.length) fail(errorCode, `${label}.${field} 不得包含重复值`);
  };
  if (relations.parent !== null) relationString(relations.parent, 'parent');
  relationArray(relations.children, 'children');
  relationArray(relations.supersedes, 'supersedes');
  if (relations.superseded_by !== null) relationString(relations.superseded_by, 'superseded_by');
  for (const field of RELATION_FIELDS) {
    const value = relations[field];
    if (value === specId || (Array.isArray(value) && value.includes(specId))) {
      fail('invalid-relation', `${label}.${field} 不得引用事项自身`, { specId, field });
    }
  }
  return relations;
}

function validateRelationChanges(changes, specId) {
  const record = assertRecord(changes, 'relation_changes');
  const allowed = new Set(RELATION_FIELDS);
  for (const [field, change] of Object.entries(record)) {
    if (!allowed.has(field)) fail('invalid-event', 'relation_changes 包含不支持的字段', { field });
    assertExactKeys(change, ['from', 'to'], [], `relation_changes.${field}`);
    assertRelationValue(field, change.from, `relation_changes.${field}.from`);
    assertRelationValue(field, change.to, `relation_changes.${field}.to`);
    if (canonicalJson(change.from) === canonicalJson(change.to)) {
      fail('invalid-event', 'relation_changes 的 from 与 to 不得相同', { field });
    }
    for (const value of [change.from, change.to]) {
      if (value === specId || (Array.isArray(value) && value.includes(specId))) {
        fail('invalid-relation', '关系变化不得引用事项自身', { specId, field });
      }
    }
  }
}

function relationSnapshotEquals(left, right) {
  return RELATION_FIELDS.every((field) => canonicalJson(left[field]) === canonicalJson(right[field]));
}

function applyRelationChanges(relations, event, label) {
  const next = structuredClone(relations);
  for (const [field, change] of Object.entries(event.relation_changes)) {
    if (canonicalJson(next[field]) !== canonicalJson(change.from)) {
      fail('lifecycle-relation-broken', `${label}的关系前置值与事件链不一致`, { field });
    }
    next[field] = structuredClone(change.to);
  }
  return next;
}

export function validateLifecycleEventStructure(event) {
  assertExactKeys(
    event,
    ['schema_version', 'event_id', 'spec_id', 'sequence', 'event_type', 'created_at', 'transition', 'authorization', 'reason', 'relation_changes', 'evidence_refs', 'integrity'],
    [],
    'Lifecycle Event',
  );
  if (event.schema_version !== 1) fail('invalid-event', '只支持 Lifecycle Event schema_version 1');
  assertString(event.event_id, 'event_id');
  assertString(event.spec_id, 'spec_id');
  if (!Number.isInteger(event.sequence) || event.sequence < 1) fail('invalid-event', 'sequence 必须是正整数');
  if (event.event_id !== `${event.spec_id}:${String(event.sequence).padStart(4, '0')}`) {
    fail('invalid-event', 'event_id 必须由 spec_id 和四位 sequence 组成');
  }
  if (!['superseded', 'cancelled', 'relation-updated', 'freshness-reviewed'].includes(event.event_type)) {
    fail('invalid-event', 'event_type 无效');
  }
  assertString(event.created_at, 'event.created_at');
  if (Number.isNaN(Date.parse(event.created_at))) fail('invalid-event', 'event.created_at 不是有效时间');
  assertExactKeys(event.transition, ['from', 'to'], [], 'event.transition');
  if (!TERMINAL_STATES.has(event.transition.from) || !TERMINAL_STATES.has(event.transition.to)) {
    fail('invalid-event', 'Lifecycle Event 只能连接终态');
  }
  if (event.event_type === 'superseded' && event.transition.to !== 'superseded') {
    fail('invalid-event', 'superseded Event 必须进入 superseded');
  }
  if (event.event_type === 'cancelled' && event.transition.to !== 'cancelled') {
    fail('invalid-event', 'cancelled Event 必须进入 cancelled');
  }
  if (['relation-updated', 'freshness-reviewed'].includes(event.event_type) && event.transition.from !== event.transition.to) {
    fail('invalid-event', `${event.event_type} 不得改变生命周期状态`);
  }
  assertExactKeys(event.authorization, ['confirmed', 'confirmed_at', 'authority', 'evidence_ref'], [], 'event.authorization');
  if (event.authorization.confirmed !== true) fail('authorization-required', 'Lifecycle Event 授权必须明确确认');
  assertString(event.authorization.confirmed_at, 'event.authorization.confirmed_at');
  assertString(event.authorization.authority, 'event.authorization.authority');
  assertString(event.authorization.evidence_ref, 'event.authorization.evidence_ref');
  assertString(event.reason, 'event.reason');
  validateRelationChanges(event.relation_changes, event.spec_id);
  assertStringArray(event.evidence_refs, 'event.evidence_refs');
  if (event.evidence_refs.length === 0) fail('invalid-event', 'Lifecycle Event 至少需要一个 Evidence Ref');
  assertExactKeys(event.integrity, ['algorithm', 'canonicalization', 'previous_digest', 'event_digest'], [], 'event.integrity');
  if (event.integrity.algorithm !== 'sha256' || !ACCEPTED_CANONICALIZATIONS.has(event.integrity.canonicalization)) {
    fail('invalid-integrity-contract', 'Lifecycle Event 完整性契约不受支持');
  }
  assertDigest(event.integrity.previous_digest, 'event.integrity.previous_digest');
  assertDigest(event.integrity.event_digest, 'event.integrity.event_digest');
  return event;
}

async function loadVerifiedLifecycleChain(specDir, receiptPath, lifecycleDir) {
  const root = path.resolve(specDir);
  const receipt = await readReceipt(root, receiptPath);
  const lifecycleAbsolute = resolveInside(root, lifecycleDir, 'Lifecycle 目录');
  await assertNoSymlinkSegments(root, lifecycleAbsolute);
  const lifecycleEntry = await statOrNull(lifecycleAbsolute);
  const names = lifecycleEntry
    ? (await readdir(lifecycleAbsolute, { withFileTypes: true })).map((entry) => {
        if (!entry.isFile() || entry.isSymbolicLink() || !/^\d{4}-[a-z0-9-]+\.yaml$/u.test(entry.name)) {
          fail('invalid-lifecycle-entry', 'Lifecycle 目录包含不支持的条目', { name: entry.name });
        }
        return entry.name;
      }).sort()
    : [];
  const events = [];
  let previousDigest = receipt.integrity.payload_digest;
  let currentState = receipt.transition.to;
  let currentRelations = structuredClone(receipt.relations_snapshot);
  for (const [index, name] of names.entries()) {
    const eventPath = path.join(lifecycleAbsolute, name);
    await assertNoSymlinkSegments(root, eventPath);
    const event = validateLifecycleEventStructure(parseYamlSubset(await readFile(eventPath, 'utf8')));
    const sequence = index + 1;
    const expectedName = `${String(sequence).padStart(4, '0')}-${event.event_type}.yaml`;
    if (event.spec_id !== receipt.spec_id || event.sequence !== sequence || name !== expectedName) {
      fail('lifecycle-sequence-broken', 'Lifecycle Event 序号、文件名或 Spec ID 不连续', { name });
    }
    if (event.integrity.previous_digest !== previousDigest) fail('lifecycle-chain-broken', 'Lifecycle Previous Digest 不连续', { name });
    if (event.transition.from !== currentState) fail('lifecycle-state-broken', 'Lifecycle 状态链不连续', { name });
    const digest = computeLifecycleEventDigest(event);
    if (digest !== event.integrity.event_digest) fail('event-digest-mismatch', 'Lifecycle Event 摘要不一致', { name });
    const relationsBefore = structuredClone(currentRelations);
    currentRelations = applyRelationChanges(currentRelations, event, `Lifecycle Event ${sequence}`);
    previousDigest = digest;
    currentState = event.transition.to;
    events.push({ name, event, digest, relationsBefore, relationsAfter: structuredClone(currentRelations) });
  }
  return { root, receipt, lifecycleAbsolute, lifecycleDir, events, previousDigest, currentState, currentRelations };
}

export async function verifyLifecycleChain(
  specDir,
  { receiptPath = './archive-receipt.yaml', lifecycleDir = './lifecycle' } = {},
) {
  const chain = await loadVerifiedLifecycleChain(specDir, receiptPath, lifecycleDir);
  return {
    ok: true,
    command: 'verify-chain',
    status: 'verified',
    specId: chain.receipt.spec_id,
    events: chain.events.length,
    currentState: chain.currentState,
    currentRelations: chain.currentRelations,
    lastDigest: chain.previousDigest,
  };
}

function prepareLifecycleCandidate(candidate, chain) {
  assertRecord(candidate, '候选 Lifecycle Event');
  if (candidate.spec_id !== chain.receipt.spec_id) fail('event-spec-mismatch', 'Event Spec ID 与 Receipt 不一致');
  if (!Number.isInteger(candidate.sequence) || candidate.sequence < 1) fail('invalid-event', '候选 Event sequence 无效');
  let expectedPrevious = chain.receipt.integrity.payload_digest;
  if (candidate.sequence > 1) {
    const previous = chain.events[candidate.sequence - 2];
    if (!previous) fail('lifecycle-sequence-broken', '候选 Event 跳过了前置序号');
    expectedPrevious = previous.digest;
  }
  candidate.integrity = {
    algorithm: 'sha256',
    canonicalization: CANONICALIZATION,
    previous_digest: expectedPrevious,
    event_digest: `sha256:${'0'.repeat(64)}`,
  };
  candidate.integrity.event_digest = computeLifecycleEventDigest(candidate);
  validateLifecycleEventStructure(candidate);
  const relationBase = chain.events[candidate.sequence - 1]?.relationsBefore || chain.currentRelations;
  applyRelationChanges(relationBase, candidate, '候选 Lifecycle Event');
  return candidate;
}

async function assertMetaMatchesChainTip(chain, metaPath, receiptPath) {
  const absoluteMeta = resolveInside(chain.root, metaPath, 'Meta');
  await assertNoSymlinkSegments(chain.root, absoluteMeta);
  const meta = validateMeta(parseYamlSubset(await readFile(absoluteMeta, 'utf8')), chain.receipt.spec_id);
  if (
    meta.status !== chain.currentState ||
    !relationSnapshotEquals(meta.relations, chain.currentRelations) ||
    meta.artifacts.archive_receipt !== receiptPath ||
    meta.authorization.terminal_transition_confirmed !== true
  ) {
    fail('meta-chain-out-of-sync', 'Meta 尚未投影到现有生命周期链尾，拒绝追加后续 Event');
  }
}

export async function sealLifecycleEvent(
  specDir,
  candidatePath,
  { receiptPath = './archive-receipt.yaml', lifecycleDir = './lifecycle', metaPath = './meta.yaml' } = {},
) {
  const chain = await loadVerifiedLifecycleChain(specDir, receiptPath, lifecycleDir);
  const candidateAbsolute = resolveInside(chain.root, candidatePath, '候选 Lifecycle Event');
  await assertNoSymlinkSegments(chain.root, candidateAbsolute);
  const candidate = prepareLifecycleCandidate(parseYamlSubset(await readFile(candidateAbsolute, 'utf8')), chain);
  const existingAtSequence = chain.events[candidate.sequence - 1];
  if (existingAtSequence) {
    if (canonicalJson(existingAtSequence.event) !== canonicalJson(candidate)) {
      fail('immutable-event-conflict', '该 Sequence 的 Lifecycle Event 已存在且与候选不同');
    }
    return {
      ok: true,
      command: 'seal-event',
      status: 'unchanged',
      specId: candidate.spec_id,
      sequence: candidate.sequence,
      eventPath: `./${path.posix.join(lifecycleDir.replace(/^\.\//u, ''), existingAtSequence.name)}`,
      eventDigest: existingAtSequence.digest,
      nextAction: 'update-meta-last',
    };
  }
  if (candidate.sequence !== chain.events.length + 1) fail('lifecycle-sequence-broken', '候选 Event sequence 必须紧接现有链');
  if (candidate.transition.from !== chain.currentState) fail('lifecycle-state-broken', '候选 Event 起始状态与现有链不一致');
  await assertMetaMatchesChainTip(chain, metaPath, receiptPath);
  await mkdir(chain.lifecycleAbsolute, { recursive: false }).catch((error) => {
    if (error.code !== 'EEXIST') throw error;
  });
  await assertNoSymlinkSegments(chain.root, chain.lifecycleAbsolute);
  const name = `${String(candidate.sequence).padStart(4, '0')}-${candidate.event_type}.yaml`;
  const output = path.join(chain.lifecycleAbsolute, name);
  try {
    await writeFile(output, stringifyYamlSubset(candidate), { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    fail('immutable-event-conflict', 'Lifecycle Event 在写入期间已由其他进程创建，拒绝覆盖');
  }
  const verified = await loadVerifiedLifecycleChain(chain.root, receiptPath, lifecycleDir);
  const sealed = verified.events.at(-1);
  if (!sealed || sealed.event.sequence !== candidate.sequence) fail('event-write-verification-failed', 'Lifecycle Event 回读校验失败');
  return {
    ok: true,
    command: 'seal-event',
    status: 'sealed',
    specId: candidate.spec_id,
    sequence: candidate.sequence,
    eventPath: `./${path.posix.join(lifecycleDir.replace(/^\.\//u, ''), name)}`,
    eventDigest: sealed.digest,
    nextAction: 'update-meta-last',
  };
}

export async function applyLifecycleEventTransition(
  specDir,
  sequence,
  { receiptPath = './archive-receipt.yaml', lifecycleDir = './lifecycle', metaPath = './meta.yaml', beforeRename } = {},
) {
  const chain = await loadVerifiedLifecycleChain(specDir, receiptPath, lifecycleDir);
  const record = chain.events[sequence - 1];
  if (!record) fail('event-missing', '找不到指定 Sequence 的 Lifecycle Event', { sequence });
  if (sequence !== chain.events.length) fail('event-not-chain-tip', '只能把当前链尾 Event 投影到 Meta');
  const event = record.event;
  return mutateMetaAtomically(
    chain.root,
    metaPath,
    (metaValue) => {
      const meta = validateMeta(metaValue, event.spec_id);
      const relationsApplied = relationSnapshotEquals(meta.relations, record.relationsAfter);
      if (meta.status === event.transition.to && relationsApplied && meta.artifacts.lifecycle_dir === lifecycleDir) {
        return {
          changed: false,
          meta,
          result: { ok: true, command: 'apply-event-meta', status: 'unchanged', specId: event.spec_id, sequence },
        };
      }
      if (meta.status !== event.transition.from) {
        fail('invalid-transition', 'Meta 当前状态与 Event 起始状态不一致', {
          current: meta.status,
          expected: event.transition.from,
        });
      }
      if (!relationSnapshotEquals(meta.relations, record.relationsBefore)) {
        fail('relation-precondition-failed', 'Meta 关系与 Event 前置快照不一致');
      }
      meta.relations = structuredClone(record.relationsAfter);
      meta.status = event.transition.to;
      meta.updated_at = event.created_at.slice(0, 10);
      meta.artifacts.lifecycle_dir = lifecycleDir;
      return {
        changed: true,
        meta,
        result: { ok: true, command: 'apply-event-meta', status: 'updated', specId: event.spec_id, sequence },
      };
    },
    { beforeRename },
  );
}

export async function finalizeLifecycleEvent(
  specDir,
  candidatePath,
  { receiptPath = './archive-receipt.yaml', lifecycleDir = './lifecycle', metaPath = './meta.yaml', beforeMetaRename } = {},
) {
  const event = await sealLifecycleEvent(specDir, candidatePath, { receiptPath, lifecycleDir, metaPath });
  const meta = await applyLifecycleEventTransition(specDir, event.sequence, {
    receiptPath,
    lifecycleDir,
    metaPath,
    beforeRename: beforeMetaRename,
  });
  return {
    ok: true,
    command: 'finalize-event',
    status: event.status === 'unchanged' && meta.status === 'unchanged' ? 'unchanged' : 'finalized',
    specId: event.specId,
    sequence: event.sequence,
    event: event.status,
    meta: meta.status,
  };
}

export function computeRelationTransactionDigest(transaction) {
  const payload = structuredClone(transaction);
  if (payload.integrity) delete payload.integrity.transaction_digest;
  return sha256(canonicalJson(payload));
}

export function validateRelationTransactionStructure(transaction) {
  assertExactKeys(
    transaction,
    ['schema_version', 'transaction_id', 'created_at', 'relation_type', 'authorization', 'reason', 'participants', 'evidence_refs', 'integrity'],
    [],
    'Relation Transaction',
  );
  if (transaction.schema_version !== 1) fail('invalid-relation-transaction', '只支持 Relation Transaction schema_version 1');
  assertString(transaction.transaction_id, 'transaction_id');
  if (!/^[a-z0-9][a-z0-9-]{0,99}$/u.test(transaction.transaction_id)) {
    fail('invalid-relation-transaction', 'transaction_id 只能包含小写字母、数字和连字符');
  }
  assertString(transaction.created_at, 'created_at');
  if (Number.isNaN(Date.parse(transaction.created_at))) fail('invalid-relation-transaction', 'created_at 不是有效时间');
  if (!['parent-child', 'supersession'].includes(transaction.relation_type)) {
    fail('invalid-relation-transaction', 'relation_type 只支持 parent-child 或 supersession');
  }
  assertExactKeys(transaction.authorization, ['confirmed', 'confirmed_at', 'authority', 'evidence_ref'], [], 'authorization');
  if (transaction.authorization.confirmed !== true) fail('authorization-required', '跨事项关系事务必须明确授权');
  assertString(transaction.authorization.confirmed_at, 'authorization.confirmed_at');
  if (Number.isNaN(Date.parse(transaction.authorization.confirmed_at))) {
    fail('invalid-relation-transaction', 'authorization.confirmed_at 不是有效时间');
  }
  assertString(transaction.authorization.authority, 'authorization.authority');
  assertString(transaction.authorization.evidence_ref, 'authorization.evidence_ref');
  assertString(transaction.reason, 'reason');
  if (!Array.isArray(transaction.participants) || transaction.participants.length !== 2) {
    fail('invalid-relation-transaction', 'v1 Relation Transaction 必须且只能包含两个事项');
  }
  const specIds = new Set();
  const specDirs = new Set();
  for (const participant of transaction.participants) {
    assertExactKeys(participant, ['spec_id', 'spec_dir', 'event_candidate', 'sequence', 'event_digest'], [], 'participant');
    assertString(participant.spec_id, 'participant.spec_id');
    assertString(participant.spec_dir, 'participant.spec_dir');
    assertString(participant.event_candidate, 'participant.event_candidate');
    if (!participant.spec_dir.startsWith('./') || !participant.event_candidate.startsWith('./')) {
      fail('unsafe-path', 'participant 路径必须使用 ./ 相对路径');
    }
    if (!Number.isInteger(participant.sequence) || participant.sequence < 1) {
      fail('invalid-relation-transaction', 'participant.sequence 必须是正整数');
    }
    assertDigest(participant.event_digest, 'participant.event_digest');
    if (specIds.has(participant.spec_id) || specDirs.has(participant.spec_dir)) {
      fail('invalid-relation-transaction', 'Relation Transaction 不得重复引用事项或目录');
    }
    specIds.add(participant.spec_id);
    specDirs.add(participant.spec_dir);
  }
  assertStringArray(transaction.evidence_refs, 'evidence_refs');
  if (transaction.evidence_refs.length === 0) fail('invalid-relation-transaction', 'Relation Transaction 至少需要一个 Evidence Ref');
  assertExactKeys(transaction.integrity, ['algorithm', 'canonicalization', 'transaction_digest'], [], 'integrity');
  if (transaction.integrity.algorithm !== 'sha256' || !ACCEPTED_CANONICALIZATIONS.has(transaction.integrity.canonicalization)) {
    fail('invalid-integrity-contract', 'Relation Transaction 完整性契约不受支持');
  }
  assertDigest(transaction.integrity.transaction_digest, 'integrity.transaction_digest');
  return transaction;
}

function onlyRelationChange(event, field) {
  const entries = Object.entries(event.relation_changes);
  if (entries.length !== 1 || entries[0][0] !== field) {
    fail('non-reciprocal-relation', '跨事项 Event 每侧只能声明本次事务对应的一个关系字段', {
      specId: event.spec_id,
      expectedField: field,
    });
  }
  return entries[0][1];
}

function sameStringSet(left, right) {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function assertSingleArrayAddition(change, value, label) {
  if (change.from.includes(value) || !change.to.includes(value)) fail('non-reciprocal-relation', `${label} 未增加对侧事项`);
  if (!sameStringSet(change.to, [...change.from, value])) fail('non-reciprocal-relation', `${label} 除对侧事项外还包含其他变化`);
}

function assertSingleArrayRemoval(change, value, label) {
  if (!change.from.includes(value) || change.to.includes(value)) fail('non-reciprocal-relation', `${label} 未移除对侧事项`);
  if (!sameStringSet(change.from, [...change.to, value])) fail('non-reciprocal-relation', `${label} 除对侧事项外还包含其他变化`);
}

function validateReciprocalRelation(relationType, preparedParticipants) {
  const [left, right] = preparedParticipants;
  const participants = [left, right];
  if (relationType === 'parent-child') {
    const child = participants.find(({ event }) => Object.hasOwn(event.relation_changes, 'parent'));
    const parent = participants.find(({ event }) => Object.hasOwn(event.relation_changes, 'children'));
    if (!child || !parent || child === parent) fail('non-reciprocal-relation', 'parent-child 必须分别更新 child.parent 与 parent.children');
    for (const participant of [child, parent]) {
      if (
        participant.event.event_type !== 'relation-updated' ||
        participant.event.transition.from !== participant.event.transition.to
      ) {
        fail('non-reciprocal-relation', 'parent-child 双方都必须使用不改变终态的 relation-updated Event');
      }
    }
    const parentChange = onlyRelationChange(child.event, 'parent');
    const childrenChange = onlyRelationChange(parent.event, 'children');
    if (parentChange.from === null && parentChange.to === parent.specId) {
      assertSingleArrayAddition(childrenChange, child.specId, 'parent.children');
      return;
    }
    if (parentChange.from === parent.specId && parentChange.to === null) {
      assertSingleArrayRemoval(childrenChange, child.specId, 'parent.children');
      return;
    }
    fail('non-reciprocal-relation', 'parent-child v1 只支持直接建立或解除一组父子关系');
  }

  const oldItem = participants.find(({ event }) => Object.hasOwn(event.relation_changes, 'superseded_by'));
  const replacement = participants.find(({ event }) => Object.hasOwn(event.relation_changes, 'supersedes'));
  if (!oldItem || !replacement || oldItem === replacement) {
    fail('non-reciprocal-relation', 'supersession 必须分别更新旧事项 superseded_by 与新事项 supersedes');
  }
  const supersededBy = onlyRelationChange(oldItem.event, 'superseded_by');
  const supersedes = onlyRelationChange(replacement.event, 'supersedes');
  if (supersededBy.from !== null || supersededBy.to !== replacement.specId) {
    fail('non-reciprocal-relation', '旧事项 superseded_by 必须从 null 指向替代事项');
  }
  if (oldItem.event.event_type !== 'superseded' || oldItem.event.transition.to !== 'superseded') {
    fail('non-reciprocal-relation', '旧事项必须通过 superseded Event 进入 superseded');
  }
  if (
    replacement.event.event_type !== 'relation-updated' ||
    replacement.event.transition.from !== 'archived' ||
    replacement.event.transition.to !== 'archived'
  ) {
    fail('non-reciprocal-relation', '替代事项必须保持 archived，并使用 relation-updated Event 登记 supersedes');
  }
  assertSingleArrayAddition(supersedes, oldItem.specId, 'replacement.supersedes');
}

async function prepareRelationTransaction(specsRoot, candidatePath, options) {
  const root = path.resolve(specsRoot);
  const rootEntry = await statOrNull(root);
  if (!rootEntry?.isDirectory() || rootEntry.isSymbolicLink()) fail('unsafe-path', 'Specs Root 必须是普通目录');
  const candidateAbsolute = resolveInside(root, candidatePath, '候选 Relation Transaction');
  await assertNoSymlinkSegments(root, candidateAbsolute);
  const candidate = assertRecord(parseYamlSubset(await readFile(candidateAbsolute, 'utf8')), '候选 Relation Transaction');
  if (!Array.isArray(candidate.participants) || candidate.participants.length !== 2) {
    fail('invalid-relation-transaction', 'v1 Relation Transaction 必须且只能包含两个事项');
  }
  const preparedParticipants = [];
  for (const input of candidate.participants) {
    assertExactKeys(input, ['spec_id', 'spec_dir', 'event_candidate'], ['sequence', 'event_digest'], 'participant');
    const specDir = resolveInside(root, input.spec_dir, 'participant.spec_dir');
    await assertNoSymlinkSegments(root, specDir);
    const specEntry = await statOrNull(specDir);
    if (!specEntry?.isDirectory() || specEntry.isSymbolicLink()) fail('unsafe-path', 'participant.spec_dir 必须是普通事项目录');
    const chain = await loadVerifiedLifecycleChain(specDir, options.receiptPath, options.lifecycleDir);
    if (chain.receipt.spec_id !== input.spec_id) fail('transaction-spec-mismatch', 'participant.spec_id 与 Receipt 不一致');
    const eventAbsolute = resolveInside(specDir, input.event_candidate, 'participant.event_candidate');
    await assertNoSymlinkSegments(specDir, eventAbsolute);
    const event = prepareLifecycleCandidate(parseYamlSubset(await readFile(eventAbsolute, 'utf8')), chain);
    const existing = chain.events[event.sequence - 1];
    if (existing && canonicalJson(existing.event) !== canonicalJson(event)) {
      fail('immutable-event-conflict', 'Relation Transaction 引用的既有 Event 与候选不同', { specId: input.spec_id });
    }
    if (!existing) {
      if (event.sequence !== chain.events.length + 1) fail('lifecycle-sequence-broken', '跨事项 Event sequence 必须紧接现有链');
      if (event.transition.from !== chain.currentState) fail('lifecycle-state-broken', '跨事项 Event 起始状态与现有链不一致');
      await assertMetaMatchesChainTip(chain, options.metaPath, options.receiptPath);
    }
    preparedParticipants.push({ input, specDir, chain, event, existing, specId: input.spec_id });
  }
  validateReciprocalRelation(candidate.relation_type, preparedParticipants);
  candidate.participants = preparedParticipants.map(({ input, event }) => ({
    spec_id: input.spec_id,
    spec_dir: input.spec_dir,
    event_candidate: input.event_candidate,
    sequence: event.sequence,
    event_digest: event.integrity.event_digest,
  }));
  candidate.integrity = {
    algorithm: 'sha256',
    canonicalization: CANONICALIZATION,
    transaction_digest: `sha256:${'0'.repeat(64)}`,
  };
  candidate.integrity.transaction_digest = computeRelationTransactionDigest(candidate);
  validateRelationTransactionStructure(candidate);
  return { root, candidate, preparedParticipants };
}

async function readRelationTransaction(specsRoot, transactionPath) {
  const root = path.resolve(specsRoot);
  const rootEntry = await statOrNull(root);
  if (!rootEntry?.isDirectory() || rootEntry.isSymbolicLink()) fail('unsafe-path', 'Specs Root 必须是普通目录');
  const absolute = resolveInside(root, transactionPath, 'Relation Transaction');
  await assertNoSymlinkSegments(root, absolute);
  const entry = await statOrNull(absolute);
  if (!entry?.isFile()) fail('relation-transaction-missing', 'Relation Transaction 不存在', { transactionPath });
  const transaction = validateRelationTransactionStructure(parseYamlSubset(await readFile(absolute, 'utf8')));
  if (computeRelationTransactionDigest(transaction) !== transaction.integrity.transaction_digest) {
    fail('relation-transaction-digest-mismatch', 'Relation Transaction 摘要不一致');
  }
  return { root, absolute, transaction };
}

export async function verifyRelationTransaction(
  specsRoot,
  transactionPath,
  { receiptPath = './archive-receipt.yaml', lifecycleDir = './lifecycle', metaPath = './meta.yaml' } = {},
) {
  const { root, transaction } = await readRelationTransaction(specsRoot, transactionPath);
  const preparedParticipants = [];
  for (const participant of transaction.participants) {
    const specDir = resolveInside(root, participant.spec_dir, 'participant.spec_dir');
    await assertNoSymlinkSegments(root, specDir);
    const chain = await loadVerifiedLifecycleChain(specDir, receiptPath, lifecycleDir);
    if (chain.receipt.spec_id !== participant.spec_id) fail('transaction-spec-mismatch', 'participant.spec_id 与 Receipt 不一致');
    const record = chain.events[participant.sequence - 1];
    if (!record || record.digest !== participant.event_digest) {
      fail('relation-transaction-incomplete', 'Relation Transaction 对应 Event 尚未完整写入', { specId: participant.spec_id });
    }
    try {
      await assertMetaMatchesChainTip(chain, metaPath, receiptPath);
    } catch (error) {
      if (error instanceof SpecflowArchiveError && error.code === 'meta-chain-out-of-sync') {
        fail('relation-transaction-incomplete', 'Relation Transaction 对应 Meta 尚未完整投影', { specId: participant.spec_id });
      }
      throw error;
    }
    preparedParticipants.push({ specId: participant.spec_id, event: record.event });
  }
  validateReciprocalRelation(transaction.relation_type, preparedParticipants);
  return {
    ok: true,
    command: 'verify-relation',
    status: 'verified',
    transactionId: transaction.transaction_id,
    relationType: transaction.relation_type,
    participants: transaction.participants.map(({ spec_id: specId }) => specId),
    transactionDigest: transaction.integrity.transaction_digest,
  };
}

export async function finalizeRelationTransaction(
  specsRoot,
  candidatePath,
  {
    transactionsDir = './.specflow-transactions',
    receiptPath = './archive-receipt.yaml',
    lifecycleDir = './lifecycle',
    metaPath = './meta.yaml',
    beforeSealParticipant,
    beforeMetaRenameParticipant,
  } = {},
) {
  const root = path.resolve(specsRoot);
  const rootEntry = await statOrNull(root);
  if (!rootEntry?.isDirectory() || rootEntry.isSymbolicLink()) fail('unsafe-path', 'Specs Root 必须是普通目录');
  const lockPath = path.join(root, '.specflow-relation.lock');
  const releaseLock = await acquireProcessLock(
    lockPath,
    'relation-transaction-locked',
    '另一个跨事项关系事务正在执行',
  );
  try {
    const prepared = await prepareRelationTransaction(root, candidatePath, { receiptPath, lifecycleDir, metaPath });
    const transactionRelative = `./${path.posix.join(transactionsDir.replace(/^\.\//u, ''), `${prepared.candidate.transaction_id}.yaml`)}`;
    const transactionAbsolute = resolveInside(root, transactionRelative, 'Relation Transaction');
    const transactionDirectory = path.dirname(transactionAbsolute);
    await assertNoSymlinkSegments(root, transactionDirectory);
    await mkdir(transactionDirectory, { recursive: false }).catch((error) => {
      if (error.code !== 'EEXIST') throw error;
    });
    await assertNoSymlinkSegments(root, transactionAbsolute);
    const existing = await statOrNull(transactionAbsolute);
    let transactionStatus = 'sealed';
    if (existing) {
      const current = (await readRelationTransaction(root, transactionRelative)).transaction;
      if (canonicalJson(current) !== canonicalJson(prepared.candidate)) {
        fail('immutable-relation-transaction-conflict', 'Relation Transaction 已存在且与当前候选不同，拒绝覆盖');
      }
      transactionStatus = 'unchanged';
    } else {
      try {
        await writeFile(transactionAbsolute, stringifyYamlSubset(prepared.candidate), { flag: 'wx' });
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        fail('immutable-relation-transaction-conflict', 'Relation Transaction 在写入期间已由其他进程创建，拒绝覆盖');
      }
      await readRelationTransaction(root, transactionRelative);
    }

    const eventStatuses = [];
    for (const [index, participant] of prepared.preparedParticipants.entries()) {
      if (beforeSealParticipant) await beforeSealParticipant({ index, specId: participant.specId });
      const result = await sealLifecycleEvent(participant.specDir, participant.input.event_candidate, {
        receiptPath,
        lifecycleDir,
        metaPath,
      });
      eventStatuses.push(result.status);
    }

    const metaStatuses = [];
    for (const [index, participant] of prepared.preparedParticipants.entries()) {
      const result = await applyLifecycleEventTransition(participant.specDir, participant.event.sequence, {
        receiptPath,
        lifecycleDir,
        metaPath,
        beforeRename: beforeMetaRenameParticipant
          ? () => beforeMetaRenameParticipant({ index, specId: participant.specId })
          : undefined,
      });
      metaStatuses.push(result.status);
    }
    await verifyRelationTransaction(root, transactionRelative, { receiptPath, lifecycleDir, metaPath });
    const unchanged = transactionStatus === 'unchanged' && eventStatuses.every((status) => status === 'unchanged') && metaStatuses.every((status) => status === 'unchanged');
    return {
      ok: true,
      command: 'finalize-relation',
      status: unchanged ? 'unchanged' : 'finalized',
      transactionId: prepared.candidate.transaction_id,
      transactionPath: transactionRelative,
      relationType: prepared.candidate.relation_type,
      transaction: transactionStatus,
      events: eventStatuses,
      metas: metaStatuses,
    };
  } finally {
    await releaseLock();
  }
}

function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      positional.push(value);
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) options[value.slice(2)] = true;
    else {
      options[value.slice(2)] = next;
      index += 1;
    }
  }
  return { positional, options };
}

function required(options, key) {
  if (!options[key] || options[key] === true) fail('invalid-arguments', `缺少 --${key}`);
  return options[key];
}

export async function runCli(argv) {
  const { positional, options } = parseArgs(argv);
  const command = positional[0];
  if (command === 'finalize-relation') {
    return finalizeRelationTransaction(required(options, 'specs-root'), required(options, 'candidate'), {
      transactionsDir: options['transactions-dir'] && options['transactions-dir'] !== true ? options['transactions-dir'] : './.specflow-transactions',
      receiptPath: options.receipt && options.receipt !== true ? options.receipt : './archive-receipt.yaml',
      lifecycleDir: options['lifecycle-dir'] && options['lifecycle-dir'] !== true ? options['lifecycle-dir'] : './lifecycle',
      metaPath: options.meta && options.meta !== true ? options.meta : './meta.yaml',
    });
  }
  if (command === 'verify-relation') {
    return verifyRelationTransaction(required(options, 'specs-root'), required(options, 'transaction'), {
      receiptPath: options.receipt && options.receipt !== true ? options.receipt : './archive-receipt.yaml',
      lifecycleDir: options['lifecycle-dir'] && options['lifecycle-dir'] !== true ? options['lifecycle-dir'] : './lifecycle',
      metaPath: options.meta && options.meta !== true ? options.meta : './meta.yaml',
    });
  }
  const specDir = required(options, 'spec-dir');
  const receipt = options.receipt && options.receipt !== true ? options.receipt : './archive-receipt.yaml';
  const lifecycleDir = options['lifecycle-dir'] && options['lifecycle-dir'] !== true ? options['lifecycle-dir'] : './lifecycle';
  const metaPath = options.meta && options.meta !== true ? options.meta : './meta.yaml';
  if (command === 'seal-receipt') return sealArchiveReceipt(specDir, required(options, 'candidate'), receipt);
  if (command === 'verify-receipt') return verifyArchiveReceipt(specDir, receipt);
  if (command === 'finalize-receipt') {
    return finalizeArchiveReceipt(specDir, required(options, 'candidate'), { receiptPath: receipt, metaPath });
  }
  if (command === 'seal-event') {
    return sealLifecycleEvent(specDir, required(options, 'candidate'), { receiptPath: receipt, lifecycleDir, metaPath });
  }
  if (command === 'verify-chain') return verifyLifecycleChain(specDir, { receiptPath: receipt, lifecycleDir });
  if (command === 'finalize-event') {
    return finalizeLifecycleEvent(specDir, required(options, 'candidate'), {
      receiptPath: receipt,
      lifecycleDir,
      metaPath,
    });
  }
  fail(
    'invalid-arguments',
    '用法：seal-receipt|finalize-receipt --spec-dir <dir> --candidate <relative-path> | verify-receipt --spec-dir <dir> | seal-event|finalize-event --spec-dir <dir> --candidate <relative-path> | verify-chain --spec-dir <dir> | finalize-relation --specs-root <dir> --candidate <relative-path> | verify-relation --specs-root <dir> --transaction <relative-path>',
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  runCli(process.argv.slice(2))
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      const known = error instanceof SpecflowArchiveError;
      process.stdout.write(
        `${JSON.stringify({ ok: false, error: { code: known ? error.code : 'unexpected-error', message: error.message, details: known ? error.details : undefined } }, null, 2)}\n`,
      );
      process.exitCode = known && error.code === 'invalid-arguments' ? 2 : 1;
    });
}
