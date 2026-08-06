import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'node:test';
import { createAdapterRegistry } from '../../../adapters/registry.mjs';
import {
  FoundationError,
  applyDistribution,
  applyKnowledgeProjection,
  checkChangeGate,
  checkKnowledgeGovernance,
  checkRepository,
  checkSpecflowGovernance,
  checkSkill,
  discoverSkills,
  doctorProject,
  initProject,
  installSkill,
  inspectSourceControlSnapshot,
  planKnowledgeProjection,
  planDistribution,
  planProjectInit,
  planSkill,
  resolveProjectContext,
  updateSkill,
  verifyDistribution,
  verifyKnowledgeProjection,
} from '../src/harness.mjs';
import { finalizeArchiveReceipt, stringifyYamlSubset } from '../../../skills/specflow/scripts/archive-receipt.mjs';
import { sealCheckpoint } from '../../../frameworks/checkpoint/scripts/checkpoint.mjs';

const temporaryRoots = [];
const CLI = path.resolve('packages/harness/bin/agent-foundation.mjs');

function runCli(args) {
  const result = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
  return {
    ...result,
    json: result.stdout ? JSON.parse(result.stdout) : null,
  };
}

async function makeTemporaryRoot() {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'agent-foundation-test-')));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  while (temporaryRoots.length) await rm(temporaryRoots.pop(), { recursive: true, force: true });
});

async function makeFakeSkillRepo(root, content = '# Demo\n') {
  const skillRoot = path.join(root, 'skills', 'demo-skill');
  await mkdir(skillRoot, { recursive: true });
  await writeFile(
    path.join(skillRoot, 'SKILL.md'),
    `---\nname: demo-skill\ndescription: 在合成测试中执行一个通用演示任务。\n---\n\n${content}`,
  );
  return skillRoot;
}

async function makeCheckableRepository(root) {
  for (const directory of [
    'docs',
    'knowledge',
    'specs',
    'frameworks',
    'templates',
    'blueprints',
    'starter',
    'packages',
    'adapters',
    'distribution',
    path.join('skills', 'demo-skill', 'evals', 'cases'),
  ]) {
    await mkdir(path.join(root, directory), { recursive: true });
  }
  await writeFile(path.join(root, 'AGENTS.md'), '# Agent rules\n');
  await writeFile(path.join(root, 'README.md'), '# Synthetic repository\n');
  await writeFile(path.join(root, 'package.json'), '{"name":"synthetic-repository","private":true}\n');
  await writeFile(
    path.join(root, 'skills', 'demo-skill', 'SKILL.md'),
    '---\nname: demo-skill\ndescription: 在合成仓库中演示检查能力。\n---\n\n# Demo\n',
  );
  await writeFile(path.join(root, 'skills', 'demo-skill', 'evals', 'rubric.md'), '# Rubric\n');
  await writeFile(path.join(root, 'skills', 'demo-skill', 'evals', 'cases', 'case-01.md'), '# Case\n');
}

function runGit(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result;
}

function sourceEvidence(source, content) {
  return [{ path: source, digest: `sha256:${createHash('sha256').update(content).digest('hex')}` }];
}

function syntheticKnowledgeEntry({ id, status, scope, sourceContent, pathName = `${id}.md` }) {
  return {
    id,
    title: `合成知识 ${id}`,
    path: `./${pathName}`,
    status,
    scope,
    topics: ['synthetic-governance'],
    last_reviewed_at: '2026-08-04',
    authoritative_sources: ['AGENTS.md'],
    source_evidence: status === 'review-required' ? [] : sourceEvidence('AGENTS.md', sourceContent),
    refresh_triggers: ['权威来源变化'],
    load_when: ['修改合成范围'],
  };
}

async function writeSyntheticGateSpec(target, { id, scope, status = 'in-progress' }) {
  const specDirectory = path.join(target, 'specs', id);
  await mkdir(specDirectory, { recursive: true });
  const meta = {
    id,
    title: `合成事项 ${id}`,
    status,
    created_at: '2026-08-05',
    updated_at: '2026-08-05',
    scope,
    relations: { parent: null, children: [], supersedes: [], superseded_by: null },
    artifacts: {
      spec: './spec.md',
      plan: './plan.md',
      tasks: './tasks.md',
      research: null,
      validation_report: './validation-report.md',
      archive_receipt: null,
      lifecycle_dir: './lifecycle',
    },
    freshness: { status: 'current', last_reviewed_at: '2026-08-05', refresh_triggers: [] },
    active_context: { summary: '合成门禁事项', next_task_id: null },
    authorization: { terminal_transition_confirmed: false },
  };
  await writeFile(path.join(specDirectory, 'meta.yaml'), stringifyYamlSubset(meta));
  for (const [name, content] of [
    ['spec.md', '# Spec\n'],
    ['plan.md', '# Plan\n'],
    ['tasks.md', '# Tasks\n'],
    ['validation-report.md', '# Validation\n'],
  ]) await writeFile(path.join(specDirectory, name), content);
  return { specDirectory, meta };
}

function syntheticReceiptCandidate({ specId, snapshot }) {
  const placeholder = `sha256:${'0'.repeat(64)}`;
  return {
    schema_version: 1,
    receipt_id: `${specId}:first-terminal`,
    spec_id: specId,
    created_at: '2026-08-05T00:00:00Z',
    transition: { from: 'in-progress', to: 'archived' },
    authorization: {
      confirmed: true,
      confirmed_at: '2026-08-05T00:00:00Z',
      authority: 'maintainer',
      evidence_ref: 'local:synthetic-authorization',
    },
    snapshot: {
      source_revision: snapshot.sourceRevision,
      base_revision: snapshot.baseRevision,
      change: {
        algorithm: snapshot.change.algorithm,
        scope: snapshot.scope,
        digest: snapshot.change.digest,
        excludes: snapshot.change.excludes,
      },
      artifacts: [
        { role: 'spec', path: './spec.md', digest: placeholder },
        { role: 'plan', path: './plan.md', digest: placeholder },
        { role: 'tasks', path: './tasks.md', digest: placeholder },
        { role: 'validation-report', path: './validation-report.md', digest: placeholder },
      ],
    },
    validation: {
      result: 'pass',
      completed_conditions: ['AC-001'],
      unresolved_blockers: [],
      evidence_refs: ['test:change-gate'],
    },
    knowledge_projection: { impact: 'none', reason: '合成事项不影响长期知识', decisions: [] },
    relations_snapshot: { parent: null, children: [], supersedes: [], superseded_by: null },
    integrity: { algorithm: 'sha256', canonicalization: 'candidate', payload_digest: placeholder },
  };
}

test('init 创建最小 Starter，重复执行保持幂等，Doctor 通过', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  const first = await initProject(target);
  assert.equal(first.status, 'initialized');
  assert.ok(first.added.includes('AGENTS.md'));

  const second = await initProject(target);
  assert.equal(second.status, 'unchanged');
  assert.deepEqual(second.added, []);

  const doctor = await doctorProject(target);
  assert.equal(doctor.ok, true);
  assert.equal(doctor.status, 'pass');
  assert.equal(doctor.errors.length, 0);

  const context = await resolveProjectContext(target);
  assert.equal(context.status, 'resolved');
  assert.deepEqual(context.activeSpecs, []);
  assert.deepEqual(context.knowledge, []);
});

