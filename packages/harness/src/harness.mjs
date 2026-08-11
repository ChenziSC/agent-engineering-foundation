import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  cp,
  lstat,
  mkdir,
  readFile,
  readlink,
  readdir,
  rename,
  rm,
  rmdir,
  symlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDeliveryEvidenceProvider } from '../../../adapters/delivery-evidence/remote-resolver.mjs';
import { defaultAdapterRegistry } from '../../../adapters/registry.mjs';
import {
  canonicalJson,
  validateSpecMetaStructure,
  verifyLifecycleChain,
} from '../../../skills/specflow/scripts/archive-receipt.mjs';
import { buildEvalRun } from '../../../frameworks/skill-eval/scripts/eval-runner.mjs';
import { checkComponentRegistry } from '../../../skills/project-component-governance/scripts/validate-registry.mjs';
import { buildMarkdownContextIndex, buildSpecContextIndex } from './context/markdown-index.mjs';
import { FoundationError } from './shared/errors.mjs';
import {
  assertNoSymlinkAncestors,
  assertNoSymlinkSegments,
  collectFiles,
  digestFiles,
  digestTree,
  relativeInside,
  statOrNull,
} from './shared/filesystem.mjs';
import {
  readJson,
  readStructuredDocument,
  serializeStructuredDocument,
  validateYamlSubset,
} from './shared/structured-document.mjs';
import {
  genericSecretPatterns,
  isScannableText,
  MAX_SCANNABLE_TEXT_BYTES,
  scanSensitivePath,
  scanSensitiveText,
} from './repository/sensitive-scan.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const STARTER_ROOT = path.join(REPO_ROOT, 'starter', 'minimal');
const STATE_RELATIVE_PATH = path.join('.agent-foundation', 'installed-skills.json');
const REQUIRED_STARTER_FILES = [
  'AGENTS.md',
  'agent-foundation.json',
  path.join('specs', 'README.md'),
  path.join('knowledge', 'README.md'),
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
  ['distribution', 'directory'],
]);
const REPOSITORY_IGNORED_DIRECTORIES = new Set(['.git', 'node_modules']);
const MAX_GIT_COMMAND_OUTPUT_BYTES = 128 * 1024 * 1024;
const DEFAULT_CONTEXT_POLICY = Object.freeze({
  perSpecFullTextBytes: 32 * 1024,
  totalFullTextBytes: 64 * 1024,
  maxIndexEntriesPerArtifact: 256,
  maxRuleFileBytes: 32 * 1024,
});

export { FoundationError };

function assertSimpleName(name, label = '名称') {
  if (typeof name !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/u.test(name)) {
    throw new FoundationError('invalid-name', `${label}必须使用小写字母、数字和连字符`, { name });
  }
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

async function validateMarkdownLinks(skillRoot, includedFiles) {
  const missing = [];
  const files = includedFiles || await collectFiles(skillRoot);
  const included = includedFiles
    ? new Set(includedFiles.map((relative) => relative.split(path.sep).join('/')))
    : null;
  for (const relative of files) {
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
      if (!existsSync(resolved)) {
        missing.push({ from: relative, target, reason: 'missing' });
        continue;
      }
      if (included) {
        const targetRelative = path.relative(skillRoot, resolved).split(path.sep).join('/');
        if (!included.has(targetRelative)) missing.push({ from: relative, target, reason: 'not-distributed' });
      }
    }
  }
  return missing;
}

function stringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);
}

function validKnowledgeProjectionMarker(value) {
  const allowedKeys = new Set(['spec_id', 'action', 'reviewed_at', 'decision_digest']);
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !Object.keys(value).some((key) => !allowedKeys.has(key)) &&
    typeof value.spec_id === 'string' &&
    /^[a-z0-9][a-z0-9-]{0,127}$/u.test(value.spec_id) &&
    ['create', 'update', 'still-valid', 'supersede', 'retire'].includes(value.action) &&
    typeof value.reviewed_at === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/u.test(value.reviewed_at) &&
    typeof value.decision_digest === 'string' &&
    /^sha256:[a-f0-9]{64}$/u.test(value.decision_digest)
  );
}

function normalizedIndexVersion(document) {
  return document?.schemaVersion ?? document?.version;
}

function pathsOverlap(left, right) {
  const normalize = (value) => value.replace(/^\.\//u, '').replace(/\\/gu, '/').replace(/\/$/u, '');
  const a = normalize(left);
  const b = normalize(right);
  if (a === '.' || b === '.' || a === '' || b === '') return true;
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

function posixProjectPath(value) {
  return value.split(path.sep).join('/').replace(/^\.\//u, '').replace(/\/$/u, '');
}

function duplicateStrings(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort((left, right) => left.localeCompare(right));
}

function markdownRuleLines(markdown) {
  const rules = [];
  for (const [index, line] of markdown.split(/\r?\n/u).entries()) {
    const match = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.+?)\s*$/u);
    if (!match) continue;
    const normalized = match[1].replace(/\s+/gu, ' ').trim().toLocaleLowerCase('zh-CN');
    if (normalized.length < 8) continue;
    rules.push({ line: index + 1, normalized });
  }
  return rules;
}

function ruleDirectory(relative) {
  const directory = path.posix.dirname(relative);
  return directory === '.' ? '' : directory;
}

function isAncestorRule(parent, child) {
  const parentDirectory = ruleDirectory(parent);
  const childDirectory = ruleDirectory(child);
  return parentDirectory !== childDirectory && (!parentDirectory || childDirectory.startsWith(`${parentDirectory}/`));
}

async function inspectRuleNavigation(projectRoot, loaded, mappings) {
  const errors = [];
  const warnings = [];
  const checks = [];
  const referenced = new Set(['AGENTS.md']);
  for (const mapping of mappings) {
    for (const rule of Array.isArray(mapping?.module_rules) ? mapping.module_rules : []) referenced.add(posixProjectPath(rule));
  }
  const documents = [];
  for (const relative of [...referenced].sort((left, right) => left.localeCompare(right))) {
    try {
      const absolute = safeProjectPath(projectRoot, relative, '规则文件');
      await assertNoSymlinkSegments(projectRoot, absolute);
      const entry = await statOrNull(absolute);
      if (!entry?.isFile() || entry.isSymbolicLink()) {
        errors.push({ code: 'rule-file-missing', path: relative });
        continue;
      }
      const buffer = await readFile(absolute);
      if (buffer.length > loaded.context.maxRuleFileBytes) {
        errors.push({
          code: 'rule-file-budget-exceeded',
          path: relative,
          bytes: buffer.length,
          limit: loaded.context.maxRuleFileBytes,
        });
      }
      documents.push({ path: relative, bytes: buffer.length, rules: markdownRuleLines(buffer.toString('utf8')) });
    } catch (error) {
      errors.push({ code: error.code || 'invalid-rule-file', path: relative, message: error.message });
    }
  }
  let duplicateCount = 0;
  for (const parent of documents) {
    const parentRules = new Map(parent.rules.map((rule) => [rule.normalized, rule.line]));
    for (const child of documents) {
      if (!isAncestorRule(parent.path, child.path)) continue;
      for (const rule of child.rules) {
        const parentLine = parentRules.get(rule.normalized);
        if (!parentLine) continue;
        duplicateCount += 1;
        warnings.push({
          code: 'duplicate-inherited-rule',
          parent: parent.path,
          parentLine,
          child: child.path,
          childLine: rule.line,
          fingerprint: `sha256:${createHash('sha256').update(rule.normalized).digest('hex')}`,
        });
      }
    }
  }
  checks.push({
    code: 'rule-navigation',
    ruleFiles: documents.length,
    duplicateInheritedRules: duplicateCount,
    status: errors.length ? 'fail' : duplicateCount ? 'warn' : 'pass',
  });
  return { errors, warnings, checks, documents };
}

async function ancestorRulePaths(projectRoot, requestedPaths) {
  const paths = new Set(['AGENTS.md']);
  for (const requested of requestedPaths) {
    const absolute = safeProjectPath(projectRoot, requested, 'Context 路径');
    const entry = await statOrNull(absolute);
    const relative = posixProjectPath(path.relative(projectRoot, entry?.isFile() ? path.dirname(absolute) : absolute));
    const segments = relative ? relative.split('/') : [];
    for (let index = 0; index <= segments.length; index += 1) {
      const candidate = [...segments.slice(0, index), 'AGENTS.md'].join('/');
      const candidatePath = safeProjectPath(projectRoot, candidate, '祖先规则');
      await assertNoSymlinkSegments(projectRoot, candidatePath);
      if ((await statOrNull(candidatePath))?.isFile()) paths.add(candidate);
    }
  }
  return [...paths].sort((left, right) => left.localeCompare(right));
}

async function findIndexFile(directory, basename) {
  for (const extension of ['json', 'yaml', 'yml']) {
    const candidate = path.join(directory, `${basename}.${extension}`);
    const entry = await statOrNull(candidate);
    if (entry?.isFile() && !entry.isSymbolicLink()) return candidate;
  }
  return null;
}

async function governanceConfiguration(projectRoot) {
  const manifestPath = path.join(projectRoot, 'agent-foundation.json');
  const manifestStat = await statOrNull(manifestPath);
  if (!manifestStat) {
    return {
      directories: { specs: 'specs', knowledge: 'knowledge' },
      context: { ...DEFAULT_CONTEXT_POLICY },
    };
  }
  const manifest = await readProjectManifest(projectRoot);
  return {
    directories: manifest.directories,
    context: { ...DEFAULT_CONTEXT_POLICY, ...manifest.context },
  };
}

function relationCycle(records, field) {
  const visiting = new Set();
  const visited = new Set();
  function visit(id, trail) {
    if (visiting.has(id)) return [...trail, id];
    if (visited.has(id)) return null;
    visiting.add(id);
    const target = records.get(id)?.meta.relations[field];
    if (typeof target === 'string' && records.has(target)) {
      const cycle = visit(target, [...trail, id]);
      if (cycle) return cycle;
    }
    visiting.delete(id);
    visited.add(id);
    return null;
  }
  for (const id of records.keys()) {
    const cycle = visit(id, []);
    if (cycle) return cycle;
  }
  return null;
}

export async function checkSpecflowGovernance(target) {
  const projectRoot = path.resolve(target);
  const errors = [];
  const warnings = [];
  const checks = [];
  let directories;
  try {
    ({ directories } = await governanceConfiguration(projectRoot));
  } catch (error) {
    return {
      ok: false,
      command: 'specflow-check',
      status: 'fail',
      target: projectRoot,
      errors: [{ code: error.code || 'invalid-manifest', message: error.message }],
      warnings,
      checks,
    };
  }
  const specsRoot = safeProjectPath(projectRoot, directories.specs, 'Specs 目录');
  const specsEntry = await statOrNull(specsRoot);
  if (!specsEntry?.isDirectory() || specsEntry.isSymbolicLink()) {
    return {
      ok: false,
      command: 'specflow-check',
      status: 'fail',
      target: projectRoot,
      errors: [{ code: 'invalid-specs-root', path: directories.specs }],
      warnings,
      checks,
    };
  }
  const records = new Map();
  const entries = (await readdir(specsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink() && !entry.name.startsWith('.'))
    .sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const specDir = path.join(specsRoot, entry.name);
    const metaPath = await findIndexFile(specDir, 'meta');
    if (!metaPath) {
      warnings.push({ code: 'spec-directory-without-meta', directory: entry.name });
      continue;
    }
    try {
      await assertNoSymlinkSegments(projectRoot, metaPath);
      const meta = validateSpecMetaStructure(await readStructuredDocument(metaPath, 'Specflow Meta'), {
        expectedId: entry.name,
      });
      for (const [role, artifact] of Object.entries(meta.artifacts)) {
        if (artifact === null || role === 'lifecycle_dir') continue;
        const absolute = path.resolve(specDir, artifact);
        relativeInside(specDir, absolute);
        await assertNoSymlinkSegments(specDir, absolute);
        if (!(await statOrNull(absolute))?.isFile()) {
          throw new FoundationError('spec-artifact-missing', 'Meta 引用的事项产物不存在', {
            specId: meta.id,
            role,
            path: artifact,
          });
        }
      }
      if (['archived', 'superseded', 'cancelled'].includes(meta.status)) {
        const chain = await verifyLifecycleChain(specDir, {
          receiptPath: meta.artifacts.archive_receipt,
          lifecycleDir: meta.artifacts.lifecycle_dir,
        });
        if (
          chain.currentState !== meta.status ||
          canonicalJson(chain.currentRelations) !== canonicalJson(meta.relations)
        ) {
          throw new FoundationError('spec-meta-chain-out-of-sync', '终态 Meta 未投影到 Lifecycle 链尾', {
            specId: meta.id,
          });
        }
      }
      records.set(meta.id, { meta, specDir });
      checks.push({ code: 'spec-meta', specId: meta.id, status: 'pass' });
    } catch (error) {
      errors.push({ code: error.code || 'invalid-spec-meta', specId: entry.name, message: error.message });
    }
  }

  const requireTarget = (sourceId, field, targetId, reverseField, reverseMany) => {
    const target = records.get(targetId)?.meta;
    if (!target) {
      errors.push({ code: 'spec-relation-target-missing', specId: sourceId, field, targetId });
      return;
    }
    const reverse = target.relations[reverseField];
    const reciprocal = reverseMany ? Array.isArray(reverse) && reverse.includes(sourceId) : reverse === sourceId;
    if (!reciprocal) errors.push({ code: 'spec-relation-not-reciprocal', specId: sourceId, field, targetId });
  };
  for (const [id, { meta }] of records) {
    if (meta.relations.parent) requireTarget(id, 'parent', meta.relations.parent, 'children', true);
    for (const child of meta.relations.children) requireTarget(id, 'children', child, 'parent', false);
    if (meta.relations.superseded_by) requireTarget(id, 'superseded_by', meta.relations.superseded_by, 'supersedes', true);
    for (const superseded of meta.relations.supersedes) requireTarget(id, 'supersedes', superseded, 'superseded_by', false);
  }
  for (const field of ['parent', 'superseded_by']) {
    const cycle = relationCycle(records, field);
    if (cycle) errors.push({ code: 'spec-relation-cycle', field, specIds: cycle });
  }
  checks.push({ code: 'specflow-relations', specs: records.size, status: errors.length ? 'fail' : 'pass' });
  return {
    ok: errors.length === 0,
    command: 'specflow-check',
    status: errors.length ? 'fail' : warnings.length ? 'warn' : 'pass',
    target: projectRoot,
    errors,
    warnings,
    checks,
  };
}

function safeProjectPath(projectRoot, relative, label) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative)) {
    throw new FoundationError('unsafe-governance-path', `${label} 必须是项目内相对路径`, { path: relative });
  }
  const absolute = path.resolve(projectRoot, relative);
  relativeInside(projectRoot, absolute);
  return absolute;
}

