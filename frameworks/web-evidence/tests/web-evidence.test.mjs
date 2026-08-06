import assert from 'node:assert/strict';
import { test } from 'node:test';
import { summarizeHar, summarizeTrace, summarizeWebEvidence } from '../scripts/web-evidence.mjs';

test('HAR 只导出网络 Observation 并保留证据限制', () => {
  const result = summarizeHar({
    log: {
      entries: [
        {
          startedDateTime: '2026-08-05T00:00:00Z',
          time: 120,
          request: { method: 'GET', url: 'https://example.com/synthetic' },
          response: { status: 200, bodySize: 128 },
        },
      ],
    },
  });
  assert.equal(result.requests.length, 1);
  assert.match(result.limitations.join(' '), /不包含主线程/u);
});

test('Trace 只把明确完整事件解析为任务 Observation', () => {
  const result = summarizeTrace({
    traceEvents: [{ ph: 'X', cat: 'devtools.timeline', name: 'RunTask', ts: 10, dur: 60_000 }],
  });
  assert.equal(result.long_tasks[0].duration_ms, 60);
  assert.match(result.limitations.join(' '), /不能证明稳定收益/u);
});

test('Web Evidence 要求页面版本且公开不能推导的 Claim', () => {
  const result = summarizeWebEvidence({ version: 1, page_version: 'synthetic-1', har: { log: { entries: [] } } });
  assert.ok(result.claims_not_derived.some((item) => item.includes('HAR')));
  assert.throws(() => summarizeWebEvidence({ version: 1, page_version: '', har: {} }), /无效/u);
});