test('Context 按路径解析 Active Spec 与 Knowledge，并由来源摘要检查新鲜度', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  await mkdir(path.join(target, 'src', 'demo'), { recursive: true });
  await writeFile(path.join(target, 'knowledge', 'demo.md'), '# Demo Knowledge\n');
  const source = await readFile(path.join(target, 'AGENTS.md'));
  const sourceDigest = `sha256:${createHash('sha256').update(source).digest('hex')}`;
  await writeFile(
    path.join(target, 'knowledge', 'registry.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      entries: [
        {
          id: 'demo-knowledge',
          title: '合成长期知识',
          path: './demo.md',
          status: 'current',
          scope: ['src/demo/'],
          topics: ['demo'],
          last_reviewed_at: '2026-08-05',
          authoritative_sources: ['AGENTS.md'],
          source_evidence: [{ path: 'AGENTS.md', digest: sourceDigest }],
          refresh_triggers: ['规则变化'],
          load_when: ['修改合成模块'],
        },
      ],
    }, null, 2)}\n`,
  );
  await writeFile(
    path.join(target, 'knowledge', 'code-entry-map.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      entries: [
        {
          task_type: '修改合成模块',
          start_paths: ['src/demo/'],
          module_rules: ['AGENTS.md'],
          knowledge: ['demo-knowledge'],
          exclude_by_default: [],
        },
      ],
    }, null, 2)}\n`,
  );
  const specRoot = path.join(target, 'specs', 'demo-work');
  await mkdir(specRoot);
  for (const file of ['spec.md', 'plan.md', 'tasks.md']) await writeFile(path.join(specRoot, file), `# ${file}\n`);
  await writeFile(
    path.join(specRoot, 'meta.json'),
    `${JSON.stringify({
      id: 'demo-work',
      status: 'in-progress',
      scope: ['src/demo/'],
      artifacts: { spec: './spec.md', plan: './plan.md', tasks: './tasks.md' },
      active_context: { summary: '继续合成工作', next_task_id: 'T-02' },
    }, null, 2)}\n`,
  );

  const checked = await checkKnowledgeGovernance(target);
  assert.equal(checked.status, 'pass');
  const context = await resolveProjectContext(target, { taskType: '修改合成模块', paths: ['src/demo/index.mjs'] });
  assert.equal(context.status, 'resolved');
  assert.deepEqual(context.activeSpecs.map((entry) => entry.id), ['demo-work']);
  assert.deepEqual(context.knowledge.map((entry) => entry.id), ['demo-knowledge']);
  assert.equal(context.activeSpecs[0].loadMode, 'full');
  assert.equal(context.activeSpecs[0].loadReason, 'within-budget');
  assert.ok(context.activeSpecs[0].markdownBytes > 0);
  assert.equal(context.activeSpecs[0].contextIndex, null);
  assert.equal(context.contextBudget.fullTextSpecCount, 1);
  assert.equal(context.contextBudget.sectionedSpecCount, 0);
  assert.ok(context.loadPlan.includes('AGENTS.md'));
  assert.ok(context.loadPlan.includes('specs/demo-work/spec.md'));
  assert.ok(context.loadPlan.includes('knowledge/demo.md'));

  const metaPath = path.join(specRoot, 'meta.json');
  const unsafeMeta = JSON.parse(await readFile(metaPath, 'utf8'));
  unsafeMeta.artifacts.spec = '../outside.md';
  await writeFile(metaPath, `${JSON.stringify(unsafeMeta, null, 2)}\n`);
  await assert.rejects(
    resolveProjectContext(target, { paths: ['src/demo/index.mjs'] }),
    (error) => error instanceof FoundationError && error.code === 'unsafe-path',
  );
  unsafeMeta.artifacts.spec = './spec.md';
  await writeFile(metaPath, `${JSON.stringify(unsafeMeta, null, 2)}\n`);

  await writeFile(path.join(target, 'AGENTS.md'), '# Changed rules\n');
  const stale = await checkKnowledgeGovernance(target);
  assert.equal(stale.ok, false);
  assert.ok(stale.errors.some((error) => error.code === 'knowledge-source-digest-mismatch'));
  assert.equal((await doctorProject(target)).ok, false);
});

test('Specflow Check 校验完整 Meta、产物与本地关系互反', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  const parent = await writeSyntheticGateSpec(target, { id: 'parent-spec', scope: ['src/parent/'] });
  const child = await writeSyntheticGateSpec(target, { id: 'child-spec', scope: ['src/child/'] });
  parent.meta.relations.children = ['child-spec'];
  child.meta.relations.parent = 'parent-spec';
  await writeFile(path.join(parent.specDirectory, 'meta.yaml'), stringifyYamlSubset(parent.meta));
  await writeFile(path.join(child.specDirectory, 'meta.yaml'), stringifyYamlSubset(child.meta));

  assert.equal((await checkSpecflowGovernance(target)).status, 'pass');
  child.meta.relations.parent = null;
  await writeFile(path.join(child.specDirectory, 'meta.yaml'), stringifyYamlSubset(child.meta));
  assert.ok(
    (await checkSpecflowGovernance(target)).errors.some((error) => error.code === 'spec-relation-not-reciprocal'),
  );
  await rm(path.join(parent.specDirectory, 'spec.md'));
  assert.ok(
    (await checkSpecflowGovernance(target)).errors.some((error) => error.code === 'spec-artifact-missing'),
  );
});

test('Specflow Check 阻断关系循环和不完整 Meta', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  const left = await writeSyntheticGateSpec(target, { id: 'left-spec', scope: ['src/left/'] });
  const right = await writeSyntheticGateSpec(target, { id: 'right-spec', scope: ['src/right/'] });
  left.meta.relations.parent = 'right-spec';
  left.meta.relations.children = ['right-spec'];
  right.meta.relations.parent = 'left-spec';
  right.meta.relations.children = ['left-spec'];
  await writeFile(path.join(left.specDirectory, 'meta.yaml'), stringifyYamlSubset(left.meta));
  await writeFile(path.join(right.specDirectory, 'meta.yaml'), stringifyYamlSubset(right.meta));
  assert.ok((await checkSpecflowGovernance(target)).errors.some((error) => error.code === 'spec-relation-cycle'));

  delete left.meta.authorization;
  await writeFile(path.join(left.specDirectory, 'meta.yaml'), stringifyYamlSubset(left.meta));
  assert.ok((await checkSpecflowGovernance(target)).errors.some((error) => error.specId === 'left-spec'));
});

test('Context 按可配置预算确定性降级为真实 Markdown Section Index', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  const manifestPath = path.join(target, 'agent-foundation.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.context = {
    perSpecFullTextBytes: 700,
    totalFullTextBytes: 700,
    maxIndexEntriesPerArtifact: 16,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  async function writeActiveSpec(id, padding) {
    const specRoot = path.join(target, 'specs', id);
    await mkdir(specRoot);
    const body = `# ${id}\n\n## 目标\n\nAC-101：${'x'.repeat(padding)}\n\n### 验证\n\n- [x] 已完成结构检查\n- [ ] 完成合成检查\n`;
    for (const file of ['spec.md', 'plan.md', 'tasks.md']) await writeFile(path.join(specRoot, file), body);
    await writeFile(
      path.join(specRoot, 'meta.json'),
      `${JSON.stringify({
        id,
        status: 'in-progress',
        scope: [`src/${id}/`],
        artifacts: { spec: './spec.md', plan: './plan.md', tasks: './tasks.md' },
      }, null, 2)}\n`,
    );
  }
  await writeActiveSpec('small-work', 40);
  await writeActiveSpec('large-work', 110);

  const globallyLimited = await resolveProjectContext(target);
  const small = globallyLimited.activeSpecs.find((entry) => entry.id === 'small-work');
  const large = globallyLimited.activeSpecs.find((entry) => entry.id === 'large-work');
  assert.equal(small.loadMode, 'full');
  assert.equal(large.loadMode, 'sectioned');
  assert.equal(large.loadReason, 'total-budget-exceeded');
  assert.equal(globallyLimited.contextBudget.fullTextSpecCount, 1);
  assert.equal(globallyLimited.contextBudget.sectionedSpecCount, 1);
  assert.ok(globallyLimited.loadPlan.includes('specs/small-work/spec.md'));
  assert.equal(globallyLimited.loadPlan.includes('specs/large-work/spec.md'), false);
  const specIndex = large.contextIndex.artifacts.find((artifact) => artifact.path.endsWith('/spec.md'));
  assert.deepEqual(
    specIndex.headings.map(({ level, title, startLine }) => ({ level, title, startLine })),
    [
      { level: 1, title: 'large-work', startLine: 1 },
      { level: 2, title: '目标', startLine: 3 },
      { level: 3, title: '验证', startLine: 7 },
    ],
  );
  assert.ok(specIndex.headings.every((heading) => heading.endLine >= heading.startLine && heading.bytes > 0));
  assert.deepEqual(specIndex.checklist, {
    total: 2,
    completed: 1,
    pending: 1,
    pendingLines: [10],
    pendingLinesTruncated: false,
  });
  assert.deepEqual(large.contextIndex.ruleLocations, [
    { id: 'AC-101', path: 'specs/large-work/spec.md', line: 5 },
  ]);

  manifest.context.perSpecFullTextBytes = 400;
  manifest.context.totalFullTextBytes = 900;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const individuallyLimited = await resolveProjectContext(target);
  assert.equal(
    individuallyLimited.activeSpecs.find((entry) => entry.id === 'large-work').loadReason,
    'per-spec-budget-exceeded',
  );
});

