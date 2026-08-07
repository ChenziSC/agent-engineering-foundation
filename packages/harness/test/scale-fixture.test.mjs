import assert from 'node:assert/strict';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  checkKnowledgeGovernance,
  checkSpecflowGovernance,
  resolveProjectContext,
} from '../src/harness.mjs';
import {
  createSyntheticGovernanceProject,
  mutateStructuredDocument,
  SYNTHETIC_SCALE_PROFILES,
} from './fixtures/synthetic-governance-project.mjs';

test('小型规模夹具保持 Active Spec 上限、预算降级并发现尾部错误', async (t) => {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'agent-foundation-scale-small-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const fixture = await createSyntheticGovernanceProject(root, SYNTHETIC_SCALE_PROFILES.small);

  const specflow = await checkSpecflowGovernance(root);
  assert.equal(specflow.status, 'pass');
  assert.equal(specflow.checks.find((entry) => entry.code === 'specflow-relations').specs, 13);
  assert.equal((await checkKnowledgeGovernance(root)).status, 'pass');

  const context = await resolveProjectContext(root, {
    taskType: '不存在但路径有效的任务',
    paths: [fixture.entryPath],
  });
  assert.equal(context.status, 'resolved');
  assert.deepEqual(context.activeSpecs.map(({ id }) => id), fixture.activeSpecIds);
  assert.equal(context.contextBudget.activeSpecCount, 3);
  assert.equal(context.contextBudget.fullTextSpecCount, 1);
  assert.equal(context.contextBudget.sectionedSpecCount, 2);
  assert.deepEqual(context.ruleFiles.map(({ path: rulePath }) => rulePath), fixture.rulePaths);
  assert.equal(context.knowledge.length, SYNTHETIC_SCALE_PROFILES.small.knowledge);
  assert.equal(context.matchedRoutes.length, SYNTHETIC_SCALE_PROFILES.small.routes);
  assert.deepEqual(
    context.matchedRoutes.map(({ taskType }) => taskType),
    [...context.matchedRoutes.map(({ taskType }) => taskType)].sort((left, right) => left.localeCompare(right)),
  );

  const restoreReceipt = await mutateStructuredDocument(fixture.tailHistoricalReceiptPath, (receipt) => {
    receipt.integrity.payload_digest = `sha256:${'0'.repeat(64)}`;
  });
  const brokenSpecflow = await checkSpecflowGovernance(root);
  assert.equal(brokenSpecflow.status, 'fail');
  assert.ok(brokenSpecflow.errors.some((entry) =>
    entry.specId === fixture.historicalSpecIds.at(-1) && entry.code === 'receipt-digest-mismatch'));
  await restoreReceipt();

  const restoreRoutes = await mutateStructuredDocument(fixture.routeMapPath, (routeMap) => {
    routeMap.entries.at(-1).knowledge = ['missing-tail-knowledge'];
  });
  const brokenKnowledge = await checkKnowledgeGovernance(root);
  assert.equal(brokenKnowledge.status, 'fail');
  assert.ok(brokenKnowledge.errors.some((entry) =>
    entry.taskType === `合成任务-${String(SYNTHETIC_SCALE_PROFILES.small.routes).padStart(4, '0')}` &&
    entry.code === 'unknown-knowledge-reference'));
  await restoreRoutes();
});
