import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, readFile, rename, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  SpecflowArchiveError,
  canonicalJson,
  finalizeArchiveReceipt,
  finalizeLifecycleEvent,
  finalizeRelationTransaction,
  parseYamlSubset,
  sealArchiveReceipt,
  sealLifecycleEvent,
  stringifyYamlSubset,
  verifyArchiveReceipt,
  verifyLifecycleChain,
  verifyRelationTransaction,
} from '../scripts/archive-receipt.mjs';

function digest(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

async function makeItem({ minimal = false } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'specflow-archive-'));
  const meta = {
    id: 'synthetic-work',
    title: 'Synthetic Work',
    status: 'in-progress',
    created_at: '2026-08-05',
    updated_at: '2026-08-05',
    scope: ['src/synthetic'],
    relations: { parent: null, children: [], supersedes: [], superseded_by: null },
    artifacts: {
      spec: './spec.md',
      plan: minimal ? null : './plan.md',
      tasks: minimal ? null : './tasks.md',
      research: null,
      validation_report: minimal ? null : './validation-report.md',
      archive_receipt: null,
      lifecycle_dir: './lifecycle',
    },
    freshness: { status: 'current', last_reviewed_at: '2026-08-05', refresh_triggers: [] },
    active_context: { summary: 'Synthetic', next_task_id: null },
    authorization: { terminal_transition_confirmed: false },
  };
  const files = [
    ['meta.yaml', stringifyYamlSubset(meta)],
    ['spec.md', '# Spec\n'],
  ];
  if (!minimal) files.push(
    ['plan.md', '# Plan\n'],
    ['tasks.md', '# Tasks\n'],
    ['validation-report.md', '# Validation\n'],
  );
  for (const [name, content] of files) await writeFile(path.join(root, name), content);
  const candidate = {
    schema_version: 1,
    receipt_id: 'synthetic-work:first-terminal',
    spec_id: 'synthetic-work',
    created_at: '2026-08-05T00:00:00Z',
    transition: { from: 'in-progress', to: 'archived' },
    authorization: {
      confirmed: true,
      confirmed_at: '2026-08-05T00:00:00Z',
      authority: 'maintainer',
      evidence_ref: 'local:explicit-request',
    },
    snapshot: {
      source_revision: 'synthetic-source-revision',
      base_revision: 'synthetic-base-revision',
      change: { algorithm: 'sha256', scope: 'committed-range', digest: digest('synthetic-change'), excludes: [] },
      artifacts: minimal
        ? [{ role: 'spec', path: './spec.md', digest: digest('placeholder') }]
        : [
          { role: 'spec', path: './spec.md', digest: digest('placeholder') },
          { role: 'plan', path: './plan.md', digest: digest('placeholder') },
          { role: 'tasks', path: './tasks.md', digest: digest('placeholder') },
          { role: 'validation-report', path: './validation-report.md', digest: digest('placeholder') },
        ],
    },
    validation: {
      result: 'pass',
      completed_conditions: ['AC-001'],
      unresolved_blockers: [],
      evidence_refs: ['test:synthetic'],
    },
    knowledge_projection: { impact: 'none', reason: '合成事项不影响长期知识', decisions: [] },
    relations_snapshot: { parent: null, children: [], supersedes: [], superseded_by: null },
    integrity: { algorithm: 'sha256', canonicalization: 'candidate', payload_digest: digest('placeholder') },
  };
  await writeFile(path.join(root, 'candidate.yaml'), stringifyYamlSubset(candidate));
  return { root, candidate };
}

async function writeEventCandidate(root, overrides = {}) {
  const event = {
    schema_version: 1,
    event_id: 'synthetic-work:0001',
    spec_id: 'synthetic-work',
    sequence: 1,
    event_type: 'superseded',
    created_at: '2026-08-06T00:00:00Z',
    transition: { from: 'archived', to: 'superseded' },
    authorization: {
      confirmed: true,
      confirmed_at: '2026-08-06T00:00:00Z',
      authority: 'maintainer',
      evidence_ref: 'local:explicit-event-request',
    },
    reason: '由合成后续事项取代',
    relation_changes: { superseded_by: { from: null, to: 'replacement-work' } },
    evidence_refs: ['spec:replacement-work'],
    integrity: {
      algorithm: 'sha256',
      canonicalization: 'candidate',
      previous_digest: digest('placeholder'),
      event_digest: digest('placeholder'),
    },
    ...overrides,
  };
  await writeFile(path.join(root, 'event-candidate.yaml'), stringifyYamlSubset(event));
  return event;
}