test('Repository Doctor 检查继承规则精确重复并按请求路径加载祖先规则', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  await mkdir(path.join(target, 'src', 'module', 'nested'), { recursive: true });
  await writeFile(path.join(target, 'AGENTS.md'), '# Root Rules\n\n- 不覆盖未知文件或用户修改。\n');
  await writeFile(
    path.join(target, 'src', 'module', 'AGENTS.md'),
    '# Module Rules\n\n- 不覆盖未知文件或用户修改。\n- 修改模块后运行对应测试。\n',
  );
  await writeFile(
    path.join(target, 'knowledge', 'code-entry-map.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      entries: [
        {
          task_type: '修改合成模块',
          start_paths: ['src/module'],
          module_rules: ['AGENTS.md', 'src/module/AGENTS.md'],
          knowledge: [],
          exclude_by_default: [],
        },
      ],
    }, null, 2)}\n`,
  );

  const checked = await checkKnowledgeGovernance(target);
  assert.equal(checked.ok, true);
  assert.equal(checked.status, 'warn');
  const duplicate = checked.warnings.find((warning) => warning.code === 'duplicate-inherited-rule');
  assert.equal(duplicate.parent, 'AGENTS.md');
  assert.equal(duplicate.child, 'src/module/AGENTS.md');
  assert.match(duplicate.fingerprint, /^sha256:[a-f0-9]{64}$/u);
  assert.equal(JSON.stringify(duplicate).includes('不覆盖未知文件'), false);
  assert.equal((await doctorProject(target)).status, 'warn');

  const mapPath = path.join(target, 'knowledge', 'code-entry-map.json');
  const navigationMap = JSON.parse(await readFile(mapPath, 'utf8'));
  navigationMap.entries[0].module_rules = ['AGENTS.md'];
  await writeFile(mapPath, `${JSON.stringify(navigationMap, null, 2)}\n`);

  const context = await resolveProjectContext(target, {
    taskType: '修改合成模块',
    paths: ['src/module/nested/new-file.mjs'],
  });
  assert.deepEqual(context.ruleFiles.map((rule) => rule.path), ['AGENTS.md', 'src/module/AGENTS.md']);
  assert.ok(context.loadPlan.includes('AGENTS.md'));
  assert.ok(context.loadPlan.includes('src/module/AGENTS.md'));
  assert.equal((await doctorProject(target)).status, 'pass');
});

test('Repository Doctor 阻断路由结构矛盾、失效入口和超预算规则', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  await mkdir(path.join(target, 'src', 'module'), { recursive: true });
  const mapPath = path.join(target, 'knowledge', 'code-entry-map.json');
  const mapping = {
    schemaVersion: 1,
    entries: [
      {
        task_type: '修改合成模块',
        start_paths: ['src/module'],
        module_rules: ['AGENTS.md'],
        knowledge: [],
        exclude_by_default: ['src/module'],
      },
    ],
  };
  await writeFile(mapPath, `${JSON.stringify(mapping, null, 2)}\n`);
  let checked = await checkKnowledgeGovernance(target);
  assert.ok(checked.errors.some((error) => error.code === 'code-entry-path-conflict'));

  mapping.entries[0].exclude_by_default = [];
  mapping.entries[0].start_paths = ['src/missing'];
  await writeFile(mapPath, `${JSON.stringify(mapping, null, 2)}\n`);
  checked = await checkKnowledgeGovernance(target);
  assert.ok(checked.errors.some((error) => error.code === 'start-path-missing'));

  mapping.entries[0].start_paths = ['src/module'];
  mapping.entries[0].module_rules = ['AGENTS.md', 'AGENTS.md'];
  await writeFile(mapPath, `${JSON.stringify(mapping, null, 2)}\n`);
  checked = await checkKnowledgeGovernance(target);
  assert.ok(checked.errors.some((error) => error.code === 'duplicate-code-entry-value'));

  mapping.entries[0].module_rules = ['AGENTS.md'];
  await writeFile(mapPath, `${JSON.stringify(mapping, null, 2)}\n`);
  const manifestPath = path.join(target, 'agent-foundation.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.context.maxRuleFileBytes = 256;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(path.join(target, 'AGENTS.md'), `# Root Rules\n\n- ${'x'.repeat(300)}\n`);
  checked = await checkKnowledgeGovernance(target);
  assert.ok(checked.errors.some((error) => error.code === 'rule-file-budget-exceeded'));
  assert.equal((await doctorProject(target)).ok, false);
});

test('Knowledge Projection 对已准备知识执行可计划、幂等应用和独立验证', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  const agentsContent = await readFile(path.join(target, 'AGENTS.md'), 'utf8');
  const registryPath = path.join(target, 'knowledge', 'registry.json');
  const projectionPath = path.join(target, 'specs', 'demo-projection.json');
  await mkdir(path.join(target, 'src', 'demo'), { recursive: true });
  await writeFile(path.join(target, 'knowledge', 'demo.md'), '# Demo Knowledge\n');
  await writeFile(
    registryPath,
    `${JSON.stringify({
      schemaVersion: 1,
      entries: [
        syntheticKnowledgeEntry({
          id: 'demo-knowledge',
          status: 'review-required',
          scope: ['src/demo/'],
          sourceContent: agentsContent,
          pathName: 'demo.md',
        }),
      ],
    }, null, 2)}\n`,
  );
  await writeFile(
    projectionPath,
    `${JSON.stringify({
      impact: 'reviewed',
      decisions: [
        {
          action: 'create',
          knowledge_id: 'demo-knowledge',
          target_knowledge_id: null,
          reason: '将已复核的通用结论纳入长期知识',
          evidence_refs: ['spec.md#AC-001'],
        },
      ],
    }, null, 2)}\n`,
  );
  const options = {
    projectionPath: 'specs/demo-projection.json',
    specId: 'demo-spec',
    reviewedAt: '2026-08-05',
    changedPaths: ['src/demo/index.mjs'],
  };

  const plan = await planKnowledgeProjection(target, options);
  assert.equal(plan.status, 'planned', JSON.stringify(plan));
  assert.equal(plan.registryChanged, true);
  assert.deepEqual(plan.coverage.matchedKnowledgeIds, ['demo-knowledge']);
  const beforeApply = await readFile(registryPath, 'utf8');
  assert.equal(JSON.parse(beforeApply).entries[0].status, 'review-required');

  const applied = await applyKnowledgeProjection(target, options);
  assert.equal(applied.status, 'applied');
  const projected = JSON.parse(await readFile(registryPath, 'utf8')).entries[0];
  assert.equal(projected.status, 'current');
  assert.equal(projected.last_projection.spec_id, 'demo-spec');
  assert.match(projected.last_projection.decision_digest, /^sha256:[a-f0-9]{64}$/u);
  assert.equal(projected.source_evidence.length, 1);
  assert.equal((await checkKnowledgeGovernance(target)).ok, true);
  assert.equal((await verifyKnowledgeProjection(target, options)).status, 'verified');
  assert.equal((await applyKnowledgeProjection(target, options)).status, 'unchanged');

  const cli = runCli([
    'knowledge',
    'projection',
    'verify',
    '--target',
    target,
    '--projection',
    'specs/demo-projection.json',
    '--spec-id',
    'demo-spec',
    '--reviewed-at',
    '2026-08-05',
    '--paths',
    'src/demo/index.mjs',
  ]);
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(cli.json.status, 'verified');

  const inconsistentRegistry = JSON.parse(await readFile(registryPath, 'utf8'));
  inconsistentRegistry.entries[0].last_projection.action = 'retire';
  await writeFile(registryPath, `${JSON.stringify(inconsistentRegistry, null, 2)}\n`);
  assert.ok(
    (await checkKnowledgeGovernance(target)).errors.some(
      (error) => error.code === 'knowledge-projection-status-mismatch',
    ),
  );
});

