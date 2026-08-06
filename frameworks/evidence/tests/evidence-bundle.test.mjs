import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sealEvidenceBundle, validateEvidenceBundle } from '../scripts/evidence-bundle.mjs';

function candidate() {
  return {
    schema_version: 1,
    bundle_id: 'synthetic-bundle',
    created_at: '2026-08-05T00:00:00Z',
    evidence: [{ id: 'evidence-01', source_type: 'file', observed_at: '2026-08-05T00:00:00Z', scope: 'synthetic/input.md', summary: '合成输入存在。', content_digest: `sha256:${'1'.repeat(64)}`, status: 'valid' }],
    claims: [{ id: 'claim-01', kind: 'observation', statement: '合成输入存在。', evidence_refs: ['evidence-01'], blocker_refs: [], status: 'supported' }],
    blockers: [],
    verifications: [],
  };
}

test('Evidence Bundle 可封存并校验完整性与引用', () => {
  const bundle = sealEvidenceBundle(candidate());
  assert.equal(validateEvidenceBundle(bundle).ok, true);
  bundle.claims[0].statement = '被修改';
  assert.throws(() => validateEvidenceBundle(bundle), /完整性摘要不匹配/u);
});

test('Evidence Bundle 阻断悬空引用和无 Blocker 的 blocked Claim', () => {
  const missing = candidate();
  missing.claims[0].evidence_refs = ['missing-evidence'];
  assert.throws(() => sealEvidenceBundle(missing), /不存在的 Evidence/u);
  const blocked = candidate();
  blocked.claims[0].status = 'blocked';
  blocked.claims[0].evidence_refs = [];
  assert.throws(() => sealEvidenceBundle(blocked), /必须引用 Blocker/u);
});

test('Evidence Bundle 要求 Claim 与 Blocker 双向引用', () => {
  const value = candidate();
  value.claims[0].status = 'blocked';
  value.claims[0].evidence_refs = [];
  value.claims[0].blocker_refs = ['blocker-01'];
  value.blockers.push({ id: 'blocker-01', reason: '缺少合成证据。', affected_claim_refs: ['claim-01'] });
  assert.equal(validateEvidenceBundle(sealEvidenceBundle(value)).ok, true);
  value.blockers[0].affected_claim_refs = ['missing-claim'];
  assert.throws(() => sealEvidenceBundle(value), /双向引用/u);
});