async function makeNamedTerminalItem(specsRoot, id) {
  const item = await makeItem();
  const target = path.join(specsRoot, id);
  await rename(item.root, target);
  const metaPath = path.join(target, 'meta.yaml');
  const meta = parseYamlSubset(await readFile(metaPath, 'utf8'));
  meta.id = id;
  meta.title = id;
  await writeFile(metaPath, stringifyYamlSubset(meta));
  const candidatePath = path.join(target, 'candidate.yaml');
  const candidate = parseYamlSubset(await readFile(candidatePath, 'utf8'));
  candidate.receipt_id = `${id}:first-terminal`;
  candidate.spec_id = id;
  await writeFile(candidatePath, stringifyYamlSubset(candidate));
  await finalizeArchiveReceipt(target, './candidate.yaml');
  return target;
}

async function writeRelationTransactionCandidate(specsRoot, relationType, transactionId, participants) {
  const candidate = {
    schema_version: 1,
    transaction_id: transactionId,
    created_at: '2026-08-06T00:00:00Z',
    relation_type: relationType,
    authorization: {
      confirmed: true,
      confirmed_at: '2026-08-06T00:00:00Z',
      authority: 'maintainer',
      evidence_ref: 'local:explicit-relation-request',
    },
    reason: '同步两侧关系',
    participants: participants.map((participant) => ({
      ...participant,
      sequence: 1,
      event_digest: digest('placeholder'),
    })),
    evidence_refs: ['test:reciprocal-relation'],
    integrity: {
      algorithm: 'sha256',
      canonicalization: 'candidate',
      transaction_digest: digest('placeholder'),
    },
  };
  const candidatePath = path.join(specsRoot, 'relation-transaction.candidate.yaml');
  await writeFile(candidatePath, stringifyYamlSubset(candidate));
  return './relation-transaction.candidate.yaml';
}

async function prepareParentChildTransaction() {
  const specsRoot = await mkdtemp(path.join(os.tmpdir(), 'specflow-relations-'));
  const parentDir = await makeNamedTerminalItem(specsRoot, 'parent-work');
  const childDir = await makeNamedTerminalItem(specsRoot, 'child-work');
  await writeEventCandidate(childDir, {
    event_id: 'child-work:0001',
    spec_id: 'child-work',
    event_type: 'relation-updated',
    transition: { from: 'archived', to: 'archived' },
    reason: '建立父事项',
    relation_changes: { parent: { from: null, to: 'parent-work' } },
    evidence_refs: ['spec:parent-work'],
  });
  await writeEventCandidate(parentDir, {
    event_id: 'parent-work:0001',
    spec_id: 'parent-work',
    event_type: 'relation-updated',
    transition: { from: 'archived', to: 'archived' },
    reason: '登记子事项',
    relation_changes: { children: { from: [], to: ['child-work'] } },
    evidence_refs: ['spec:child-work'],
  });
  const candidatePath = await writeRelationTransactionCandidate(specsRoot, 'parent-child', 'attach-parent-child', [
    { spec_id: 'child-work', spec_dir: './child-work', event_candidate: './event-candidate.yaml' },
    { spec_id: 'parent-work', spec_dir: './parent-work', event_candidate: './event-candidate.yaml' },
  ]);
  return { specsRoot, parentDir, childDir, candidatePath };
}

test('YAML 子集序列化后可以无损解析', () => {
  const value = {
    root: { enabled: true, empty: [], nullable: null },
    entries: [{ name: 'first', refs: ['one', 'two'] }],
  };
  assert.deepEqual(parseYamlSubset(stringifyYamlSubset(value)), value);
});

test('canonical-json-v1 按 Unicode 码点排序对象键', () => {
  assert.equal(canonicalJson({ '\uE000': 1, '\u{10000}': 2 }), '{"":1,"𐀀":2}');
});