test('Knowledge Projection 阻断遗漏影响和仍被路由的退役知识，并校验取代关系', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  const agentsContent = await readFile(path.join(target, 'AGENTS.md'), 'utf8');
  const registryPath = path.join(target, 'knowledge', 'registry.json');
  const mapPath = path.join(target, 'knowledge', 'code-entry-map.json');
  const projectionPath = path.join(target, 'specs', 'replacement-projection.json');
  const noImpactPath = path.join(target, 'specs', 'no-impact-projection.json');
  await mkdir(path.join(target, 'src', 'legacy'), { recursive: true });
  await mkdir(path.join(target, 'src', 'next'), { recursive: true });
  await writeFile(path.join(target, 'knowledge', 'legacy-knowledge.md'), '# Legacy\n');
  await writeFile(path.join(target, 'knowledge', 'next-knowledge.md'), '# Next\n');
  await writeFile(
    registryPath,
    `${JSON.stringify({
      schemaVersion: 1,
      entries: [
        syntheticKnowledgeEntry({
          id: 'legacy-knowledge',
          status: 'current',
          scope: ['src/legacy/'],
          sourceContent: agentsContent,
        }),
        syntheticKnowledgeEntry({
          id: 'next-knowledge',
          status: 'review-required',
          scope: ['src/next/'],
          sourceContent: agentsContent,
        }),
      ],
    }, null, 2)}\n`,
  );
  await writeFile(noImpactPath, `${JSON.stringify({ impact: 'none', reason: '已人工检查', decisions: [] }, null, 2)}\n`);
  const noImpact = await planKnowledgeProjection(target, {
    projectionPath: 'specs/no-impact-projection.json',
    specId: 'replacement-spec',
    reviewedAt: '2026-08-05',
    changedPaths: ['src/legacy/index.mjs'],
  });
  assert.equal(noImpact.status, 'blocked');
  assert.ok(noImpact.errors.some((error) => error.code === 'knowledge-impact-unaddressed'));

  const decisions = {
    impact: 'reviewed',
    decisions: [
      {
        action: 'supersede',
        knowledge_id: 'legacy-knowledge',
        target_knowledge_id: 'next-knowledge',
        reason: '旧结论已由新的通用结论取代',
        evidence_refs: ['spec.md#AC-002'],
      },
      {
        action: 'create',
        knowledge_id: 'next-knowledge',
        target_knowledge_id: null,
        reason: '新结论已经完成语义复核',
        evidence_refs: ['spec.md#AC-003'],
      },
    ],
  };
  await writeFile(projectionPath, `${JSON.stringify(decisions, null, 2)}\n`);
  const mapping = (knowledge) => ({
    schemaVersion: 1,
    entries: [
      {
        task_type: 'synthetic-change',
        start_paths: ['src/'],
        module_rules: [],
        knowledge,
        exclude_by_default: [],
      },
    ],
  });
  await writeFile(mapPath, `${JSON.stringify(mapping(['legacy-knowledge']), null, 2)}\n`);
  const options = {
    projectionPath: 'specs/replacement-projection.json',
    specId: 'replacement-spec',
    reviewedAt: '2026-08-05',
    changedPaths: ['src/legacy/index.mjs', 'src/next/index.mjs'],
  };
  const routed = await planKnowledgeProjection(target, options);
  assert.equal(routed.status, 'blocked');
  assert.ok(routed.errors.some((error) => error.code === 'retired-knowledge-still-routed'));

  await writeFile(mapPath, `${JSON.stringify(mapping(['next-knowledge']), null, 2)}\n`);
  assert.equal((await applyKnowledgeProjection(target, options)).status, 'applied');
  const entries = JSON.parse(await readFile(registryPath, 'utf8')).entries;
  assert.equal(entries.find((entry) => entry.id === 'legacy-knowledge').status, 'retired');
  assert.equal(entries.find((entry) => entry.id === 'legacy-knowledge').superseded_by, 'next-knowledge');
  assert.equal(entries.find((entry) => entry.id === 'next-knowledge').status, 'current');
  assert.equal((await checkKnowledgeGovernance(target)).ok, true);
});

test('本地 Git Provider 生成稳定 Merge Candidate 摘要并阻断纳入范围的未提交改动', async () => {
  const root = await makeTemporaryRoot();
  await mkdir(path.join(root, 'src', 'generated'), { recursive: true });
  await mkdir(path.join(root, 'docs'));
  runGit(root, ['init']);
  runGit(root, ['config', 'user.name', 'Synthetic Tester']);
  runGit(root, ['config', 'user.email', 'synthetic@example.invalid']);
  await writeFile(path.join(root, 'src', 'a.mjs'), 'export const value = 1;\n');
  await writeFile(path.join(root, 'src', 'b.mjs'), 'export const stable = true;\n');
  await writeFile(path.join(root, 'src', 'generated', 'auto.mjs'), 'export const generated = 1;\n');
  await writeFile(path.join(root, 'docs', 'guide.md'), '# Guide\n');
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'baseline']);
  const baseRevision = runGit(root, ['rev-parse', 'HEAD']).stdout.trim();

  await writeFile(path.join(root, 'src', 'a.mjs'), 'export const value = 2;\n');
  runGit(root, ['mv', 'src/b.mjs', 'src/c.mjs']);
  await writeFile(path.join(root, 'src', 'generated', 'auto.mjs'), 'export const generated = 2;\n');
  await writeFile(path.join(root, 'docs', 'guide.md'), '# Changed guide\n');
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'feature']);
  const objectStateBefore = runGit(root, ['count-objects', '-v']).stdout;

  const first = await inspectSourceControlSnapshot(root, {
    baseRevision,
    includePaths: ['src/'],
    excludePaths: ['src/generated/'],
  });
  const second = await inspectSourceControlSnapshot(root, {
    baseRevision,
    includePaths: ['./src'],
    excludePaths: ['./src/generated'],
  });
  assert.equal(first.snapshot.scope, 'merge-candidate');
  assert.equal(first.snapshot.baseRevision, baseRevision);
  assert.match(first.snapshot.sourceRevision, /^[0-9a-f]{40,64}$/u);
  assert.match(first.snapshot.change.digest, /^sha256:[0-9a-f]{64}$/u);
  assert.equal(first.snapshot.change.digest, second.snapshot.change.digest);
  assert.deepEqual(first.snapshot.change.includes, ['src']);
  assert.deepEqual(first.snapshot.change.excludes, ['src/generated']);
  assert.deepEqual(
    first.snapshot.evidence.changes.flatMap((change) => change.paths.map((entry) => entry.path)),
    ['src/a.mjs', 'src/b.mjs', 'src/c.mjs'],
  );
  const rename = first.snapshot.evidence.changes.find((change) => change.status.startsWith('R'));
  assert.equal(rename.paths[0].objectId, null);
  assert.match(rename.paths[1].objectId, /^[0-9a-f]{40,64}$/u);
  const cli = runCli([
    'source-control',
    'inspect',
    '--target',
    root,
    '--base',
    baseRevision,
    '--include',
    'src',
    '--exclude',
    'src/generated',
  ]);
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(cli.json.snapshot.change.digest, first.snapshot.change.digest);
  assert.equal(runGit(root, ['count-objects', '-v']).stdout, objectStateBefore);

  await writeFile(path.join(root, 'src', 'generated', 'auto.mjs'), 'export const generated = 3;\n');
  assert.equal(
    (await inspectSourceControlSnapshot(root, { baseRevision, includePaths: ['src'], excludePaths: ['src/generated'] })).ok,
    true,
  );
  await writeFile(path.join(root, 'src', 'a.mjs'), 'export const value = 3;\n');
  await assert.rejects(
    inspectSourceControlSnapshot(root, { baseRevision, includePaths: ['src'], excludePaths: ['src/generated'] }),
    (error) =>
      error instanceof FoundationError &&
      error.code === 'source-control-scope-dirty' &&
      error.details.paths.includes('src/a.mjs') &&
      !error.details.paths.includes('src/generated/auto.mjs'),
  );
});

