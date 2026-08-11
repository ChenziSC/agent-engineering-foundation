import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { decideRegistryAction } from '../../../.github/scripts/publish-npm-release.mjs';
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

test('手动 npm Workflow 只从已存在 Tag 发布公共 Registry 的不可变制品', async () => {
  const workflow = await readFile(path.resolve('.github/workflows/release.yml'), 'utf8');
  const publisher = await readFile(path.resolve('.github/scripts/publish-npm-release.mjs'), 'utf8');
  assert.match(workflow, /workflow_dispatch:/u);
  assert.match(workflow, /contents: read/u);
  assert.match(workflow, /id-token: write/u);
  assert.match(workflow, /npm run release:pack/u);
  assert.match(workflow, /registry-url: "https:\/\/registry\.npmjs\.org\/"/u);
  assert.match(workflow, /node \.github\/scripts\/publish-npm-release\.mjs/u);
  assert.match(workflow, /secrets\.NPM_TOKEN/u);
  assert.doesNotMatch(workflow, /gh release|contents: write/u);
  assert.match(publisher, /git', \['describe', '--tags', '--exact-match', 'HEAD'\]/u);
  assert.match(publisher, /\['publish', artifact, '--access', 'public', '--provenance'/u);
  assert.match(publisher, /\['view', packageSpec, 'dist\.integrity'/u);
  assert.equal(decideRegistryAction(null, 'sha512-candidate'), 'publish');
  assert.equal(decideRegistryAction('sha512-candidate', 'sha512-candidate'), 'skip');
  assert.throws(
    () => decideRegistryAction('sha512-existing', 'sha512-candidate'),
    /integrity 与候选制品不一致/u,
  );
});

test('公共包元数据与 Agent 安装入口固定当前版本和 npmjs.org', async () => {
  const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'));
  const install = await readFile(path.resolve('Install.md'), 'utf8');
  const readme = await readFile(path.resolve('README.md'), 'utf8');
  assert.equal(packageJson.private, false);
  assert.equal(packageJson.license, 'Apache-2.0');
  assert.equal(packageJson.publishConfig.access, 'public');
  assert.equal(packageJson.publishConfig.registry, 'https://registry.npmjs.org/');
  assert.equal(packageJson.publishConfig.provenance, true);
  assert.ok(packageJson.files.includes('Install.md'));
  for (const content of [install, readme]) {
    assert.match(content, new RegExp(`agent-engineering-foundation@${packageJson.version.replaceAll('.', '\\.')}`, 'u'));
    assert.doesNotMatch(content, /agent-engineering-foundation@latest/u);
  }
  assert.match(install, /不自动执行 Stage、Commit、Push、Tag、PR\/MR、CI 修改、部署或发布/u);
  assert.match(install, /distribution verify/u);
  assert.match(install, /upgrade plan/u);
  assert.match(install, /upgrade apply/u);
  assert.match(readme, /upgrade plan/u);
  assert.match(install, /安装一致、项目语义、Host 发现和外部 Adapter 分开验证/u);
});