test('首次 Seal 计算产物摘要、不可覆盖写入并回读校验', async () => {
  const { root } = await makeItem();
  const metaBefore = await readFile(path.join(root, 'meta.yaml'), 'utf8');
  const sealed = await sealArchiveReceipt(root, './candidate.yaml');
  assert.equal(sealed.status, 'sealed');
  assert.equal(sealed.nextAction, 'update-meta-last');
  assert.equal((await verifyArchiveReceipt(root)).status, 'verified');

  const receipt = parseYamlSubset(await readFile(path.join(root, 'archive-receipt.yaml'), 'utf8'));
  assert.equal(receipt.integrity.canonicalization, 'canonical-json-v1');
  assert.equal(receipt.snapshot.artifacts[0].digest, digest('# Spec\n'));
  assert.equal(await readFile(path.join(root, 'meta.yaml'), 'utf8'), metaBefore);
  assert.equal((await sealArchiveReceipt(root, './candidate.yaml')).status, 'unchanged');
});

test('Seal 接受模板中的待计算 Artifact Digest 占位符', async () => {
  const { root, candidate } = await makeItem({ minimal: true });
  candidate.snapshot.artifacts[0].digest = 'sha256:<computed-value>';
  await writeFile(path.join(root, 'candidate.yaml'), stringifyYamlSubset(candidate));
  await sealArchiveReceipt(root, './candidate.yaml');
  const receipt = parseYamlSubset(await readFile(path.join(root, 'archive-receipt.yaml'), 'utf8'));
  assert.equal(receipt.snapshot.artifacts[0].digest, digest('# Spec\n'));
});

test('仅 Meta 与 Spec 的事项可以生成并验证 Receipt', async () => {
  const { root } = await makeItem({ minimal: true });
  await finalizeArchiveReceipt(root, './candidate.yaml');
  const receipt = parseYamlSubset(await readFile(path.join(root, 'archive-receipt.yaml'), 'utf8'));
  assert.deepEqual(receipt.snapshot.artifacts.map(({ role }) => role), ['spec']);
  assert.equal(receipt.validation.result, 'pass');
  assert.equal((await verifyArchiveReceipt(root)).status, 'verified');
});

test('Receipt 仍必须冻结 Spec', async () => {
  const { root, candidate } = await makeItem({ minimal: true });
  candidate.snapshot.artifacts = [];
  await writeFile(path.join(root, 'candidate.yaml'), stringifyYamlSubset(candidate));
  await assert.rejects(
    sealArchiveReceipt(root, './candidate.yaml'),
    (error) => error instanceof SpecflowArchiveError && error.code === 'invalid-receipt',
  );
});

test('Receipt 不能漏掉 Meta 已声明的条件产物', async () => {
  const { root, candidate } = await makeItem();
  candidate.snapshot.artifacts = candidate.snapshot.artifacts.filter(({ role }) => role !== 'plan');
  await writeFile(path.join(root, 'candidate.yaml'), stringifyYamlSubset(candidate));
  await assert.rejects(
    sealArchiveReceipt(root, './candidate.yaml'),
    (error) => error instanceof SpecflowArchiveError && error.code === 'receipt-artifact-map-mismatch',
  );
});

test('Receipt 验证阻断终态 Meta 的 Artifact Map 漂移', async () => {
  const { root } = await makeItem({ minimal: true });
  await finalizeArchiveReceipt(root, './candidate.yaml');
  const metaPath = path.join(root, 'meta.yaml');
  const meta = parseYamlSubset(await readFile(metaPath, 'utf8'));
  meta.artifacts.plan = './plan.md';
  await writeFile(path.join(root, 'plan.md'), '# Late Plan\n');
  await writeFile(metaPath, stringifyYamlSubset(meta));
  await assert.rejects(
    verifyArchiveReceipt(root),
    (error) => error instanceof SpecflowArchiveError && error.code === 'receipt-artifact-map-mismatch',
  );
  await assert.rejects(
    verifyLifecycleChain(root),
    (error) => error instanceof SpecflowArchiveError && error.code === 'receipt-artifact-map-mismatch',
  );
});

test('自定义 Meta 路径贯穿 Receipt Seal、状态最后写和 Verify', async () => {
  const { root } = await makeItem({ minimal: true });
  await rename(path.join(root, 'meta.yaml'), path.join(root, 'custom-meta.yaml'));
  await finalizeArchiveReceipt(root, './candidate.yaml', { metaPath: './custom-meta.yaml' });
  assert.equal(
    (await verifyArchiveReceipt(root, './archive-receipt.yaml', './custom-meta.yaml')).status,
    'verified',
  );
  assert.equal(parseYamlSubset(await readFile(path.join(root, 'custom-meta.yaml'), 'utf8')).status, 'archived');
});

