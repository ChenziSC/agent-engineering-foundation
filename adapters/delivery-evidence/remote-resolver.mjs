import { spawnSync } from 'node:child_process';
import path from 'node:path';

const REMOTE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/u;
const MAX_GIT_OUTPUT_BYTES = 1024 * 1024;

export class DeliveryEvidenceResolverError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'DeliveryEvidenceResolverError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details) {
  throw new DeliveryEvidenceResolverError(code, message, details);
}

function runGit(projectRoot, args, { allowFailure = false } = {}) {
  const result = spawnSync('git', args, {
    cwd: path.resolve(projectRoot),
    encoding: 'utf8',
    maxBuffer: MAX_GIT_OUTPUT_BYTES,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) fail('delivery-evidence-git-unavailable', '无法读取本地 Git Remote');
  if (result.status !== 0 && !allowFailure) {
    fail('delivery-evidence-remote-unavailable', '无法读取用于交付门禁的平台 Remote');
  }
  return { status: result.status, stdout: result.stdout || '' };
}

export function parseGitRemoteUrl(value) {
  if (typeof value !== 'string' || !value.trim() || /[\0\r\n]/u.test(value)) return null;
  const remoteUrl = value.trim();
  let host;
  let pathname;
  const scpLike = remoteUrl.match(/^(?:[^@/:]+@)?([^/:]+):(.+)$/u);
  if (scpLike && !remoteUrl.includes('://')) {
    [, host, pathname] = scpLike;
  } else {
    let parsed;
    try {
      parsed = new URL(remoteUrl);
    } catch {
      return null;
    }
    if (!['https:', 'http:', 'ssh:', 'git:'].includes(parsed.protocol)) return null;
    host = parsed.hostname;
    pathname = parsed.pathname;
  }
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const repositoryPath = decodedPath.replace(/^\/+|\/+$/gu, '').replace(/\.git$/u, '');
  if (
    !host ||
    !repositoryPath ||
    repositoryPath.split('/').some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    return null;
  }
  return Object.freeze({ host: host.toLowerCase(), repositoryPath });
}

function selectRemote(projectRoot, requestedRemote) {
  if (requestedRemote !== undefined && (typeof requestedRemote !== 'string' || !REMOTE_NAME_PATTERN.test(requestedRemote))) {
    fail('invalid-delivery-evidence-remote', 'deliveryRemote 必须是合法 Git Remote 名称');
  }
  const remotes = runGit(projectRoot, ['remote']).stdout
    .split(/\r?\n/u)
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!remotes.length) fail('delivery-evidence-remote-missing', '仓库没有可用于识别交付平台的 Git Remote');
  const remoteName = requestedRemote || (remotes.includes('origin') ? 'origin' : remotes.length === 1 ? remotes[0] : null);
  if (!remoteName) {
    fail('delivery-evidence-remote-ambiguous', '仓库存在多个 Git Remote 且没有 origin，必须显式选择');
  }
  if (!remotes.includes(remoteName)) {
    fail('delivery-evidence-remote-missing', '指定的 Git Remote 不存在');
  }
  const result = runGit(projectRoot, ['remote', 'get-url', remoteName], { allowFailure: true });
  if (result.status !== 0 || !result.stdout.trim()) {
    fail('delivery-evidence-remote-unavailable', '无法读取用于交付门禁的平台 Remote');
  }
  const remote = parseGitRemoteUrl(result.stdout.trim());
  if (!remote) fail('delivery-evidence-remote-invalid', 'Git Remote 不是可识别的远端仓库 URL');
  return { remoteName, remote };
}

export function resolveDeliveryEvidenceProvider({ projectRoot, adapterRegistry, remoteName } = {}) {
  if (!adapterRegistry || typeof adapterRegistry.list !== 'function') {
    fail('delivery-evidence-registry-invalid', 'Delivery Evidence Adapter Registry 无效');
  }
  const selected = selectRemote(projectRoot, remoteName);
  const matches = adapterRegistry
    .list('delivery-evidence')
    .filter((adapter) => typeof adapter.resolveRemoteRepository === 'function')
    .map((adapter) => {
      const repository = adapter.resolveRemoteRepository(selected.remote);
      return typeof repository === 'string' && repository ? { adapter, repository } : null;
    })
    .filter(Boolean);
  if (matches.length === 0) {
    fail('delivery-evidence-platform-unsupported', 'Git Remote 平台没有已注册的 Delivery Evidence Provider');
  }
  if (matches.length > 1) {
    fail('delivery-evidence-platform-ambiguous', '多个 Delivery Evidence Provider 同时匹配 Git Remote');
  }
  const [match] = matches;
  return Object.freeze({
    provider: match.adapter.id,
    repository: match.repository,
    remoteName: selected.remoteName,
  });
}