async function loadGovernanceIndexes(projectRoot) {
  const { directories, context } = await governanceConfiguration(projectRoot);
  const knowledgeRoot = safeProjectPath(projectRoot, directories.knowledge, 'Knowledge 目录');
  const [registryPath, mapPath] = await Promise.all([
    findIndexFile(knowledgeRoot, 'registry'),
    findIndexFile(knowledgeRoot, 'code-entry-map'),
  ]);
  if (!registryPath || !mapPath) {
    throw new FoundationError('missing-knowledge-index', 'Knowledge Registry 或 Code Entry Map 不存在');
  }
  await Promise.all([
    assertNoSymlinkSegments(projectRoot, registryPath),
    assertNoSymlinkSegments(projectRoot, mapPath),
  ]);
  const [registry, codeEntryMap] = await Promise.all([
    readStructuredDocument(registryPath, 'Knowledge Registry'),
    readStructuredDocument(mapPath, 'Code Entry Map'),
  ]);
  return { directories, context, knowledgeRoot, registryPath, mapPath, registry, codeEntryMap };
}

export async function checkKnowledgeGovernance(target) {
  const projectRoot = path.resolve(target);
  const errors = [];
  const warnings = [];
  const checks = [];
  let loaded;
  try {
    loaded = await loadGovernanceIndexes(projectRoot);
  } catch (error) {
    return {
      ok: false,
      command: 'knowledge-check',
      status: 'fail',
      target: projectRoot,
      errors: [{ code: error.code || 'invalid-knowledge-index', message: error.message }],
      warnings,
      checks,
    };
  }
  const { registry, codeEntryMap, knowledgeRoot } = loaded;
  if (normalizedIndexVersion(registry) !== 1 || !Array.isArray(registry.entries)) {
    errors.push({ code: 'invalid-knowledge-registry' });
  }
  if (normalizedIndexVersion(codeEntryMap) !== 1 || !Array.isArray(codeEntryMap.entries)) {
    errors.push({ code: 'invalid-code-entry-map' });
  }
  const entries = Array.isArray(registry.entries) ? registry.entries : [];
  const byId = new Map();
  for (const entry of entries) {
    const entryErrorCount = errors.length;
    const valid =
      entry &&
      typeof entry === 'object' &&
      !Array.isArray(entry) &&
      typeof entry.id === 'string' &&
      /^[a-z0-9][a-z0-9-]{0,63}$/u.test(entry.id) &&
      typeof entry.title === 'string' &&
      ['current', 'review-required', 'retired'].includes(entry.status) &&
      typeof entry.path === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/u.test(entry.last_reviewed_at) &&
      stringArray(entry.scope) &&
      stringArray(entry.topics) &&
      stringArray(entry.authoritative_sources) &&
      stringArray(entry.refresh_triggers) &&
      stringArray(entry.load_when) &&
      Array.isArray(entry.source_evidence) &&
      (entry.status_reason === undefined ||
        entry.status_reason === null ||
        (typeof entry.status_reason === 'string' && entry.status_reason.trim().length > 0)) &&
      (entry.superseded_by === undefined ||
        entry.superseded_by === null ||
        (typeof entry.superseded_by === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/u.test(entry.superseded_by))) &&
      (entry.last_projection === undefined || validKnowledgeProjectionMarker(entry.last_projection));
    if (!valid || byId.has(entry?.id)) {
      errors.push({ code: byId.has(entry?.id) ? 'duplicate-knowledge-id' : 'invalid-knowledge-entry', id: entry?.id });
      continue;
    }
    if (
      entry.status !== 'retired' &&
      ((entry.status_reason !== undefined && entry.status_reason !== null) ||
        (entry.superseded_by !== undefined && entry.superseded_by !== null))
    ) {
      errors.push({ code: 'active-knowledge-has-retirement-metadata', id: entry.id });
    }
    if (entry.last_projection) {
      const expectsCurrent = ['create', 'update', 'still-valid'].includes(entry.last_projection.action);
      if ((expectsCurrent && entry.status !== 'current') || (!expectsCurrent && entry.status !== 'retired')) {
        errors.push({ code: 'knowledge-projection-status-mismatch', id: entry.id });
      }
      if (entry.last_projection.reviewed_at !== entry.last_reviewed_at) {
        errors.push({ code: 'knowledge-projection-review-date-mismatch', id: entry.id });
      }
      if (entry.last_projection.action === 'supersede' && !entry.superseded_by) {
        errors.push({ code: 'knowledge-projection-target-missing', id: entry.id });
      }
      if (entry.last_projection.action === 'retire' && entry.superseded_by) {
        errors.push({ code: 'knowledge-retire-has-supersede-target', id: entry.id });
      }
    }
    byId.set(entry.id, entry);
    try {
      for (const scopedPath of entry.scope) safeProjectPath(projectRoot, scopedPath, 'Knowledge scope');
      const documentPath = path.resolve(knowledgeRoot, entry.path);
      relativeInside(knowledgeRoot, documentPath);
      await assertNoSymlinkSegments(projectRoot, documentPath);
      if (!(await statOrNull(documentPath))?.isFile()) errors.push({ code: 'knowledge-document-missing', id: entry.id });
      const evidenceByPath = new Map();
      for (const evidence of entry.source_evidence) {
        if (
          !evidence ||
          typeof evidence !== 'object' ||
          Array.isArray(evidence) ||
          typeof evidence.path !== 'string' ||
          typeof evidence.digest !== 'string' ||
          !/^sha256:[a-f0-9]{64}$/u.test(evidence.digest) ||
          evidenceByPath.has(evidence.path)
        ) {
          errors.push({ code: 'invalid-knowledge-source-evidence', id: entry.id });
          continue;
        }
        evidenceByPath.set(evidence.path, evidence.digest);
      }
      if (
        evidenceByPath.size !== entry.authoritative_sources.length ||
        entry.authoritative_sources.some((source) => !evidenceByPath.has(source))
      ) {
        errors.push({ code: 'knowledge-source-evidence-incomplete', id: entry.id });
      }
      for (const source of entry.authoritative_sources) {
        const sourcePath = safeProjectPath(projectRoot, source, 'Knowledge 权威来源');
        await assertNoSymlinkSegments(projectRoot, sourcePath);
        const sourceStat = await statOrNull(sourcePath);
        if (!sourceStat?.isFile()) {
          errors.push({ code: 'knowledge-source-missing', id: entry.id, source });
          continue;
        }
        const actual = `sha256:${createHash('sha256').update(await readFile(sourcePath)).digest('hex')}`;
        if (evidenceByPath.get(source) !== actual) {
          const issue = { code: 'knowledge-source-digest-mismatch', id: entry.id, source };
          if (entry.status === 'current') errors.push(issue);
          else warnings.push(issue);
        }
      }
      if (entry.status === 'review-required') warnings.push({ code: 'knowledge-review-required', id: entry.id });
      checks.push({ code: 'knowledge-entry', id: entry.id, status: errors.length === entryErrorCount ? 'pass' : 'fail' });
    } catch (error) {
      errors.push({ code: error.code || 'invalid-knowledge-entry', id: entry.id, message: error.message });
    }
  }
  for (const entry of entries) {
    if (!entry?.superseded_by) continue;
    const target = byId.get(entry.superseded_by);
    if (!target) errors.push({ code: 'knowledge-supersede-target-missing', id: entry.id, target: entry.superseded_by });
    else if (target.status !== 'current') {
      errors.push({ code: 'knowledge-supersede-target-not-current', id: entry.id, target: entry.superseded_by });
    }
    const visited = new Set([entry.id]);
    let cursor = target;
    while (cursor?.superseded_by) {
      if (visited.has(cursor.superseded_by)) {
        errors.push({ code: 'knowledge-supersession-cycle', id: entry.id });
        break;
      }
      visited.add(cursor.superseded_by);
      cursor = byId.get(cursor.superseded_by);
    }
  }
  const mappings = Array.isArray(codeEntryMap.entries) ? codeEntryMap.entries : [];
  const taskTypes = new Set();
  for (const mapping of mappings) {
    const mappingErrorCount = errors.length;
    if (
      !mapping ||
      typeof mapping.task_type !== 'string' ||
      !stringArray(mapping.start_paths) ||
      !stringArray(mapping.module_rules) ||
      !stringArray(mapping.knowledge) ||
      !Array.isArray(mapping.exclude_by_default) ||
      !mapping.exclude_by_default.every((item) => typeof item === 'string') ||
      taskTypes.has(mapping.task_type)
    ) {
      errors.push({ code: taskTypes.has(mapping?.task_type) ? 'duplicate-task-type' : 'invalid-code-entry', taskType: mapping?.task_type });
      continue;
    }
    taskTypes.add(mapping.task_type);
    for (const field of ['start_paths', 'module_rules', 'knowledge', 'exclude_by_default']) {
      for (const duplicate of duplicateStrings(mapping[field])) {
        errors.push({ code: 'duplicate-code-entry-value', taskType: mapping.task_type, field, value: duplicate });
      }
    }
    const excluded = new Set(mapping.exclude_by_default.map(posixProjectPath));
    for (const [field, candidates] of [
      ['start_paths', mapping.start_paths],
      ['module_rules', mapping.module_rules],
    ]) {
      for (const candidate of candidates) {
        if (excluded.has(posixProjectPath(candidate))) {
          errors.push({ code: 'code-entry-path-conflict', taskType: mapping.task_type, field, path: candidate });
        }
      }
    }
    for (const id of mapping.knowledge) {
      if (!byId.has(id)) errors.push({ code: 'unknown-knowledge-reference', taskType: mapping.task_type, id });
      else if (byId.get(id).status === 'retired') {
        errors.push({ code: 'retired-knowledge-reference', taskType: mapping.task_type, id });
      }
    }
    for (const candidate of [...mapping.start_paths, ...mapping.module_rules, ...mapping.exclude_by_default]) {
      try {
        safeProjectPath(projectRoot, candidate, 'Code Entry Map 路径');
      } catch (error) {
        errors.push({ code: error.code || 'unsafe-governance-path', taskType: mapping.task_type });
      }
    }
    for (const startPath of mapping.start_paths) {
      try {
        const absolute = safeProjectPath(projectRoot, startPath, '起始路径');
        await assertNoSymlinkSegments(projectRoot, absolute);
        if (!(await statOrNull(absolute))) errors.push({ code: 'start-path-missing', taskType: mapping.task_type, path: startPath });
      } catch (error) {
        if (error.code === 'unsafe-symlink') {
          errors.push({ code: error.code, taskType: mapping.task_type, path: startPath });
        }
      }
    }
    for (const moduleRule of mapping.module_rules) {
      try {
        const rulePath = safeProjectPath(projectRoot, moduleRule, '模块规则');
        await assertNoSymlinkSegments(projectRoot, rulePath);
        if (!(await statOrNull(rulePath))?.isFile()) errors.push({ code: 'module-rule-missing', taskType: mapping.task_type, path: moduleRule });
      } catch (error) {
        if (error.code === 'unsafe-symlink') {
          errors.push({ code: error.code, taskType: mapping.task_type, path: moduleRule });
        }
      }
    }
    for (const excludedPath of mapping.exclude_by_default) {
      try {
        const absolute = safeProjectPath(projectRoot, excludedPath, '默认排除路径');
        await assertNoSymlinkSegments(projectRoot, absolute);
        if (!(await statOrNull(absolute))) warnings.push({ code: 'excluded-path-missing', taskType: mapping.task_type, path: excludedPath });
      } catch (error) {
        if (error.code === 'unsafe-symlink') {
          errors.push({ code: error.code, taskType: mapping.task_type, path: excludedPath });
        }
      }
    }
    checks.push({ code: 'code-entry', taskType: mapping.task_type, status: errors.length === mappingErrorCount ? 'pass' : 'fail' });
  }
  const ruleNavigation = await inspectRuleNavigation(projectRoot, loaded, mappings);
  errors.push(...ruleNavigation.errors);
  warnings.push(...ruleNavigation.warnings);
  checks.push(...ruleNavigation.checks);
  return {
    ok: errors.length === 0,
    command: 'knowledge-check',
    status: errors.length ? 'fail' : warnings.length ? 'warn' : 'pass',
    target: projectRoot,
    errors,
    warnings,
    checks,
    registryEntries: entries.length,
    codeEntries: mappings.length,
    ruleFiles: ruleNavigation.documents.map(({ path: rulePath, bytes }) => ({ path: rulePath, bytes })),
  };
}

function validateKnowledgeProjectionDocument(projection) {
  const errors = [];
  const allowedProjectionKeys = new Set(['impact', 'reason', 'decisions']);
  if (
    !projection ||
    typeof projection !== 'object' ||
    Array.isArray(projection) ||
    Object.keys(projection).some((key) => !allowedProjectionKeys.has(key)) ||
    !['reviewed', 'none'].includes(projection.impact) ||
    !Array.isArray(projection.decisions)
  ) {
    return [{ code: 'invalid-knowledge-projection' }];
  }
  if (projection.impact === 'none') {
    if (typeof projection.reason !== 'string' || !projection.reason.trim() || projection.decisions.length) {
      errors.push({ code: 'invalid-no-impact-projection' });
    }
    return errors;
  }
  if (!projection.decisions.length) errors.push({ code: 'knowledge-decisions-missing' });
  const ids = new Set();
  const allowedDecisionKeys = new Set(['action', 'knowledge_id', 'target_knowledge_id', 'reason', 'evidence_refs']);
  for (const decision of projection.decisions) {
    const valid =
      decision &&
      typeof decision === 'object' &&
      !Array.isArray(decision) &&
      !Object.keys(decision).some((key) => !allowedDecisionKeys.has(key)) &&
      ['create', 'update', 'still-valid', 'supersede', 'retire'].includes(decision.action) &&
      typeof decision.knowledge_id === 'string' &&
      /^[a-z0-9][a-z0-9-]{0,63}$/u.test(decision.knowledge_id) &&
      typeof decision.reason === 'string' &&
      decision.reason.trim().length > 0 &&
      stringArray(decision.evidence_refs) &&
      decision.evidence_refs.length > 0;
    if (!valid) {
      errors.push({ code: 'invalid-knowledge-decision', id: decision?.knowledge_id });
      continue;
    }
    if (ids.has(decision.knowledge_id)) errors.push({ code: 'duplicate-knowledge-decision', id: decision.knowledge_id });
    ids.add(decision.knowledge_id);
    if (
      decision.action === 'supersede'
        ? typeof decision.target_knowledge_id !== 'string' ||
          !/^[a-z0-9][a-z0-9-]{0,63}$/u.test(decision.target_knowledge_id) ||
          decision.target_knowledge_id === decision.knowledge_id
        : decision.target_knowledge_id !== undefined && decision.target_knowledge_id !== null
    ) {
      errors.push({ code: 'invalid-knowledge-target', id: decision.knowledge_id });
    }
  }
  return errors;
}

function knowledgeProjectionDecisionDigest(decision) {
  const canonical = {
    action: decision.action,
    knowledge_id: decision.knowledge_id,
    target_knowledge_id: decision.target_knowledge_id || null,
    reason: decision.reason,
    evidence_refs: [...decision.evidence_refs].sort(),
  };
  return `sha256:${createHash('sha256').update(JSON.stringify(canonical)).digest('hex')}`;
}

