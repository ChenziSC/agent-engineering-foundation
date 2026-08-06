import { createHash } from 'node:crypto';

const ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u;
const DIGEST = /^sha256:[a-f0-9]{64}$/u;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/u;

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function exact(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} 必须是对象`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) throw new Error(`${label} 字段与契约不一致`);
}

function uniqueIds(items, label) {
  const ids = new Set();
  for (const item of items) {
    if (!ID.test(item.id) || ids.has(item.id)) throw new Error(`${label} ID 无效或重复`);
    ids.add(item.id);
  }
  return ids;
}

function payloadDigest(checkpoint) {
  const payload = { ...checkpoint };
  delete payload.integrity;
  return `sha256:${createHash('sha256').update(canonical(payload)).digest('hex')}`;
}

export function validateCheckpoint(checkpoint) {
  exact(checkpoint, ['schema_version', 'run', 'stages', 'events', 'decisions', 'external_refs', 'integrity'], 'Checkpoint');
  if (checkpoint.schema_version !== 1) throw new Error('Checkpoint schema_version 无效');
  exact(checkpoint.run, ['id', 'task_type', 'status', 'current_stage_id', 'updated_at'], 'Run');
  if (!ID.test(checkpoint.run.id) || !checkpoint.run.task_type?.trim() || !['active', 'paused', 'blocked', 'completed', 'cancelled'].includes(checkpoint.run.status) || !DATE_TIME.test(checkpoint.run.updated_at)) throw new Error('Run 字段无效');
  if (![checkpoint.stages, checkpoint.events, checkpoint.decisions, checkpoint.external_refs].every(Array.isArray) || checkpoint.stages.length === 0) throw new Error('Checkpoint 集合字段无效');
  const stageIds = uniqueIds(checkpoint.stages, 'Stage');
  if (!stageIds.has(checkpoint.run.current_stage_id)) throw new Error('Run current_stage_id 不存在');
  for (const stage of checkpoint.stages) {
    exact(stage, ['id', 'status', 'replay_policy', 'input_digest', 'exit_gate'], `Stage ${stage.id}`);
    exact(stage.exit_gate, ['status', 'reasons'], `Stage ${stage.id} exit_gate`);
    if (!['pending', 'active', 'paused', 'blocked', 'completed', 'skipped'].includes(stage.status) || !['idempotent', 'verify-before-replay', 'manual-only'].includes(stage.replay_policy) || !DIGEST.test(stage.input_digest)) throw new Error(`Stage ${stage.id} 字段无效`);
    if (!['unknown', 'allowed', 'denied'].includes(stage.exit_gate.status) || !Array.isArray(stage.exit_gate.reasons) || stage.exit_gate.reasons.some((item) => typeof item !== 'string')) throw new Error(`Stage ${stage.id} exit_gate 无效`);
  }
  uniqueIds(checkpoint.events, 'Event');
  checkpoint.events.forEach((event, index) => {
    exact(event, ['sequence', 'id', 'type', 'stage_id', 'occurred_at', 'summary'], `Event ${event.id}`);
    if (event.sequence !== index + 1 || !stageIds.has(event.stage_id) || !DATE_TIME.test(event.occurred_at) || !event.summary?.trim()) throw new Error(`Event ${event.id} 顺序或字段无效`);
  });
  uniqueIds(checkpoint.decisions, 'Decision');
  for (const decision of checkpoint.decisions) {
    exact(decision, ['id', 'actor_type', 'stage_id', 'decision', 'decided_at'], `Decision ${decision.id}`);
    if (!stageIds.has(decision.stage_id) || !['human', 'policy'].includes(decision.actor_type) || !['continue', 'skip', 'revalidate', 'cancel'].includes(decision.decision) || !DATE_TIME.test(decision.decided_at)) throw new Error(`Decision ${decision.id} 字段无效`);
  }
  uniqueIds(checkpoint.external_refs, 'ExternalRef');
  for (const ref of checkpoint.external_refs) {
    exact(ref, ['id', 'type', 'content_digest', 'status'], `ExternalRef ${ref.id}`);
    if (!['evidence', 'claim', 'file', 'external-artifact', 'other'].includes(ref.type) || !DIGEST.test(ref.content_digest) || !['valid', 'stale', 'unknown'].includes(ref.status)) throw new Error(`ExternalRef ${ref.id} 字段无效`);
  }
  exact(checkpoint.integrity, ['algorithm', 'canonicalization', 'payload_digest'], 'Integrity');
  if (checkpoint.integrity.algorithm !== 'sha256' || checkpoint.integrity.canonicalization !== 'canonical-json-without-integrity' || checkpoint.integrity.payload_digest !== payloadDigest(checkpoint)) throw new Error('Checkpoint 完整性摘要不匹配');
  return { ok: true, runId: checkpoint.run.id, digest: checkpoint.integrity.payload_digest, eventCount: checkpoint.events.length };
}

export function sealCheckpoint(candidate) {
  const checkpoint = structuredClone(candidate);
  checkpoint.integrity = { algorithm: 'sha256', canonicalization: 'canonical-json-without-integrity', payload_digest: payloadDigest(checkpoint) };
  validateCheckpoint(checkpoint);
  return checkpoint;
}

export function deriveResumePlan(checkpoint, { currentInputDigest } = {}) {
  validateCheckpoint(checkpoint);
  const stage = checkpoint.stages.find((item) => item.id === checkpoint.run.current_stage_id);
  const staleRefs = checkpoint.external_refs.filter((ref) => ref.status !== 'valid').map((ref) => ref.id);
  if (checkpoint.run.status === 'completed' || checkpoint.run.status === 'cancelled') return { action: 'stop', stage_id: stage.id, reason: 'Run 已处于终态。', blockers: [] };
  if (staleRefs.length) return { action: 'revalidate', stage_id: stage.id, reason: '存在失效或未知的外部引用。', blockers: staleRefs };
  if (currentInputDigest && currentInputDigest !== stage.input_digest) return { action: 'revalidate', stage_id: stage.id, reason: '阶段输入摘要已经变化。', blockers: ['input-digest-changed'] };
  if (stage.replay_policy === 'manual-only') return { action: 'confirm-manually', stage_id: stage.id, reason: '该阶段包含不能自动重放的动作。', blockers: ['manual-decision-required'] };
  if (stage.replay_policy === 'verify-before-replay') return { action: 'revalidate', stage_id: stage.id, reason: '必须先确认外部结果，再决定是否重放。', blockers: ['external-result-unknown'] };
  if (stage.exit_gate.status === 'denied') return { action: 'blocked', stage_id: stage.id, reason: stage.exit_gate.reasons.join('；') || '阶段退出门禁拒绝继续。', blockers: ['exit-gate-denied'] };
  return { action: 'continue', stage_id: stage.id, reason: '输入与引用仍有效，且当前阶段允许幂等重放。', blockers: [] };
}
