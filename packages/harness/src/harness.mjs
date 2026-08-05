import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  rmdir,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultAdapterRegistry } from '../../../adapters/registry.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const STARTER_ROOT = path.join(REPO_ROOT, 'starter', 'minimal');
const STATE_RELATIVE_PATH = path.join('.agent-foundation', 'installed-skills.json');
const REQUIRED_STARTER_FILES = [
  'AGENTS.md',
  'agent-foundation.json',
  path.join('specs', 'README.md'),
  path.join('knowledge', 'README.md'),
  path.join('knowledge', 'registry.json'),
  path.join('knowledge', 'code-entry-map.json'),
];
const REQUIRED_REPOSITORY_ENTRIES = new Map([
  ['AGENTS.md', 'file'],
  ['README.md', 'file'],
  ['package.json', 'file'],
  ['docs', 'directory'],
  ['knowledge', 'directory'],
  ['specs', 'directory'],
  ['frameworks', 'directory'],
  ['skills', 'directory'],
  ['templates', 'directory'],
  ['blueprints', 'directory'],
  ['starter', 'directory'],
  ['packages', 'directory'],
  ['adapters', 'directory'],
]);
const REPOSITORY_IGNORED_DIRECTORIES = new Set(['.git', 'node_modules']);
const TEXT_EXTENSIONS = new Set(['.js', '.json', '.md', '.mjs', '.txt', '.yaml', '.yml']);

export class FoundationError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'FoundationError';
    this.code = code;
    this.details = details;
  }
}

async function statOrNull(filePath) {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function assertSimpleName(name, label = '名称') {
  if (typeof name !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/u.test(name)) {
    throw new FoundationError('invalid-name', `${label}必须使用小写字母、数字和连字符`, { name });
  }
}

function relativeInside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) return relative;
  throw new FoundationError('unsafe-path', '目标路径越出允许的项目范围', { root, target });
}

async function assertNoSymlinkSegments(root, target) {
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

async function collectFiles(root) {
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

async function collectRepositoryFiles(root) {
  const files = [];
  async function visit(current, relative) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.isDirectory() && REPOSITORY_IGNORED_DIRECTORIES.has(entry.name)) continue;
      const absolute = path.join(current, entry.name);
      const childRelative = relative ? path.join(relative, entry.name) : entry.name;
      if (entry.isSymbolicLink()) {
        files.push({ relative: childRelative, type: 'symlink' });
      } else if (entry.isDirectory()) {
        await visit(absolute, childRelative);
      } else if (entry.isFile()) {
        files.push({ relative: childRelative, type: 'file' });
      }
    }
  }
  await visit(root, '');
  return files;
}

async function digestTree(root) {
  const files = await collectFiles(root);
  const hash = createHash('sha256');
  for (const relative of files) {
    hash.update(relative.split(path.sep).join('/'));
    hash.update('\0');
    hash.update(await readFile(path.join(root, relative)));
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

function parseFrontmatter(markdown, source) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/u);
  if (!match) throw new FoundationError('invalid-skill', 'SKILL.md 缺少有效 Frontmatter', { source });
  const values = {};
  for (const line of match[1].split(/\r?\n/u)) {
    const field = line.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/u);
    if (!field) continue;
    values[field[1]] = field[2].replace(/^['"]|['"]$/gu, '').trim();
  }
  if (!values.name || !values.description) {
    throw new FoundationError('invalid-skill', 'SKILL.md Frontmatter 必须包含 name 和 description', { source });
  }
  return values;
}

async function validateMarkdownLinks(skillRoot) {
  const missing = [];
  for (const relative of await collectFiles(skillRoot)) {
    if (!relative.endsWith('.md')) continue;
    const markdown = await readFile(path.join(skillRoot, relative), 'utf8');
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
      const raw = match[1].trim().replace(/^<|>$/gu, '');
      if (!raw || raw.startsWith('#') || /^[a-z][a-z0-9+.-]*:/iu.test(raw)) continue;
      const target = raw.split('#', 1)[0];
      if (!target) continue;
      const resolved = path.resolve(skillRoot, path.dirname(relative), target);
      try {
        relativeInside(skillRoot, resolved);
      } catch {
        missing.push({ from: relative, target, reason: 'outside-skill' });
        continue;
      }
      if (!existsSync(resolved)) missing.push({ from: relative, target, reason: 'missing' });
    }
  }
  return missing;
}