test('Receipt Schema 明确要求包含且只包含一个 Spec 角色', async () => {
  const schema = JSON.parse(await readFile(new URL('../assets/archive-receipt.schema.json', import.meta.url), 'utf8'));
  const artifacts = schema.$defs.snapshot.properties.artifacts;
  assert.equal(artifacts.minContains, 1);
  assert.equal(artifacts.maxContains, 1);
  assert.equal(artifacts.contains.properties.role.const, 'spec');
});

test('Receipt 已存在且候选变化时拒绝覆盖', async () => {
  const { root, candidate } = await makeItem();
  await sealArchiveReceipt(root, './candidate.yaml');
  candidate.authorization.evidence_ref = 'local:different-request';
  await writeFile(path.join(root, 'candidate.yaml'), stringifyYamlSubset(candidate));
  await assert.rejects(
    sealArchiveReceipt(root, './candidate.yaml'),
    (error) => error instanceof SpecflowArchiveError && error.code === 'immutable-receipt-conflict',
  );
});

test('归档产物变化后摘要校验失败且 Receipt 保持不变', async () => {
  const { root } = await makeItem();
  await sealArchiveReceipt(root, './candidate.yaml');
  const before = await readFile(path.join(root, 'archive-receipt.yaml'), 'utf8');
  await writeFile(path.join(root, 'spec.md'), '# Changed Spec\n');
  await assert.rejects(
    verifyArchiveReceipt(root),
    (error) => error instanceof SpecflowArchiveError && error.code === 'artifact-digest-mismatch',
  );
  assert.equal(await readFile(path.join(root, 'archive-receipt.yaml'), 'utf8'), before);
});

test('Archived 存在未解决 Blocker 时拒绝 Seal', async () => {
  const { root, candidate } = await makeItem();
  candidate.validation.unresolved_blockers = ['synthetic-blocker'];
  await writeFile(path.join(root, 'candidate.yaml'), stringifyYamlSubset(candidate));
  await assert.rejects(
    sealArchiveReceipt(root, './candidate.yaml'),
    (error) => error instanceof SpecflowArchiveError && error.code === 'archive-blocked',
  );
});

test('产物路径越出事项目录时在读取前阻断', async () => {
  const { root, candidate } = await makeItem();
  candidate.snapshot.artifacts[0].path = '../outside.md';
  await writeFile(path.join(root, 'candidate.yaml'), stringifyYamlSubset(candidate));
  await assert.rejects(
    sealArchiveReceipt(root, './candidate.yaml'),
    (error) => error instanceof SpecflowArchiveError && error.code === 'unsafe-path',
  );
});

test('Finalize Receipt 在证据回读后最后更新 Meta，并保持幂等', async () => {
  const { root } = await makeItem();
  const finalized = await finalizeArchiveReceipt(root, './candidate.yaml');
  assert.equal(finalized.status, 'finalized');
  const meta = parseYamlSubset(await readFile(path.join(root, 'meta.yaml'), 'utf8'));
  assert.equal(meta.status, 'archived');
  assert.equal(meta.artifacts.archive_receipt, './archive-receipt.yaml');
  assert.equal(meta.authorization.terminal_transition_confirmed, true);
  assert.equal((await finalizeArchiveReceipt(root, './candidate.yaml')).status, 'unchanged');
});

test('Meta 状态最后写失败后保留 Receipt，使用相同候选可以恢复', async () => {
  const { root } = await makeItem();
  await assert.rejects(
    finalizeArchiveReceipt(root, './candidate.yaml', {
      beforeMetaRename() {
        throw new Error('synthetic-meta-write-failure');
      },
    }),
    /synthetic-meta-write-failure/u,
  );
  assert.equal((await verifyArchiveReceipt(root)).status, 'verified');
  assert.equal(parseYamlSubset(await readFile(path.join(root, 'meta.yaml'), 'utf8')).status, 'in-progress');
  assert.equal((await finalizeArchiveReceipt(root, './candidate.yaml')).status, 'finalized');
});

