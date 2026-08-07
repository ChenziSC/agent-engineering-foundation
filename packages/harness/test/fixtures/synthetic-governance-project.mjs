import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { initProject } from '../../src/harness.mjs';
import {
  computeReceiptPayloadDigest,
  parseYamlSubset,
  stringifyYamlSubset,
} from '../../../../skills/specflow/scripts/archive-receipt.mjs';

export const SYNTHETIC_SCALE_PROFILES = Object.freeze({
  small: Object.freeze({ historicalSpecs: 10, activeSpecs: 3, knowledge: 5, routes: 10, ruleDepth: 1 }),
  mature: Object.freeze({ historicalSpecs: 100, activeSpecs: 3, knowledge: 30, routes: 100, ruleDepth: 3 }),
  large: Object.freeze({ historicalSpecs: 1000, activeSpecs: 3, knowledge: 200, routes: 500, ruleDepth: 6 }),
});

const ARTIFACT_CONTENT = Object.freeze({
  spec: '# Spec\n\n## AC-001 合成完成条件\n',
  plan: '# Plan\n\n- 使用完全合成的治理数据。\n',
  tasks: '# Tasks\n\n- [x] T-01 完成\n',
  'validation-report': '# Validation Report\n\n- 结果：pass\n',
});

function sha256(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function fixedWidth(value, width = 4) {
  return String(value).padStart(width, '0');
}

function relationSnapshot() {
  return { parent: null, children: [], supersedes: [], superseded_by: null };
}

function artifactMetadata() {
  return [
    { role: 'spec', path: './spec.md', digest: sha256(ARTIFACT_CONTENT.spec) },
    { role: 'plan', path: './plan.md', digest: sha256(ARTIFACT_CONTENT.plan) },
    { role: 'tasks', path: './tasks.md', digest: sha256(ARTIFACT_CONTENT.tasks) },
    { role: 'validation-report', path: './validation-report.md', digest: sha256(ARTIFACT_CONTENT['validation-report']) },
  ];
}

function historicalMeta(id, scope) {
  return {
    id,
    title: `合成历史事项 ${id}`,
    status: 'archived',
    created_at: '2026-01-01',
    updated_at: '2026-01-02',
    scope: [scope],
    relations: relationSnapshot(),
    artifacts: {
      spec: './spec.md',
      plan: './plan.md',
      tasks: './tasks.md',
      research: null,
      validation_report: './validation-report.md',
      archive_receipt: './archive-receipt.yaml',
      lifecycle_dir: './lifecycle',
    },
    freshness: { status: 'current', last_reviewed_at: '2026-01-02', refresh_triggers: [] },
    active_context: { summary: '已归档的合成历史事项', next_task_id: null },
    authorization: { terminal_transition_confirmed: true },
  };
}

function archiveReceipt(id) {
  const placeholder = `sha256:${'0'.repeat(64)}`;
  const receipt = {
    schema_version: 1,
    receipt_id: `${id}:first-terminal`,
    spec_id: id,
    created_at: '2026-01-02T00:00:00Z',
    transition: { from: 'in-progress', to: 'archived' },
    authorization: {
      confirmed: true,
      confirmed_at: '2026-01-02T00:00:00Z',
      authority: 'synthetic-test',
      evidence_ref: 'test:synthetic-scale-fixture',
    },
    snapshot: {
      source_revision: 'synthetic-source',
      base_revision: 'synthetic-base',
      change: { algorithm: 'sha256', scope: 'none', digest: placeholder, excludes: [] },
      artifacts: artifactMetadata(),
    },
    validation: {
      result: 'pass',
      completed_conditions: ['AC-001'],
      unresolved_blockers: [],
      evidence_refs: ['test:synthetic-scale-fixture'],
    },
    knowledge_projection: { impact: 'none', reason: '合成历史事项不产生长期知识', decisions: [] },
    relations_snapshot: relationSnapshot(),
    integrity: { algorithm: 'sha256', canonicalization: 'canonical-json-v1', payload_digest: placeholder },
  };
  receipt.integrity.payload_digest = computeReceiptPayloadDigest(receipt);
  return receipt;
}

function activeMeta(id, scope) {
  return {
    id,
    title: `合成 Active 事项 ${id}`,
    status: 'in-progress',
    created_at: '2026-08-07',
    updated_at: '2026-08-07',
    scope: [scope],
    relations: relationSnapshot(),
    artifacts: {
      spec: './spec.md',
      plan: './plan.md',
      tasks: './tasks.md',
      research: null,
      validation_report: './validation-report.md',
      archive_receipt: null,
      lifecycle_dir: './lifecycle',
    },
    freshness: { status: 'current', last_reviewed_at: '2026-08-07', refresh_triggers: [] },
    active_context: { summary: '规模回归中的合成 Active 事项', next_task_id: 'T-01' },
    authorization: { terminal_transition_confirmed: false },
  };
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeYaml(filePath, value) {
  await writeFile(filePath, stringifyYamlSubset(value));
}

async function writeHistoricalSpec(specsRoot, index, scope) {
  const id = `historical-${fixedWidth(index, 5)}`;
  const directory = path.join(specsRoot, id);
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeYaml(path.join(directory, 'meta.yaml'), historicalMeta(id, scope)),
    writeYaml(path.join(directory, 'archive-receipt.yaml'), archiveReceipt(id)),
    ...Object.entries(ARTIFACT_CONTENT).map(([name, content]) => writeFile(path.join(directory, `${name}.md`), content)),
  ]);
  return id;
}