function validateYamlSubset(text) {
  const issues = [];
  const lines = text.split(/\r?\n/u);
  let previousIndent = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (/\t/u.test(line)) issues.push({ line: index + 1, reason: 'tab-indentation' });
    const indent = line.match(/^ */u)[0].length;
    if (indent % 2 !== 0) issues.push({ line: index + 1, reason: 'odd-indentation' });
    if (indent > previousIndent + 2) issues.push({ line: index + 1, reason: 'indentation-jump' });
    const body = line.trim();
    if (!/^(?:-\s+(?:[A-Za-z0-9_-]+:\s*)?.+|[A-Za-z0-9_-]+:\s*.*)$/u.test(body)) {
      issues.push({ line: index + 1, reason: 'unsupported-yaml-shape' });
    }
    const doubleQuotes = (body.match(/(?<!\\)"/gu) || []).length;
    const singleQuotes = (body.match(/(?<!\\)'/gu) || []).length;
    if (doubleQuotes % 2 !== 0 || singleQuotes % 2 !== 0) {
      issues.push({ line: index + 1, reason: 'unbalanced-quotes' });
    }
    previousIndent = indent;
  }
  return issues;
}

function genericSecretPatterns() {
  return [
    { kind: 'github-token', pattern: /\bghp_[A-Za-z0-9]{36}\b/gu },
    { kind: 'github-fine-grained-token', pattern: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/gu },
    { kind: 'aws-access-key', pattern: /\bAKIA[0-9A-Z]{16}\b/gu },
    { kind: 'openai-style-secret', pattern: /\bsk-[A-Za-z0-9]{32,}\b/gu },
    { kind: 'private-key', pattern: new RegExp(`-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----`, 'gu') },
  ];
}

function isJsonSchemaFile(relative) {
  return /\.schema(?:\.example)?\.json$/u.test(relative);
}

export async function checkSkill(name, { repoRoot = REPO_ROOT } = {}) {
  assertSimpleName(name, 'Skill 名称');
  const skillRoot = path.join(repoRoot, 'skills', name);
  const skillStat = await statOrNull(skillRoot);
  if (!skillStat?.isDirectory() || skillStat.isSymbolicLink()) {
    throw new FoundationError('skill-not-found', '找不到可分发的 Skill 源目录', { name });
  }
  const skillFile = path.join(skillRoot, 'SKILL.md');
  const skillMarkdown = await readFile(skillFile, 'utf8').catch(() => null);
  if (!skillMarkdown) throw new FoundationError('invalid-skill', 'Skill 缺少 SKILL.md', { name });
  const frontmatter = parseFrontmatter(skillMarkdown, path.join('skills', name, 'SKILL.md'));
  if (frontmatter.name !== name) {
    throw new FoundationError('invalid-skill', 'Skill 目录名与 Frontmatter name 不一致', {
      directory: name,
      frontmatter: frontmatter.name,
    });
  }
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/u.test(frontmatter.name)) {
    throw new FoundationError('invalid-skill', 'Skill name 不符合开放命名规则', { name: frontmatter.name });
  }
  if (frontmatter.description.length > 1024 || /[<>]/u.test(frontmatter.description)) {
    throw new FoundationError('invalid-skill', 'Skill description 超长或包含不允许的尖括号', { name });
  }
  const missingLinks = await validateMarkdownLinks(skillRoot);
  if (missingLinks.length) {
    throw new FoundationError('invalid-skill-links', 'Skill 包含失效或越界的本地链接', {
      name,
      links: missingLinks,
    });
  }
  const resources = {};
  for (const resource of ['agents', 'references', 'assets', 'evals', 'scripts', 'tests']) {
    resources[resource] = Boolean((await statOrNull(path.join(skillRoot, resource)))?.isDirectory());
  }
  return {
    ok: true,
    name,
    description: frontmatter.description,
    source: path.posix.join('skills', name),
    digest: await digestTree(skillRoot),
    resources,
  };
}

export async function discoverSkills({ repoRoot = REPO_ROOT } = {}) {
  const skillsRoot = path.join(repoRoot, 'skills');
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  const names = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const skills = [];
  for (const name of names) skills.push(await checkSkill(name, { repoRoot }));
  return skills;
}

async function ensureDirectories(root, directory, createdDirectories) {
  const relative = relativeInside(root, directory);
  let current = path.resolve(root);
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const currentStat = await statOrNull(current);
    if (currentStat?.isSymbolicLink()) {
      throw new FoundationError('unsafe-symlink', '写入路径包含 Symlink', { path: current });
    }
    if (currentStat && !currentStat.isDirectory()) {
      throw new FoundationError('path-conflict', '预期目录的位置已经存在文件', { path: current });
    }
    if (!currentStat) {
      await mkdir(current);
      createdDirectories.push(current);
    }
  }
}

export async function initProject(target, { starterRoot = STARTER_ROOT } = {}) {
  const projectRoot = path.resolve(target);
  const projectStat = await statOrNull(projectRoot);
  const starterFiles = await collectFiles(starterRoot);
  if (!projectStat) {
    const parent = path.dirname(projectRoot);
    await mkdir(parent, { recursive: true });
    const temporary = path.join(parent, `.${path.basename(projectRoot)}.foundation-${randomUUID()}`);
    try {
      await cp(starterRoot, temporary, { recursive: true, errorOnExist: true, force: false });
      await rename(temporary, projectRoot);
      return { ok: true, command: 'init', status: 'initialized', target: projectRoot, added: starterFiles };
    } catch (error) {
      await rm(temporary, { recursive: true, force: true });
      throw error;
    }
  }
  if (projectStat.isSymbolicLink() || !projectStat.isDirectory()) {
    throw new FoundationError('unsafe-target', '初始化目标必须是普通目录，不能是文件或 Symlink', {
      target: projectRoot,
    });
  }

  const missing = [];
  const conflicts = [];
  for (const relative of starterFiles) {
    const destination = path.join(projectRoot, relative);
    await assertNoSymlinkSegments(projectRoot, path.dirname(destination));
    const destinationStat = await statOrNull(destination);
    if (!destinationStat) {
      missing.push(relative);
      continue;
    }
    if (!destinationStat.isFile() || destinationStat.isSymbolicLink()) {
      conflicts.push({ path: relative, reason: 'not-a-regular-file' });
      continue;
    }
    const [sourceContent, destinationContent] = await Promise.all([
      readFile(path.join(starterRoot, relative)),
      readFile(destination),
    ]);
    if (!sourceContent.equals(destinationContent)) conflicts.push({ path: relative, reason: 'different-content' });
  }
  if (conflicts.length) {
    throw new FoundationError('init-conflict', '目标项目存在与 Starter 冲突的文件，未执行任何写入', {
      conflicts,
    });
  }
  if (!missing.length) {
    return { ok: true, command: 'init', status: 'unchanged', target: projectRoot, added: [] };
  }

  const createdFiles = [];
  const createdDirectories = [];
  try {
    for (const relative of missing) {
      const destination = path.join(projectRoot, relative);
      await ensureDirectories(projectRoot, path.dirname(destination), createdDirectories);
      await writeFile(destination, await readFile(path.join(starterRoot, relative)), { flag: 'wx' });
      createdFiles.push(destination);
    }
  } catch (error) {
    for (const file of createdFiles.reverse()) await rm(file, { force: true });
    for (const directory of createdDirectories.reverse()) await rmdir(directory).catch(() => {});
    throw error;
  }
  return { ok: true, command: 'init', status: 'initialized', target: projectRoot, added: missing };
}

async function readJson(filePath, label) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    throw new FoundationError('invalid-json', `${label} 不是有效 JSON`, { path: filePath, reason: error.message });
  }
}