test('旧规范化标识的已验证 Receipt 可使用相同 Payload 恢复 Meta', async () => {
  const { root } = await makeItem();
  await sealArchiveReceipt(root, './candidate.yaml');
  const receiptPath = path.join(root, 'archive-receipt.yaml');
  const receipt = parseYamlSubset(await readFile(receiptPath, 'utf8'));
  receipt.integrity.canonicalization = 'canonical-json-v1:recursive-key-sort:utf8';
  await writeFile(receiptPath, stringifyYamlSubset(receipt));
  assert.equal((await verifyArchiveReceipt(root)).status, 'verified');
  assert.equal((await finalizeArchiveReceipt(root, './candidate.yaml')).status, 'finalized');
  assert.equal(parseYamlSubset(await readFile(path.join(root, 'meta.yaml'), 'utf8')).status, 'archived');
});

test('Lifecycle Event 连续追加后最后投影 Meta，并可幂等恢复', async () => {
  const { root } = await makeItem();
  await finalizeArchiveReceipt(root, './candidate.yaml');
  await writeEventCandidate(root);
  const finalized = await finalizeLifecycleEvent(root, './event-candidate.yaml');
  assert.equal(finalized.status, 'finalized');
  const chain = await verifyLifecycleChain(root);
  assert.equal(chain.events, 1);
  assert.equal(chain.currentState, 'superseded');
  const meta = parseYamlSubset(await readFile(path.join(root, 'meta.yaml'), 'utf8'));
  assert.equal(meta.status, 'superseded');
  assert.equal(meta.relations.superseded_by, 'replacement-work');
  assert.equal((await finalizeLifecycleEvent(root, './event-candidate.yaml')).status, 'unchanged');
});

test('Lifecycle Event 已 Seal 但 Meta 写入失败时可从链尾恢复', async () => {
  const { root } = await makeItem();
  await finalizeArchiveReceipt(root, './candidate.yaml');
  await writeEventCandidate(root);
  await assert.rejects(
    finalizeLifecycleEvent(root, './event-candidate.yaml', {
      beforeMetaRename() {
        throw new Error('synthetic-event-meta-failure');
      },
    }),
    /synthetic-event-meta-failure/u,
  );
  assert.equal((await verifyLifecycleChain(root)).currentState, 'superseded');
  assert.equal(parseYamlSubset(await readFile(path.join(root, 'meta.yaml'), 'utf8')).status, 'archived');
  assert.equal((await finalizeLifecycleEvent(root, './event-candidate.yaml')).status, 'finalized');
});

test('前一个 Event 尚未投影到 Meta 时拒绝追加后续 Event', async () => {
  const { root } = await makeItem();
  await finalizeArchiveReceipt(root, './candidate.yaml');
  await writeEventCandidate(root);
  await sealLifecycleEvent(root, './event-candidate.yaml');
  await writeEventCandidate(root, {
    event_id: 'synthetic-work:0002',
    sequence: 2,
    event_type: 'relation-updated',
    created_at: '2026-08-07T00:00:00Z',
    transition: { from: 'superseded', to: 'superseded' },
    relation_changes: { children: { from: [], to: ['child-work'] } },
  });
  await assert.rejects(
    sealLifecycleEvent(root, './event-candidate.yaml'),
    (error) => error instanceof SpecflowArchiveError && error.code === 'meta-chain-out-of-sync',
  );
});

test('候选 Event 的关系前置值必须与链尾连续', async () => {
  const { root } = await makeItem();
  await finalizeArchiveReceipt(root, './candidate.yaml');
  await writeEventCandidate(root);
  await finalizeLifecycleEvent(root, './event-candidate.yaml');
  await writeEventCandidate(root, {
    event_id: 'synthetic-work:0002',
    sequence: 2,
    event_type: 'relation-updated',
    created_at: '2026-08-07T00:00:00Z',
    transition: { from: 'superseded', to: 'superseded' },
    relation_changes: { superseded_by: { from: 'wrong-work', to: 'replacement-work-v2' } },
  });
  await assert.rejects(
    sealLifecycleEvent(root, './event-candidate.yaml'),
    (error) => error instanceof SpecflowArchiveError && error.code === 'lifecycle-relation-broken',
  );
});

