import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { FoundationError as PublicFoundationError } from '../src/harness.mjs';
import { FoundationError } from '../src/shared/errors.mjs';
import {
  assertNoSymlinkSegments,
  digestFiles,
  digestTree,
  relativeInside,
} from '../src/shared/filesystem.mjs';
import {
  parseSupportedYaml,
  readStructuredDocument,
  serializeStructuredDocument,
  validateYamlSubset,
} from '../src/shared/structured-document.mjs';

test('Harness 聚合入口复用唯一 FoundationError 实现', () => {
  assert.equal(PublicFoundationError, FoundationError);
  const error = new PublicFoundationError('synthetic-error', '合成错误', { source: 'test' });
  assert.ok(error instanceof FoundationError);
  assert.equal(error.code, 'synthetic-error');
});

test('共享模块保持向下依赖，不反向导入 Harness 或领域目录', async () => {
  for (const name of ['errors.mjs', 'filesystem.mjs', 'structured-document.mjs']) {
    const source = await readFile(new URL(`../src/shared/${name}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /(?:harness\.mjs|adapters\/|frameworks\/|skills\/)/u, name);
  }
});

test('共享文件模块保持路径边界、Symlink 阻断和稳定摘要', async (t) => {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'agent-foundation-shared-fs-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'nested'));
  await writeFile(path.join(root, 'a.txt'), 'a\n');
  await writeFile(path.join(root, 'nested', 'b.txt'), 'b\n');

  assert.equal(relativeInside(root, path.join(root, 'nested', 'b.txt')), path.join('nested', 'b.txt'));
  assert.throws(() => relativeInside(root, path.dirname(root)), { code: 'unsafe-path' });
  assert.equal(
    await digestTree(root),
    await digestFiles(root, ['a.txt', path.join('nested', 'b.txt')]),
  );

  await symlink(path.join(root, 'a.txt'), path.join(root, 'nested', 'link.txt'));
  await assert.rejects(assertNoSymlinkSegments(root, path.join(root, 'nested', 'link.txt')), { code: 'unsafe-symlink' });
  await assert.rejects(digestTree(root), { code: 'unsafe-symlink' });
});

test('共享结构化文档模块保持 JSON/YAML 子集解析、序列化和错误码', async (t) => {
  const root = await realpath(await mkdtemp(path.join(os.tmpdir(), 'agent-foundation-shared-doc-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const value = {
    version: 1,
    enabled: true,
    entries: [{ id: 'alpha', paths: ['src/alpha'], optional: null }],
  };
  const yamlPath = path.join(root, 'contract.yaml');
  const jsonPath = path.join(root, 'contract.json');
  const yaml = serializeStructuredDocument(yamlPath, value);
  await writeFile(yamlPath, yaml);
  await writeFile(jsonPath, serializeStructuredDocument(jsonPath, value));

  assert.deepEqual(parseSupportedYaml(yaml), value);
  assert.deepEqual(await readStructuredDocument(yamlPath, '合成 YAML'), value);
  assert.deepEqual(await readStructuredDocument(jsonPath, '合成 JSON'), value);
  assert.deepEqual(validateYamlSubset(yaml), []);
  assert.throws(() => parseSupportedYaml('root:\n   child: true\n'), { code: 'invalid-yaml' });
});