async function readProjectManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, 'agent-foundation.json');
  const manifest = await readJson(manifestPath, 'Starter Manifest');
  if (manifest.schemaVersion !== 2 || manifest.preset !== 'minimal' || !Array.isArray(manifest.integrations)) {
    throw new FoundationError('invalid-manifest-contract', 'Starter Manifest 结构或版本不受支持', {
      path: manifestPath,
    });
  }

  const seen = new Set();
  for (const integration of manifest.integrations) {
    const allowedKeys = new Set(['capability', 'adapterId', 'configRef']);
    if (
      !integration ||
      typeof integration !== 'object' ||
      Array.isArray(integration) ||
      Object.keys(integration).some((key) => !allowedKeys.has(key))
    ) {
      throw new FoundationError('invalid-integration', 'Integration 只能包含能力、Adapter ID 和不透明配置引用');
    }
    assertSimpleName(integration.capability, 'Integration capability');
    assertSimpleName(integration.adapterId, 'Integration adapterId');
    if (
      integration.configRef !== null &&
      (typeof integration.configRef !== 'string' || !/^[a-z][a-z0-9+.-]*:\/\/.+/iu.test(integration.configRef))
    ) {
      throw new FoundationError('invalid-integration', 'configRef 必须为空或使用 URI 形式的不透明引用', {
        capability: integration.capability,
        adapterId: integration.adapterId,
      });
    }
    const key = `${integration.capability}:${integration.adapterId}`;
    if (seen.has(key)) {
      throw new FoundationError('duplicate-integration', 'Integration 不能重复声明同一个 Adapter', {
        capability: integration.capability,
        adapterId: integration.adapterId,
      });
    }
    seen.add(key);
  }

  const hosts = manifest.integrations.filter((integration) => integration.capability === 'host');
  if (hosts.length !== 1) {
    throw new FoundationError('invalid-host-integration', 'Starter Manifest 必须且只能配置一个项目级 Host Adapter');
  }
  return manifest;
}