test('Lifecycle Event 被修改后链校验失败且不自动修复', async () => {
  const { root } = await makeItem();
  await finalizeArchiveReceipt(root, './candidate.yaml');
  await writeEventCandidate(root);
  await finalizeLifecycleEvent(root, './event-candidate.yaml');
  const eventPath = path.join(root, 'lifecycle', '0001-superseded.yaml');
  const event = parseYamlSubset(await readFile(eventPath, 'utf8'));
  event.reason = 'tampered';
  await writeFile(eventPath, stringifyYamlSubset(event));
  await assert.rejects(
    verifyLifecycleChain(root),
    (error) => error instanceof SpecflowArchiveError && error.code === 'event-digest-mismatch',
  );
});

test('Lifecycle Event 文件名必须与序号和事件类型完全一致', async () => {
  const { root } = await makeItem();
  await finalizeArchiveReceipt(root, './candidate.yaml');
  await writeEventCandidate(root);
  await finalizeLifecycleEvent(root, './event-candidate.yaml');
  await rename(
    path.join(root, 'lifecycle', '0001-superseded.yaml'),
    path.join(root, 'lifecycle', '0001-cancelled.yaml'),
  );
  await assert.rejects(
    verifyLifecycleChain(root),
    (error) => error instanceof SpecflowArchiveError && error.code === 'lifecycle-sequence-broken',
  );
});

test('Lifecycle Event 跳过序号时拒绝写入', async () => {
  const { root } = await makeItem();
  await finalizeArchiveReceipt(root, './candidate.yaml');
  await writeEventCandidate(root, { sequence: 2, event_id: 'synthetic-work:0002' });
  await assert.rejects(
    finalizeLifecycleEvent(root, './event-candidate.yaml'),
    (error) => error instanceof SpecflowArchiveError && error.code === 'lifecycle-sequence-broken',
  );
});

test('父子关系事务先写双侧 Event、最后投影 Meta，并保持幂等', async () => {
  const { specsRoot, parentDir, childDir, candidatePath } = await prepareParentChildTransaction();
  const finalized = await finalizeRelationTransaction(specsRoot, candidatePath);
  assert.equal(finalized.status, 'finalized');
  assert.equal(finalized.transactionPath, './.specflow-transactions/attach-parent-child.yaml');
  assert.equal((await verifyRelationTransaction(specsRoot, finalized.transactionPath)).status, 'verified');
  const parentMeta = parseYamlSubset(await readFile(path.join(parentDir, 'meta.yaml'), 'utf8'));
  const childMeta = parseYamlSubset(await readFile(path.join(childDir, 'meta.yaml'), 'utf8'));
  assert.deepEqual(parentMeta.relations.children, ['child-work']);
  assert.equal(childMeta.relations.parent, 'parent-work');
  assert.equal((await finalizeRelationTransaction(specsRoot, candidatePath)).status, 'unchanged');
});

test('取代关系事务要求旧事项与替代事项双向一致', async () => {
  const specsRoot = await mkdtemp(path.join(os.tmpdir(), 'specflow-supersession-'));
  const oldDir = await makeNamedTerminalItem(specsRoot, 'old-work');
  const replacementDir = await makeNamedTerminalItem(specsRoot, 'replacement-work');
  await writeEventCandidate(oldDir, {
    event_id: 'old-work:0001',
    spec_id: 'old-work',
    event_type: 'superseded',
    transition: { from: 'archived', to: 'superseded' },
    relation_changes: { superseded_by: { from: null, to: 'replacement-work' } },
    evidence_refs: ['spec:replacement-work'],
  });
  await writeEventCandidate(replacementDir, {
    event_id: 'replacement-work:0001',
    spec_id: 'replacement-work',
    event_type: 'relation-updated',
    transition: { from: 'archived', to: 'archived' },
    relation_changes: { supersedes: { from: [], to: ['old-work'] } },
    evidence_refs: ['spec:old-work'],
  });
  const candidatePath = await writeRelationTransactionCandidate(specsRoot, 'supersession', 'supersede-old-work', [
    { spec_id: 'old-work', spec_dir: './old-work', event_candidate: './event-candidate.yaml' },
    { spec_id: 'replacement-work', spec_dir: './replacement-work', event_candidate: './event-candidate.yaml' },
  ]);
  await finalizeRelationTransaction(specsRoot, candidatePath);
  const oldMeta = parseYamlSubset(await readFile(path.join(oldDir, 'meta.yaml'), 'utf8'));
  const replacementMeta = parseYamlSubset(await readFile(path.join(replacementDir, 'meta.yaml'), 'utf8'));
  assert.equal(oldMeta.status, 'superseded');
  assert.equal(oldMeta.relations.superseded_by, 'replacement-work');
  assert.deepEqual(replacementMeta.relations.supersedes, ['old-work']);
});