test('本地 Git Provider 对冲突候选和未知 Provider 明确失败', async () => {
  const root = await makeTemporaryRoot();
  runGit(root, ['init']);
  runGit(root, ['config', 'user.name', 'Synthetic Tester']);
  runGit(root, ['config', 'user.email', 'synthetic@example.invalid']);
  await writeFile(path.join(root, 'shared.txt'), 'baseline\n');
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'baseline']);
  const baseline = runGit(root, ['rev-parse', 'HEAD']).stdout.trim();

  runGit(root, ['switch', '-c', 'feature']);
  await writeFile(path.join(root, 'shared.txt'), 'feature\n');
  runGit(root, ['commit', '-am', 'feature change']);
  const feature = runGit(root, ['rev-parse', 'HEAD']).stdout.trim();
  runGit(root, ['switch', '-c', 'target', baseline]);
  await writeFile(path.join(root, 'shared.txt'), 'target\n');
  runGit(root, ['commit', '-am', 'target change']);
  const target = runGit(root, ['rev-parse', 'HEAD']).stdout.trim();

  await assert.rejects(
    inspectSourceControlSnapshot(root, { baseRevision: target, sourceRevision: feature }),
    (error) => error instanceof FoundationError && error.code === 'merge-candidate-conflict',
  );
  await assert.rejects(
    inspectSourceControlSnapshot(root, { baseRevision: target, provider: 'missing-provider' }),
    (error) => error instanceof FoundationError && error.code === 'source-control-provider-unavailable',
  );
});

test('Change Gate 允许候选显式关联一个范围匹配的 Active Spec', async () => {
  const root = await makeTemporaryRoot();
  await initProject(root);
  await mkdir(path.join(root, 'src', 'demo'), { recursive: true });
  await writeFile(path.join(root, 'src', 'demo', 'index.mjs'), 'export const value = 1;\n');
  runGit(root, ['init']);
  runGit(root, ['config', 'user.name', 'Synthetic Tester']);
  runGit(root, ['config', 'user.email', 'synthetic@example.invalid']);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'baseline']);
  const baseRevision = runGit(root, ['rev-parse', 'HEAD']).stdout.trim();

  const specId = 'synthetic-change-gate';
  const { specDirectory, meta } = await writeSyntheticGateSpec(root, { id: specId, scope: ['docs/'] });
  await writeFile(path.join(root, 'src', 'demo', 'index.mjs'), 'export const value = 2;\n');
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'feature with active spec']);
  const wrongScope = await checkChangeGate(root, { baseRevision, specId });
  assert.equal(wrongScope.status, 'blocked');
  assert.ok(wrongScope.errors.some((error) => error.code === 'change-gate-spec-scope-mismatch'));

  meta.scope = ['src/demo/'];
  await writeFile(path.join(specDirectory, 'meta.yaml'), stringifyYamlSubset(meta));
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'align synthetic scope']);
  const passed = await checkChangeGate(root, { baseRevision, specId });
  assert.equal(passed.status, 'pass');
  assert.equal(passed.evidence.association.mode, 'spec');
  assert.deepEqual(passed.evidence.association.specIds, [specId]);
  assert.deepEqual(passed.evidence.association.implementationPaths, ['src/demo/index.mjs']);
  assert.match(passed.evidence.gateDigest, /^sha256:[a-f0-9]{64}$/u);
  const prematureDelivery = await checkChangeGate(root, { baseRevision, specId, phase: 'delivery' });
  assert.ok(prematureDelivery.errors.some((error) => error.code === 'change-gate-spec-not-archived'));

  const cli = runCli([
    'change',
    'gate',
    'check',
    '--target',
    root,
    '--base',
    baseRevision,
    '--spec-id',
    specId,
  ]);
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(cli.json.evidence.gateDigest, passed.evidence.gateDigest);
});

test('Change Gate 使用多个 Active Spec 的 Scope 并集覆盖完整候选', async () => {
  const root = await makeTemporaryRoot();
  await initProject(root);
  await mkdir(path.join(root, 'src', 'product'), { recursive: true });
  await mkdir(path.join(root, 'src', 'platform'), { recursive: true });
  await writeFile(path.join(root, 'src', 'product', 'index.mjs'), 'export const product = 1;\n');
  await writeFile(path.join(root, 'src', 'platform', 'index.mjs'), 'export const platform = 1;\n');
  runGit(root, ['init']);
  runGit(root, ['config', 'user.name', 'Synthetic Tester']);
  runGit(root, ['config', 'user.email', 'synthetic@example.invalid']);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'baseline']);
  const baseRevision = runGit(root, ['rev-parse', 'HEAD']).stdout.trim();

  await writeSyntheticGateSpec(root, { id: 'product-change', scope: ['src/product/', 'src/shared/'] });
  await writeSyntheticGateSpec(root, { id: 'platform-change', scope: ['src/platform/', 'src/shared/'] });
  await writeFile(path.join(root, 'src', 'product', 'index.mjs'), 'export const product = 2;\n');
  await writeFile(path.join(root, 'src', 'platform', 'index.mjs'), 'export const platform = 2;\n');
  await mkdir(path.join(root, 'src', 'shared'), { recursive: true });
  await writeFile(path.join(root, 'src', 'shared', 'index.mjs'), 'export const shared = true;\n');
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'coupled product and platform changes']);

  const incomplete = await checkChangeGate(root, { baseRevision, specIds: ['product-change'] });
  assert.equal(incomplete.status, 'blocked');
  const uncoveredPaths = incomplete.errors.find(
    (error) => error.code === 'change-gate-spec-scope-mismatch',
  ).paths;
  assert.ok(uncoveredPaths.includes('specs/platform-change/meta.yaml'));
  assert.ok(uncoveredPaths.includes('src/platform/index.mjs'));

  const passed = await checkChangeGate(root, {
    baseRevision,
    specIds: ['product-change', 'platform-change'],
  });
  assert.equal(passed.status, 'pass', JSON.stringify(passed));
  assert.deepEqual(passed.evidence.association.specIds, ['platform-change', 'product-change']);
  assert.deepEqual(passed.evidence.association.specs, [
    { specId: 'platform-change', status: 'in-progress' },
    { specId: 'product-change', status: 'in-progress' },
  ]);
  assert.deepEqual(passed.evidence.association.implementationPaths, [
    'src/platform/index.mjs',
    'src/product/index.mjs',
    'src/shared/index.mjs',
  ]);

  const cli = runCli([
    'change',
    'gate',
    'check',
    '--target',
    root,
    '--base',
    baseRevision,
    '--spec-id',
    'product-change',
    '--spec-id',
    'platform-change',
  ]);
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(cli.json.evidence.gateDigest, passed.evidence.gateDigest);
});

