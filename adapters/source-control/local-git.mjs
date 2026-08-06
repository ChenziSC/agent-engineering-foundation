import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const OBJECT_ID_PATTERN = /^[0-9a-f]{40,64}$/u;
const MAX_GIT_OUTPUT_BYTES = 64 * 1024 * 1024;

export class SourceControlAdapterError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'SourceControlAdapterError';
    this.code = code;
    this.details = details;
  }
}

function runGit(repositoryRoot, args, { allowStatus = [], env = {} } = {}) {
  const result = spawnSync('git', args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    maxBuffer: MAX_GIT_OUTPUT_BYTES,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) {
    throw new SourceControlAdapterError('source-control-unavailable', '无法执行本地 Git', {
      reason: result.error.code || result.error.message,
    });
  }
  if (result.status !== 0 && !allowStatus.includes(result.status)) {
    throw new SourceControlAdapterError('git-command-failed', 'Git 无法解析请求的版本或候选变更', {
      operation: args[0],
      status: result.status,
    });
  }
  return { status: result.status, stdout: result.stdout || '', stderr: result.stderr || '' };
}

function normalizeSelector(value, label) {
  if (typeof value !== 'string' || value.includes('\0') || path.isAbsolute(value)) {
    throw new SourceControlAdapterError('invalid-source-control-path', `${label} 必须是仓库内相对路径`, {
      path: value,
    });
  }
  const normalized = value.replace(/\\/gu, '/').replace(/^\.\//u, '').replace(/\/+$/u, '');
  if (normalized === '.' || normalized === '') return '';
  if (normalized.split('/').some((segment) => segment === '..')) {
    throw new SourceControlAdapterError('invalid-source-control-path', `${label} 不能越出仓库`, { path: value });
  }
  return normalized;
}

function normalizeSelectors(values, label) {
  if (!Array.isArray(values)) {
    throw new SourceControlAdapterError('invalid-source-control-path', `${label} 必须是路径数组`);
  }
  return [...new Set(values.map((value) => normalizeSelector(value, label)))].sort(compareCodePoint);
}

function compareCodePoint(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function pathMatchesSelector(filePath, selector) {
  return selector === '' || filePath === selector || filePath.startsWith(`${selector}/`);
}

function pathSelected(filePath, includes, excludes) {
  const included = !includes.length || includes.some((selector) => pathMatchesSelector(filePath, selector));
  return included && !excludes.some((selector) => pathMatchesSelector(filePath, selector));
}

function parseNameStatusZ(output) {
  if (!output) return [];
  const tokens = output.split('\0');
  if (tokens.at(-1) === '') tokens.pop();
  const changes = [];
  for (let index = 0; index < tokens.length; ) {
    const status = tokens[index];
    index += 1;
    if (!status) throw new SourceControlAdapterError('invalid-git-output', 'Git 变更列表包含空状态');
    const pathCount = /^[RC]/u.test(status) ? 2 : 1;
    const paths = tokens.slice(index, index + pathCount);
    if (paths.length !== pathCount || paths.some((candidate) => !candidate)) {
      throw new SourceControlAdapterError('invalid-git-output', 'Git 变更列表结构不完整');
    }
    index += pathCount;
    changes.push({ status, paths });
  }
  return changes;
}

function resolveCommit(repositoryRoot, revision, label) {
  if (typeof revision !== 'string' || !revision.trim() || revision.startsWith('-')) {
    throw new SourceControlAdapterError('invalid-source-control-revision', `${label} 必须是非空版本引用`);
  }
  const resolved = runGit(repositoryRoot, ['rev-parse', '--verify', `${revision}^{commit}`]).stdout.trim();
  if (!OBJECT_ID_PATTERN.test(resolved)) {
    throw new SourceControlAdapterError('invalid-source-control-revision', `${label} 未解析为不可变 Commit`);
  }
  return resolved;
}

function resolveTreeObjectId(repositoryRoot, treeId, filePath, env) {
  const output = runGit(repositoryRoot, ['ls-tree', '-z', treeId, '--', filePath], { env }).stdout;
  if (!output) return null;
  const first = output.split('\0').find(Boolean);
  const match = first?.match(/^[0-7]+\s+(?:blob|tree|commit)\s+([0-9a-f]{40,64})\t/u);
  if (!match) throw new SourceControlAdapterError('invalid-git-output', 'Git Tree 条目结构无效', { path: filePath });
  return match[1];
}

function collectDirtyPaths(repositoryRoot) {
  const tracked = runGit(repositoryRoot, ['diff', '--name-only', '-z', 'HEAD', '--']).stdout.split('\0').filter(Boolean);
  const untracked = runGit(repositoryRoot, ['ls-files', '--others', '--exclude-standard', '-z']).stdout
    .split('\0')
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].sort(compareCodePoint);
}

function resolveCandidateTree(repositoryRoot, baseRevision, sourceRevision, env) {
  const result = runGit(
    repositoryRoot,
    ['merge-tree', '--write-tree', '--messages', baseRevision, sourceRevision],
    { allowStatus: [1], env },
  );
  if (result.status === 1) {
    throw new SourceControlAdapterError('merge-candidate-conflict', 'Base 与 Source 无法形成无冲突的 Merge Candidate');
  }
  const [treeId] = result.stdout.split(/\r?\n/u);
  if (!OBJECT_ID_PATTERN.test(treeId || '')) {
    throw new SourceControlAdapterError('invalid-git-output', 'Git 未返回合法的候选 Tree ID');
  }
  return treeId;
}

export function inspectLocalGitMergeCandidate({
  projectRoot,
  baseRevision,
  sourceRevision = 'HEAD',
  includePaths = [],
  excludePaths = [],
}) {
  const repositoryRoot = path.resolve(projectRoot);
  const includes = normalizeSelectors(includePaths, 'includePaths');
  const excludes = normalizeSelectors(excludePaths, 'excludePaths');
  const base = resolveCommit(repositoryRoot, baseRevision, 'baseRevision');
  const source = resolveCommit(repositoryRoot, sourceRevision, 'sourceRevision');
  const dirtyPaths = collectDirtyPaths(repositoryRoot).filter((filePath) => pathSelected(filePath, includes, excludes));
  if (dirtyPaths.length) {
    throw new SourceControlAdapterError(
      'source-control-scope-dirty',
      '生成稳定变更摘要前，纳入范围的改动必须先形成不可变版本',
      { paths: dirtyPaths },
    );
  }

  const objectDirectory = runGit(repositoryRoot, ['rev-parse', '--git-path', 'objects']).stdout.trim();
  const alternateObjectDirectory = path.resolve(repositoryRoot, objectDirectory);
  const temporaryObjectDirectory = mkdtempSync(path.join(os.tmpdir(), 'agent-foundation-git-objects-'));
  const inheritedAlternates = process.env.GIT_ALTERNATE_OBJECT_DIRECTORIES;
  const gitEnv = {
    GIT_OBJECT_DIRECTORY: temporaryObjectDirectory,
    GIT_ALTERNATE_OBJECT_DIRECTORIES: [alternateObjectDirectory, inheritedAlternates].filter(Boolean).join(path.delimiter),
  };
  try {
    const candidateTreeId = resolveCandidateTree(repositoryRoot, base, source, gitEnv);
    const allChanges = parseNameStatusZ(
      runGit(repositoryRoot, ['diff', '--name-status', '-z', '--find-renames', base, candidateTreeId, '--'], {
        env: gitEnv,
      }).stdout,
    );
    const changes = allChanges
      .filter((change) => change.paths.some((filePath) => pathSelected(filePath, includes, excludes)))
      .map((change) => ({
        status: change.status,
        paths: change.paths.map((filePath) => ({
          path: filePath,
          objectId: resolveTreeObjectId(repositoryRoot, candidateTreeId, filePath, gitEnv),
        })),
      }))
      .sort((left, right) =>
        compareCodePoint(left.paths.map((entry) => entry.path).join('\0'), right.paths.map((entry) => entry.path).join('\0')),
      );
    const entries = [
      ...new Map(
        changes
          .flatMap((change) => change.paths)
          .sort((left, right) => compareCodePoint(left.path, right.path))
          .map((entry) => [entry.path, entry]),
      ).values(),
    ];
    const digestPayload = { schemaVersion: 1, entries };
    const digest = `sha256:${createHash('sha256').update(JSON.stringify(digestPayload)).digest('hex')}`;
    return {
      schemaVersion: 1,
      capability: 'source-control',
      provider: 'local-git',
      scope: 'merge-candidate',
      baseRevision: base,
      sourceRevision: source,
      change: {
        algorithm: 'sha256',
        canonicalization: 'source-control-snapshot-v1',
        digest,
        includes,
        excludes,
      },
      evidence: {
        candidateTreeId,
        changedPathCount: entries.length,
        changes,
      },
    };
  } finally {
    rmSync(temporaryObjectDirectory, { recursive: true, force: true });
  }
}

export const localGitSourceControl = Object.freeze({
  capability: 'source-control',
  id: 'local-git',
  displayName: 'Local Git',
  inspectMergeCandidate: inspectLocalGitMergeCandidate,
});