async function readInstallState(projectRoot) {
  const statePath = path.join(projectRoot, STATE_RELATIVE_PATH);
  const stateStat = await statOrNull(statePath);
  if (!stateStat) return { schemaVersion: 1, records: {} };
  if (!stateStat.isFile() || stateStat.isSymbolicLink()) {
    throw new FoundationError('invalid-install-state', 'Skill 安装状态必须是普通文件', { path: statePath });
  }
  const state = await readJson(statePath, 'Skill 安装状态');
  if (state.schemaVersion !== 1 || !state.records || typeof state.records !== 'object' || Array.isArray(state.records)) {
    throw new FoundationError('invalid-install-state', 'Skill 安装状态结构不受支持', { path: statePath });
  }
  return state;
}

async function writeInstallState(projectRoot, state) {
  const statePath = path.join(projectRoot, STATE_RELATIVE_PATH);
  const directory = path.dirname(statePath);
  await assertNoSymlinkSegments(projectRoot, directory);
  await mkdir(directory, { recursive: true });
  const temporary = `${statePath}.tmp-${randomUUID()}`;
  try {
    await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { flag: 'wx' });
    await rename(temporary, statePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

function resolveHost(adapterRegistry, host) {
  const adapter = adapterRegistry?.get?.('host', host);
  if (!adapter) throw new FoundationError('unsupported-host', '没有注册项目声明的 Host Adapter', { host });
  if (adapter.scope !== 'project' || typeof adapter.resolveProjectSkillsDir !== 'function') {
    throw new FoundationError('invalid-host-adapter', 'Host Adapter 不满足项目级 Skill 目录契约', { host });
  }
  return adapter;
}

function resolveHostSkillsDirectory(hostAdapter, projectRoot, integration) {
  let resolved;
  try {
    resolved = hostAdapter.resolveProjectSkillsDir(projectRoot, integration);
  } catch {
    throw new FoundationError('invalid-host-adapter-path', 'Host Adapter 无法解析项目级 Skill 目录', {
      host: hostAdapter.id,
    });
  }
  if (typeof resolved !== 'string' || !resolved.trim()) {
    throw new FoundationError('invalid-host-adapter-path', 'Host Adapter 必须返回非空路径', {
      host: hostAdapter.id,
    });
  }
  const absolute = path.resolve(resolved);
  const relative = relativeInside(projectRoot, absolute);
  if (!relative) {
    throw new FoundationError('invalid-host-adapter-path', 'Host Adapter 不能把项目根目录作为 Skill 目录', {
      host: hostAdapter.id,
    });
  }
  return absolute;
}

export async function planSkill({
  target,
  name,
  host,
  operation = 'install',
  repoRoot = REPO_ROOT,
  adapterRegistry = defaultAdapterRegistry,
}) {
  assertSimpleName(name, 'Skill 名称');
  if (!['install', 'update'].includes(operation)) {
    throw new FoundationError('invalid-operation', 'Skill 计划只支持 install 或 update', { operation });
  }
  const projectRoot = path.resolve(target);
  const projectStat = await statOrNull(projectRoot);
  if (!projectStat?.isDirectory() || projectStat.isSymbolicLink()) {
    throw new FoundationError('unsafe-target', 'Skill 目标必须是已经初始化的普通项目目录', { target: projectRoot });
  }
  const manifest = await readProjectManifest(projectRoot);
  const hostIntegration = manifest.integrations.find((integration) => integration.capability === 'host');
  if (host && host !== hostIntegration.adapterId) {
    throw new FoundationError('host-configuration-mismatch', '命令指定的 Host 与项目 Manifest 不一致', {
      requested: host,
      configured: hostIntegration.adapterId,
    });
  }
  const hostId = host || hostIntegration.adapterId;
  const hostAdapter = resolveHost(adapterRegistry, hostId);
  const source = await checkSkill(name, { repoRoot });
  const skillsDirectory = resolveHostSkillsDirectory(hostAdapter, projectRoot, hostIntegration);
  const destination = path.join(skillsDirectory, name);
  await assertNoSymlinkSegments(projectRoot, destination);
  const destinationStat = await statOrNull(destination);
  const state = await readInstallState(projectRoot);
  const record = state.records[name] || null;
  const conflicts = [];
  let targetDigest = null;
  if (destinationStat) {
    if (!destinationStat.isDirectory() || destinationStat.isSymbolicLink()) {
      conflicts.push({ type: 'unsafe-target-entry', path: path.relative(projectRoot, destination) });
    } else {
      targetDigest = await digestTree(destination);
    }
  }

  let action = 'blocked';
  if (operation === 'install') {
    if (!destinationStat) action = 'add';
    else if (!record) conflicts.push({ type: 'unmanaged-existing-skill', path: path.relative(projectRoot, destination) });
    else if (targetDigest !== record.digest) conflicts.push({ type: 'user-modified-skill', name });
    else if (targetDigest === source.digest) action = 'noop';
    else conflicts.push({ type: 'update-required', name });
  } else if (!record) {
    conflicts.push({ type: 'not-managed', name });
  } else if (!destinationStat) {
    conflicts.push({ type: 'managed-target-missing', name });
  } else if (targetDigest !== record.digest) {
    conflicts.push({ type: 'user-modified-skill', name });
  } else if (targetDigest === source.digest) {
    action = 'noop';
  } else {
    action = 'update';
  }

  if (conflicts.length) action = 'blocked';
  return {
    ok: conflicts.length === 0,
    command: 'skill-plan',
    status: action === 'blocked' ? 'blocked' : 'planned',
    operation,
    action,
    host: hostId,
    scope: 'project',
    name,
    source: source.source,
    sourceDigest: source.digest,
    target: path.relative(projectRoot, destination).split(path.sep).join('/'),
    targetDigest,
    managed: Boolean(record),
    conflicts,
  };
}

async function applySkill({
  target,
  name,
  host,
  operation,
  repoRoot,
  adapterRegistry = defaultAdapterRegistry,
}) {
  const projectRoot = path.resolve(target);
  const plan = await planSkill({ target: projectRoot, name, host, operation, repoRoot, adapterRegistry });
  if (!plan.ok) {
    throw new FoundationError('skill-conflict', 'Skill 计划存在冲突，目标保持不变', { plan });
  }
  if (plan.action === 'noop') {
    return { ok: true, command: `skill-${operation}`, status: 'unchanged', plan };
  }

  const sourceRoot = path.join(repoRoot, 'skills', name);
  const destination = path.resolve(projectRoot, plan.target);
  relativeInside(projectRoot, destination);
  const skillsDirectory = path.dirname(destination);
  await assertNoSymlinkSegments(projectRoot, skillsDirectory);
  await mkdir(skillsDirectory, { recursive: true });
  const temporary = path.join(skillsDirectory, `.${name}.tmp-${randomUUID()}`);
  const backup = path.join(skillsDirectory, `.${name}.backup-${randomUUID()}`);
  const state = await readInstallState(projectRoot);
  const beforeState = JSON.parse(JSON.stringify(state));
  const now = new Date().toISOString();

  try {
    await cp(sourceRoot, temporary, { recursive: true, errorOnExist: true, force: false });
    const copiedDigest = await digestTree(temporary);
    if (copiedDigest !== plan.sourceDigest) {
      throw new FoundationError('source-changed', 'Skill 源在计划后发生变化，拒绝 Apply', {
        planned: plan.sourceDigest,
        actual: copiedDigest,
      });
    }

    if (plan.action === 'update') {
      await rename(destination, backup);
      try {
        await rename(temporary, destination);
      } catch (error) {
        await rename(backup, destination);
        throw error;
      }
    } else {
      await rename(temporary, destination);
    }
    state.records[name] = {
      host: plan.host,
      scope: 'project',
      path: plan.target,
      digest: copiedDigest,
      installedAt: state.records[name]?.installedAt || now,
      updatedAt: now,
    };
    try {
      await writeInstallState(projectRoot, state);
    } catch (error) {
      await rm(destination, { recursive: true, force: true });
      if (plan.action === 'update') await rename(backup, destination);
      await writeInstallState(projectRoot, beforeState).catch(() => {});
      throw error;
    }
    if (plan.action === 'update') await rm(backup, { recursive: true, force: true }).catch(() => {});
    return {
      ok: true,
      command: `skill-${operation}`,
      status: plan.action === 'add' ? 'installed' : 'updated',
      plan,
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export function installSkill(options) {
  return applySkill({ ...options, operation: 'install', repoRoot: options.repoRoot || REPO_ROOT });
}

export function updateSkill(options) {
  return applySkill({ ...options, operation: 'update', repoRoot: options.repoRoot || REPO_ROOT });
}

export async function doctorProject(target, { adapterRegistry = defaultAdapterRegistry } = {}) {
  const projectRoot = path.resolve(target);
  const errors = [];
  const warnings = [];
  const checks = [];
  const projectStat = await statOrNull(projectRoot);
  if (!projectStat || !projectStat.isDirectory() || projectStat.isSymbolicLink()) {
    return {
      ok: false,
      command: 'doctor',
      status: 'fail',
      target: projectRoot,
      errors: [{ code: 'invalid-project-root', path: projectRoot }],
      warnings,
      checks,
    };
  }

  for (const relative of REQUIRED_STARTER_FILES) {
    const filePath = path.join(projectRoot, relative);
    const fileStat = await statOrNull(filePath);
    if (!fileStat?.isFile() || fileStat.isSymbolicLink()) errors.push({ code: 'missing-required-file', path: relative });
    else checks.push({ code: 'required-file', path: relative, status: 'pass' });
  }

  let manifest = null;
  let hostIntegration = null;
  let hostAdapter = null;
  try {
    manifest = await readProjectManifest(projectRoot);
    hostIntegration = manifest.integrations.find((integration) => integration.capability === 'host');
    hostAdapter = resolveHost(adapterRegistry, hostIntegration.adapterId);
    const hostSkillsDirectory = resolveHostSkillsDirectory(hostAdapter, projectRoot, hostIntegration);
    await assertNoSymlinkSegments(projectRoot, hostSkillsDirectory);
    checks.push({ code: 'manifest-contract', status: 'pass' });
    for (const integration of manifest.integrations) {
      const adapter = adapterRegistry?.get?.(integration.capability, integration.adapterId);
      if (!adapter && integration.capability !== 'host') {
        warnings.push({
          code: 'adapter-unavailable',
          capability: integration.capability,
          adapterId: integration.adapterId,
        });
      } else if (adapter) {
        checks.push({
          code: 'integration-adapter',
          capability: integration.capability,
          adapterId: integration.adapterId,
          status: 'pass',
        });
      }
    }
  } catch (error) {
    errors.push({ code: error.code || 'invalid-manifest', message: error.message });
  }

  for (const relative of [path.join('knowledge', 'registry.json'), path.join('knowledge', 'code-entry-map.json')]) {
    try {
      const document = await readJson(path.join(projectRoot, relative), relative);
      if (document.schemaVersion !== 1 || !Array.isArray(document.entries)) {
        errors.push({ code: 'invalid-knowledge-index', path: relative });
      } else checks.push({ code: 'knowledge-index', path: relative, status: 'pass' });
    } catch (error) {
      errors.push({ code: error.code || 'invalid-knowledge-index', path: relative, message: error.message });
    }
  }

  try {
    const state = await readInstallState(projectRoot);
    for (const [name, record] of Object.entries(state.records)) {
      try {
        assertSimpleName(name, '已安装 Skill 名称');
        if (!hostIntegration || !hostAdapter || record.host !== hostIntegration.adapterId || record.scope !== 'project') {
          errors.push({ code: 'unsupported-installed-skill-target', name });
          continue;
        }
        const destination = path.resolve(projectRoot, record.path);
        relativeInside(projectRoot, destination);
        const expected = path.join(resolveHostSkillsDirectory(hostAdapter, projectRoot, hostIntegration), name);
        if (destination !== expected) {
          errors.push({ code: 'installed-skill-path-mismatch', name, path: record.path });
          continue;
        }
        await assertNoSymlinkSegments(projectRoot, destination);
        const destinationStat = await statOrNull(destination);
        if (!destinationStat?.isDirectory() || destinationStat.isSymbolicLink()) {
          errors.push({ code: 'installed-skill-missing', name, path: record.path });
          continue;
        }
        const digest = await digestTree(destination);
        if (digest !== record.digest) errors.push({ code: 'installed-skill-modified', name, path: record.path });
        else checks.push({ code: 'installed-skill', name, status: 'pass' });
      } catch (error) {
        errors.push({ code: error.code || 'invalid-installed-skill', name, message: error.message });
      }
    }
  } catch (error) {
    errors.push({ code: error.code || 'invalid-install-state', message: error.message });
  }

  return {
    ok: errors.length === 0,
    command: 'doctor',
    status: errors.length ? 'fail' : warnings.length ? 'warn' : 'pass',
    target: projectRoot,
    errors,
    warnings,
    checks,
  };
}

export async function checkRepository({ repoRoot = REPO_ROOT, denyTerms = [] } = {}) {
  const root = path.resolve(repoRoot);
  const errors = [];
  const warnings = [];
  const checks = [];
  const rootStat = await statOrNull(root);
  if (!rootStat?.isDirectory() || rootStat.isSymbolicLink()) {
    return {
      ok: false,
      command: 'repository-check',
      status: 'fail',
      target: root,
      errors: [{ code: 'invalid-repository-root', path: root }],
      warnings,
      checks,
    };
  }

  for (const [relative, type] of REQUIRED_REPOSITORY_ENTRIES) {
    const entry = await statOrNull(path.join(root, relative));
    const validType = type === 'file' ? entry?.isFile() : entry?.isDirectory();
    if (!validType || entry.isSymbolicLink()) errors.push({ code: 'invalid-repository-entry', path: relative, type });
    else checks.push({ code: 'repository-entry', path: relative, status: 'pass' });
  }

  const repositoryEntries = await collectRepositoryFiles(root);
  const files = repositoryEntries.filter((entry) => entry.type === 'file').map((entry) => entry.relative);
  for (const entry of repositoryEntries.filter((item) => item.type === 'symlink')) {
    errors.push({ code: 'repository-symlink', path: entry.relative });
  }

  for (const relative of files.filter((file) => file.endsWith('.json'))) {
    try {
      const document = await readJson(path.join(root, relative), relative);
      if (isJsonSchemaFile(relative)) {
        if (
          !document ||
          typeof document !== 'object' ||
          typeof document.$schema !== 'string' ||
          document.type !== 'object' ||
          !document.properties ||
          typeof document.properties !== 'object' ||
          !Array.isArray(document.required)
        ) {
          errors.push({ code: 'invalid-json-schema-structure', path: relative });
          continue;
        }
      }
      checks.push({ code: isJsonSchemaFile(relative) ? 'json-schema' : 'json', path: relative, status: 'pass' });
    } catch (error) {
      errors.push({ code: error.code || 'invalid-json', path: relative, message: error.message });
    }
  }

  for (const relative of files.filter((file) => /\.ya?ml$/u.test(file))) {
    const issues = validateYamlSubset(await readFile(path.join(root, relative), 'utf8'));
    if (issues.length) errors.push({ code: 'invalid-supported-yaml-subset', path: relative, issues });
    else checks.push({ code: 'yaml-subset', path: relative, status: 'pass' });
  }

  const markdownErrorCount = errors.length;
  for (const relative of files.filter((file) => file.endsWith('.md'))) {
    const markdown = await readFile(path.join(root, relative), 'utf8');
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
      const raw = match[1].trim().replace(/^<|>$/gu, '');
      if (!raw || raw.startsWith('#') || /^[a-z][a-z0-9+.-]*:/iu.test(raw)) continue;
      const target = raw.split('#', 1)[0];
      if (!target) continue;
      const resolved = path.resolve(root, path.dirname(relative), target);
      try {
        relativeInside(root, resolved);
      } catch {
        errors.push({ code: 'markdown-link-outside-repository', path: relative, target });
        continue;
      }
      if (!existsSync(resolved)) errors.push({ code: 'markdown-link-missing', path: relative, target });
    }
  }
  checks.push({
    code: 'markdown-links',
    files: files.filter((file) => file.endsWith('.md')).length,
    status: errors.length === markdownErrorCount ? 'pass' : 'fail',
  });

  try {
    const skills = await discoverSkills({ repoRoot: root });
    for (const skill of skills) {
      const evalRoot = path.join(root, 'skills', skill.name, 'evals');
      if (!(await statOrNull(evalRoot))?.isDirectory()) {
        warnings.push({ code: 'skill-evals-missing', name: skill.name });
        continue;
      }
      const rubric = await statOrNull(path.join(evalRoot, 'rubric.md'));
      const casesRoot = path.join(evalRoot, 'cases');
      const cases = (await statOrNull(casesRoot))?.isDirectory()
        ? (await readdir(casesRoot, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
        : [];
      if (!rubric?.isFile() || rubric.isSymbolicLink() || cases.length === 0) {
        errors.push({ code: 'invalid-skill-evals', name: skill.name });
      } else checks.push({ code: 'skill', name: skill.name, evalCases: cases.length, status: 'pass' });
    }
  } catch (error) {
    errors.push({ code: error.code || 'invalid-skills', message: error.message, details: error.details });
  }

  const normalizedTerms = [...new Set(denyTerms.map((term) => term.trim()).filter(Boolean))];
  const secretPatterns = genericSecretPatterns();
  const sensitiveErrorCount = errors.length;
  for (const relative of files.filter((file) => TEXT_EXTENSIONS.has(path.extname(file)))) {
    const content = await readFile(path.join(root, relative), 'utf8');
    for (const { kind, pattern } of secretPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) errors.push({ code: 'high-confidence-secret', kind, path: relative });
    }
    for (const term of normalizedTerms) {
      if (content.toLocaleLowerCase().includes(term.toLocaleLowerCase())) {
        const termId = createHash('sha256').update(term).digest('hex').slice(0, 12);
        errors.push({ code: 'denied-sensitive-term', path: relative, termId });
      }
    }
  }
  checks.push({
    code: 'sensitive-content-scan',
    files: files.filter((file) => TEXT_EXTENSIONS.has(path.extname(file))).length,
    customTerms: normalizedTerms.length,
    status: errors.length === sensitiveErrorCount ? 'pass' : 'fail',
  });

  return {
    ok: errors.length === 0,
    command: 'repository-check',
    status: errors.length ? 'fail' : warnings.length ? 'warn' : 'pass',
    target: root,
    errors,
    warnings,
    checks,
  };
}

export const internals = Object.freeze({
  REPO_ROOT,
  STARTER_ROOT,
  STATE_RELATIVE_PATH,
  digestTree,
});
