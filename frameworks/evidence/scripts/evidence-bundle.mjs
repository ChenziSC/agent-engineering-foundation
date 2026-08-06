import { createHash } from 'node:crypto';
import { lstat, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u;
const DIGEST = /^sha256:[a-f0-9]{64}$/u;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/u;

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function exact(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} 必须是对象`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} 字段与契约不一致`);
  }
}

function nonEmpty(value, label, maximum = 2000) {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum) throw new Error(`${label} 必须是非空短文本`);
}

function uniqueRefs(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !ID.test(item)) || new Set(value).size !== value.length) {
    throw new Error(`${label} 必须是无重复的 ID 数组`);
  }
}

function payloadDigest(bundle) {
  const payload = { ...bundle };
  delete payload.integrity;
  return `sha256:${createHash('sha256').update(canonical(payload)).digest('hex')}`;
}

export function sealEvidenceBundle(candidate) {
  const bundle = JSON.parse(JSON.stringify(candidate));
  bundle.integrity = {
    algorithm: 'sha256',
    canonicalization: 'canonical-json-without-integrity',
    payload_digest: payloadDigest(bundle),
  };
  validateEvidenceBundle(bundle);
  return bundle;
}

export function validateEvidenceBundle(bundle) {
  exact(bundle, ['schema_version', 'bundle_id', 'created_at', 'evidence', 'claims', 'blockers', 'verifications', 'integrity'], 'Evidence Bundle');
  if (bundle.schema_version !== 1 || !ID.test(bundle.bundle_id) || !DATE_TIME.test(bundle.created_at)) throw new Error('Evidence Bundle 标识、版本或时间无效');
  if (![bundle.evidence, bundle.claims, bundle.blockers, bundle.verifications].every(Array.isArray)) throw new Error('Evidence Bundle 集合字段必须是数组');
  const allIds = new Set();
  const addId = (id, label) => {
    if (!ID.test(id) || allIds.has(id)) throw new Error(`${label} ID 无效或在 Bundle 内重复`);
    allIds.add(id);
  };
  const evidenceById = new Map();
  for (const item of bundle.evidence) {
    exact(item, ['id', 'source_type', 'observed_at', 'scope', 'summary', 'content_digest', 'status'], 'Evidence');
    addId(item.id, 'Evidence');
    if (!['browser', 'file', 'repository', 'measurement', 'human-confirmation', 'other'].includes(item.source_type)) throw new Error(`Evidence ${item.id} source_type 无效`);
    if (!DATE_TIME.test(item.observed_at) || !DIGEST.test(item.content_digest) || !['valid', 'conflicted', 'stale'].includes(item.status)) throw new Error(`Evidence ${item.id} 时间、摘要或状态无效`);
    nonEmpty(item.scope, `Evidence ${item.id} scope`, 500);
    nonEmpty(item.summary, `Evidence ${item.id} summary`);
    evidenceById.set(item.id, item);
  }
  const claimById = new Map();
  for (const item of bundle.claims) {
    exact(item, ['id', 'kind', 'statement', 'evidence_refs', 'blocker_refs', 'status'], 'Claim');
    addId(item.id, 'Claim');
    if (!['observation', 'derived', 'inference'].includes(item.kind) || !['supported', 'partial', 'blocked', 'refuted', 'stale'].includes(item.status)) throw new Error(`Claim ${item.id} 类型或状态无效`);
    nonEmpty(item.statement, `Claim ${item.id} statement`);
    uniqueRefs(item.evidence_refs, `Claim ${item.id} evidence_refs`);
    uniqueRefs(item.blocker_refs, `Claim ${item.id} blocker_refs`);
    claimById.set(item.id, item);
  }
  const blockerById = new Map();
  for (const item of bundle.blockers) {
    exact(item, ['id', 'reason', 'affected_claim_refs'], 'Blocker');
    addId(item.id, 'Blocker');
    nonEmpty(item.reason, `Blocker ${item.id} reason`);
    uniqueRefs(item.affected_claim_refs, `Blocker ${item.id} affected_claim_refs`);
    if (!item.affected_claim_refs.length) throw new Error(`Blocker ${item.id} 至少影响一个 Claim`);
    blockerById.set(item.id, item);
  }
  for (const item of bundle.verifications) {
    exact(item, ['id', 'claim_ref', 'action', 'expected_observation', 'actual_observation', 'status'], 'Verification');
    addId(item.id, 'Verification');
    if (!ID.test(item.claim_ref) || !['planned', 'passed', 'failed', 'inconclusive'].includes(item.status)) throw new Error(`Verification ${item.id} 引用或状态无效`);
    nonEmpty(item.action, `Verification ${item.id} action`);
    nonEmpty(item.expected_observation, `Verification ${item.id} expected_observation`);
    if (item.actual_observation !== null && typeof item.actual_observation !== 'string') throw new Error(`Verification ${item.id} actual_observation 无效`);
    if (['passed', 'failed'].includes(item.status) && !item.actual_observation?.trim()) throw new Error(`Verification ${item.id} 完成后必须记录实际观察`);
    if (!claimById.has(item.claim_ref)) throw new Error(`Verification ${item.id} 引用不存在的 Claim`);
  }
  for (const claim of bundle.claims) {
    const evidence = claim.evidence_refs.map((id) => evidenceById.get(id));
    if (evidence.some((item) => !item)) throw new Error(`Claim ${claim.id} 引用不存在的 Evidence`);
    const blockers = claim.blocker_refs.map((id) => blockerById.get(id));
    if (blockers.some((item) => !item)) throw new Error(`Claim ${claim.id} 引用不存在的 Blocker`);
    if (claim.status === 'blocked' && !blockers.length) throw new Error(`blocked Claim ${claim.id} 必须引用 Blocker`);
    if (claim.status !== 'blocked' && !evidence.length) throw new Error(`非 blocked Claim ${claim.id} 必须引用 Evidence`);
    if (claim.status === 'supported' && evidence.some((item) => item.status !== 'valid')) throw new Error(`supported Claim ${claim.id} 只能依赖 valid Evidence`);
    if (claim.status === 'stale' && !evidence.some((item) => item.status === 'stale')) throw new Error(`stale Claim ${claim.id} 必须引用 stale Evidence`);
    for (const blocker of blockers) {
      if (!blocker.affected_claim_refs.includes(claim.id)) throw new Error(`Claim ${claim.id} 与 Blocker ${blocker.id} 必须双向引用`);
    }
  }
  for (const blocker of bundle.blockers) {
    for (const claimId of blocker.affected_claim_refs) {
      const claim = claimById.get(claimId);
      if (!claim || !claim.blocker_refs.includes(blocker.id)) throw new Error(`Blocker ${blocker.id} 与 Claim ${claimId} 必须双向引用`);
    }
  }
  exact(bundle.integrity, ['algorithm', 'canonicalization', 'payload_digest'], 'Integrity');
  if (bundle.integrity.algorithm !== 'sha256' || bundle.integrity.canonicalization !== 'canonical-json-without-integrity' || !DIGEST.test(bundle.integrity.payload_digest)) throw new Error('Integrity 契约无效');
  const actualDigest = payloadDigest(bundle);
  if (bundle.integrity.payload_digest !== actualDigest) throw new Error('Evidence Bundle 完整性摘要不匹配');
  return { ok: true, bundleId: bundle.bundle_id, digest: actualDigest, counts: { evidence: bundle.evidence.length, claims: bundle.claims.length, blockers: bundle.blockers.length, verifications: bundle.verifications.length } };
}

