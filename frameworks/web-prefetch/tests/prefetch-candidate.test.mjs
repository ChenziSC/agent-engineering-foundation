import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluatePrefetchCandidate } from '../scripts/prefetch-candidate.mjs';

function candidate() {
  return {
    version: 1,
    id: 'synthetic-request',
    method: 'GET',
    side_effect_free: true,
    repeat_safe: true,
    request_contract: { consumer: 'v1', prefetch: 'v1' },
    cache_key_dimensions: ['item', 'locale', 'identity'],
    required_dimensions: ['item', 'locale', 'identity'],
    identity_stable_before_trigger: true,
    consumer_reuses_result: true,
    fallback_preserves_original_path: true,
    states_covered: ['normal', 'empty', 'error', 'permission'],
  };
}

test('预请求候选通过资格检查后只能标记 ready', () => {
  const result = evaluatePrefetchCandidate(candidate());
  assert.equal(result.status, 'ready');
  assert.equal(result.verified, false);
});

test('写请求、契约漂移和缓存维度缺失均产生 Blocker', () => {
  const value = candidate();
  value.method = 'POST';
  value.request_contract.prefetch = 'v2';
  value.cache_key_dimensions = ['item'];
  const result = evaluatePrefetchCandidate(value);
  assert.equal(result.status, 'blocked');
  assert.ok(result.blockers.includes('request-not-safe-to-repeat'));
  assert.ok(result.blockers.includes('request-contract-drift'));
  assert.ok(result.blockers.includes('cache-key-incomplete'));
});
