import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'node:test';
import { buildEvalRun, compareEvalRuns, validateEvalRun } from '../scripts/eval-runner.mjs';

const roots = [];
afterEach(async () => { while (roots.length) await rm(roots.pop(), { recursive: true, force: true }); });

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'skill-eval-'));
  roots.push(root);
  await mkdir(path.join(root, 'evals', 'cases'), { recursive: true });
  await mkdir(path.join(root, 'evals', 'traces', '2026-08-05'), { recursive: true });
  await writeFile(path.join(root, 'SKILL.md'), '---\nname: synthetic-skill\ndescription: 合成测试。\n---\n# Synthetic\n');
  await writeFile(path.join(root, 'evals', 'rubric.md'), '# Rubric\n');
  await writeFile(path.join(root, 'evals', 'cases', '01-one.md'), '# Case one\n');
  await writeFile(path.join(root, 'evals', 'traces', '2026-08-05', '01-one.md'), '# Trace\n- [T-01] 完成必须动作。\n- [T-02] 未发生禁止动作。\n');
  const replay = {
    schema_version: 1,
    run_id: 'synthetic-skill:2026-08-05',
    skill_name: 'synthetic-skill',
    executed_at: '2026-08-05T00:00:00Z',
    environment: { host: 'test-host', tools: ['repository-read'], configuration_ref: null },
    threshold: 80,
    cases: [{ id: 'case-01', case_path: 'evals/cases/01-one.md', trace_path: 'evals/traces/2026-08-05/01-one.md', blocking_violations: [], dimensions: [{ name: '核心行为', weight: 100, score: 90, status: 'assessed', evidence_refs: ['T-01'] }], required_actions: [{ id: 'required-01', status: 'pass', evidence_refs: ['T-01'] }], forbidden_actions: [{ id: 'forbidden-01', occurred: false, evidence_refs: ['T-02'] }], inconclusive: [] }],
  };
  await writeFile(path.join(root, 'evals', 'replay.json'), `${JSON.stringify(replay, null, 2)}\n`);
  return { root, replay };
}

test('Eval Runner 动态覆盖真实 Case、评分并封存 Trace 摘要', async () => {
  const { root } = await fixture();
  const report = await buildEvalRun({ skillRoot: root });
  assert.equal(report.summary.result, 'pass');
  assert.equal(report.summary.average_score, 90);
  assert.equal(validateEvalRun(report).ok, true);
});

test('Eval Runner 阻断遗漏 Case 与不存在的 Evidence 引用', async () => {
  const { root, replay } = await fixture();
  await writeFile(path.join(root, 'evals', 'cases', '02-two.md'), '# Case two\n');
  await assert.rejects(buildEvalRun({ skillRoot: root }), /全部真实 Case/u);
  await rm(path.join(root, 'evals', 'cases', '02-two.md'));
  replay.cases[0].dimensions[0].evidence_refs = ['T-99'];
  await writeFile(path.join(root, 'evals', 'replay.json'), `${JSON.stringify(replay, null, 2)}\n`);
  await assert.rejects(buildEvalRun({ skillRoot: root }), /不存在/u);
});

test('Eval 比较器不以平均分掩盖阻塞级回归', async () => {
  const { root, replay } = await fixture();
  const baseline = await buildEvalRun({ skillRoot: root });
  replay.run_id = 'synthetic-skill:2026-08-06';
  replay.executed_at = '2026-08-06T00:00:00Z';
  replay.cases[0].dimensions[0].score = 100;
  replay.cases[0].forbidden_actions[0].occurred = true;
  await writeFile(path.join(root, 'evals', 'replay.json'), `${JSON.stringify(replay, null, 2)}\n`);
  const candidate = await buildEvalRun({ skillRoot: root });
  const comparison = compareEvalRuns(baseline, candidate);
  assert.equal(comparison.result, 'regression');
  assert.equal(comparison.blockingRegression, true);
});
