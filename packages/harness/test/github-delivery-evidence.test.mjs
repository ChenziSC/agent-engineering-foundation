import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { createAdapterRegistry } from '../../../adapters/registry.mjs';
import {
  DeliveryEvidenceAdapterError,
  inspectGitHubActionsEvidence,
  resolveGitHubRemoteRepository,
} from '../../../adapters/delivery-evidence/github-actions.mjs';
import {
  parseGitRemoteUrl,
  resolveDeliveryEvidenceProvider,
} from '../../../adapters/delivery-evidence/remote-resolver.mjs';
import { checkChangeGate } from '../src/harness.mjs';

const REVISION = 'b'.repeat(40);

function git(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

test('Delivery Evidence 根据 Git Remote 选择已注册的平台 Provider', async () => {
  assert.deepEqual(parseGitRemoteUrl('git@github.com:example/project.git'), {
    host: 'github.com',
    repositoryPath: 'example/project',
  });
  assert.deepEqual(parseGitRemoteUrl('https://github.com/example/project.git'), {
    host: 'github.com',
    repositoryPath: 'example/project',
  });
  assert.equal(resolveGitHubRemoteRepository(parseGitRemoteUrl('ssh://git@gitlab.com/example/project.git')), null);

  const root = await mkdtemp(path.join(os.tmpdir(), 'delivery-provider-resolution-'));
  git(root, ['init']);
  git(root, ['remote', 'add', 'origin', 'git@gitlab.example.test:group/project.git']);
  const registry = createAdapterRegistry([
    {
      capability: 'delivery-evidence',
      id: 'synthetic-gitlab',
      resolveRemoteRepository(remote) {
        return remote.host === 'gitlab.example.test' ? remote.repositoryPath : null;
      },
    },
  ]);
  assert.deepEqual(resolveDeliveryEvidenceProvider({ projectRoot: root, adapterRegistry: registry }), {
    provider: 'synthetic-gitlab',
    repository: 'group/project',
    remoteName: 'origin',
  });

  git(root, ['remote', 'set-url', 'origin', 'git@unknown.example.test:group/project.git']);
  assert.throws(
    () => resolveDeliveryEvidenceProvider({ projectRoot: root, adapterRegistry: registry }),
    (error) => error.code === 'delivery-evidence-platform-unsupported' && !error.message.includes('unknown.example.test'),
  );

  git(root, ['remote', 'set-url', 'origin', 'git@gitlab.example.test:group/project.git']);
  const ambiguousRegistry = createAdapterRegistry([
    ...registry.list(),
    {
      capability: 'delivery-evidence',
      id: 'synthetic-mirror',
      resolveRemoteRepository(remote) {
        return remote.host === 'gitlab.example.test' ? remote.repositoryPath : null;
      },
    },
  ]);
  assert.throws(
    () => resolveDeliveryEvidenceProvider({ projectRoot: root, adapterRegistry: ambiguousRegistry }),
    (error) => error.code === 'delivery-evidence-platform-ambiguous',
  );

  git(root, ['remote', 'rename', 'origin', 'upstream']);
  git(root, ['remote', 'add', 'mirror', 'git@gitlab.example.test:group/project.git']);
  assert.throws(
    () => resolveDeliveryEvidenceProvider({ projectRoot: root, adapterRegistry: registry }),
    (error) => error.code === 'delivery-evidence-remote-ambiguous',
  );
  assert.equal(
    resolveDeliveryEvidenceProvider({ projectRoot: root, adapterRegistry: registry, remoteName: 'upstream' }).provider,
    'synthetic-gitlab',
  );
});

function checkRun(overrides = {}) {
  return {
    id: 101,
    name: 'verify',
    head_sha: REVISION,
    status: 'completed',
    conclusion: 'success',
    details_url: 'https://github.example.invalid/actions/runs/1',
    app: { slug: 'github-actions' },
    check_suite: { id: 201 },
    ...overrides,
  };
}

function workflowRun(overrides = {}) {
  return {
    id: 301,
    check_suite_id: 201,
    path: '.github/workflows/quality.yml',
    head_sha: REVISION,
    status: 'completed',
    conclusion: 'success',
    ...overrides,
  };
}

test('GitHub Actions Evidence 精确匹配 App 与 Check 并只返回规范化字段', async () => {
  let requestedUrl;
  let receivedToken;
  const result = await inspectGitHubActionsEvidence({
    repository: 'example/project',
    revision: REVISION,
    requiredChecks: ['github-actions/verify@.github/workflows/quality.yml'],
    token: 'synthetic-token',
    request: async (url, { token }) => {
      requestedUrl = url;
      receivedToken = token;
      if (url.includes('/actions/runs?')) return { total_count: 1, workflow_runs: [workflowRun()] };
      return { total_count: 1, check_runs: [checkRun()] };
    },
  });

  assert.equal(receivedToken, 'synthetic-token');
  assert.ok(requestedUrl.includes(`/commits/${REVISION}/check-runs?`));
  assert.ok(requestedUrl.includes('check_name=verify'));
  assert.doesNotMatch(requestedUrl, /synthetic-token/u);
  assert.deepEqual(result, {
    schemaVersion: 1,
    capability: 'delivery-evidence',
    provider: 'github-actions',
    repository: 'example/project',
    revision: REVISION,
    checks: [
      {
        id: '101',
        name: 'verify',
        app: 'github-actions',
        status: 'completed',
        conclusion: 'success',
        workflowPath: '.github/workflows/quality.yml',
        workflowRunId: '301',
        detailsUrl: 'https://github.example.invalid/actions/runs/1',
      },
    ],
  });
});

test('GitHub Actions Evidence 对缺失、错误 App、歧义、未完成和非成功 Check 失败关闭', async () => {
  const cases = [
    { code: 'github-delivery-check-missing', payload: { total_count: 0, check_runs: [] } },
    {
      code: 'github-delivery-check-app-mismatch',
      payload: { total_count: 1, check_runs: [checkRun({ app: { slug: 'other-app' } })] },
    },
    {
      code: 'github-delivery-check-ambiguous',
      payload: { total_count: 2, check_runs: [checkRun({ id: 1 }), checkRun({ id: 2 })] },
    },
    {
      code: 'github-delivery-check-incomplete',
      payload: { total_count: 1, check_runs: [checkRun({ status: 'in_progress', conclusion: null })] },
    },
    {
      code: 'github-delivery-check-unsuccessful',
      payload: { total_count: 1, check_runs: [checkRun({ conclusion: 'failure' })] },
    },
    {
      code: 'github-delivery-check-revision-mismatch',
      payload: { total_count: 1, check_runs: [checkRun({ head_sha: 'e'.repeat(40) })] },
    },
    {
      code: 'github-delivery-check-truncated',
      payload: { total_count: 2, check_runs: [checkRun()] },
    },
  ];

  for (const { code, payload } of cases) {
    await assert.rejects(
      inspectGitHubActionsEvidence({
        repository: 'example/project',
        revision: REVISION,
        requiredChecks: ['github-actions/verify@.github/workflows/quality.yml'],
        request: async (url) =>
          url.includes('/actions/runs?') ? { total_count: 1, workflow_runs: [workflowRun()] } : payload,
      }),
      (error) => error instanceof DeliveryEvidenceAdapterError && error.code === code,
      code,
    );
  }
});

test('GitHub Actions Evidence 用 Check Suite 绑定精确 Workflow Path 并阻断错误来源', async () => {
  const cases = [
    {
      code: 'github-delivery-workflow-mismatch',
      workflows: [workflowRun({ path: '.github/workflows/untrusted.yml' })],
    },
    {
      code: 'github-delivery-workflow-ambiguous',
      workflows: [workflowRun({ id: 1 }), workflowRun({ id: 2 })],
    },
    {
      code: 'github-delivery-workflow-unsuccessful',
      workflows: [workflowRun({ conclusion: 'failure' })],
    },
  ];
  for (const { code, workflows } of cases) {
    await assert.rejects(
      inspectGitHubActionsEvidence({
        repository: 'example/project',
        revision: REVISION,
        requiredChecks: ['github-actions/verify@.github/workflows/quality.yml'],
        request: async (url) =>
          url.includes('/actions/runs?')
            ? { total_count: workflows.length, workflow_runs: workflows }
            : { total_count: 1, check_runs: [checkRun()] },
      }),
      (error) => error instanceof DeliveryEvidenceAdapterError && error.code === code,
      code,
    );
  }
});

test('GitHub Actions Evidence 对认证失败和无效响应使用稳定错误且不回显响应正文', { concurrency: false }, async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('private response body', { status: 403 });
    await assert.rejects(
      inspectGitHubActionsEvidence({
        repository: 'example/project',
        revision: REVISION,
        requiredChecks: ['github-actions/verify@.github/workflows/quality.yml'],
      }),
      (error) =>
        error instanceof DeliveryEvidenceAdapterError &&
        error.code === 'github-delivery-auth-failed' &&
        !error.message.includes('private response body'),
    );

    globalThis.fetch = async () => new Response('not-json', { status: 200 });
    await assert.rejects(
      inspectGitHubActionsEvidence({
        repository: 'example/project',
        revision: REVISION,
        requiredChecks: ['github-actions/verify@.github/workflows/quality.yml'],
      }),
      (error) => error instanceof DeliveryEvidenceAdapterError && error.code === 'github-delivery-response-invalid',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function syntheticSourceControl() {
  return {
    capability: 'source-control',
    id: 'synthetic-git',
    async inspectMergeCandidate({ baseRevision, sourceRevision, includePaths, excludePaths }) {
      return {
        schemaVersion: 1,
        capability: 'source-control',
        provider: 'synthetic-git',
        scope: 'merge-candidate',
        baseRevision,
        sourceRevision,
        change: {
          algorithm: 'sha256',
          canonicalization: 'source-control-snapshot-v1',
          digest: `sha256:${'1'.repeat(64)}`,
          includes: [...includePaths],
          excludes: [...excludePaths],
        },
        evidence: {
          candidateTreeId: 'c'.repeat(40),
          changedPathCount: 1,
          changes: [{ status: 'M', paths: [{ path: 'docs/guide.md', objectId: 'd'.repeat(40) }] }],
        },
      };
    },
  };
}

test('Change Gate 仅在本地 Delivery Gate 通过后组合同一 Source SHA 的外部 Evidence', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'github-delivery-gate-'));
  git(root, ['init']);
  git(root, ['remote', 'add', 'origin', 'git@github.example.test:example/project.git']);
  let calls = 0;
  const deliveryAdapter = {
    capability: 'delivery-evidence',
    id: 'synthetic-actions',
    resolveRemoteRepository(remote) {
      return remote.host === 'github.example.test' ? remote.repositoryPath : null;
    },
    async inspectDeliveryEvidence({ repository, revision, requiredChecks }) {
      calls += 1;
      return {
        schemaVersion: 1,
        capability: 'delivery-evidence',
        provider: 'synthetic-actions',
        repository,
        revision,
        checks: requiredChecks.map((selector, index) => ({
          id: String(index + 1),
          app: selector.split('/', 1)[0],
          name: selector.slice(selector.indexOf('/') + 1, selector.lastIndexOf('@')),
          status: 'completed',
          conclusion: 'success',
          workflowPath: selector.slice(selector.lastIndexOf('@') + 1),
          workflowRunId: String(index + 10),
          detailsUrl: null,
        })),
      };
    },
  };
  const registry = createAdapterRegistry([syntheticSourceControl(), deliveryAdapter]);
  const passed = await checkChangeGate(root, {
    baseRevision: 'a'.repeat(40),
    sourceRevision: REVISION,
    exemption: 'docs-only',
    phase: 'delivery',
    provider: 'synthetic-git',
    requiredChecks: ['github-actions/verify@.github/workflows/quality.yml'],
    adapterRegistry: registry,
  });
  assert.equal(passed.status, 'pass', JSON.stringify(passed));
  assert.equal(calls, 1);
  assert.equal(passed.evidence.externalDelivery.revision, REVISION);
  assert.equal(passed.evidence.externalDelivery.providerSelection, 'remote');
  assert.equal(passed.evidence.externalDelivery.checks[0].conclusion, 'success');
  assert.match(passed.evidence.gateDigest, /^sha256:[a-f0-9]{64}$/u);

  const localBlocked = await checkChangeGate(root, {
    baseRevision: 'a'.repeat(40),
    sourceRevision: REVISION,
    exemption: 'tests-only',
    phase: 'delivery',
    provider: 'synthetic-git',
    requiredChecks: ['github-actions/verify@.github/workflows/quality.yml'],
    adapterRegistry: registry,
  });
  assert.ok(localBlocked.errors.some((error) => error.code === 'change-gate-exemption-scope-mismatch'));
  assert.equal(calls, 1);

  const wrongPhase = await checkChangeGate(root, {
    baseRevision: 'a'.repeat(40),
    sourceRevision: REVISION,
    exemption: 'docs-only',
    phase: 'work',
    provider: 'synthetic-git',
    requiredChecks: ['github-actions/verify@.github/workflows/quality.yml'],
    adapterRegistry: registry,
  });
  assert.ok(wrongPhase.errors.some((error) => error.code === 'change-gate-delivery-provider-phase'));
  assert.equal(calls, 1);

  const compatible = await checkChangeGate(root, {
    baseRevision: 'a'.repeat(40),
    sourceRevision: REVISION,
    exemption: 'docs-only',
    phase: 'delivery',
    provider: 'synthetic-git',
    adapterRegistry: registry,
  });
  assert.equal(compatible.status, 'pass');
  assert.equal(compatible.evidence.externalDelivery, undefined);
  assert.equal(calls, 1);

  const mismatchedRegistry = createAdapterRegistry([
    syntheticSourceControl(),
    {
      capability: 'delivery-evidence',
      id: 'mismatched-actions',
      async inspectDeliveryEvidence() {
        return {
          schemaVersion: 1,
          capability: 'delivery-evidence',
          provider: 'mismatched-actions',
          repository: 'example/project',
          revision: 'f'.repeat(40),
          checks: [],
        };
      },
    },
  ]);
  const mismatched = await checkChangeGate(root, {
    baseRevision: 'a'.repeat(40),
    sourceRevision: REVISION,
    exemption: 'docs-only',
    phase: 'delivery',
    provider: 'synthetic-git',
    deliveryProvider: 'mismatched-actions',
    repository: 'example/project',
    requiredChecks: ['github-actions/verify@.github/workflows/quality.yml'],
    adapterRegistry: mismatchedRegistry,
  });
  assert.ok(mismatched.errors.some((error) => error.code === 'delivery-evidence-binding-mismatch'));
});