test('Change Gate 的无 Spec 豁免只接受受控类型和可由路径证明的完整候选', async () => {
  const root = await makeTemporaryRoot();
  await initProject(root);
  await mkdir(path.join(root, 'docs'));
  await writeFile(path.join(root, 'docs', 'guide.md'), '# Initial\n');
  runGit(root, ['init']);
  runGit(root, ['config', 'user.name', 'Synthetic Tester']);
  runGit(root, ['config', 'user.email', 'synthetic@example.invalid']);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'baseline']);
  const baseRevision = runGit(root, ['rev-parse', 'HEAD']).stdout.trim();

  await writeFile(path.join(root, 'docs', 'guide.md'), '# Updated\n');
  runGit(root, ['commit', '-am', 'docs change']);
  const passed = await checkChangeGate(root, { baseRevision, exemption: 'docs-only', phase: 'delivery' });
  assert.equal(passed.status, 'pass');
  assert.deepEqual(passed.evidence.changedPaths, ['docs/guide.md']);

  const ambiguous = await checkChangeGate(root, {
    baseRevision,
    specId: 'synthetic-spec',
    exemption: 'docs-only',
  });
  assert.ok(ambiguous.errors.some((error) => error.code === 'change-gate-association-required'));
  const unknown = await checkChangeGate(root, { baseRevision, exemption: 'copy-only' });
  assert.ok(unknown.errors.some((error) => error.code === 'invalid-change-gate-exemption'));

  await mkdir(path.join(root, 'src'));
  await writeFile(path.join(root, 'src', 'index.mjs'), 'export const changed = true;\n');
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'behavior change']);
  const mixed = await checkChangeGate(root, { baseRevision, exemption: 'docs-only' });
  assert.equal(mixed.status, 'blocked');
  assert.deepEqual(
    mixed.errors.find((error) => error.code === 'change-gate-exemption-scope-mismatch').paths,
    ['src/index.mjs'],
  );
});

test('Delivery Change Gate 复核 Archived Receipt 与最终 Merge Candidate 摘要', async () => {
  const root = await makeTemporaryRoot();
  await initProject(root);
  await mkdir(path.join(root, 'src', 'delivery'), { recursive: true });
  await writeFile(path.join(root, 'src', 'delivery', 'index.mjs'), 'export const value = 1;\n');
  runGit(root, ['init']);
  runGit(root, ['config', 'user.name', 'Synthetic Tester']);
  runGit(root, ['config', 'user.email', 'synthetic@example.invalid']);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'baseline']);
  const baseRevision = runGit(root, ['rev-parse', 'HEAD']).stdout.trim();

  const specId = 'synthetic-delivery-gate';
  const { specDirectory } = await writeSyntheticGateSpec(root, { id: specId, scope: ['src/delivery/'] });
  await writeFile(path.join(root, 'src', 'delivery', 'index.mjs'), 'export const value = 2;\n');
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'feature implementation']);
  const exclusion = `specs/${specId}`;
  const receiptSnapshot = (
    await inspectSourceControlSnapshot(root, { baseRevision, excludePaths: [exclusion] })
  ).snapshot;
  await writeFile(
    path.join(specDirectory, 'archive-receipt.candidate.yaml'),
    stringifyYamlSubset(syntheticReceiptCandidate({ specId, snapshot: receiptSnapshot })),
  );
  await finalizeArchiveReceipt(specDirectory, './archive-receipt.candidate.yaml');
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'finalize delivery evidence']);

  const delivered = await checkChangeGate(root, {
    baseRevision,
    specId,
    phase: 'delivery',
    excludePaths: [exclusion],
  });
  assert.equal(delivered.status, 'pass', JSON.stringify(delivered));
  assert.equal(delivered.evidence.delivery[0].currentState, 'archived');
  assert.equal(delivered.evidence.delivery[0].receiptScopeDigest, receiptSnapshot.change.digest);

  await writeFile(path.join(root, 'src', 'delivery', 'index.mjs'), 'export const value = 3;\n');
  runGit(root, ['commit', '-am', 'stale implementation after receipt']);
  const stale = await checkChangeGate(root, {
    baseRevision,
    specId,
    phase: 'delivery',
    excludePaths: [exclusion],
  });
  assert.equal(stale.status, 'blocked');
  assert.ok(stale.errors.some((error) => error.code === 'change-gate-receipt-snapshot-mismatch'));
});

test('Delivery Change Gate 逐项复核多个 Archived Spec 对应同一候选', async () => {
  const root = await makeTemporaryRoot();
  await initProject(root);
  await mkdir(path.join(root, 'src', 'product'), { recursive: true });
  await mkdir(path.join(root, 'src', 'platform'), { recursive: true });
  await writeFile(path.join(root, 'src', 'product', 'index.mjs'), 'export const product = 1;\n');
  await writeFile(path.join(root, 'src', 'platform', 'index.mjs'), 'export const platform = 1;\n');
  runGit(root, ['init']);
  runGit(root, ['config', 'user.name', 'Synthetic Tester']);
  runGit(root, ['config', 'user.email', 'synthetic@example.invalid']);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'baseline']);
  const baseRevision = runGit(root, ['rev-parse', 'HEAD']).stdout.trim();

  const items = [
    { specId: 'product-delivery', scope: ['src/product/'] },
    { specId: 'platform-delivery', scope: ['src/platform/'] },
  ];
  for (const item of items) {
    const { specDirectory } = await writeSyntheticGateSpec(root, { id: item.specId, scope: item.scope });
    item.specDirectory = specDirectory;
  }
  await writeFile(path.join(root, 'src', 'product', 'index.mjs'), 'export const product = 2;\n');
  await writeFile(path.join(root, 'src', 'platform', 'index.mjs'), 'export const platform = 2;\n');
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'joint implementation']);

  const excludePaths = items.map(({ specId }) => `specs/${specId}`);
  const receiptSnapshot = (
    await inspectSourceControlSnapshot(root, { baseRevision, excludePaths })
  ).snapshot;
  for (const { specId, specDirectory } of items) {
    await writeFile(
      path.join(specDirectory, 'archive-receipt.candidate.yaml'),
      stringifyYamlSubset(syntheticReceiptCandidate({ specId, snapshot: receiptSnapshot })),
    );
    await finalizeArchiveReceipt(specDirectory, './archive-receipt.candidate.yaml');
  }
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'finalize both delivery receipts']);

  const delivered = await checkChangeGate(root, {
    baseRevision,
    specIds: items.map(({ specId }) => specId),
    phase: 'delivery',
    excludePaths,
  });
  assert.equal(delivered.status, 'pass', JSON.stringify(delivered));
  assert.deepEqual(
    delivered.evidence.delivery.map(({ specId }) => specId),
    ['platform-delivery', 'product-delivery'],
  );
  assert.ok(
    delivered.evidence.delivery.every(
      ({ receiptScopeDigest }) => receiptScopeDigest === receiptSnapshot.change.digest,
    ),
  );
});

test('init 遇到既有不同内容时整体阻断，不写入其他 Starter 文件', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await mkdir(target);
  await writeFile(path.join(target, 'AGENTS.md'), '# 用户已有规则\n');

  const plan = await planProjectInit(target);
  assert.equal(plan.ok, false);
  assert.equal(plan.status, 'blocked');
  assert.deepEqual(plan.conflicts, [{ path: 'AGENTS.md', reason: 'different-content' }]);

  await assert.rejects(
    initProject(target),
    (error) => error instanceof FoundationError && error.code === 'init-conflict',
  );
  assert.equal(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), '# 用户已有规则\n');
  await assert.rejects(readFile(path.join(target, 'agent-foundation.json')), { code: 'ENOENT' });
});

test('init plan 为已有项目提供只读接入计划，并拒绝父路径 Symlink', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'existing-project');
  await mkdir(target);
  await writeFile(path.join(target, 'README.md'), '# 既有项目\n');

  const before = (await readdir(target)).sort();
  const plan = await planProjectInit(target);
  assert.equal(plan.ok, true);
  assert.equal(plan.action, 'add');
  assert.ok(plan.added.includes('AGENTS.md'));
  assert.deepEqual((await readdir(target)).sort(), before);

  const realParent = path.join(root, 'real-parent');
  const linkedParent = path.join(root, 'linked-parent');
  await mkdir(realParent);
  await symlink(realParent, linkedParent);
  await assert.rejects(
    planProjectInit(path.join(linkedParent, 'project')),
    (error) => error instanceof FoundationError && error.code === 'unsafe-symlink',
  );
  await assert.rejects(readFile(path.join(realParent, 'project', 'agent-foundation.json')), { code: 'ENOENT' });
});