async function writeActiveSpec(specsRoot, index, scope) {
  const id = `active-${fixedWidth(index, 2)}`;
  const directory = path.join(specsRoot, id);
  const bodyBytes = [128, 2048, 4096][index - 1] || 128;
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeYaml(path.join(directory, 'meta.yaml'), activeMeta(id, scope)),
    writeFile(path.join(directory, 'spec.md'), `# ${id}\n\n## AC-${fixedWidth(index, 3)} 合成条件\n\n${'x'.repeat(bodyBytes)}\n`),
    writeFile(path.join(directory, 'plan.md'), '# Plan\n'),
    writeFile(path.join(directory, 'tasks.md'), '# Tasks\n\n- [ ] T-01\n'),
    writeFile(path.join(directory, 'validation-report.md'), '# Validation Report\n'),
  ]);
  return id;
}

async function inBatches(total, size, operation) {
  const values = [];
  for (let start = 1; start <= total; start += size) {
    const batch = [];
    for (let index = start; index < Math.min(start + size, total + 1); index += 1) batch.push(operation(index));
    values.push(...(await Promise.all(batch)));
  }
  return values;
}

function validateProfile(profile) {
  for (const key of ['historicalSpecs', 'activeSpecs', 'knowledge', 'routes', 'ruleDepth']) {
    if (!Number.isInteger(profile[key]) || profile[key] < 0) throw new TypeError(`profile.${key} 必须是非负整数`);
  }
  if (profile.activeSpecs > 3) throw new RangeError('合成规模夹具不允许超过 3 个 Active Spec');
  if (profile.ruleDepth < 1) throw new RangeError('合成规模夹具至少需要 1 层规则');
}

