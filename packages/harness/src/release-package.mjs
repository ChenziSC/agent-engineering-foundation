import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} 执行失败：${result.stderr || result.stdout}`.trim());
  return result.stdout.trim();
}

function assertPackageMetadata(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    typeof value.version !== 'string' ||
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(value.version)
  ) throw new Error('Package 必须声明有效 name 与 SemVer version');
  if (value.private !== false) throw new Error('公开 Package 必须显式声明 private: false');
  if (typeof value.license !== 'string' || !value.license.trim()) {
    throw new Error('公开 Package 必须声明 license');
  }
  const repositoryUrl = typeof value.repository === 'string' ? value.repository : value.repository?.url;
  if (typeof repositoryUrl !== 'string' || !/^git\+https:\/\/|^https:\/\//u.test(repositoryUrl)) {
    throw new Error('公开 Package 必须声明可公开访问的 HTTPS repository');
  }
  if (
    value.publishConfig?.access !== 'public' ||
    value.publishConfig?.registry !== 'https://registry.npmjs.org/' ||
    value.publishConfig?.provenance !== true
  ) {
    throw new Error('公开 Package 必须固定 npmjs.org、public access 与 provenance');
  }
  return value;
}

export async function buildReleasePackage({ target = '.', output } = {}) {
  if (typeof output !== 'string' || !output.trim()) throw new Error('必须提供独立 Release 输出目录');
  const projectRoot = path.resolve(target);
  const outputRoot = path.resolve(output);
  const status = run('git', ['status', '--porcelain=v1', '--untracked-files=all'], projectRoot);
  if (status) throw new Error('Release Package 只能从干净 Git 工作区生成');
  const sourceRevision = run('git', ['rev-parse', 'HEAD'], projectRoot);
  if (!/^[a-f0-9]{40}$/u.test(sourceRevision)) throw new Error('无法解析不可变 Source Revision');
  const packageJson = assertPackageMetadata(JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8')));
  await mkdir(outputRoot, { recursive: true });
  const manifestPath = path.join(outputRoot, 'release-manifest.json');
  try {
    await stat(manifestPath);
    throw new Error('Release Manifest 已存在，拒绝覆盖');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const packOutput = run(
    'npm',
    ['pack', '--ignore-scripts', '--json', '--pack-destination', outputRoot],
    projectRoot,
  );
  const packed = JSON.parse(packOutput);
  if (!Array.isArray(packed) || packed.length !== 1 || typeof packed[0].filename !== 'string') {
    throw new Error('npm pack 没有返回唯一制品');
  }
  const artifactPath = path.join(outputRoot, packed[0].filename);
  const artifact = await readFile(artifactPath);
  const manifest = {
    schemaVersion: 1,
    package: {
      name: packageJson.name,
      version: packageJson.version,
      filename: packed[0].filename,
      bytes: artifact.length,
      sha256: `sha256:${createHash('sha256').update(artifact).digest('hex')}`,
      npmIntegrity: packed[0].integrity,
      npmShasum: packed[0].shasum,
      registry: packageJson.publishConfig.registry,
      access: packageJson.publishConfig.access,
    },
    source: {
      revision: sourceRevision,
    },
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
  return { artifactPath, manifestPath, manifest };
}
