import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deriveResumePlan, sealCheckpoint, validateCheckpoint } from '../scripts/checkpoint.mjs';

const digest = (character) => `sha256:${character.repeat(64)}`;

function candidate(overrides = {}) {
  return {
    schema_version: 1,
    run: { id: 'synthetic-run', task_type: 'synthetic-analysis', status: 'paused', current_stage_id: 'verify', updated_at: '2026-08-05T00:00:00Z' },
    stages: [{ id: 'verify', status: 'paused', replay_policy: 'idempotent', input_digest: digest('1'), exit_gate: { status: 'unknown', reasons: [] } }],
    events: [{ sequence: 1, id: 'event-01', type: 'stage-paused', stage_id: 'verify', occurred_at: '2026-08-05T00:00:00Z', summary: '合成中断。' }],
    decisions: [],
    external_refs: [],
    ...overrides,
  };
}

test('Checkpoint 可封存、复核并为幂等阶段生成继续计划', () => {
  const checkpoint = sealCheckpoint(candidate());
  assert.equal(validateCheckpoint(checkpoint).ok, true);
  assert.equal(deriveResumePlan(checkpoint, { currentInputDigest: digest('1') }).action, 'continue');
  checkpoint.run.status = 'active';
  assert.throws(() => validateCheckpoint(checkpoint), /完整性摘要/u);
});

test('输入漂移、Evidence 失效和非幂等阶段不会自动重放', () => {
  const changed = sealCheckpoint(candidate());
  assert.equal(deriveResumePlan(changed, { currentInputDigest: digest('2') }).action, 'revalidate');
  const stale = sealCheckpoint(candidate({ external_refs: [{ id: 'claim-01', type: 'claim', content_digest: digest('3'), status: 'stale' }] }));
  assert.equal(deriveResumePlan(stale).action, 'revalidate');
  const manualCandidate = candidate();
  manualCandidate.stages[0].replay_policy = 'manual-only';
  assert.equal(deriveResumePlan(sealCheckpoint(manualCandidate)).action, 'confirm-manually');
});

test('Checkpoint 阻断断序 Event 和不存在的当前阶段', () => {
  const broken = candidate();
  broken.events[0].sequence = 2;
  assert.throws(() => sealCheckpoint(broken), /顺序/u);
  const missing = candidate();
  missing.run.current_stage_id = 'missing';
  assert.throws(() => sealCheckpoint(missing), /不存在/u);
});