export async function createSyntheticGovernanceProject(target, profile) {
  validateProfile(profile);
  await initProject(target);
  const manifestPath = path.join(target, 'agent-foundation.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.context.perSpecFullTextBytes = 1024;
  manifest.context.totalFullTextBytes = 1400;
  manifest.context.maxIndexEntriesPerArtifact = 32;
  await writeJson(manifestPath, manifest);

  const rulePaths = ['AGENTS.md'];
  let modulePath = 'src';
  await mkdir(path.join(target, modulePath), { recursive: true });
  await writeFile(path.join(target, 'AGENTS.md'), '# Root synthetic rules\n\n- 只处理合成数据。\n');
  for (let depth = 2; depth <= profile.ruleDepth; depth += 1) {
    modulePath = path.posix.join(modulePath, `level-${fixedWidth(depth, 2)}`);
    await mkdir(path.join(target, modulePath), { recursive: true });
    const rulePath = path.posix.join(modulePath, 'AGENTS.md');
    rulePaths.push(rulePath);
    await writeFile(path.join(target, rulePath), `# Synthetic rules ${depth}\n\n- 规则层级 ${depth}。\n`);
  }
  const entryPath = path.posix.join(modulePath, 'entry.mjs');
  const excludedPath = path.posix.join(modulePath, 'generated');
  await mkdir(path.join(target, excludedPath), { recursive: true });
  await writeFile(path.join(target, entryPath), 'export const syntheticScale = true;\n');

  const sourceContent = await readFile(path.join(target, 'AGENTS.md'));
  const sourceDigest = sha256(sourceContent);
  const knowledgeEntries = [];
  for (let index = 1; index <= profile.knowledge; index += 1) {
    const id = `knowledge-${fixedWidth(index)}`;
    const documentName = `${id}.md`;
    await writeFile(path.join(target, 'knowledge', documentName), `# ${id}\n\n完全合成的长期知识。\n`);
    knowledgeEntries.push({
      id,
      title: `合成知识 ${id}`,
      path: `./${documentName}`,
      status: 'current',
      scope: [modulePath],
      topics: ['synthetic-scale'],
      last_reviewed_at: '2026-08-07',
      authoritative_sources: ['AGENTS.md'],
      source_evidence: [{ path: 'AGENTS.md', digest: sourceDigest }],
      refresh_triggers: ['AGENTS.md 变化'],
      load_when: ['执行规模回归'],
    });
  }
  const routes = Array.from({ length: profile.routes }, (_, offset) => ({
    task_type: `合成任务-${fixedWidth(offset + 1)}`,
    start_paths: [entryPath],
    module_rules: [rulePaths.at(-1)],
    knowledge: profile.knowledge ? [`knowledge-${fixedWidth((offset % profile.knowledge) + 1)}`] : [],
    exclude_by_default: [excludedPath],
  }));
  const registryPath = path.join(target, 'knowledge', 'registry.json');
  const routeMapPath = path.join(target, 'knowledge', 'code-entry-map.json');
  await Promise.all([
    writeJson(registryPath, { schemaVersion: 1, entries: knowledgeEntries }),
    writeJson(routeMapPath, { schemaVersion: 1, entries: routes }),
  ]);

  const specsRoot = path.join(target, 'specs');
  const scope = modulePath;
  const historicalSpecIds = await inBatches(profile.historicalSpecs, 40, (index) =>
    writeHistoricalSpec(specsRoot, index, scope));
  const activeSpecIds = await inBatches(profile.activeSpecs, 3, (index) => writeActiveSpec(specsRoot, index, scope));

  return {
    target,
    profile: { ...profile },
    entryPath,
    excludedPath,
    rulePaths,
    historicalSpecIds,
    activeSpecIds,
    registryPath,
    routeMapPath,
    tailHistoricalMetaPath: path.join(specsRoot, historicalSpecIds.at(-1), 'meta.yaml'),
    tailHistoricalReceiptPath: path.join(specsRoot, historicalSpecIds.at(-1), 'archive-receipt.yaml'),
  };
}

export async function mutateStructuredDocument(filePath, mutate) {
  const original = await readFile(filePath, 'utf8');
  const yaml = /\.ya?ml$/u.test(filePath);
  const value = yaml ? parseYamlSubset(original) : JSON.parse(original);
  mutate(value);
  if (yaml) await writeYaml(filePath, value);
  else await writeJson(filePath, value);
  return async () => writeFile(filePath, original);
}