test('单侧或夹带其他变化的关系候选在写入事务证据前阻断', async () => {
  const { specsRoot, parentDir, candidatePath } = await prepareParentChildTransaction();
  await writeEventCandidate(parentDir, {
    event_id: 'parent-work:0001',
    spec_id: 'parent-work',
    event_type: 'relation-updated',
    transition: { from: 'archived', to: 'archived' },
    relation_changes: { children: { from: [], to: ['child-work', 'unrelated-work'] } },
  });
  await assert.rejects(
    finalizeRelationTransaction(specsRoot, candidatePath),
    (error) => error instanceof SpecflowArchiveError && error.code === 'non-reciprocal-relation',
  );
  await assert.rejects(readFile(path.join(specsRoot, '.specflow-transactions', 'attach-parent-child.yaml')), { code: 'ENOENT' });
});

test('第二侧 Event 写入前失败时保留事务意图且不投影 Meta，重跑可恢复', async () => {
  const { specsRoot, parentDir, childDir, candidatePath } = await prepareParentChildTransaction();
  await assert.rejects(
    finalizeRelationTransaction(specsRoot, candidatePath, {
      beforeSealParticipant({ index }) {
        if (index === 1) throw new Error('synthetic-second-event-failure');
      },
    }),
    /synthetic-second-event-failure/u,
  );
  assert.equal(parseYamlSubset(await readFile(path.join(parentDir, 'meta.yaml'), 'utf8')).relations.children.length, 0);
  assert.equal(parseYamlSubset(await readFile(path.join(childDir, 'meta.yaml'), 'utf8')).relations.parent, null);
  await assert.rejects(
    verifyRelationTransaction(specsRoot, './.specflow-transactions/attach-parent-child.yaml'),
    (error) => error instanceof SpecflowArchiveError && error.code === 'relation-transaction-incomplete',
  );
  assert.equal((await finalizeRelationTransaction(specsRoot, candidatePath)).status, 'finalized');
});

test('第二侧 Meta 投影失败时允许可见的中间态，并由同一事务幂等补齐', async () => {
  const { specsRoot, parentDir, childDir, candidatePath } = await prepareParentChildTransaction();
  await assert.rejects(
    finalizeRelationTransaction(specsRoot, candidatePath, {
      beforeMetaRenameParticipant({ index }) {
        if (index === 1) throw new Error('synthetic-second-meta-failure');
      },
    }),
    /synthetic-second-meta-failure/u,
  );
  assert.equal(parseYamlSubset(await readFile(path.join(childDir, 'meta.yaml'), 'utf8')).relations.parent, 'parent-work');
  assert.deepEqual(parseYamlSubset(await readFile(path.join(parentDir, 'meta.yaml'), 'utf8')).relations.children, []);
  await assert.rejects(
    verifyRelationTransaction(specsRoot, './.specflow-transactions/attach-parent-child.yaml'),
    (error) => error instanceof SpecflowArchiveError && error.code === 'relation-transaction-incomplete',
  );
  assert.equal((await finalizeRelationTransaction(specsRoot, candidatePath)).status, 'finalized');
  assert.equal((await verifyRelationTransaction(specsRoot, './.specflow-transactions/attach-parent-child.yaml')).status, 'verified');
});

test('进程崩溃遗留的关系事务锁可安全接管，存活进程锁不会被覆盖', async () => {
  const { specsRoot, candidatePath } = await prepareParentChildTransaction();
  const exited = spawn(process.execPath, ['-e', 'process.exit(0)']);
  const exitedPid = exited.pid;
  await once(exited, 'exit');
  await writeFile(path.join(specsRoot, '.specflow-relation.lock'), `${exitedPid}\n`);
  assert.equal((await finalizeRelationTransaction(specsRoot, candidatePath)).status, 'finalized');

  const second = await prepareParentChildTransaction();
  await writeFile(path.join(second.specsRoot, '.specflow-relation.lock'), `${process.pid}\n`);
  await assert.rejects(
    finalizeRelationTransaction(second.specsRoot, second.candidatePath),
    (error) => error instanceof SpecflowArchiveError && error.code === 'relation-transaction-locked',
  );
});