test('Skill 发现与检查从真实源目录派生', async () => {
  const skills = await discoverSkills();
  const expectedNames = (await readdir(path.resolve('skills'), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  assert.deepEqual(
    skills.map((skill) => skill.name),
    expectedNames,
  );
  for (const skill of skills) {
    assert.match(skill.digest, /^sha256:[a-f0-9]{64}$/u);
    assert.equal((await checkSkill(skill.name)).ok, true);
  }
});

test('Skill Plan 是只读操作，Install 幂等并被 Doctor 复核', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);

  const plan = await planSkill({ target, name: 'web-performance-review' });
  assert.equal(plan.ok, true);
  assert.equal(plan.action, 'add');
  await assert.rejects(readFile(path.join(target, '.agent-foundation', 'installed-skills.json')), { code: 'ENOENT' });

  const installed = await installSkill({ target, name: 'web-performance-review' });
  assert.equal(installed.status, 'installed');
  const repeated = await installSkill({ target, name: 'web-performance-review' });
  assert.equal(repeated.status, 'unchanged');

  const doctor = await doctorProject(target);
  assert.equal(doctor.ok, true);
  assert.ok(doctor.checks.some((check) => check.code === 'installed-skill'));
});

test('Install 不覆盖未纳管的同名目录', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  const destination = path.join(target, '.agents', 'skills', 'specflow');
  await mkdir(destination, { recursive: true });
  await writeFile(path.join(destination, 'KEEP.txt'), 'user-owned');

  await assert.rejects(
    installSkill({ target, name: 'specflow' }),
    (error) => error instanceof FoundationError && error.code === 'skill-conflict',
  );
  assert.equal(await readFile(path.join(destination, 'KEEP.txt'), 'utf8'), 'user-owned');
});

test('Update 检测用户修改并保持目标内容不变', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  await installSkill({ target, name: 'specflow' });
  const skillFile = path.join(target, '.agents', 'skills', 'specflow', 'SKILL.md');
  await writeFile(skillFile, `${await readFile(skillFile, 'utf8')}\n用户本地修改\n`);
  const before = await readFile(skillFile, 'utf8');

  await assert.rejects(
    updateSkill({ target, name: 'specflow' }),
    (error) => error instanceof FoundationError && error.code === 'skill-conflict',
  );
  assert.equal(await readFile(skillFile, 'utf8'), before);
  assert.equal((await doctorProject(target)).ok, false);
});

test('Update 只更新已纳管且未被用户修改的 Skill', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  const fakeRepo = path.join(root, 'source');
  const sourceSkill = await makeFakeSkillRepo(fakeRepo, '# 第一版\n');
  await initProject(target);
  await installSkill({ target, name: 'demo-skill', repoRoot: fakeRepo });

  await writeFile(
    path.join(sourceSkill, 'SKILL.md'),
    '---\nname: demo-skill\ndescription: 在合成测试中执行一个通用演示任务。\n---\n\n# 第二版\n',
  );
  const plan = await planSkill({ target, name: 'demo-skill', operation: 'update', repoRoot: fakeRepo });
  assert.equal(plan.action, 'update');
  const updated = await updateSkill({ target, name: 'demo-skill', repoRoot: fakeRepo });
  assert.equal(updated.status, 'updated');
  assert.match(await readFile(path.join(target, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /第二版/u);
  assert.equal((await doctorProject(target)).ok, true);
});

test('Distribution Manifest 以内容摘要执行 Plan、Apply 和 Verify', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  const fakeRepo = path.join(root, 'source');
  await makeFakeSkillRepo(fakeRepo);
  const source = await checkSkill('demo-skill', { repoRoot: fakeRepo });
  await mkdir(path.join(fakeRepo, 'distribution'), { recursive: true });
  await writeFile(
    path.join(fakeRepo, 'distribution', 'manifest.yaml'),
    [
      'version: 1',
      'skills:',
      '  - name: demo-skill',
      '    source: skills/demo-skill',
      '    version:',
      '      type: content-hash',
      `      value: ${source.digest}`,
      '    distributable: true',
      '    required_files:',
      '      - SKILL.md',
      '    optional_resources: []',
      '',
    ].join('\n'),
  );
  await initProject(target);

  const plan = await planDistribution({ target, repoRoot: fakeRepo });
  assert.equal(plan.ok, true);
  assert.equal(plan.items[0].action, 'add');
  assert.equal((await applyDistribution({ target, repoRoot: fakeRepo })).status, 'applied');
  assert.equal((await verifyDistribution({ target, repoRoot: fakeRepo })).status, 'pass');
  assert.equal((await applyDistribution({ target, repoRoot: fakeRepo })).status, 'unchanged');

  const skillPath = path.join(fakeRepo, 'skills', 'demo-skill', 'SKILL.md');
  await writeFile(skillPath, `${await readFile(skillPath, 'utf8')}\nchanged\n`);
  await assert.rejects(
    planDistribution({ target, repoRoot: fakeRepo }),
    (error) => error instanceof FoundationError && error.code === 'distribution-source-mismatch',
  );
  assert.equal((await verifyDistribution({ target, repoRoot: fakeRepo })).ok, false);
});

test('未知 Skill 和 Symlink 目标均在写入前阻断', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  const outside = path.join(root, 'outside');
  await initProject(target);
  await mkdir(outside);

  await assert.rejects(
    installSkill({ target, name: 'missing-skill' }),
    (error) => error instanceof FoundationError && error.code === 'skill-not-found',
  );
  await mkdir(path.join(target, '.agents'));
  await symlink(outside, path.join(target, '.agents', 'skills'));
  await assert.rejects(
    installSkill({ target, name: 'specflow' }),
    (error) => error instanceof FoundationError && error.code === 'unsafe-symlink',
  );
  assert.deepEqual(await readdirNames(outside), []);
});

test('CLI 暴露初始化、Doctor、Skill 列表和参数错误退出码', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');

  const initialized = runCli(['init', '--target', target]);
  assert.equal(initialized.status, 0, initialized.stderr);
  assert.equal(initialized.json.status, 'initialized');

  const initPlan = runCli(['init', 'plan', '--target', target]);
  assert.equal(initPlan.status, 0, initPlan.stderr);
  assert.equal(initPlan.json.action, 'none');

  const doctor = runCli(['doctor', '--target', target]);
  assert.equal(doctor.status, 0, doctor.stderr);
  assert.equal(doctor.json.status, 'pass');

  const knowledge = runCli(['knowledge', 'check', '--target', target]);
  assert.equal(knowledge.status, 0, knowledge.stderr);
  assert.equal(knowledge.json.status, 'pass');

  const context = runCli(['context', 'resolve', '--target', target]);
  assert.equal(context.status, 0, context.stderr);
  assert.equal(context.json.status, 'resolved');

  const listed = runCli(['skill', 'list']);
  assert.equal(listed.status, 0, listed.stderr);
  assert.ok(listed.json.skills.some((skill) => skill.name === 'specflow'));

  const repository = runCli(['repository', 'check']);
  assert.equal(repository.status, 0, repository.stderr);
  assert.equal(repository.json.status, 'pass');

  const invalid = runCli(['skill', 'install', '--target', target]);
  assert.equal(invalid.status, 2);
  assert.equal(invalid.json.error.code, 'invalid-arguments');

  const missingDenyFile = runCli(['repository', 'check', '--deny-file']);
  assert.equal(missingDenyFile.status, 2);
  assert.equal(missingDenyFile.json.error.code, 'invalid-arguments');
});

