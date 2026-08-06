import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'node:test';
import { checkComponentRegistry } from '../scripts/validate-registry.mjs';

const roots = [];
afterEach(async () => { while (roots.length) await rm(roots.pop(), { recursive: true, force: true }); });

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'component-governance-'));
  roots.push(root);
  await mkdir(path.join(root, '.component-governance'), { recursive: true });
  await mkdir(path.join(root, 'packages/ui/src/standard/AsyncTable'), { recursive: true });
  await writeFile(path.join(root, 'packages/ui/src/standard/AsyncTable/AsyncTable.md'), '# Contract\n');
  await writeFile(path.join(root, 'packages/ui/src/index.ts'), 'export { AsyncTable } from "./standard/AsyncTable";\n');
  await writeFile(path.join(root, '.component-governance/config.yaml'), `version: 1\nregistry: .component-governance/registry.yaml\nsources:\n  - id: project-ui\n    roots:\n      - packages/ui/src\n    default_level: project-shared\nstandard:\n  roots:\n    - packages/ui/src/standard\n  contract_pattern: <component-dir>/<component-name>.md\n  stable_entries:\n    - packages/ui/src/index.ts\ndeep_imports:\n  forbidden:\n    - "@example/ui/src/**"\nvalidation:\n  require_registry_entry: true\n  require_contract_for_levels:\n    - project-standard\n  require_public_entry_for_levels:\n    - project-shared\n    - project-standard\n  deprecation_requires_replacement: true\n  test_policy: risk-based\n`);
  await writeFile(path.join(root, '.component-governance/registry.yaml'), `version: 1\ncomponents:\n  - id: async-table\n    display_name: AsyncTable\n    purpose: 展示异步列表\n    location: packages/ui/src/standard/AsyncTable\n    source: project-ui\n    level: project-standard\n    status: active\n    keywords:\n      - table\n    contract: packages/ui/src/standard/AsyncTable/AsyncTable.md\n    public_entry: "@example/ui"\n    replacement: null\n    alternatives: []\n    known_consumers: []\n    validation:\n      - behavior-test\n`);
  return root;
}

test('Component Registry Validator 校验标准目录、Contract 与稳定入口', async () => {
  const root = await fixture();
  const result = await checkComponentRegistry(root);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.ok(result.checks.some((item) => item.code === 'component-registry-entry'));
});

test('Component Registry Validator 阻断未登记标准组件和深路径导入', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'packages/ui/src/standard/Hidden'));
  await mkdir(path.join(root, 'apps/demo'), { recursive: true });
  await writeFile(path.join(root, 'apps/demo/index.ts'), 'import x from "@example/ui/src/internal";\n');
  const result = await checkComponentRegistry(root);
  assert.ok(result.errors.some((item) => item.code === 'standard-component-unregistered'));
  assert.ok(result.errors.some((item) => item.code === 'forbidden-deep-import'));
});

test('Component Registry Validator 阻断缺少替代项的 deprecated 组件', async () => {
  const root = await fixture();
  const registryPath = path.join(root, '.component-governance/registry.yaml');
  const current = await import('node:fs/promises').then(({ readFile }) => readFile(registryPath, 'utf8'));
  await writeFile(registryPath, current.replace('status: active', 'status: deprecated'));
  const result = await checkComponentRegistry(root);
  assert.ok(result.errors.some((item) => item.code === 'component-replacement-missing'));
});

test('Component Registry Validator 检查静态导出、消费者登记与兼容基线', async () => {
  const root = await fixture();
  const { readFile } = await import('node:fs/promises');
  const configPath = path.join(root, '.component-governance/config.yaml');
  await writeFile(configPath, `${await readFile(configPath, 'utf8')}language_analysis:\n  enabled: true\n  languages:\n    - javascript-typescript\n  consumer_roots:\n    - apps\n  compatibility_baseline: .component-governance/public-exports.baseline.json\n`);
  const registryPath = path.join(root, '.component-governance/registry.yaml');
  await writeFile(registryPath, (await readFile(registryPath, 'utf8')).replace('known_consumers: []', 'known_consumers:\n      - apps/demo').replace('    validation:\n      - behavior-test', '    validation:\n      - behavior-test\n    exports:\n      - AsyncTable'));
  await writeFile(path.join(root, '.component-governance/public-exports.baseline.json'), '{"version":1,"exports":["AsyncTable"]}\n');
  await mkdir(path.join(root, 'apps/demo'), { recursive: true });
  await writeFile(path.join(root, 'apps/demo/page.ts'), 'import { AsyncTable } from "@example/ui";\n');
  const valid = await checkComponentRegistry(root);
  assert.equal(valid.ok, true, JSON.stringify(valid.errors));
  assert.ok(valid.checks.some((item) => item.code === 'component-language-analysis'));

  await writeFile(path.join(root, 'packages/ui/src/index.ts'), 'export { OtherTable } from "./other";\n');
  const broken = await checkComponentRegistry(root);
  assert.ok(broken.errors.some((item) => item.code === 'component-export-not-public'));
  assert.ok(broken.errors.some((item) => item.code === 'component-breaking-export-removed'));
});

test('Component Registry Validator 阻断公共入口深路径与未登记消费者', async () => {
  const root = await fixture();
  const { readFile } = await import('node:fs/promises');
  const configPath = path.join(root, '.component-governance/config.yaml');
  await writeFile(configPath, `${await readFile(configPath, 'utf8')}language_analysis:\n  enabled: true\n  languages:\n    - javascript-typescript\n  consumer_roots:\n    - apps\n  compatibility_baseline: null\n`);
  const registryPath = path.join(root, '.component-governance/registry.yaml');
  await writeFile(registryPath, (await readFile(registryPath, 'utf8')).replace('    validation:\n      - behavior-test', '    validation:\n      - behavior-test\n    exports:\n      - AsyncTable'));
  await mkdir(path.join(root, 'apps/unknown'), { recursive: true });
  await writeFile(path.join(root, 'apps/unknown/page.ts'), 'import { AsyncTable } from "@example/ui";\nimport Internal from "@example/ui/internal";\n');
  const result = await checkComponentRegistry(root);
  assert.ok(result.errors.some((item) => item.code === 'component-consumer-unregistered'));
  assert.ok(result.errors.some((item) => item.code === 'component-public-deep-import'));
});
