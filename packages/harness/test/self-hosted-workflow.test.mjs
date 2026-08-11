import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { parsePullRequestAssociation } from '../../../.github/scripts/run-delivery-gate.mjs';

test('GitHub PR 严格选择 Spec 集合或既有 Exemption', () => {
  assert.deepEqual(
    parsePullRequestAssociation('说明\nSpec-IDs: beta-spec,alpha-spec\n更多说明'),
    { mode: 'spec', specIds: ['alpha-spec', 'beta-spec'] },
  );
  assert.deepEqual(
    parsePullRequestAssociation('说明\nSpec-Exemption: docs-only'),
    { mode: 'exemption', exemption: 'docs-only' },
  );
  assert.throws(() => parsePullRequestAssociation('没有事项声明'), /必须且只能声明一行/u);
  assert.throws(() => parsePullRequestAssociation('Spec-IDs: one\nSpec-IDs: two'), /必须且只能声明一行/u);
  assert.throws(() => parsePullRequestAssociation('Spec-IDs: one\nSpec-Exemption: docs-only'), /必须且只能声明一行/u);
  assert.throws(() => parsePullRequestAssociation('Spec-IDs: one,two,three,four'), /1～3/u);
  assert.throws(() => parsePullRequestAssociation('Spec-IDs: valid,../invalid'), /无效事项标识/u);
});

test('本仓真实 Workflow 串联 Continuous 与同 SHA Delivery Gate', async () => {
  const workflow = await readFile(path.resolve('.github/workflows/quality.yml'), 'utf8');
  for (const command of [
    'npm test',
    'npm run test:scale',
    'npm run check',
    'agent-foundation.mjs doctor --target .',
    'agent-foundation.mjs distribution verify --target .',
    'agent-foundation.mjs knowledge check --target .',
    'agent-foundation.mjs specflow check --target .',
    'node .github/scripts/run-delivery-gate.mjs',
  ]) assert.ok(workflow.includes(command), command);
  assert.match(workflow, /delivery:\s*\n\s+if: github\.event_name == 'pull_request'\s*\n\s+needs: verify/u);
  assert.match(workflow, /push:\s*\n\s+branches:\s*\n\s+- main/u);
  assert.match(workflow, /name: 确认门禁没有改写项目\s*\n\s+if: always\(\)/u);
  assert.match(workflow, /checks: read/u);
  assert.match(workflow, /actions: read/u);
  assert.match(workflow, /SOURCE_SHA: "\$\{\{ github\.event\.pull_request\.head\.sha \}\}"/u);
  assert.match(workflow, /REQUIRED_CHECK: "github-actions\/verify@\.github\/workflows\/quality\.yml"/u);
  assert.doesNotMatch(workflow, /--delivery-provider|--repository/u);
});

test('手动 Release Workflow 只发布已存在 Tag 的干净不可变制品', async () => {
  const workflow = await readFile(path.resolve('.github/workflows/release.yml'), 'utf8');
  assert.match(workflow, /workflow_dispatch:/u);
  assert.match(workflow, /contents: write/u);
  assert.match(workflow, /git describe --tags --exact-match HEAD/u);
  assert.match(workflow, /npm run release:pack/u);
  assert.match(workflow, /gh release create/u);
  assert.match(workflow, /--verify-tag/u);
  assert.doesNotMatch(workflow, /npm publish/u);
});