test('CLI 暴露 Checkpoint、增量验证、Web、Design 与埋点确定性契约', async () => {
  const root = await makeTemporaryRoot();
  const digest = (character) => `sha256:${character.repeat(64)}`;
  const checkpointPath = path.join(root, 'checkpoint.json');
  await writeFile(checkpointPath, `${JSON.stringify(sealCheckpoint({
    schema_version: 1,
    run: { id: 'cli-run', task_type: 'synthetic', status: 'paused', current_stage_id: 'verify', updated_at: '2026-08-05T00:00:00Z' },
    stages: [{ id: 'verify', status: 'paused', replay_policy: 'idempotent', input_digest: digest('1'), exit_gate: { status: 'unknown', reasons: [] } }],
    events: [], decisions: [], external_refs: [],
  }), null, 2)}\n`);
  assert.equal(runCli(['checkpoint', 'check', '--file', checkpointPath]).status, 0);
  assert.equal(runCli(['checkpoint', 'resume', '--file', checkpointPath, '--input-digest', digest('1')]).json.action, 'continue');

  const matrixPath = path.join(root, 'change-validation.json');
  await writeFile(matrixPath, `${JSON.stringify({
    version: 1, change_id: 'cli-change', changed_paths: ['src/page.ts'],
    rules: [{ id: 'page', path_prefixes: ['src/'], required_checks: ['unit'], required_browser_scenarios: [], required_manual_gates: [] }],
    checks: [{ id: 'unit', command: 'npm test', status: 'passed', evidence_ref: 'local:test' }], browser_scenarios: [], manual_gates: [],
  }, null, 2)}\n`);
  assert.equal(runCli(['change-validation', 'check', '--file', matrixPath]).status, 0);

  const webPath = path.join(root, 'web.json');
  await writeFile(webPath, '{"version":1,"page_version":"synthetic-1","har":{"log":{"entries":[]}},"trace":null}\n');
  assert.equal(runCli(['web-evidence', 'summarize', '--file', webPath]).status, 0);
  assert.equal(runCli(['prefetch', 'check', '--file', path.resolve('frameworks/web-prefetch/prefetch-candidate.template.json')]).status, 0);
  assert.equal(runCli(['design', 'check', '--file', path.resolve('frameworks/design-to-code/design-contract.template.json')]).status, 0);
  assert.equal(runCli(['tracking', 'check', '--file', path.resolve('frameworks/tracking-governance/event-catalog.template.json')]).status, 0);
});

test('仓库检查支持私有词表且不在结果中回显词条', async () => {
  const passed = await checkRepository();
  assert.equal(passed.ok, true);

  const privateTerm = 'Agent 工程治理骨架';
  const blocked = await checkRepository({ denyTerms: [privateTerm] });
  assert.equal(blocked.ok, false);
  assert.ok(blocked.errors.some((error) => error.code === 'denied-sensitive-term'));
  assert.equal(JSON.stringify(blocked).includes(privateTerm), false);
});

test('敏感扫描覆盖无扩展名文件、路径、暂存区和 Git 历史且不回显命中内容', async () => {
  const root = await makeTemporaryRoot();
  await makeCheckableRepository(root);
  const syntheticSecret = `ghp_${'A'.repeat(36)}`;

  await writeFile(path.join(root, '.env'), `TOKEN=${syntheticSecret}\n`);
  const worktreeBlocked = await checkRepository({ repoRoot: root });
  assert.ok(worktreeBlocked.errors.some((error) => error.code === 'high-confidence-secret' && error.path === '.env'));
  assert.equal(JSON.stringify(worktreeBlocked).includes(syntheticSecret), false);
  await rm(path.join(root, '.env'));

  const privateTerm = 'synthetic-private-system';
  await writeFile(path.join(root, `${privateTerm}-notes`), `${privateTerm}\n`);
  const pathBlocked = await checkRepository({ repoRoot: root, denyTerms: [privateTerm] });
  assert.ok(pathBlocked.errors.some((error) => error.code === 'denied-sensitive-term-in-path'));
  assert.equal(JSON.stringify(pathBlocked).includes(privateTerm), false);
  await rm(path.join(root, `${privateTerm}-notes`));

  runGit(root, ['init']);
  runGit(root, ['config', 'user.name', 'Synthetic Tester']);
  runGit(root, ['config', 'user.email', 'synthetic@example.invalid']);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-m', 'baseline']);

  await writeFile(path.join(root, 'history-note'), `${syntheticSecret}\n`);
  runGit(root, ['add', 'history-note']);
  const stagedBlocked = await checkRepository({ repoRoot: root, gitScope: 'staged' });
  assert.ok(stagedBlocked.errors.some((error) => error.code === 'high-confidence-secret' && error.gitScope));
  runGit(root, ['commit', '-m', 'add synthetic history evidence']);
  await rm(path.join(root, 'history-note'));
  runGit(root, ['add', '-u']);
  runGit(root, ['commit', '-m', 'remove synthetic history evidence']);

  const historyBlocked = await checkRepository({ repoRoot: root, gitScope: 'reachable' });
  assert.ok(historyBlocked.errors.some((error) => error.code === 'high-confidence-secret' && error.gitScope));
  assert.equal(JSON.stringify(historyBlocked).includes(syntheticSecret), false);
});

test('采用方可以注入合成 Host Adapter，无需修改 Harness 核心', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  const manifestPath = path.join(target, 'agent-foundation.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.integrations = [
    {
      capability: 'host',
      adapterId: 'synthetic-host',
      configRef: 'env://SYNTHETIC_HOST_CONFIG',
    },
  ];
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const syntheticHost = {
    capability: 'host',
    id: 'synthetic-host',
    displayName: 'Synthetic Host',
    scope: 'project',
    supportsSymlinks: false,
    resolveProjectSkillsDir(projectRoot) {
      return path.join(projectRoot, '.synthetic-agent', 'skills');
    },
  };
  const adapterRegistry = createAdapterRegistry([syntheticHost]);

  const plan = await planSkill({ target, name: 'specflow', adapterRegistry });
  assert.equal(plan.host, 'synthetic-host');
  assert.equal(plan.target, '.synthetic-agent/skills/specflow');
  assert.equal((await installSkill({ target, name: 'specflow', adapterRegistry })).status, 'installed');
  assert.equal((await doctorProject(target, { adapterRegistry })).status, 'pass');
  assert.equal((await doctorProject(target)).ok, false);
});

test('Integration Manifest 对重复、未知和越界 Adapter 保持明确边界', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  const manifestPath = path.join(target, 'agent-foundation.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  manifest.integrations.push({
    capability: 'work-item',
    adapterId: 'synthetic-tracker',
    configRef: 'env://SYNTHETIC_TRACKER_CONFIG',
  });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const warningDoctor = await doctorProject(target);
  assert.equal(warningDoctor.ok, true);
  assert.equal(warningDoctor.status, 'warn');
  assert.ok(warningDoctor.warnings.some((warning) => warning.code === 'adapter-unavailable'));

  manifest.integrations.push({ ...manifest.integrations[0] });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.ok((await doctorProject(target)).errors.some((error) => error.code === 'duplicate-integration'));

  manifest.integrations = [manifest.integrations[0]];
  manifest.integrations[0].configRef = 'inline-secret-like-value';
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.ok((await doctorProject(target)).errors.some((error) => error.code === 'invalid-integration'));

  manifest.integrations[0].configRef = null;
  manifest.context.totalFullTextBytes = 100;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.ok((await doctorProject(target)).errors.some((error) => error.code === 'invalid-manifest-context'));

  manifest.context.totalFullTextBytes = 65536;
  manifest.safety.followSymlinks = true;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.ok((await doctorProject(target)).errors.some((error) => error.code === 'invalid-manifest-safety'));

  manifest.safety.followSymlinks = false;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const escapingRegistry = createAdapterRegistry([
    {
      capability: 'host',
      id: 'open-agent',
      scope: 'project',
      resolveProjectSkillsDir(projectRoot) {
        return path.resolve(projectRoot, '..', 'outside-skills');
      },
    },
  ]);
  await assert.rejects(
    planSkill({ target, name: 'specflow', adapterRegistry: escapingRegistry }),
    (error) => error instanceof FoundationError && error.code === 'unsafe-path',
  );
  assert.ok(
    (await doctorProject(target, { adapterRegistry: escapingRegistry })).errors.some(
      (error) => error.code === 'unsafe-path',
    ),
  );
  assert.throws(
    () => createAdapterRegistry([{ capability: 'host', id: 'same' }, { capability: 'host', id: 'same' }]),
    /重复注册/u,
  );
});

async function readdirNames(directory) {
  const { readdir } = await import('node:fs/promises');
  return (await readdir(directory)).sort();
}