function expectedKnowledgeProjectionMarker(decision, specId, reviewedAt) {
  return {
    spec_id: specId,
    action: decision.action,
    reviewed_at: reviewedAt,
    decision_digest: knowledgeProjectionDecisionDigest(decision),
  };
}

function knowledgeProjectionMarkerMatches(entry, decision, specId, reviewedAt) {
  return JSON.stringify(entry.last_projection) === JSON.stringify(expectedKnowledgeProjectionMarker(decision, specId, reviewedAt));
}

async function refreshKnowledgeSourceEvidence(projectRoot, entry) {
  const evidence = [];
  for (const source of entry.authoritative_sources) {
    const sourcePath = safeProjectPath(projectRoot, source, 'Knowledge 权威来源');
    await assertNoSymlinkSegments(projectRoot, sourcePath);
    if (!(await statOrNull(sourcePath))?.isFile()) {
      throw new FoundationError('knowledge-source-missing', 'Knowledge 权威来源不存在', { id: entry.id, source });
    }
    evidence.push({
      path: source,
      digest: `sha256:${createHash('sha256').update(await readFile(sourcePath)).digest('hex')}`,
    });
  }
  return evidence;
}

function publicKnowledgeProjectionPlan(plan) {
  const { proposedRegistry: _registry, registryPath: _path, ...result } = plan;
  return result;
}

