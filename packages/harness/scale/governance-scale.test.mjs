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
} from '../test/fixtures/synthetic-governance-project.mjs';

for (const profileName of ['mature', 'large']) {
  const profile = SYNTHETIC_SCALE_PROFILES[profileName];
  test(`${profileName} 规模治理回归`, { timeout: profileName === 'large' ? 120_000 : 30_000 }, async (t) => {
    const root = await realpath(await mkdtemp(path.join(os.tmpdir(), `agent-foundation-scale-${profileName}-`)));
    t.after(() => rm(root, { recursive: true, force: true }));
    const fixture = await createSyntheticGovernanceProject(root, profile);

    const [specflow, knowledge] = await Promise.all([
      checkSpecflowGovernance(root),
      checkKnowledgeGovernance(root),
    ]);
    assert.equal(specflow.status, 'pass');
    assert.equal(specflow.checks.find((entry) => entry.code === 'specflow-relations').specs, profile.historicalSpecs + 3);
    assert.equal(knowledge.status, 'pass');
    assert.equal(knowledge.registryEntries, profile.knowledge);
    assert.equal(knowledge.codeEntries, profile.routes);

    const context = await resolveProjectContext(root, { paths: [fixture.entryPath] });
    assert.deepEqual(context.activeSpecs.map(({ id }) => id), fixture.activeSpecIds);
    assert.equal(context.contextBudget.activeSpecCount, 3);
    assert.equal(context.contextBudget.fullTextSpecCount, 1);
    assert.equal(context.contextBudget.sectionedSpecCount, 2);
    assert.deepEqual(context.ruleFiles.map(({ path: rulePath }) => rulePath), fixture.rulePaths);
    assert.equal(context.knowledge.length, profile.knowledge);
    assert.equal(context.matchedRoutes.length, profile.routes);
    assert.ok(context.loadPlan.every((entry) => !entry.includes('historical-')));

    if (profileName === 'large') {
      const restoreReceipt = await mutateStructuredDocument(fixture.tailHistoricalReceiptPath, (receipt) => {
        receipt.integrity.payload_digest = `sha256:${'f'.repeat(64)}`;
      });
      const brokenSpecflow = await checkSpecflowGovernance(root);
      assert.ok(brokenSpecflow.errors.some((entry) =>
        entry.specId === fixture.historicalSpecIds.at(-1) && entry.code === 'receipt-digest-mismatch'));
      await restoreReceipt();

      const restoreRegistry = await mutateStructuredDocument(fixture.registryPath, (registry) => {
        registry.entries.at(-1).source_evidence[0].digest = `sha256:${'f'.repeat(64)}`;
      });
      const brokenKnowledge = await checkKnowledgeGovernance(root);
      assert.ok(brokenKnowledge.errors.some((entry) =>
        entry.id === `knowledge-${String(profile.knowledge).padStart(4, '0')}` &&
        entry.code === 'knowledge-source-digest-mismatch'));
      await restoreRegistry();
    }
  });
}
