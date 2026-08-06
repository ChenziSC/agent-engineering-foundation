import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateChangeValidation } from '../scripts/change-validation.mjs';

function matrix() {
  return {
    version: 1, change_id: 'synthetic-change', changed_paths: ['src/page.ts'],
    rules: [{ id: 'page', path_prefixes: ['src/'], required_checks: ['unit'], required_browser_scenarios: ['normal', 'empty', 'error'], required_manual_gates: [] }],
    checks: [{ id: 'unit', command: 'npm test', status: 'passed', evidence_ref: 'local:test-output' }],
    browser_scenarios: ['normal', 'empty', 'error'].map((id) => ({ id, page: '/synthetic', version: 'candidate-1', preconditions: [], actions: ['打开页面'], expected: ['状态正确'], status: 'passed', evidence_ref: `browser:${id}` })),
    manual_gates: [],
  };
}

test('增量覆盖矩阵在路径与全部关键场景通过时通过', () => {
  const result = evaluateChangeValidation(matrix());
  assert.equal(result.ok, true);
  assert.deepEqual(result.uncovered_paths, []);
});

test('未覆盖路径和失败浏览器场景阻断通过', () => {
  const uncovered = matrix();
  uncovered.changed_paths.push('config/unknown.yaml');
  assert.equal(evaluateChangeValidation(uncovered).status, 'uncovered');
  const failed = matrix();
  failed.browser_scenarios[1].status = 'failed';
  failed.browser_scenarios[1].evidence_ref = 'browser:empty-failed';
  assert.equal(evaluateChangeValidation(failed).status, 'incomplete');
});

test('passed 结果没有 Evidence 时拒绝接受', () => {
  const value = matrix();
  value.checks[0].evidence_ref = null;
  assert.throws(() => evaluateChangeValidation(value), /必须引用 Evidence/u);
});