async function buildKnowledgeProjectionPlan(target, { projectionPath, specId, reviewedAt, changedPaths = [] }) {
  const projectRoot = path.resolve(target);
  if (typeof specId !== 'string' || !/^[a-z0-9][a-z0-9-]{0,127}$/u.test(specId)) {
    throw new FoundationError('invalid-spec-id', 'specId 必须是稳定的小写连字符标识');
  }
  if (typeof reviewedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(reviewedAt)) {
    throw new FoundationError('invalid-reviewed-at', 'reviewedAt 必须使用 YYYY-MM-DD');
  }
  if (!Array.isArray(changedPaths) || changedPaths.some((candidate) => typeof candidate !== 'string' || !candidate.trim())) {
    throw new FoundationError('invalid-knowledge-paths', 'changedPaths 必须是非空相对路径数组');
  }
  const requestedPaths = changedPaths.map((candidate) => {
    safeProjectPath(projectRoot, candidate, 'Knowledge 变更路径');
    return candidate.replace(/^\.\//u, '').replace(/\\/gu, '/').replace(/\/$/u, '');
  });
  const projectionAbsolute = safeProjectPath(projectRoot, projectionPath, 'Knowledge Projection');
  await assertNoSymlinkSegments(projectRoot, projectionAbsolute);
  if (!(await statOrNull(projectionAbsolute))?.isFile()) {
    throw new FoundationError('knowledge-projection-missing', 'Knowledge Projection 文件不存在');
  }
  const projection = await readStructuredDocument(projectionAbsolute, 'Knowledge Projection');
  const projectionErrors = validateKnowledgeProjectionDocument(projection);
  if (projectionErrors.length) {
    return {
      ok: false,
      command: 'knowledge-projection-plan',
      status: 'blocked',
      target: projectRoot,
      specId,
      reviewedAt,
      errors: projectionErrors,
      warnings: [],
      changes: [],
      registryChanged: false,
    };
  }
  const loaded = await loadGovernanceIndexes(projectRoot);
  const knowledgeCheck = await checkKnowledgeGovernance(projectRoot);
  const registryEntries = Array.isArray(loaded.registry.entries) ? loaded.registry.entries : [];
  const matchedKnowledgeIds = requestedPaths.length
    ? registryEntries
        .filter(
          (entry) =>
            entry &&
            entry.status !== 'retired' &&
            Array.isArray(entry.scope) &&
            entry.scope.some((scope) => requestedPaths.some((candidate) => pathsOverlap(scope, candidate))),
        )
        .map((entry) => entry.id)
        .sort()
    : [];
  const coverage = {
    mode: requestedPaths.length ? 'path-overlap' : 'not-provided',
    paths: requestedPaths,
    matchedKnowledgeIds,
  };
  const coverageWarnings = requestedPaths.length ? [] : [{ code: 'knowledge-coverage-paths-not-provided' }];
  if (projection.impact === 'none') {
    const noImpactErrors = [
      ...knowledgeCheck.errors,
      ...matchedKnowledgeIds.map((id) => ({ code: 'knowledge-impact-unaddressed', id })),
    ];
    if (noImpactErrors.length) {
      return {
        ok: false,
        command: 'knowledge-projection-plan',
        status: 'blocked',
        target: projectRoot,
        specId,
        reviewedAt,
        errors: noImpactErrors,
        warnings: coverageWarnings,
        coverage,
        changes: [],
        registryChanged: false,
      };
    }
    return {
      ok: true,
      command: 'knowledge-projection-plan',
      status: 'no-impact',
      target: projectRoot,
      specId,
      reviewedAt,
      errors: [],
      warnings: coverageWarnings,
      coverage,
      changes: [],
      registryChanged: false,
      reason: projection.reason,
    };
  }
  const decisionIds = new Set(projection.decisions.map((decision) => decision.knowledge_id));
  const repairableCodes = new Set([
    'invalid-knowledge-source-evidence',
    'knowledge-source-evidence-incomplete',
    'knowledge-source-digest-mismatch',
  ]);
  const blockingErrors = knowledgeCheck.errors.filter(
    (error) => !decisionIds.has(error.id) || !repairableCodes.has(error.code),
  );
  for (const id of matchedKnowledgeIds) {
    if (!decisionIds.has(id)) blockingErrors.push({ code: 'knowledge-impact-unaddressed', id });
  }
  if (blockingErrors.length) {
    return {
      ok: false,
      command: 'knowledge-projection-plan',
      status: 'blocked',
      target: projectRoot,
      specId,
      reviewedAt,
      errors: blockingErrors,
      warnings: coverageWarnings,
      coverage,
      changes: [],
      registryChanged: false,
    };
  }

  const proposedRegistry = structuredClone(loaded.registry);
  const entries = Array.isArray(proposedRegistry.entries) ? proposedRegistry.entries : [];
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const errors = [];
  const changes = [];
  const decisions = [...projection.decisions].sort((left, right) => left.knowledge_id.localeCompare(right.knowledge_id));
  const positiveActions = new Set(['create', 'update', 'still-valid']);
  for (const decision of decisions) {
    const entry = byId.get(decision.knowledge_id);
    if (!entry) {
      errors.push({ code: 'knowledge-entry-not-prepared', id: decision.knowledge_id, action: decision.action });
      continue;
    }
    const documentPath = path.resolve(loaded.knowledgeRoot, entry.path);
    try {
      relativeInside(loaded.knowledgeRoot, documentPath);
      await assertNoSymlinkSegments(projectRoot, documentPath);
      if (!(await statOrNull(documentPath))?.isFile()) errors.push({ code: 'knowledge-document-missing', id: entry.id });
    } catch (error) {
      errors.push({ code: error.code || 'unsafe-governance-path', id: entry.id });
    }
    const alreadyApplied = knowledgeProjectionMarkerMatches(entry, decision, specId, reviewedAt);
    if (decision.action === 'create' && entry.status !== 'review-required' && !alreadyApplied) {
      errors.push({ code: 'knowledge-create-not-prepared', id: entry.id });
    }
    if (decision.action !== 'create' && entry.status === 'retired' && !alreadyApplied) {
      errors.push({ code: 'knowledge-entry-already-retired', id: entry.id });
    }
    entry.status = positiveActions.has(decision.action) ? 'current' : 'retired';
    entry.last_reviewed_at = reviewedAt;
    if (entry.status === 'current') {
      entry.status_reason = null;
      entry.superseded_by = null;
    } else {
      entry.status_reason = decision.reason;
      entry.superseded_by = decision.action === 'supersede' ? decision.target_knowledge_id : null;
    }
    entry.last_projection = expectedKnowledgeProjectionMarker(decision, specId, reviewedAt);
  }
  for (const decision of decisions.filter((item) => item.action === 'supersede')) {
    const targetEntry = byId.get(decision.target_knowledge_id);
    if (!targetEntry) errors.push({ code: 'knowledge-supersede-target-missing', id: decision.knowledge_id, target: decision.target_knowledge_id });
    else if (targetEntry.status !== 'current') {
      errors.push({ code: 'knowledge-supersede-target-not-current', id: decision.knowledge_id, target: decision.target_knowledge_id });
    }
  }
  for (const decision of decisions.filter((item) => ['supersede', 'retire'].includes(item.action))) {
    for (const mapping of loaded.codeEntryMap.entries) {
      if (mapping.knowledge.includes(decision.knowledge_id)) {
        errors.push({
          code: 'retired-knowledge-still-routed',
          id: decision.knowledge_id,
          taskType: mapping.task_type,
        });
      }
    }
  }
  if (errors.length) {
    return {
      ok: false,
      command: 'knowledge-projection-plan',
      status: 'blocked',
      target: projectRoot,
      specId,
      reviewedAt,
      errors,
      warnings: coverageWarnings,
      coverage,
      changes: [],
      registryChanged: false,
    };
  }
  for (const decision of decisions) {
    const original = loaded.registry.entries.find((entry) => entry.id === decision.knowledge_id);
    const entry = byId.get(decision.knowledge_id);
    entry.source_evidence = await refreshKnowledgeSourceEvidence(projectRoot, entry);
    changes.push({
      id: entry.id,
      action: decision.action,
      beforeStatus: original.status,
      afterStatus: entry.status,
      targetKnowledgeId: decision.target_knowledge_id || null,
      sourceEvidenceCount: entry.source_evidence.length,
    });
  }
  const registryChanged = JSON.stringify(proposedRegistry) !== JSON.stringify(loaded.registry);
  return {
    ok: true,
    command: 'knowledge-projection-plan',
    status: registryChanged ? 'planned' : 'unchanged',
    target: projectRoot,
    specId,
    reviewedAt,
    errors: [],
    warnings: coverageWarnings,
    coverage,
    changes,
    registryChanged,
    registryPath: loaded.registryPath,
    proposedRegistry,
  };
}

export async function planKnowledgeProjection(target, options) {
  return publicKnowledgeProjectionPlan(await buildKnowledgeProjectionPlan(target, options));
}

export async function applyKnowledgeProjection(target, options) {
  const projectRoot = path.resolve(target);
  const initial = await buildKnowledgeProjectionPlan(projectRoot, options);
  if (!initial.ok || !initial.registryChanged) {
    return { ...publicKnowledgeProjectionPlan(initial), command: 'knowledge-projection-apply' };
  }
  const lockPath = `${initial.registryPath}.projection.lock`;
  try {
    await writeFile(lockPath, `${JSON.stringify({ specId: options.specId, reviewedAt: options.reviewedAt })}\n`, { flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') throw new FoundationError('knowledge-projection-locked', '已有 Knowledge Projection 正在应用');
    throw error;
  }
  const extension = path.extname(initial.registryPath);
  const temporary = `${initial.registryPath.slice(0, -extension.length)}.tmp-${randomUUID()}${extension}`;
  const rollback = `${initial.registryPath.slice(0, -extension.length)}.rollback-${randomUUID()}${extension}`;
  try {
    const plan = await buildKnowledgeProjectionPlan(projectRoot, options);
    if (!plan.ok) return { ...publicKnowledgeProjectionPlan(plan), command: 'knowledge-projection-apply' };
    if (!plan.registryChanged) return { ...publicKnowledgeProjectionPlan(plan), command: 'knowledge-projection-apply' };
    const serialized = serializeStructuredDocument(plan.registryPath, plan.proposedRegistry);
    await writeFile(temporary, serialized, { flag: 'wx' });
    const roundTrip = await readStructuredDocument(temporary, 'Knowledge Registry 候选');
    if (JSON.stringify(roundTrip) !== JSON.stringify(plan.proposedRegistry)) {
      throw new FoundationError('knowledge-projection-roundtrip-failed', 'Knowledge Registry 候选无法无损回读');
    }
    const originalRegistry = await readFile(plan.registryPath);
    await rename(temporary, plan.registryPath);
    const verification = await buildKnowledgeProjectionPlan(projectRoot, options);
    if (!verification.ok || verification.registryChanged) {
      await writeFile(rollback, originalRegistry, { flag: 'wx' });
      await rename(rollback, plan.registryPath);
      throw new FoundationError('knowledge-projection-verify-failed', 'Knowledge Projection 应用后复核失败');
    }
    return {
      ...publicKnowledgeProjectionPlan(verification),
      command: 'knowledge-projection-apply',
      status: 'applied',
      appliedChanges: plan.changes,
    };
  } finally {
    await rm(temporary, { force: true });
    await rm(rollback, { force: true });
    await rm(lockPath, { force: true });
  }
}

export async function verifyKnowledgeProjection(target, options) {
  const plan = await buildKnowledgeProjectionPlan(target, options);
  if (!plan.ok) return { ...publicKnowledgeProjectionPlan(plan), command: 'knowledge-projection-verify' };
  if (plan.status === 'no-impact') {
    return { ...publicKnowledgeProjectionPlan(plan), command: 'knowledge-projection-verify' };
  }
  return {
    ...publicKnowledgeProjectionPlan(plan),
    command: 'knowledge-projection-verify',
    ok: !plan.registryChanged,
    status: plan.registryChanged ? 'drift' : 'verified',
  };
}

export async function resolveProjectContext(target, { taskType, paths = [] } = {}) {
  const projectRoot = path.resolve(target);
  if (taskType !== undefined && (typeof taskType !== 'string' || !taskType.trim())) {
    throw new FoundationError('invalid-context-selector', 'taskType 必须是非空字符串');
  }
  if (!Array.isArray(paths) || paths.some((candidate) => typeof candidate !== 'string' || !candidate.trim())) {
    throw new FoundationError('invalid-context-selector', 'paths 必须是非空相对路径数组');
  }
  const knowledgeCheck = await checkKnowledgeGovernance(projectRoot);
  if (!knowledgeCheck.ok) {
    return { ...knowledgeCheck, command: 'context-resolve', status: 'blocked', activeSpecs: [], knowledge: [], loadPlan: [] };
  }
  const loaded = await loadGovernanceIndexes(projectRoot);
  const requestedPaths = paths.map((candidate) => {
    safeProjectPath(projectRoot, candidate, 'Context 路径');
    return candidate;
  });
  const taskTypeRoutes = taskType
    ? loaded.codeEntryMap.entries.filter((entry) => entry.task_type === taskType)
    : [];
  const pathRoutes = requestedPaths.length
    ? loaded.codeEntryMap.entries.filter((entry) =>
        entry.start_paths.some((start) => requestedPaths.some((candidate) => pathsOverlap(start, candidate))))
    : [];
  const mappings = [...(requestedPaths.length ? pathRoutes : taskTypeRoutes)]
    .sort((left, right) => left.task_type.localeCompare(right.task_type));
  const warnings = [];
  if (taskType && taskTypeRoutes.length === 0) {
    warnings.push({ code: 'unknown-task-type', taskType });
  }
  if (requestedPaths.length && pathRoutes.length === 0) {
    warnings.push({ code: 'path-route-not-found', paths: requestedPaths });
  }
  if (
    taskTypeRoutes.length &&
    requestedPaths.length &&
    !taskTypeRoutes.some((taskRoute) => pathRoutes.includes(taskRoute))
  ) {
    warnings.push({
      code: 'context-selector-conflict',
      taskType,
      taskTypeRoutes: taskTypeRoutes.map((entry) => entry.task_type).sort((left, right) => left.localeCompare(right)),
      pathRoutes: pathRoutes.map((entry) => entry.task_type).sort((left, right) => left.localeCompare(right)),
    });
  }
  const matchedRoutes = mappings.map((entry) => {
    const matchingPaths = requestedPaths.filter((candidate) =>
      entry.start_paths.some((start) => pathsOverlap(start, candidate)));
    const matchReasons = [];
    if (taskType === entry.task_type) matchReasons.push({ selector: 'task-type', value: taskType });
    if (matchingPaths.length) matchReasons.push({ selector: 'path', values: matchingPaths });
    return { taskType: entry.task_type, matchReasons };
  });
  const selectedIds = new Set(mappings.flatMap((entry) => entry.knowledge));
  if (!taskType && !requestedPaths.length) {
    for (const entry of loaded.registry.entries) if (entry.status !== 'retired') selectedIds.add(entry.id);
  } else {
    for (const entry of loaded.registry.entries) {
      if (requestedPaths.some((candidate) => entry.scope.some((scope) => pathsOverlap(scope, candidate)))) selectedIds.add(entry.id);
    }
  }
  const knowledge = loaded.registry.entries
    .filter((entry) => selectedIds.has(entry.id) && entry.status !== 'retired')
    .map((entry) => ({ id: entry.id, status: entry.status, path: path.posix.join(loaded.directories.knowledge, entry.path.replace(/^\.\//u, '')) }));

  const selectedRulePaths = [
    ...new Set([
      ...(await ancestorRulePaths(projectRoot, requestedPaths)),
      ...mappings.flatMap((entry) => entry.module_rules.map(posixProjectPath)),
    ]),
  ].sort((left, right) => left.localeCompare(right));
  const ruleFiles = [];
  for (const rulePath of selectedRulePaths) {
    const absolute = safeProjectPath(projectRoot, rulePath, 'Context 规则');
    await assertNoSymlinkSegments(projectRoot, absolute);
    const buffer = await readFile(absolute);
    if (buffer.length > loaded.context.maxRuleFileBytes) {
      throw new FoundationError('rule-file-budget-exceeded', '规则文件超过 Manifest 声明的单文件预算', {
        path: rulePath,
        bytes: buffer.length,
        limit: loaded.context.maxRuleFileBytes,
      });
    }
    ruleFiles.push({ path: rulePath, bytes: buffer.length });
  }

  const specsRoot = safeProjectPath(projectRoot, loaded.directories.specs, 'Specs 目录');
  const activeSpecs = [];
  const specsStat = await statOrNull(specsRoot);
  if (specsStat?.isDirectory() && !specsStat.isSymbolicLink()) {
    const directories = (await readdir(specsRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory() && !entry.isSymbolicLink());
    for (const directory of directories.sort((left, right) => left.name.localeCompare(right.name))) {
      const metaPath = await findIndexFile(path.join(specsRoot, directory.name), 'meta');
      if (!metaPath) continue;
      const meta = await readStructuredDocument(metaPath, 'Specflow Meta');
      if (!['draft', 'planned', 'in-progress'].includes(meta.status)) continue;
      if (meta.id !== directory.name || !stringArray(meta.scope) || !meta.artifacts || typeof meta.artifacts !== 'object') {
        throw new FoundationError('invalid-spec-meta', 'Active Spec Meta 结构无效', { directory: directory.name });
      }
      if (requestedPaths.length && !requestedPaths.some((candidate) => meta.scope.some((scope) => pathsOverlap(scope, candidate)))) continue;
      for (const scopedPath of meta.scope) safeProjectPath(projectRoot, scopedPath, 'Spec scope');
      const artifacts = [];
      for (const role of ['spec', 'plan', 'tasks']) {
        const value = meta.artifacts[role];
        if (role !== 'spec' && value === null) continue;
        if (typeof value !== 'string' || path.isAbsolute(value)) {
          throw new FoundationError('invalid-spec-meta', 'Active Spec 缺少安全的必需或已声明产物路径', { directory: directory.name, role });
        }
        const specDirectory = path.join(specsRoot, directory.name);
        const artifactPath = path.resolve(specDirectory, value);
        relativeInside(specDirectory, artifactPath);
        await assertNoSymlinkSegments(projectRoot, artifactPath);
        if (!(await statOrNull(artifactPath))?.isFile()) {
          throw new FoundationError('spec-artifact-missing', 'Active Spec 必需或已声明产物不存在', { directory: directory.name, role });
        }
        const relativePath = path.relative(projectRoot, artifactPath).split(path.sep).join('/');
        artifacts.push({ role, path: relativePath, buffer: await readFile(artifactPath) });
      }
      activeSpecs.push({
        id: meta.id,
        status: meta.status,
        directory: path.posix.join(loaded.directories.specs, directory.name),
        scope: meta.scope,
        summary: meta.active_context?.summary || null,
        nextTaskId: meta.active_context?.next_task_id || null,
        artifacts: artifacts.map((artifact) => artifact.path),
        markdownBytes: artifacts.reduce((total, artifact) => total + artifact.buffer.length, 0),
        artifactDocuments: artifacts,
      });
    }
  }
  let allocatedFullTextBytes = 0;
  const allocationOrder = [...activeSpecs].sort(
    (left, right) => left.markdownBytes - right.markdownBytes || left.id.localeCompare(right.id),
  );
  for (const spec of allocationOrder) {
    if (spec.markdownBytes > loaded.context.perSpecFullTextBytes) {
      spec.loadMode = 'sectioned';
      spec.loadReason = 'per-spec-budget-exceeded';
      continue;
    }
    if (allocatedFullTextBytes + spec.markdownBytes > loaded.context.totalFullTextBytes) {
      spec.loadMode = 'sectioned';
      spec.loadReason = 'total-budget-exceeded';
      continue;
    }
    spec.loadMode = 'full';
    spec.loadReason = 'within-budget';
    allocatedFullTextBytes += spec.markdownBytes;
  }
  for (const spec of activeSpecs) {
    spec.contextIndex =
      spec.loadMode === 'sectioned'
        ? buildSpecContextIndex(spec.artifactDocuments, loaded.context.maxIndexEntriesPerArtifact)
        : null;
    delete spec.artifactDocuments;
  }
  const loadPlan = [
    ...new Set([
      ...selectedRulePaths,
      ...activeSpecs.filter((entry) => entry.loadMode === 'full').flatMap((entry) => entry.artifacts),
      ...knowledge.map((entry) => entry.path),
    ]),
  ];
  const totalMarkdownBytes = activeSpecs.reduce((total, spec) => total + spec.markdownBytes, 0);
  return {
    ok: true,
    command: 'context-resolve',
    status: knowledge.some((entry) => entry.status === 'review-required') ? 'review-required' : 'resolved',
    target: projectRoot,
    selectors: { taskType: taskType || null, paths: requestedPaths },
    matchedRoutes,
    startPaths: [
      ...new Set(mappings.flatMap((entry) => entry.start_paths.map((candidate) => posixProjectPath(candidate) || '.'))),
    ].sort((left, right) => left.localeCompare(right)),
    warnings,
    contextBudget: {
      ...loaded.context,
      activeSpecCount: activeSpecs.length,
      fullTextSpecCount: activeSpecs.filter((entry) => entry.loadMode === 'full').length,
      sectionedSpecCount: activeSpecs.filter((entry) => entry.loadMode === 'sectioned').length,
      totalMarkdownBytes,
      allocatedFullTextBytes,
      remainingFullTextBytes: loaded.context.totalFullTextBytes - allocatedFullTextBytes,
    },
    activeSpecs,
    ruleFiles,
    knowledge,
    loadPlan,
    excludeByDefault: [
      ...new Set(mappings.flatMap((entry) => entry.exclude_by_default.map((candidate) => posixProjectPath(candidate) || '.'))),
    ].sort((left, right) => left.localeCompare(right)),
  };
}

export async function inspectSourceControlSnapshot(
  target,
  {
    baseRevision,
    sourceRevision = 'HEAD',
    includePaths = [],
    excludePaths = [],
    provider = 'local-git',
    adapterRegistry = defaultAdapterRegistry,
  } = {},
) {
  const projectRoot = path.resolve(target);
  if (typeof baseRevision !== 'string' || !baseRevision.trim()) {
    throw new FoundationError('invalid-source-control-revision', '必须提供非空 baseRevision');
  }
  if (typeof sourceRevision !== 'string' || !sourceRevision.trim()) {
    throw new FoundationError('invalid-source-control-revision', 'sourceRevision 必须是非空字符串');
  }
  if (typeof provider !== 'string' || !provider.trim()) {
    throw new FoundationError('invalid-source-control-provider', 'provider 必须是非空字符串');
  }
  for (const [label, values] of [
    ['includePaths', includePaths],
    ['excludePaths', excludePaths],
  ]) {
    if (!Array.isArray(values) || values.some((value) => typeof value !== 'string')) {
      throw new FoundationError('invalid-source-control-path', `${label} 必须是相对路径数组`);
    }
  }
  const adapter = adapterRegistry?.get?.('source-control', provider);
  if (!adapter || typeof adapter.inspectMergeCandidate !== 'function') {
    throw new FoundationError('source-control-provider-unavailable', 'Source Control Provider 未注册或不支持候选检查', {
      provider,
    });
  }
  try {
    const snapshot = await adapter.inspectMergeCandidate({
      projectRoot,
      baseRevision,
      sourceRevision,
      includePaths,
      excludePaths,
    });
    return {
      ok: true,
      command: 'source-control-inspect',
      status: 'resolved',
      target: projectRoot,
      snapshot,
    };
  } catch (error) {
    throw new FoundationError(error.code || 'source-control-inspect-failed', error.message, error.details);
  }
}

const CHANGE_GATE_PHASES = new Set(['work', 'delivery']);
const CHANGE_GATE_EXEMPTIONS = new Set([
  'assets-only',
  'docs-only',
  'generated-only',
  'styles-only',
  'tests-only',
]);

function changeGatePathMatchesExemption(exemption, candidatePath) {
  const normalized = candidatePath.replace(/\\/gu, '/');
  if (exemption === 'assets-only') {
    return /\.(?:avif|gif|jpe?g|png|svg|webp|woff2?|ttf|otf)$/iu.test(normalized);
  }
  if (exemption === 'docs-only') return /\.(?:adoc|md|mdx|rst|txt)$/iu.test(normalized);
  if (exemption === 'styles-only') return /\.(?:css|less|sass|scss|styl)$/iu.test(normalized);
  if (exemption === 'tests-only') {
    return (
      /(^|\/)(?:__tests__|test|tests)(\/|$)/u.test(normalized) ||
      /\.(?:test|spec)\.[^/]+$/u.test(normalized) ||
      /(^|\/)(?:test_[^/]+|[^/]+_test)\.(?:go|py|rs)$/u.test(normalized) ||
      /\.snap$/u.test(normalized)
    );
  }
  if (exemption === 'generated-only') {
    return (
      /(^|\/)(?:generated|__generated__)(\/|$)/u.test(normalized) ||
      /\.generated\.[^/]+$/u.test(normalized)
    );
  }
  return false;
}

function changeGateChangedPaths(snapshot) {
  return [
    ...new Set(
      (snapshot.evidence?.changes || []).flatMap((change) =>
        (change.paths || []).map((entry) => entry.path),
      ),
    ),
  ].sort();
}

async function loadChangeGateSpec(projectRoot, specId) {
  if (typeof specId !== 'string' || !/^[a-z0-9][a-z0-9-]{0,127}$/u.test(specId)) {
    throw new FoundationError('invalid-change-gate-spec', 'specId 必须是稳定的小写连字符标识');
  }
  const { directories } = await governanceConfiguration(projectRoot);
  const specsRoot = safeProjectPath(projectRoot, directories.specs, 'Specs 目录');
  const specDirectory = safeProjectPath(projectRoot, path.posix.join(directories.specs, specId), 'Spec 目录');
  relativeInside(specsRoot, specDirectory);
  await assertNoSymlinkSegments(projectRoot, specDirectory);
  const specStat = await statOrNull(specDirectory);
  if (!specStat?.isDirectory() || specStat.isSymbolicLink()) {
    throw new FoundationError('change-gate-spec-missing', '关联的 Spec 目录不存在', { specId });
  }
  const metaPath = await findIndexFile(specDirectory, 'meta');
  if (!metaPath) throw new FoundationError('change-gate-spec-meta-missing', '关联的 Spec 缺少 Meta', { specId });
  await assertNoSymlinkSegments(projectRoot, metaPath);
  const meta = await readStructuredDocument(metaPath, 'Specflow Meta');
  if (
    !meta ||
    typeof meta !== 'object' ||
    Array.isArray(meta) ||
    meta.id !== specId ||
    !['draft', 'planned', 'in-progress', 'archived', 'superseded', 'cancelled'].includes(meta.status) ||
    !stringArray(meta.scope) ||
    !meta.artifacts ||
    typeof meta.artifacts !== 'object' ||
    Array.isArray(meta.artifacts)
  ) {
    throw new FoundationError('invalid-change-gate-spec-meta', '关联的 Spec Meta 结构无效', { specId });
  }
  for (const scopedPath of meta.scope) safeProjectPath(projectRoot, scopedPath, 'Spec scope');
  return {
    specId,
    specDirectory,
    specDirectoryRelative: path.relative(projectRoot, specDirectory).split(path.sep).join('/'),
    meta,
  };
}

function normalizeChangeGateSpecIds(specId, specIds) {
  const values = [
    ...(typeof specId === 'string' && specId ? [specId] : []),
    ...(Array.isArray(specIds) ? specIds : typeof specIds === 'string' && specIds ? [specIds] : []),
  ];
  return [...new Set(values)].sort();
}

function changeGateResult(projectRoot, phase, errors, evidence) {
  return {
    ok: errors.length === 0,
    command: 'change-gate-check',
    status: errors.length ? 'blocked' : 'pass',
    target: projectRoot,
    phase,
    errors,
    evidence,
  };
}

function changeGateDigest(evidence) {
  const payload = {
    schemaVersion: evidence.schemaVersion,
    phase: evidence.phase,
    association: evidence.association,
    provider: evidence.provider,
    baseRevision: evidence.baseRevision,
    sourceRevision: evidence.sourceRevision,
    snapshotDigest: evidence.snapshotDigest,
    receiptScopeDigest: evidence.receiptScopeDigest,
    receiptScope: evidence.receiptScope,
    deliveryReceipts: evidence.delivery.map(({ specId, receiptDigest }) => ({ specId, receiptDigest })),
    changedPaths: evidence.changedPaths,
  };
  if (evidence.externalDelivery) {
    payload.externalDelivery = {
      provider: evidence.externalDelivery.provider,
      repository: evidence.externalDelivery.repository,
      revision: evidence.externalDelivery.revision,
      checks: evidence.externalDelivery.checks.map(({ id, name, app, status, conclusion, workflowPath, workflowRunId }) => ({
        id,
        name,
        app,
        status,
        conclusion,
        workflowPath,
        workflowRunId,
      })),
    };
  }
  return `sha256:${createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
}

async function validateDeliveryGate(projectRoot, spec, snapshot, evidenceSnapshot, errors) {
  if (spec.meta.status !== 'archived') {
    errors.push({ code: 'change-gate-spec-not-archived', specId: spec.specId, status: spec.meta.status });
    return null;
  }
  const receiptRelative = spec.meta.artifacts.archive_receipt;
  if (typeof receiptRelative !== 'string' || !receiptRelative || path.isAbsolute(receiptRelative)) {
    errors.push({ code: 'change-gate-receipt-missing', specId: spec.specId });
    return null;
  }
  const receiptPath = path.resolve(spec.specDirectory, receiptRelative);
  try {
    relativeInside(spec.specDirectory, receiptPath);
    await assertNoSymlinkSegments(projectRoot, receiptPath);
    const lifecycleDir =
      typeof spec.meta.artifacts.lifecycle_dir === 'string' && spec.meta.artifacts.lifecycle_dir
        ? spec.meta.artifacts.lifecycle_dir
        : './lifecycle';
    const chain = await verifyLifecycleChain(spec.specDirectory, { receiptPath: receiptRelative, lifecycleDir });
    if (
      chain.specId !== spec.specId ||
      chain.currentState !== spec.meta.status ||
      canonicalJson(chain.currentRelations) !== canonicalJson(spec.meta.relations) ||
      spec.meta.authorization?.terminal_transition_confirmed !== true
    ) {
      errors.push({ code: 'change-gate-lifecycle-mismatch', specId: spec.specId });
    }
    const receipt = await readStructuredDocument(receiptPath, 'Archive Receipt');
    const receiptSnapshot = receipt?.snapshot;
    const expectedExcludes = [...(evidenceSnapshot.change.excludes || [])].sort();
    const actualExcludes = [...(receiptSnapshot?.change?.excludes || [])].sort();
    if (
      receiptSnapshot?.base_revision !== evidenceSnapshot.baseRevision ||
      receiptSnapshot?.change?.scope !== evidenceSnapshot.scope ||
      receiptSnapshot?.change?.algorithm !== evidenceSnapshot.change.algorithm ||
      receiptSnapshot?.change?.digest !== evidenceSnapshot.change.digest ||
      JSON.stringify(actualExcludes) !== JSON.stringify(expectedExcludes)
    ) {
      errors.push({ code: 'change-gate-receipt-snapshot-mismatch', specId: spec.specId });
    }
    return {
      receiptPath: path.relative(projectRoot, receiptPath).split(path.sep).join('/'),
      receiptDigest: chain.lastDigest,
      lifecycleEvents: chain.events,
      currentState: chain.currentState,
      fullCandidateDigest: snapshot.change.digest,
      receiptScopeDigest: evidenceSnapshot.change.digest,
    };
  } catch (error) {
    errors.push({ code: error.code || 'change-gate-receipt-invalid', specId: spec.specId, message: error.message });
    return null;
  }
}

export async function checkChangeGate(
  target,
  {
    baseRevision,
    sourceRevision = 'HEAD',
    specId,
    specIds = [],
    exemption,
    phase = 'work',
    includePaths = [],
    excludePaths = [],
    provider = 'local-git',
    deliveryProvider,
    repository,
    deliveryRemote,
    requiredChecks = [],
    adapterRegistry = defaultAdapterRegistry,
  } = {},
) {
  const projectRoot = path.resolve(target);
  if (!CHANGE_GATE_PHASES.has(phase)) {
    throw new FoundationError('invalid-change-gate-phase', 'phase 必须是 work 或 delivery');
  }
  const associatedSpecIds = normalizeChangeGateSpecIds(specId, specIds);
  const hasSpec = associatedSpecIds.length > 0;
  const hasExemption = typeof exemption === 'string' && exemption.length > 0;
  const modeErrors = [];
  if (hasSpec === hasExemption) {
    modeErrors.push({ code: 'change-gate-association-required', message: '必须且只能提供一个或多个 specIds，或一个 exemption' });
  }
  if (hasExemption && !CHANGE_GATE_EXEMPTIONS.has(exemption)) {
    modeErrors.push({ code: 'invalid-change-gate-exemption', exemption });
  }
  const hasDeliveryConfiguration =
    deliveryProvider !== undefined ||
    repository !== undefined ||
    deliveryRemote !== undefined ||
    (Array.isArray(requiredChecks) && requiredChecks.length > 0);
  if (!Array.isArray(requiredChecks) || requiredChecks.some((value) => typeof value !== 'string')) {
    modeErrors.push({ code: 'invalid-change-gate-delivery-checks' });
  }
  if (hasDeliveryConfiguration && phase !== 'delivery') {
    modeErrors.push({ code: 'change-gate-delivery-provider-phase', message: '外部交付 Provider 只允许用于 delivery 阶段' });
  }
  const usesAutomaticDeliveryProvider =
    hasDeliveryConfiguration && (deliveryProvider === undefined || deliveryProvider === 'auto') && repository === undefined;
  const usesExplicitDeliveryProvider =
    typeof deliveryProvider === 'string' && deliveryProvider && deliveryProvider !== 'auto' && typeof repository === 'string' && repository;
  if (hasDeliveryConfiguration && (!requiredChecks.length || (!usesAutomaticDeliveryProvider && !usesExplicitDeliveryProvider))) {
    modeErrors.push({
      code: 'change-gate-delivery-provider-config-invalid',
      message: '外部交付门禁必须提供 requiredChecks，并选择自动识别或同时显式提供 Provider 与 Repository',
    });
  }
  if (deliveryRemote !== undefined && !usesAutomaticDeliveryProvider) {
    modeErrors.push({
      code: 'change-gate-delivery-remote-mode',
      message: 'deliveryRemote 只用于自动识别外部交付 Provider',
    });
  }
  if (modeErrors.length) return changeGateResult(projectRoot, phase, modeErrors, null);

  let fullSnapshot;
  let evidenceSnapshot;
  try {
    fullSnapshot = (
      await inspectSourceControlSnapshot(projectRoot, {
        baseRevision,
        sourceRevision,
        provider,
        adapterRegistry,
      })
    ).snapshot;
    evidenceSnapshot =
      includePaths.length || excludePaths.length
        ? (
            await inspectSourceControlSnapshot(projectRoot, {
              baseRevision,
              sourceRevision,
              includePaths,
              excludePaths,
              provider,
              adapterRegistry,
            })
          ).snapshot
        : fullSnapshot;
  } catch (error) {
    return changeGateResult(
      projectRoot,
      phase,
      [{ code: error.code || 'change-gate-source-control-failed', message: error.message }],
      null,
    );
  }

  const changedPaths = changeGateChangedPaths(fullSnapshot);
  const errors = [];
  if (!changedPaths.length) errors.push({ code: 'change-gate-empty-candidate' });
  let association;
  const delivery = [];
  let externalDelivery;
  let selectedDeliveryProvider = deliveryProvider;
  let selectedRepository = repository;
  if (hasExemption) {
    const mismatchedPaths = changedPaths.filter((candidate) => !changeGatePathMatchesExemption(exemption, candidate));
    if (mismatchedPaths.length) {
      errors.push({ code: 'change-gate-exemption-scope-mismatch', exemption, paths: mismatchedPaths });
    }
    association = { mode: 'exemption', exemption };
  } else {
    const specs = [];
    for (const associatedSpecId of associatedSpecIds) {
      try {
        specs.push(await loadChangeGateSpec(projectRoot, associatedSpecId));
      } catch (error) {
        errors.push({
          code: error.code || 'change-gate-spec-invalid',
          specId: associatedSpecId,
          message: error.message,
        });
      }
    }
    const evidencePrefixes = specs.map(({ specDirectoryRelative: directory }) => ({
      directory,
      prefix: `${directory}/`,
    }));
    const implementationPaths = changedPaths.filter(
      (candidate) =>
        !evidencePrefixes.some(({ directory, prefix }) => candidate === directory || candidate.startsWith(prefix)),
    );
    const uncoveredPaths = implementationPaths.filter(
      (candidate) => !specs.some((spec) => spec.meta.scope.some((scope) => pathsOverlap(scope, candidate))),
    );
    if (uncoveredPaths.length) {
      errors.push({ code: 'change-gate-spec-scope-mismatch', specIds: associatedSpecIds, paths: uncoveredPaths });
    }
    for (const spec of specs) {
      if (phase === 'work' && !['planned', 'in-progress'].includes(spec.meta.status)) {
        errors.push({ code: 'change-gate-spec-not-active', specId: spec.specId, status: spec.meta.status });
      }
      if (phase === 'delivery') {
        const result = await validateDeliveryGate(projectRoot, spec, fullSnapshot, evidenceSnapshot, errors);
        if (result) delivery.push({ specId: spec.specId, ...result });
      }
    }
    association = {
      mode: 'spec',
      specIds: associatedSpecIds,
      specs: specs.map((spec) => ({ specId: spec.specId, status: spec.meta.status })),
      implementationPaths,
      evidencePaths: changedPaths.filter((candidate) => !implementationPaths.includes(candidate)),
    };
  }
  if (hasDeliveryConfiguration && errors.length === 0) {
    if (usesAutomaticDeliveryProvider) {
      try {
        const resolved = resolveDeliveryEvidenceProvider({
          projectRoot,
          adapterRegistry,
          remoteName: deliveryRemote,
        });
        selectedDeliveryProvider = resolved.provider;
        selectedRepository = resolved.repository;
      } catch (error) {
        errors.push({
          code: error.code || 'delivery-evidence-provider-resolution-failed',
          message: '无法从 Git Remote 选择外部交付 Provider',
        });
      }
    }
    const adapter = adapterRegistry?.get?.('delivery-evidence', selectedDeliveryProvider);
    if (!adapter || typeof adapter.inspectDeliveryEvidence !== 'function') {
      if (errors.length === 0) {
        errors.push({ code: 'delivery-evidence-provider-unavailable', provider: selectedDeliveryProvider });
      }
    } else if (errors.length === 0) {
      try {
        const candidate = await adapter.inspectDeliveryEvidence({
          repository: selectedRepository,
          revision: fullSnapshot.sourceRevision,
          requiredChecks,
        });
        if (
          !candidate ||
          candidate.capability !== 'delivery-evidence' ||
          candidate.provider !== selectedDeliveryProvider ||
          candidate.repository !== selectedRepository ||
          candidate.revision !== fullSnapshot.sourceRevision ||
          !Array.isArray(candidate.checks)
        ) {
          errors.push({ code: 'delivery-evidence-binding-mismatch', provider: selectedDeliveryProvider });
        } else {
          externalDelivery = {
            ...candidate,
            providerSelection: usesAutomaticDeliveryProvider ? 'remote' : 'explicit',
          };
        }
      } catch (error) {
        errors.push({
          code: error.code || 'delivery-evidence-inspect-failed',
          message: '外部交付证据复核失败',
        });
      }
    }
  }
  const evidence = {
    schemaVersion: 2,
    phase,
    provider: fullSnapshot.provider,
    baseRevision: fullSnapshot.baseRevision,
    sourceRevision: fullSnapshot.sourceRevision,
    snapshotDigest: fullSnapshot.change.digest,
    receiptScopeDigest: evidenceSnapshot.change.digest,
    receiptScope: {
      includes: evidenceSnapshot.change.includes,
      excludes: evidenceSnapshot.change.excludes,
    },
    changedPaths,
    association,
    delivery,
    ...(externalDelivery ? { externalDelivery } : {}),
  };
  evidence.gateDigest = changeGateDigest(evidence);
  return changeGateResult(projectRoot, phase, errors, evidence);
}

async function runGit(root, args, { input, maxOutputBytes = MAX_GIT_COMMAND_OUTPUT_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('git', ['-C', root, ...args], { stdio: ['pipe', 'pipe', 'pipe'] });
    const stdout = [];
    const stderr = [];
    let outputBytes = 0;
    let overflowed = false;
    const collect = (chunks, chunk) => {
      outputBytes += chunk.length;
      if (outputBytes > maxOutputBytes) {
        overflowed = true;
        child.kill();
        return;
      }
      chunks.push(chunk);
    };
    child.stdout.on('data', (chunk) => collect(stdout, chunk));
    child.stderr.on('data', (chunk) => collect(stderr, chunk));
    child.on('error', (error) => reject(new FoundationError('git-scan-failed', '无法启动 Git 扫描', { reason: error.message })));
    child.on('close', (code) => {
      if (overflowed) {
        reject(new FoundationError('git-scan-too-large', 'Git 扫描命令输出超过安全上限'));
        return;
      }
      const result = { stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) };
      if (code !== 0) {
        reject(
          new FoundationError('git-scan-failed', 'Git 扫描命令执行失败', {
            args,
            exitCode: code,
            stderr: result.stderr.toString('utf8').trim().slice(0, 500),
          }),
        );
        return;
      }
      resolve(result);
    });
    child.stdin.end(input);
  });
}

function addGitObject(objects, oid, scope, objectPath) {
  if (!/^[0-9a-f]{40,64}$/u.test(oid)) return;
  const descriptor = objects.get(oid) || { scopes: new Set(), paths: new Set() };
  descriptor.scopes.add(scope);
  if (objectPath) descriptor.paths.add(objectPath);
  objects.set(oid, descriptor);
}

async function collectGitObjects(root, gitScope) {
  const objects = new Map();
  const staged = await runGit(root, ['ls-files', '-s', '-z']);
  for (const record of staged.stdout.toString('utf8').split('\0').filter(Boolean)) {
    const match = record.match(/^\d+ ([0-9a-f]{40,64}) [0-3]\t([\s\S]+)$/u);
    if (match) addGitObject(objects, match[1], 'staged', match[2]);
  }
  if (gitScope === 'staged') return objects;

  const revisionArgs = gitScope === 'all' ? ['rev-list', '--objects', '--all', '--reflog'] : ['rev-list', '--objects', '--all'];
  const revisions = await runGit(root, revisionArgs);
  for (const line of revisions.stdout.toString('utf8').split(/\r?\n/u).filter(Boolean)) {
    const separator = line.indexOf(' ');
    const oid = separator === -1 ? line : line.slice(0, separator);
    const objectPath = separator === -1 ? undefined : line.slice(separator + 1);
    addGitObject(objects, oid, 'history', objectPath);
  }

  if (gitScope === 'all') {
    const unreachable = await runGit(root, ['fsck', '--full', '--no-reflogs', '--unreachable']);
    const output = Buffer.concat([unreachable.stdout, unreachable.stderr]).toString('utf8');
    for (const match of output.matchAll(/(?:unreachable|dangling)\s+\w+\s+([0-9a-f]{40,64})/gu)) {
      addGitObject(objects, match[1], 'unreachable');
    }
  }
  return objects;
}

async function describeGitObjects(root, objectIds) {
  const descriptions = new Map();
  for (let index = 0; index < objectIds.length; index += 1000) {
    const chunk = objectIds.slice(index, index + 1000);
    const result = await runGit(root, ['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], {
      input: `${chunk.join('\n')}\n`,
    });
    for (const line of result.stdout.toString('utf8').trim().split(/\r?\n/u).filter(Boolean)) {
      const match = line.match(/^([0-9a-f]{40,64}) (\w+) (\d+)$/u);
      if (match) descriptions.set(match[1], { type: match[2], size: Number(match[3]) });
    }
  }
  return descriptions;
}

async function readGitObjectBatch(root, objectIds) {
  if (objectIds.length === 0) return new Map();
  const expectedLimit = objectIds.length * 200 + MAX_SCANNABLE_TEXT_BYTES * objectIds.length + 1024;
  const result = await runGit(root, ['cat-file', '--batch'], {
    input: `${objectIds.join('\n')}\n`,
    maxOutputBytes: Math.min(MAX_GIT_COMMAND_OUTPUT_BYTES, expectedLimit),
  });
  const contents = new Map();
  let offset = 0;
  while (offset < result.stdout.length) {
    const lineEnd = result.stdout.indexOf(10, offset);
    if (lineEnd === -1) break;
    const header = result.stdout.subarray(offset, lineEnd).toString('utf8');
    const match = header.match(/^([0-9a-f]{40,64}) (\w+) (\d+)$/u);
    if (!match) break;
    const size = Number(match[3]);
    const start = lineEnd + 1;
    contents.set(match[1], result.stdout.subarray(start, start + size));
    offset = start + size + 1;
  }
  return contents;
}

async function scanGitObjects(root, gitScope, normalizedTerms, secretPatterns, errors) {
  if (!['staged', 'reachable', 'all'].includes(gitScope)) {
    throw new FoundationError('invalid-git-scope', 'gitScope 只能是 none、staged、reachable 或 all');
  }
  const topLevel = (await runGit(root, ['rev-parse', '--show-toplevel'])).stdout.toString('utf8').trim();
  if (path.resolve(topLevel) !== root) {
    throw new FoundationError('invalid-git-root', 'Git 扫描目标必须是仓库根目录', { root, topLevel });
  }
  const objects = await collectGitObjects(root, gitScope);
  for (const [oid, descriptor] of objects) {
    for (const objectPath of descriptor.paths) {
      scanSensitivePath(
        objectPath,
        { gitScope: [...descriptor.scopes].sort(), objectId: oid.slice(0, 12), path: objectPath },
        normalizedTerms,
        errors,
      );
    }
  }
  const descriptions = await describeGitObjects(root, [...objects.keys()]);
  const candidates = [...descriptions]
    .filter(([, description]) => ['blob', 'commit', 'tag'].includes(description.type) && description.size <= MAX_SCANNABLE_TEXT_BYTES)
    .map(([oid]) => oid);
  let scannedObjects = 0;
  for (let index = 0; index < candidates.length; index += 20) {
    const contents = await readGitObjectBatch(root, candidates.slice(index, index + 20));
    for (const [oid, buffer] of contents) {
      if (!isScannableText(buffer)) continue;
      const descriptor = objects.get(oid);
      scanSensitiveText(
        buffer.toString('utf8'),
        {
          gitScope: [...descriptor.scopes].sort(),
          objectId: oid.slice(0, 12),
          paths: [...descriptor.paths].sort().slice(0, 10),
        },
        normalizedTerms,
        secretPatterns,
        errors,
      );
      scannedObjects += 1;
    }
  }
  return { objects: objects.size, scannedObjects };
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

async function describeSkillSource(name, { repoRoot = REPO_ROOT, files } = {}) {
  const checked = await checkSkill(name, { repoRoot });
  const skillRoot = path.join(repoRoot, 'skills', name);
  if (files === undefined) return { ...checked, files: await collectFiles(skillRoot) };
  if (!Array.isArray(files) || files.length === 0 || files.some((relative) => typeof relative !== 'string')) {
    throw new FoundationError('invalid-skill-file-set', 'Skill 运行时文件集合必须是非空相对路径数组', { name });
  }
  const normalizedFiles = [...new Set(files.map((relative) => relative.split('/').join(path.sep)))]
    .sort((left, right) => left.localeCompare(right));
  if (normalizedFiles.length !== files.length) {
    throw new FoundationError('invalid-skill-file-set', 'Skill 运行时文件集合不能包含重复路径', { name });
  }
  for (const relative of normalizedFiles) {
    const absolute = path.resolve(skillRoot, relative);
    relativeInside(skillRoot, absolute);
    await assertNoSymlinkSegments(skillRoot, absolute);
    const stat = await statOrNull(absolute);
    if (!stat?.isFile() || stat.isSymbolicLink()) {
      throw new FoundationError('invalid-skill-file-set', 'Skill 运行时文件必须是源目录内的普通文件', {
        name,
        path: relative.split(path.sep).join('/'),
      });
    }
  }
  const missingLinks = await validateMarkdownLinks(skillRoot, normalizedFiles);
  if (missingLinks.length) {
    throw new FoundationError('invalid-skill-links', 'Skill 运行时文件集合包含未分发的本地链接', {
      name,
      links: missingLinks,
    });
  }
  return {
    ...checked,
    digest: await digestFiles(skillRoot, normalizedFiles),
    files: normalizedFiles,
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

export async function planProjectInit(target, { starterRoot = STARTER_ROOT } = {}) {
  const projectRoot = path.resolve(target);
  await assertNoSymlinkAncestors(projectRoot);
  const projectStat = await statOrNull(projectRoot);
  const starterFiles = await collectFiles(starterRoot);
  if (!projectStat) {
    return {
      ok: true,
      command: 'init-plan',
      status: 'planned',
      action: 'create',
      target: projectRoot,
      added: starterFiles,
      unchanged: [],
      conflicts: [],
    };
  }
  if (projectStat.isSymbolicLink() || !projectStat.isDirectory()) {
    throw new FoundationError('unsafe-target', '初始化目标必须是普通目录，不能是文件或 Symlink', {
      target: projectRoot,
    });
  }

  const added = [];
  const unchanged = [];
  const conflicts = [];
  for (const relative of starterFiles) {
    const destination = path.join(projectRoot, relative);
    await assertNoSymlinkSegments(projectRoot, path.dirname(destination));
    const destinationStat = await statOrNull(destination);
    if (!destinationStat) {
      added.push(relative);
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
    if (sourceContent.equals(destinationContent)) unchanged.push(relative);
    else conflicts.push({ path: relative, reason: 'different-content' });
  }
  return {
    ok: conflicts.length === 0,
    command: 'init-plan',
    status: conflicts.length ? 'blocked' : 'planned',
    action: conflicts.length ? 'blocked' : added.length ? 'add' : 'none',
    target: projectRoot,
    added,
    unchanged,
    conflicts,
  };
}

export async function initProject(target, { starterRoot = STARTER_ROOT } = {}) {
  const plan = await planProjectInit(target, { starterRoot });
  const projectRoot = plan.target;
  if (!plan.ok) {
    throw new FoundationError('init-conflict', '目标项目存在与 Starter 冲突的文件，未执行任何写入', {
      plan,
    });
  }
  if (plan.action === 'create') {
    const parent = path.dirname(projectRoot);
    await mkdir(parent, { recursive: true });
    const temporary = path.join(parent, `.${path.basename(projectRoot)}.foundation-${randomUUID()}`);
    try {
      await cp(starterRoot, temporary, { recursive: true, errorOnExist: true, force: false });
      await rename(temporary, projectRoot);
      return { ok: true, command: 'init', status: 'initialized', target: projectRoot, added: plan.added, plan };
    } catch (error) {
      await rm(temporary, { recursive: true, force: true });
      throw error;
    }
  }
  if (!plan.added.length) {
    return { ok: true, command: 'init', status: 'unchanged', target: projectRoot, added: [], plan };
  }

  const createdFiles = [];
  const createdDirectories = [];
  try {
    for (const relative of plan.added) {
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
  return { ok: true, command: 'init', status: 'initialized', target: projectRoot, added: plan.added, plan };
}

async function readProjectManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, 'agent-foundation.json');
  const manifest = await readJson(manifestPath, 'Starter Manifest');
  const allowedTopLevelKeys = new Set(['schemaVersion', 'preset', 'metadata', 'directories', 'context', 'integrations', 'safety']);
  if (
    !manifest ||
    typeof manifest !== 'object' ||
    Array.isArray(manifest) ||
    manifest.schemaVersion !== 2 ||
    manifest.preset !== 'minimal' ||
    Object.keys(manifest).some((key) => !allowedTopLevelKeys.has(key)) ||
    !Array.isArray(manifest.integrations)
  ) {
    throw new FoundationError('invalid-manifest-contract', 'Starter Manifest 结构或版本不受支持', {
      path: manifestPath,
    });
  }

  const directories = manifest.directories;
  if (
    !directories ||
    typeof directories !== 'object' ||
    Array.isArray(directories) ||
    Object.keys(directories).length !== 2 ||
    directories.specs !== 'specs' ||
    directories.knowledge !== 'knowledge'
  ) {
    throw new FoundationError(
      'invalid-manifest-directories',
      'minimal Preset 的 directories 是受校验的目录声明，必须使用 specs 和 knowledge',
    );
  }
  const safety = manifest.safety;
  if (
    !safety ||
    typeof safety !== 'object' ||
    Array.isArray(safety) ||
    Object.keys(safety).length !== 3 ||
    safety.scope !== 'project' ||
    safety.onConflict !== 'block' ||
    safety.followSymlinks !== false
  ) {
    throw new FoundationError(
      'invalid-manifest-safety',
      'minimal Preset 的 safety 是执行不变量，必须为项目级、冲突阻断且不跟随 Symlink',
    );
  }
  if (manifest.metadata !== undefined) {
    const metadata = manifest.metadata;
    const allowedMetadataKeys = new Set(['description', 'documentationRef', 'labels']);
    if (
      !metadata ||
      typeof metadata !== 'object' ||
      Array.isArray(metadata) ||
      Object.keys(metadata).some((key) => !allowedMetadataKeys.has(key)) ||
      (metadata.description !== undefined &&
        (typeof metadata.description !== 'string' || metadata.description.length > 500)) ||
      (metadata.documentationRef !== undefined &&
        (typeof metadata.documentationRef !== 'string' ||
          !/^[a-z][a-z0-9+.-]*:\/\/.+/iu.test(metadata.documentationRef))) ||
      (metadata.labels !== undefined &&
        (!Array.isArray(metadata.labels) ||
          metadata.labels.length > 20 ||
          metadata.labels.some((label) => typeof label !== 'string' || !label.trim() || label.length > 64)))
    ) {
      throw new FoundationError('invalid-manifest-metadata', 'Manifest metadata 只允许受限的说明字段');
    }
  }

  if (manifest.context !== undefined) {
    const context = manifest.context;
    const allowedContextKeys = new Set([
      'perSpecFullTextBytes',
      'totalFullTextBytes',
      'maxIndexEntriesPerArtifact',
      'maxRuleFileBytes',
    ]);
    const validInteger = (value, minimum, maximum) =>
      Number.isInteger(value) && value >= minimum && value <= maximum;
    if (
      !context ||
      typeof context !== 'object' ||
      Array.isArray(context) ||
      Object.keys(context).some((key) => !allowedContextKeys.has(key)) ||
      !validInteger(context.perSpecFullTextBytes, 256, 16 * 1024 * 1024) ||
      !validInteger(context.totalFullTextBytes, 256, 64 * 1024 * 1024) ||
      context.totalFullTextBytes < context.perSpecFullTextBytes ||
      !validInteger(context.maxIndexEntriesPerArtifact, 16, 4096) ||
      (context.maxRuleFileBytes !== undefined && !validInteger(context.maxRuleFileBytes, 256, 16 * 1024 * 1024))
    ) {
      throw new FoundationError(
        'invalid-manifest-context',
        'Manifest context 必须声明有效的单事项预算、总预算、单产物索引上限和可选规则文件预算',
      );
    }
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
  if (
    state.schemaVersion !== 1 ||
    (state.foundationVersion !== undefined && typeof state.foundationVersion !== 'string') ||
    !state.records ||
    typeof state.records !== 'object' ||
    Array.isArray(state.records)
  ) {
    throw new FoundationError('invalid-install-state', 'Skill 安装状态结构不受支持', { path: statePath });
  }
  return state;
}

async function readFoundationVersion(repoRoot = REPO_ROOT) {
  const packageJson = await readJson(path.join(repoRoot, 'package.json'), 'Foundation Package');
  if (typeof packageJson.version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(packageJson.version)) {
    throw new FoundationError('invalid-foundation-version', 'Foundation Package 必须声明有效版本');
  }
  return packageJson.version;
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

function resolveProjectSourceRuntime(hostAdapter, projectRoot, integration, repoRoot) {
  if (typeof hostAdapter.resolveProjectSourceSkillsDir !== 'function') return null;
  let resolved;
  try {
    resolved = hostAdapter.resolveProjectSourceSkillsDir(projectRoot, integration);
  } catch {
    throw new FoundationError('invalid-host-source-path', 'Host Adapter 无法解析项目级 Skill 源目录', {
      host: hostAdapter.id,
    });
  }
  if (resolved === null || resolved === undefined) return null;
  if (!hostAdapter.supportsProjectSourceLink || typeof resolved !== 'string' || !resolved.trim()) {
    throw new FoundationError('invalid-host-source-path', 'Host Adapter 未声明合法的项目级 Source Link 能力', {
      host: hostAdapter.id,
    });
  }
  const root = path.resolve(projectRoot);
  const sourceRepository = path.resolve(repoRoot);
  if (root !== sourceRepository) {
    throw new FoundationError(
      'source-runtime-requires-repository-root',
      '生产者 Source 模式只能用于当前 Foundation 源码根，采用项目必须使用不可变副本',
      { target: root },
    );
  }
  const sourceRoot = path.resolve(resolved);
  relativeInside(root, sourceRoot);
  if (sourceRoot !== path.join(sourceRepository, 'skills')) {
    throw new FoundationError('invalid-host-source-path', '生产者 Source 模式只能指向当前仓库 skills 目录', {
      host: hostAdapter.id,
    });
  }
  const skillsRoot = resolveHostSkillsDirectory(hostAdapter, root, integration);
  const linkTarget = path.relative(path.dirname(skillsRoot), sourceRoot);
  if (linkTarget !== path.join('..', 'skills')) {
    throw new FoundationError('invalid-host-source-path', 'Source Link 必须精确使用 .agents/skills -> ../skills', {
      host: hostAdapter.id,
    });
  }
  return { skillsRoot, sourceRoot, linkTarget };
}

async function inspectProjectSourceLink(projectRoot, runtime) {
  await assertNoSymlinkSegments(projectRoot, path.dirname(runtime.skillsRoot));
  await assertNoSymlinkSegments(projectRoot, runtime.sourceRoot);
  const stat = await statOrNull(runtime.skillsRoot);
  if (!stat) return { status: 'missing', actualTarget: null };
  if (!stat.isSymbolicLink()) return { status: 'not-link', actualTarget: null };
  const actualTarget = await readlink(runtime.skillsRoot);
  const resolvedTarget = path.resolve(path.dirname(runtime.skillsRoot), actualTarget);
  if (actualTarget !== runtime.linkTarget || resolvedTarget !== runtime.sourceRoot) {
    return { status: 'wrong-target', actualTarget };
  }
  return { status: 'valid', actualTarget };
}

function validSourceRuntimeRecord(record, { hostId, projectRoot, skillsRoot, entry }) {
  if (!record || record.mode !== 'source' || record.host !== hostId || record.scope !== 'project') return false;
  const expectedPath = path.join(skillsRoot, entry.name);
  return (
    path.resolve(projectRoot, record.path) === expectedPath &&
    record.source === entry.source &&
    record.digest === undefined
  );
}

async function inspectReplaceableRuntimeDirectory(projectRoot, runtime, manifest, state, hostId) {
  const entries = await readdir(runtime.skillsRoot, { withFileTypes: true });
  const actualNames = entries.map((entry) => entry.name).sort();
  const expectedNames = manifest.skills.map((entry) => entry.name).sort();
  if (
    actualNames.length !== expectedNames.length ||
    actualNames.some((name, index) => name !== expectedNames[index]) ||
    entries.some((entry) => !entry.isDirectory() || entry.isSymbolicLink())
  ) {
    return false;
  }
  for (const entry of manifest.skills) {
    const record = state.records[entry.name];
    const destination = path.join(runtime.skillsRoot, entry.name);
    if (
      !record ||
      record.host !== hostId ||
      record.scope !== 'project' ||
      path.resolve(projectRoot, record.path) !== destination ||
      record.digest !== entry.version.value ||
      (await digestTree(destination)) !== entry.version.value
    ) {
      return false;
    }
  }
  return true;
}

export async function planSkill({
  target,
  name,
  host,
  operation = 'install',
  repoRoot = REPO_ROOT,
  adapterRegistry = defaultAdapterRegistry,
  sourceFiles,
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
  const source = await describeSkillSource(name, { repoRoot, files: sourceFiles });
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
    sourceFileCount: source.files.length,
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
  sourceFiles,
}) {
  const projectRoot = path.resolve(target);
  const plan = await planSkill({ target: projectRoot, name, host, operation, repoRoot, adapterRegistry, sourceFiles });
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
    if (sourceFiles === undefined) {
      await cp(sourceRoot, temporary, { recursive: true, errorOnExist: true, force: false });
    } else {
      await mkdir(temporary);
      for (const relative of sourceFiles) {
        const source = path.resolve(sourceRoot, relative);
        relativeInside(sourceRoot, source);
        const destinationFile = path.resolve(temporary, relative);
        relativeInside(temporary, destinationFile);
        await mkdir(path.dirname(destinationFile), { recursive: true });
        await cp(source, destinationFile, { errorOnExist: true, force: false });
      }
    }
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

function assertExactObjectKeys(value, expected, label, code = 'invalid-contract') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new FoundationError(code, `${label}必须是对象`);
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new FoundationError(code, `${label}字段与契约不一致`, { actual, expected: wanted });
  }
  return value;
}

async function readDistributionManifest(repoRoot, manifestPath) {
  const root = path.resolve(repoRoot);
  const absolute = path.resolve(root, manifestPath);
  relativeInside(root, absolute);
  await assertNoSymlinkSegments(root, absolute);
  const stat = await statOrNull(absolute);
  if (!stat?.isFile() || stat.isSymbolicLink()) {
    throw new FoundationError('invalid-distribution-manifest', 'Distribution Manifest 必须是仓库内的普通文件', {
      path: manifestPath,
    });
  }
  const manifest = await readStructuredDocument(absolute, 'Distribution Manifest');
  assertExactObjectKeys(manifest, ['version', 'skills'], 'Distribution Manifest', 'invalid-distribution-manifest');
  if (manifest.version !== 1 || !Array.isArray(manifest.skills) || !manifest.skills.length) {
    throw new FoundationError('invalid-distribution-manifest', 'Distribution Manifest 必须使用 version 1 且至少声明一个 Skill');
  }

  const names = new Set();
  const runtimeSkills = new Map();
  for (const entry of manifest.skills) {
    assertExactObjectKeys(
      entry,
      ['name', 'source', 'version', 'distributable', 'required_files', 'optional_resources'],
      'Distribution Skill 条目',
      'invalid-distribution-manifest',
    );
    assertSimpleName(entry.name, 'Distribution Skill 名称');
    if (names.has(entry.name)) {
      throw new FoundationError('invalid-distribution-manifest', 'Distribution Manifest 不能重复声明 Skill', {
        name: entry.name,
      });
    }
    names.add(entry.name);
    if (entry.source !== `skills/${entry.name}` || entry.distributable !== true) {
      throw new FoundationError(
        'invalid-distribution-manifest',
        '可分发 Skill 必须显式声明仓库内 skills/<name> 来源与 distributable: true',
        { name: entry.name },
      );
    }
    assertExactObjectKeys(entry.version, ['type', 'value'], 'Distribution Skill 版本', 'invalid-distribution-manifest');
    if (entry.version.type !== 'content-hash' || !/^sha256:[a-f0-9]{64}$/u.test(entry.version.value)) {
      throw new FoundationError('invalid-distribution-manifest', 'Skill 版本必须是有效的 SHA-256 内容摘要', {
        name: entry.name,
      });
    }
    if (!stringArray(entry.required_files) || !entry.required_files.includes('SKILL.md')) {
      throw new FoundationError('invalid-distribution-manifest', 'required_files 必须包含 SKILL.md', { name: entry.name });
    }
    const allowedOptionalResources = new Set(['agents', 'references', 'assets', 'scripts', 'evals', 'tests']);
    if (
      !Array.isArray(entry.optional_resources) ||
      entry.optional_resources.some((item) => typeof item !== 'string' || !allowedOptionalResources.has(item)) ||
      new Set(entry.optional_resources).size !== entry.optional_resources.length
    ) {
      throw new FoundationError('invalid-distribution-manifest', 'optional_resources 包含未知或重复目录', {
        name: entry.name,
      });
    }
    if (new Set(entry.required_files).size !== entry.required_files.length) {
      throw new FoundationError('invalid-distribution-manifest', 'required_files 不能重复', { name: entry.name });
    }
    for (const relative of entry.required_files) {
      if (!/^[A-Za-z0-9._/-]+$/u.test(relative) || path.isAbsolute(relative) || relative.split('/').includes('..')) {
        throw new FoundationError('invalid-distribution-manifest', 'required_files 只能引用 Skill 内的安全相对路径', {
          name: entry.name,
          path: relative,
        });
      }
      const requiredPath = path.resolve(root, entry.source, relative);
      relativeInside(path.join(root, entry.source), requiredPath);
      const requiredStat = await statOrNull(requiredPath);
      if (!requiredStat?.isFile() || requiredStat.isSymbolicLink()) {
        throw new FoundationError('invalid-distribution-manifest', 'Distribution Skill 缺少 required_files 声明的文件', {
          name: entry.name,
          path: relative,
        });
      }
    }
    const runtimeFiles = [...entry.required_files];
    for (const resource of entry.optional_resources) {
      const resourceRoot = path.resolve(root, entry.source, resource);
      relativeInside(path.join(root, entry.source), resourceRoot);
      const resourceStat = await statOrNull(resourceRoot);
      if (!resourceStat) continue;
      if (!resourceStat.isDirectory() || resourceStat.isSymbolicLink()) {
        throw new FoundationError('invalid-distribution-manifest', 'optional_resources 必须引用 Skill 内的普通目录', {
          name: entry.name,
          resource,
        });
      }
      for (const relative of await collectFiles(resourceRoot)) {
        runtimeFiles.push(path.join(resource, relative));
      }
    }
    const runtime = await describeSkillSource(entry.name, { repoRoot: root, files: runtimeFiles });
    runtimeSkills.set(entry.name, runtime);
  }
  return {
    path: path.relative(root, absolute).split(path.sep).join('/'),
    digest: `sha256:${createHash('sha256').update(canonicalJson(manifest)).digest('hex')}`,
    manifest,
    runtimeSkills,
  };
}

export async function planDistribution({
  target,
  manifestPath = 'distribution/manifest.yaml',
  repoRoot = REPO_ROOT,
  adapterRegistry = defaultAdapterRegistry,
} = {}) {
  const distribution = await readDistributionManifest(repoRoot, manifestPath);
  const foundationVersion = await readFoundationVersion(repoRoot);
  const projectRoot = path.resolve(target);
  const installState = await readInstallState(projectRoot);
  const projectManifest = await readProjectManifest(projectRoot);
  const hostIntegration = projectManifest.integrations.find((integration) => integration.capability === 'host');
  const hostAdapter = resolveHost(adapterRegistry, hostIntegration.adapterId);
  const sourceRuntime = resolveProjectSourceRuntime(hostAdapter, projectRoot, hostIntegration, repoRoot);
  const items = [];
  for (const entry of distribution.manifest.skills) {
    const source = distribution.runtimeSkills.get(entry.name);
    if (source.digest !== entry.version.value) {
      throw new FoundationError('distribution-source-mismatch', 'Distribution Manifest 的版本摘要与 Skill 内容不一致', {
        name: entry.name,
        declared: entry.version.value,
        actual: source.digest,
      });
    }
    if (!sourceRuntime) {
      const operation = installState.records[entry.name] ? 'update' : 'install';
      items.push({
        entry,
        sourceFiles: source.files,
        plan: await planSkill({
          target: projectRoot,
          name: entry.name,
          operation,
          repoRoot,
          adapterRegistry,
          sourceFiles: source.files,
        }),
      });
    }
  }
  if (sourceRuntime) {
    const link = await inspectProjectSourceLink(projectRoot, sourceRuntime);
    let sourceLinkAction = 'blocked';
    const conflicts = [];
    if (link.status === 'missing') sourceLinkAction = 'add';
    else if (link.status === 'valid') {
      const recordsCurrent = distribution.manifest.skills.every((entry) =>
        validSourceRuntimeRecord(installState.records[entry.name], {
          hostId: hostIntegration.adapterId,
          projectRoot,
          skillsRoot: sourceRuntime.skillsRoot,
          entry,
        }));
      sourceLinkAction =
        recordsCurrent && installState.foundationVersion === foundationVersion ? 'noop' : 'refresh-state';
    } else if (
      link.status === 'not-link' &&
      (await inspectReplaceableRuntimeDirectory(
        projectRoot,
        sourceRuntime,
        distribution.manifest,
        installState,
        hostIntegration.adapterId,
      ))
    ) {
      sourceLinkAction = 'replace-managed-copy';
    } else {
      conflicts.push({
        type: link.status === 'wrong-target' ? 'source-link-target-mismatch' : 'source-runtime-target-conflict',
        path: path.relative(projectRoot, sourceRuntime.skillsRoot).split(path.sep).join('/'),
      });
    }
    return {
      ok: conflicts.length === 0,
      command: 'distribution-plan',
      status: conflicts.length ? 'blocked' : 'planned',
      runtimeMode: 'source-link',
      sourceLinkAction,
      sourceLink: {
        path: path.relative(projectRoot, sourceRuntime.skillsRoot).split(path.sep).join('/'),
        target: sourceRuntime.linkTarget.split(path.sep).join('/'),
      },
      manifest: distribution.path,
      manifestDigest: distribution.digest,
      foundationVersion,
      installedFoundationVersion: installState.foundationVersion || null,
      target: projectRoot,
      items: distribution.manifest.skills.map((entry) => ({
        name: entry.name,
        version: entry.version.value,
        action: sourceLinkAction,
      })),
      conflicts,
    };
  }
  const conflicts = items.flatMap(({ entry, plan }) => plan.conflicts.map((conflict) => ({ name: entry.name, ...conflict })));
  return {
    ok: conflicts.length === 0,
    command: 'distribution-plan',
    status: conflicts.length ? 'blocked' : 'planned',
    runtimeMode: 'copy',
    manifest: distribution.path,
    manifestDigest: distribution.digest,
    foundationVersion,
    installedFoundationVersion: installState.foundationVersion || null,
    target: projectRoot,
    items: items.map(({ entry, plan }) => ({ name: entry.name, version: entry.version.value, action: plan.action, plan })),
    conflicts,
  };
}

export async function applyDistribution(options = {}) {
  const plan = await planDistribution(options);
  if (!plan.ok) {
    throw new FoundationError('distribution-conflict', 'Distribution 计划存在冲突，未开始写入', { plan });
  }
  const distribution = await readDistributionManifest(
    options.repoRoot || REPO_ROOT,
    options.manifestPath || 'distribution/manifest.yaml',
  );
  if (plan.runtimeMode === 'source-link') {
    const projectRoot = path.resolve(plan.target);
    const repoRoot = path.resolve(options.repoRoot || REPO_ROOT);
    const projectManifest = await readProjectManifest(projectRoot);
    const hostIntegration = projectManifest.integrations.find((integration) => integration.capability === 'host');
    const adapterRegistry = options.adapterRegistry || defaultAdapterRegistry;
    const hostAdapter = resolveHost(adapterRegistry, hostIntegration.adapterId);
    const sourceRuntime = resolveProjectSourceRuntime(hostAdapter, projectRoot, hostIntegration, repoRoot);
    const state = await readInstallState(projectRoot);
    const beforeState = structuredClone(state);
    const backup = `${sourceRuntime.skillsRoot}.backup-${randomUUID()}`;
    let createdLink = false;
    let movedManagedCopy = false;
    const now = new Date().toISOString();
    try {
      if (plan.sourceLinkAction === 'replace-managed-copy') {
        await rename(sourceRuntime.skillsRoot, backup);
        movedManagedCopy = true;
      }
      if (['add', 'replace-managed-copy'].includes(plan.sourceLinkAction)) {
        await mkdir(path.dirname(sourceRuntime.skillsRoot), { recursive: true });
        await symlink(sourceRuntime.linkTarget, sourceRuntime.skillsRoot, 'dir');
        createdLink = true;
      }
      state.foundationVersion = plan.foundationVersion;
      state.records = Object.fromEntries(
        distribution.manifest.skills.map((entry) => {
          const previous = beforeState.records[entry.name];
          return [
            entry.name,
            {
              host: hostIntegration.adapterId,
              mode: 'source',
              scope: 'project',
              path: path.relative(projectRoot, path.join(sourceRuntime.skillsRoot, entry.name)).split(path.sep).join('/'),
              source: entry.source,
              installedAt: previous?.installedAt || now,
              updatedAt: now,
            },
          ];
        }),
      );
      if (plan.sourceLinkAction !== 'noop') await writeInstallState(projectRoot, state);
      const verification = await verifyDistribution(options);
      if (!verification.ok) {
        throw new FoundationError('distribution-verification-failed', 'Source Link 应用后校验失败', { verification });
      }
      if (movedManagedCopy) await rm(backup, { recursive: true, force: true });
      return {
        ok: true,
        command: 'distribution-apply',
        status: plan.sourceLinkAction === 'noop' ? 'unchanged' : 'applied',
        runtimeMode: 'source-link',
        manifest: plan.manifest,
        manifestDigest: plan.manifestDigest,
        foundationVersion: plan.foundationVersion,
        target: plan.target,
        sourceLink: plan.sourceLink,
      };
    } catch (error) {
      if (createdLink) await rm(sourceRuntime.skillsRoot, { force: true }).catch(() => {});
      if (movedManagedCopy) await rename(backup, sourceRuntime.skillsRoot).catch(() => {});
      await writeInstallState(projectRoot, beforeState).catch(() => {});
      throw error;
    } finally {
      await rm(backup, { recursive: true, force: true }).catch(() => {});
    }
  }
  const results = [];
  for (const item of plan.items) {
    const currentSource = distribution.runtimeSkills.get(item.name);
    if (currentSource.digest !== item.version) {
      throw new FoundationError('distribution-source-mismatch', 'Distribution Apply 前 Skill 内容已偏离 Manifest', {
        name: item.name,
        declared: item.version,
        actual: currentSource.digest,
      });
    }
    const apply = item.plan.operation === 'update' ? updateSkill : installSkill;
    results.push(
      await apply({
        target: plan.target,
        name: item.name,
        repoRoot: options.repoRoot || REPO_ROOT,
        adapterRegistry: options.adapterRegistry || defaultAdapterRegistry,
        sourceFiles: currentSource.files,
      }),
    );
  }
  const installState = await readInstallState(plan.target);
  if (installState.foundationVersion !== plan.foundationVersion) {
    installState.foundationVersion = plan.foundationVersion;
    await writeInstallState(plan.target, installState);
  }
  const verification = await verifyDistribution(options);
  if (!verification.ok) {
    throw new FoundationError('distribution-verification-failed', 'Distribution Apply 后校验失败；已完成项保持可重入状态', {
      verification,
    });
  }
  return {
    ok: true,
    command: 'distribution-apply',
    status: results.every((result) => result.status === 'unchanged') ? 'unchanged' : 'applied',
    runtimeMode: 'copy',
    manifest: plan.manifest,
    manifestDigest: plan.manifestDigest,
    foundationVersion: plan.foundationVersion,
    target: plan.target,
    results,
  };
}

export async function verifyDistribution({
  target,
  manifestPath = 'distribution/manifest.yaml',
  repoRoot = REPO_ROOT,
  adapterRegistry = defaultAdapterRegistry,
} = {}) {
  const distribution = await readDistributionManifest(repoRoot, manifestPath);
  const foundationVersion = await readFoundationVersion(repoRoot);
  const projectRoot = path.resolve(target);
  const state = await readInstallState(projectRoot);
  const projectManifest = await readProjectManifest(projectRoot);
  const hostIntegration = projectManifest.integrations.find((integration) => integration.capability === 'host');
  const hostAdapter = resolveHost(adapterRegistry, hostIntegration.adapterId);
  const skillsRoot = resolveHostSkillsDirectory(hostAdapter, projectRoot, hostIntegration);
  const sourceRuntime = resolveProjectSourceRuntime(hostAdapter, projectRoot, hostIntegration, repoRoot);
  const errors = [];
  const checks = [];
  if (state.foundationVersion !== foundationVersion) {
    errors.push({
      code: 'distribution-foundation-version-mismatch',
      expected: foundationVersion,
      actual: state.foundationVersion || null,
    });
  } else {
    checks.push({ code: 'distribution-foundation-version', version: foundationVersion, status: 'pass' });
  }
  if (sourceRuntime) {
    const link = await inspectProjectSourceLink(projectRoot, sourceRuntime);
    if (link.status !== 'valid') {
      errors.push({
        code: link.status === 'wrong-target' ? 'distribution-source-link-target-mismatch' : 'distribution-source-link-missing',
        path: path.relative(projectRoot, sourceRuntime.skillsRoot).split(path.sep).join('/'),
      });
    } else {
      checks.push({
        code: 'distribution-source-link',
        path: path.relative(projectRoot, sourceRuntime.skillsRoot).split(path.sep).join('/'),
        target: sourceRuntime.linkTarget.split(path.sep).join('/'),
        status: 'pass',
      });
    }
    for (const entry of distribution.manifest.skills) {
      const source = distribution.runtimeSkills.get(entry.name);
      if (source.digest !== entry.version.value) {
        errors.push({
          code: 'distribution-source-mismatch',
          name: entry.name,
          declared: entry.version.value,
          actual: source.digest,
        });
        continue;
      }
      const record = state.records[entry.name];
      if (
        !validSourceRuntimeRecord(record, {
          hostId: hostIntegration.adapterId,
          projectRoot,
          skillsRoot,
          entry,
        })
      ) {
        errors.push({ code: 'distribution-install-record-mismatch', name: entry.name });
        continue;
      }
      checks.push({ code: 'distribution-skill-source', name: entry.name, digest: source.digest, status: 'pass' });
    }
    return {
      ok: errors.length === 0,
      command: 'distribution-verify',
      status: errors.length ? 'fail' : 'pass',
      runtimeMode: 'source-link',
      manifest: distribution.path,
      manifestDigest: distribution.digest,
      foundationVersion,
      target: projectRoot,
      errors,
      checks,
    };
  }
  for (const entry of distribution.manifest.skills) {
    const source = distribution.runtimeSkills.get(entry.name);
    if (source.digest !== entry.version.value) {
      errors.push({ code: 'distribution-source-mismatch', name: entry.name, declared: entry.version.value, actual: source.digest });
      continue;
    }
    const record = state.records[entry.name];
    const expectedPath = path.join(skillsRoot, entry.name);
    if (!record) {
      errors.push({ code: 'distribution-skill-not-installed', name: entry.name });
      continue;
    }
    if (
      record.host !== hostIntegration.adapterId ||
      record.scope !== 'project' ||
      path.resolve(projectRoot, record.path) !== expectedPath ||
      record.digest !== entry.version.value
    ) {
      errors.push({ code: 'distribution-install-record-mismatch', name: entry.name });
      continue;
    }
    try {
      await assertNoSymlinkSegments(projectRoot, expectedPath);
      const destinationStat = await statOrNull(expectedPath);
      const digest = destinationStat?.isDirectory() && !destinationStat.isSymbolicLink() ? await digestTree(expectedPath) : null;
      if (digest !== entry.version.value) errors.push({ code: 'distribution-installed-content-mismatch', name: entry.name, actual: digest });
      else checks.push({ code: 'distribution-skill', name: entry.name, digest, status: 'pass' });
    } catch (error) {
      errors.push({ code: error.code || 'distribution-installed-content-invalid', name: entry.name, message: error.message });
    }
  }
  return {
    ok: errors.length === 0,
    command: 'distribution-verify',
    status: errors.length ? 'fail' : 'pass',
    runtimeMode: 'copy',
    manifest: distribution.path,
    manifestDigest: distribution.digest,
    foundationVersion,
    target: projectRoot,
    errors,
    checks,
  };
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
  let sourceRuntime = null;
  try {
    manifest = await readProjectManifest(projectRoot);
    hostIntegration = manifest.integrations.find((integration) => integration.capability === 'host');
    hostAdapter = resolveHost(adapterRegistry, hostIntegration.adapterId);
    const hostSkillsDirectory = resolveHostSkillsDirectory(hostAdapter, projectRoot, hostIntegration);
    sourceRuntime = resolveProjectSourceRuntime(hostAdapter, projectRoot, hostIntegration, REPO_ROOT);
    if (sourceRuntime) {
      const link = await inspectProjectSourceLink(projectRoot, sourceRuntime);
      if (link.status !== 'valid') {
        throw new FoundationError('invalid-host-source-link', '生产者 Source Link 缺失或目标不正确', {
          status: link.status,
        });
      }
      checks.push({ code: 'host-source-link', status: 'pass' });
    } else {
      await assertNoSymlinkSegments(projectRoot, hostSkillsDirectory);
    }
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

  const knowledge = await checkKnowledgeGovernance(projectRoot);
  errors.push(...knowledge.errors);
  warnings.push(...knowledge.warnings);
  checks.push(...knowledge.checks);

  const specflow = await checkSpecflowGovernance(projectRoot);
  errors.push(...specflow.errors);
  warnings.push(...specflow.warnings);
  checks.push(...specflow.checks);

  const componentConfig = await statOrNull(path.join(projectRoot, '.component-governance', 'config.yaml'));
  if (componentConfig) {
    const components = await checkComponentRegistry(projectRoot);
    errors.push(...components.errors);
    warnings.push(...components.warnings);
    checks.push(...components.checks);
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
        if (sourceRuntime) {
          if (
            record.mode !== 'source' ||
            record.digest !== undefined ||
            record.source !== path.posix.join('skills', name)
          ) {
            errors.push({ code: 'installed-skill-source-record-mismatch', name });
            continue;
          }
          const source = path.join(sourceRuntime.sourceRoot, name);
          await assertNoSymlinkSegments(projectRoot, source);
          const sourceStat = await statOrNull(source);
          if (!sourceStat?.isDirectory() || sourceStat.isSymbolicLink()) {
            errors.push({ code: 'installed-skill-missing', name, path: record.source });
          } else {
            checks.push({ code: 'installed-skill-source', name, status: 'pass' });
          }
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

export async function checkRepository({ repoRoot = REPO_ROOT, denyTerms = [], gitScope = 'none' } = {}) {
  const root = path.resolve(repoRoot);
  const errors = [];
  const warnings = [];
  const checks = [];
  if (!['none', 'staged', 'reachable', 'all'].includes(gitScope)) {
    throw new FoundationError('invalid-git-scope', 'gitScope 只能是 none、staged、reachable 或 all');
  }
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
  let allowedSourceLink = null;
  if (await statOrNull(path.join(root, 'agent-foundation.json'))) {
    try {
      const projectManifest = await readProjectManifest(root);
      const hostIntegration = projectManifest.integrations.find((integration) => integration.capability === 'host');
      const hostAdapter = resolveHost(defaultAdapterRegistry, hostIntegration.adapterId);
      const sourceRuntime = resolveProjectSourceRuntime(hostAdapter, root, hostIntegration, root);
      if (sourceRuntime) {
        const inspection = await inspectProjectSourceLink(root, sourceRuntime);
        if (inspection.status === 'valid') {
          allowedSourceLink = path.relative(root, sourceRuntime.skillsRoot);
          checks.push({
            code: 'repository-source-link',
            path: allowedSourceLink.split(path.sep).join('/'),
            status: 'pass',
          });
        } else {
          errors.push({ code: 'repository-source-link-invalid', status: inspection.status });
        }
      }
    } catch (error) {
      errors.push({ code: error.code || 'invalid-repository-source-runtime', message: error.message });
    }
  }
  for (const entry of repositoryEntries.filter((item) => item.type === 'symlink')) {
    if (allowedSourceLink && entry.relative === allowedSourceLink) continue;
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
      } else {
        checks.push({ code: 'skill', name: skill.name, evalCases: cases.length, status: 'pass' });
        const replay = await statOrNull(path.join(evalRoot, 'replay.json'));
        if (replay) {
          if (!replay.isFile() || replay.isSymbolicLink()) {
            errors.push({ code: 'invalid-skill-eval-replay', name: skill.name });
          } else {
            try {
              const report = await buildEvalRun({ skillRoot: path.join(root, 'skills', skill.name) });
              checks.push({
                code: 'skill-eval-replay',
                name: skill.name,
                evalCases: report.cases.length,
                result: report.summary.result,
                digest: report.integrity.payload_digest,
                status: report.summary.result === 'pass' ? 'pass' : 'fail',
              });
              if (report.summary.result !== 'pass') {
                errors.push({ code: 'skill-eval-replay-not-passing', name: skill.name, result: report.summary.result });
              }
            } catch (error) {
              errors.push({ code: 'invalid-skill-eval-replay', name: skill.name, message: error.message });
            }
          }
        }
      }
    }
    const distributionPath = path.join(root, 'distribution', 'manifest.yaml');
    const distributionStat = await statOrNull(distributionPath);
    if (!distributionStat) {
      warnings.push({ code: 'distribution-manifest-missing' });
    } else {
      const distribution = await readDistributionManifest(root, 'distribution/manifest.yaml');
      const mismatchStart = errors.length;
      for (const entry of distribution.manifest.skills) {
        const source = distribution.runtimeSkills.get(entry.name);
        if (source.digest !== entry.version.value) {
          errors.push({
            code: 'distribution-source-mismatch',
            name: entry.name,
            declared: entry.version.value,
            actual: source.digest,
          });
        }
      }
      checks.push({
        code: 'distribution-manifest',
        skills: distribution.manifest.skills.length,
        digest: distribution.digest,
        status: errors.length === mismatchStart ? 'pass' : 'fail',
      });
    }
  } catch (error) {
    errors.push({ code: error.code || 'invalid-skills', message: error.message, details: error.details });
  }

  const knowledge = await checkKnowledgeGovernance(root);
  errors.push(...knowledge.errors);
  warnings.push(...knowledge.warnings);
  checks.push(...knowledge.checks);

  const specflow = await checkSpecflowGovernance(root);
  errors.push(...specflow.errors);
  warnings.push(...specflow.warnings);
  checks.push(...specflow.checks);

  const normalizedTerms = [...new Set(denyTerms.map((term) => term.trim()).filter(Boolean))];
  const secretPatterns = genericSecretPatterns();
  const sensitiveErrorCount = errors.length;
  let scannedFiles = 0;
  let skippedLargeFiles = 0;
  let skippedBinaryFiles = 0;
  for (const relative of files) {
    scanSensitivePath(relative, { path: relative }, normalizedTerms, errors);
    const fileStat = await lstat(path.join(root, relative));
    if (fileStat.size > MAX_SCANNABLE_TEXT_BYTES) {
      skippedLargeFiles += 1;
      continue;
    }
    const buffer = await readFile(path.join(root, relative));
    if (!isScannableText(buffer)) {
      skippedBinaryFiles += 1;
      continue;
    }
    scanSensitiveText(buffer.toString('utf8'), { path: relative }, normalizedTerms, secretPatterns, errors);
    scannedFiles += 1;
  }
  checks.push({
    code: 'sensitive-content-scan',
    files: scannedFiles,
    skippedLargeFiles,
    skippedBinaryFiles,
    customTerms: normalizedTerms.length,
    status: errors.length === sensitiveErrorCount ? 'pass' : 'fail',
  });

  if (gitScope !== 'none') {
    const gitErrorCount = errors.length;
    const git = await scanGitObjects(root, gitScope, normalizedTerms, secretPatterns, errors);
    checks.push({
      code: 'git-sensitive-content-scan',
      scope: gitScope,
      objects: git.objects,
      scannedObjects: git.scannedObjects,
      status: errors.length === gitErrorCount ? 'pass' : 'fail',
    });
  }

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
