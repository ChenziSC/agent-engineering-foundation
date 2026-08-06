import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluatePrefetchCandidate, summarizeHar, summarizeTrace, summarizeWebEvidence } from '../scripts/web-evidence.mjs';

test('HAR 只导出网络 Observation 并保留证据限制', () => {
  const result = summarizeHar({ log: { entries: [{ startedDateTime: '2026-08-05T00:00:00Z', time: 120, request: { method: 'GET', url: 'https://example.com/synthetic' }, response: { status: 200, bodySize: 128 } }] } });
  assert.equal(result.requests.length, 1);
  assert.match(result.limitations.join(' '), /不包含主线程/u);
});

test('Trace 只把明确完整事件解析为任务 Observation', () => {
  const result = summarizeTrace({ traceEvents: [{ ph: 'X', cat: 'devtools.timeline', name: 'RunTask', ts: 10, dur: 60_000 }] });
  assert.equal(result.long_tasks[0].duration_ms, 60);
  assert.match(result.limitations.join(' '), /不能证明稳定收益/u);
});

test('Web Evidence 要求页面版本且公开不能推导的 Claim', () => {
  const result = summarizeWebEvidence({ version: 1, page_version: 'synthetic-1', har: { log: { entries: [] } } });
  assert.ok(result.claims_not_derived.some((item) => item.includes('HAR')));
  assert.throws(() => summarizeWebEvidence({ version: 1, page_version: '', har: {} }), /无效/u);
});

function candidate() {
  return { version: 1, id: 'synthetic-request', method: 'GET', side_effect_free: true, repeat_safe: true, request_contract: { consumer: 'v1', prefetch: 'v1' }, cache_key_dimensions: ['item', 'locale', 'identity'], required_dimensions: ['item', 'locale', 'identity'], identity_stable_before_trigger: true, consumer_reuses_result: true, fallback_preserves_original_path: true, states_covered: ['normal', 'empty', 'error', 'permission'] };
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
