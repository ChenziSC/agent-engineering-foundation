import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { buildReleasePackage } from '../src/release-package.mjs';

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
}

test('Release Packager 只从干净 Commit 生成绑定 Source SHA 的包与摘要', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'foundation-release-test-'));
  const output = await mkdtemp(path.join(os.tmpdir(), 'foundation-release-output-'));
  try {
    await writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'synthetic-foundation', version: '1.2.3', files: ['index.mjs'] }));
    await writeFile(path.join(root, 'index.mjs'), 'export const value = 1;\n');
    git(root, ['init']);
    git(root, ['config', 'user.name', 'Synthetic Tester']);
    git(root, ['config', 'user.email', 'synthetic@example.invalid']);
    git(root, ['add', '.']);
    git(root, ['commit', '-m', 'baseline']);

    const built = await buildReleasePackage({ target: root, output });
    const manifest = JSON.parse(await readFile(built.manifestPath, 'utf8'));
    assert.equal(manifest.package.name, 'synthetic-foundation');
    assert.equal(manifest.package.version, '1.2.3');
    assert.match(manifest.package.sha256, /^sha256:[a-f0-9]{64}$/u);
    assert.match(manifest.package.npmIntegrity, /^sha512-/u);
    assert.match(manifest.source.revision, /^[a-f0-9]{40}$/u);
    await assert.rejects(buildReleasePackage({ target: root, output }), /Release Manifest 已存在/u);

    await writeFile(path.join(root, 'index.mjs'), 'export const value = 2;\n');
    await assert.rejects(buildReleasePackage({ target: root, output: `${output}-dirty` }), /干净 Git 工作区/u);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(output, { recursive: true, force: true });
  }
});
