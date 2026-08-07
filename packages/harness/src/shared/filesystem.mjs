import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { FoundationError } from './errors.mjs';

export async function statOrNull(filePath) {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export function relativeInside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) return relative;
  throw new FoundationError('unsafe-path', '目标路径越出允许的项目范围', { root, target });
}

export async function assertNoSymlinkSegments(root, target) {
  const rootPath = path.resolve(root);
  const relative = relativeInside(rootPath, target);
  const rootStat = await statOrNull(rootPath);
  if (rootStat?.isSymbolicLink()) {
    throw new FoundationError('unsafe-symlink', '项目根目录不能是 Symlink', { path: rootPath });
  }
  let current = rootPath;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const currentStat = await statOrNull(current);
    if (currentStat?.isSymbolicLink()) {
      throw new FoundationError('unsafe-symlink', '目标路径包含 Symlink', { path: current });
    }
    if (!currentStat) break;
  }
}

export async function assertNoSymlinkAncestors(target) {
  const absolute = path.resolve(target);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  const segments = absolute.slice(parsed.root.length).split(path.sep).filter(Boolean);
  for (const segment of segments) {
    current = path.join(current, segment);
    const currentStat = await statOrNull(current);
    if (currentStat?.isSymbolicLink()) {
      throw new FoundationError('unsafe-symlink', '目标路径的父级或自身包含 Symlink', { path: current });
    }
    if (!currentStat) break;
  }
}

export async function collectFiles(root) {
  const files = [];
  async function visit(current, relative) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const childRelative = relative ? path.join(relative, entry.name) : entry.name;
      if (entry.isSymbolicLink()) {
        throw new FoundationError('unsafe-symlink', '源目录包含 Symlink，拒绝复制或计算摘要', {
          path: childRelative,
        });
      }
      if (entry.isDirectory()) await visit(absolute, childRelative);
      else if (entry.isFile()) files.push(childRelative);
      else {
        throw new FoundationError('unsupported-entry', '源目录包含不支持的文件类型', { path: childRelative });
      }
    }
  }
  await visit(root, '');
  return files;
}

export async function digestFiles(root, files) {
  const hash = createHash('sha256');
  for (const relative of files) {
    hash.update(relative.split(path.sep).join('/'));
    hash.update('\0');
    hash.update(await readFile(path.join(root, relative)));
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

export async function digestTree(root) {
  return digestFiles(root, await collectFiles(root));
}