async function statOrNull(file) {
  try { return await lstat(file); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export async function checkEvidenceBundleFile(file) {
  const absolute = path.resolve(file);
  const stat = await statOrNull(absolute);
  if (!stat?.isFile() || stat.isSymbolicLink()) throw new Error('Evidence Bundle 必须是普通 JSON 文件');
  const bundle = JSON.parse(await readFile(absolute, 'utf8'));
  return { ...validateEvidenceBundle(bundle), file: absolute };
}

export async function sealEvidenceBundleFile(candidateFile, outputFile) {
  const candidate = JSON.parse(await readFile(path.resolve(candidateFile), 'utf8'));
  const bundle = sealEvidenceBundle(candidate);
  const output = path.resolve(outputFile);
  const content = `${JSON.stringify(bundle, null, 2)}\n`;
  const existing = await statOrNull(output);
  if (existing) {
    if (!existing.isFile() || existing.isSymbolicLink()) throw new Error('Evidence Bundle 输出目标不是普通文件');
    if (await readFile(output, 'utf8') !== content) throw new Error('Evidence Bundle 输出已存在且内容不同，拒绝覆盖');
    return { ...validateEvidenceBundle(bundle), file: output, status: 'unchanged' };
  }
  const temporary = `${output}.tmp-${process.pid}`;
  try {
    await writeFile(temporary, content, { flag: 'wx' });
    await rename(temporary, output);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  return { ...validateEvidenceBundle(bundle), file: output, status: 'sealed' };
}
