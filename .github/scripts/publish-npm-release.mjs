import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const PUBLIC_REGISTRY = 'https://registry.npmjs.org/';

function run(command, args, { allowNotFound = false, inherit = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    stdio: inherit ? 'inherit' : 'pipe',
  });
  if (result.error) throw result.error;
  if (result.status === 0) return inherit ? '' : result.stdout.trim();
  const output = `${result.stderr || ''}\n${result.stdout || ''}`;
  if (allowNotFound && /E404|404 Not Found/u.test(output)) return null;
  throw new Error(`${command} 执行失败（退出码 ${result.status ?? 'unknown'}）`);
}

function requiredOption(args, name) {
  const index = args.indexOf(name);
  const value = index >= 0 ? args[index + 1] : undefined;
  if (typeof value !== 'string' || !value.trim() || value.startsWith('--')) throw new Error(`缺少 ${name}`);
  return value.trim();
}

export function decideRegistryAction(existingIntegrity, expectedIntegrity) {
  if (typeof expectedIntegrity !== 'string' || !expectedIntegrity.startsWith('sha512-')) {
    throw new Error('Release Manifest 缺少有效 npm integrity');
  }
  if (existingIntegrity === null) return 'publish';
  if (existingIntegrity === expectedIntegrity) return 'skip';
  throw new Error('npmjs.org 已存在同名同版本，但 integrity 与候选制品不一致');
}

function assertManifest(manifest, packageJson, releaseRoot, sourceRevision) {
  if (
    manifest?.schemaVersion !== 1 ||
    manifest?.package?.name !== packageJson.name ||
    manifest?.package?.version !== packageJson.version ||
    manifest?.package?.registry !== PUBLIC_REGISTRY ||
    manifest?.package?.access !== 'public' ||
    manifest?.source?.revision !== sourceRevision
  ) throw new Error('Release Manifest 与当前公共包候选不一致');
  const artifact = path.resolve(releaseRoot, manifest.package.filename || '');
  if (path.dirname(artifact) !== releaseRoot || !artifact.endsWith('.tgz')) {
    throw new Error('Release Manifest 的制品路径无效');
  }
  return artifact;
}

export async function publishNpmRelease({ tag, releaseDir }) {
  const packageJson = JSON.parse(await readFile(path.resolve('package.json'), 'utf8'));
  if (
    packageJson.private !== false ||
    packageJson.publishConfig?.registry !== PUBLIC_REGISTRY ||
    packageJson.publishConfig?.access !== 'public' ||
    packageJson.publishConfig?.provenance !== true
  ) throw new Error('package.json 未固定公共 npmjs.org、public access 与 provenance');
  if (tag !== `v${packageJson.version}`) throw new Error('Tag 必须与 package.json 版本一致');
  const exactTag = run('git', ['describe', '--tags', '--exact-match', 'HEAD']);
  if (exactTag !== tag) throw new Error('当前 Commit 没有匹配的已授权 Tag');
  const sourceRevision = run('git', ['rev-parse', 'HEAD']);
  const releaseRoot = path.resolve(releaseDir);
  const manifest = JSON.parse(await readFile(path.join(releaseRoot, 'release-manifest.json'), 'utf8'));
  const artifact = assertManifest(manifest, packageJson, releaseRoot, sourceRevision);
  const packageSpec = `${packageJson.name}@${packageJson.version}`;
  const existingIntegrity = run(
    'npm',
    ['view', packageSpec, 'dist.integrity', '--registry', PUBLIC_REGISTRY],
    { allowNotFound: true },
  );
  const action = decideRegistryAction(existingIntegrity, manifest.package.npmIntegrity);
  if (action === 'publish') {
    if (!process.env.NODE_AUTH_TOKEN) throw new Error('首次发布需要 GitHub Actions Secret NPM_TOKEN');
    run(
      'npm',
      ['publish', artifact, '--access', 'public', '--provenance', '--registry', PUBLIC_REGISTRY],
      { inherit: true },
    );
  }
  const actualIntegrity = run('npm', ['view', packageSpec, 'dist.integrity', '--registry', PUBLIC_REGISTRY]);
  decideRegistryAction(actualIntegrity, manifest.package.npmIntegrity);
  process.stdout.write(`${packageSpec} integrity 已验证${action === 'skip' ? '，无需重复发布' : ''}\n`);
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  publishNpmRelease({
    tag: requiredOption(process.argv.slice(2), '--tag'),
    releaseDir: requiredOption(process.argv.slice(2), '--release-dir'),
  }).catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
