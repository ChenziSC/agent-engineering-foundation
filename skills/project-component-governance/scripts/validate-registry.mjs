import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseYamlSubset } from '../../specflow/scripts/archive-receipt.mjs';

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/u;
const LEVELS = new Set(['page-local', 'app-shared', 'project-shared', 'project-standard']);
const STATUSES = new Set(['candidate', 'active', 'migrating', 'deprecated', 'retired']);
const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.vue', '.svelte']);

function exact(value, keys, label, optional = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} 必须是对象`);
  const actual = Object.keys(value);
  const allowed = new Set([...keys, ...optional]);
  if (keys.some((key) => !Object.hasOwn(value, key)) || actual.some((key) => !allowed.has(key))) throw new Error(`${label} 字段与契约不一致`);
}

function stringList(value, label, { nonEmpty = false } = {}) {
  if (!Array.isArray(value) || (nonEmpty && !value.length) || value.some((item) => typeof item !== 'string' || !item.trim()) || new Set(value).size !== value.length) throw new Error(`${label} 必须是无重复字符串数组`);
}

async function statOrNull(file) {
  try { return await lstat(file); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function resolveInside(root, relative, label, { allowGlob = false } = {}) {
  if (typeof relative !== 'string' || !relative.trim() || path.isAbsolute(relative) || relative.split('/').includes('..') || (!allowGlob && /[*?\[\]]/u.test(relative))) throw new Error(`${label} 必须是项目内安全相对路径`);
  const absolute = path.resolve(root, relative);
  const rel = path.relative(path.resolve(root), absolute);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`${label} 越出项目目录`);
  return absolute;
}

async function assertNoSymlink(root, absolute, label) {
  let current = path.resolve(root);
  for (const segment of path.relative(root, absolute).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const stat = await statOrNull(current);
    if (stat?.isSymbolicLink()) throw new Error(`${label} 不能经过 Symlink`);
    if (!stat) break;
  }
}

function globRegex(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/gu, '\\$&').replace(/\*\*/gu, '\u0000').replace(/\*/gu, '[^/]*').replace(/\?/gu, '[^/]').replace(/\u0000/gu, '.*');
  return new RegExp(`^${escaped}(?:/.*)?$`, 'u');
}

async function readYaml(root, relative, label) {
  const absolute = resolveInside(root, relative, label);
  await assertNoSymlink(root, absolute, label);
  const stat = await statOrNull(absolute);
  if (!stat?.isFile() || stat.isSymbolicLink()) throw new Error(`${label} 必须是普通 YAML 文件`);
  return { absolute, value: parseYamlSubset(await readFile(absolute, 'utf8')) };
}

function validateConfig(config) {
  exact(config, ['version', 'registry', 'sources', 'standard', 'deep_imports', 'validation'], '组件治理配置', ['language_analysis']);
  if (config.version !== 1 || !Array.isArray(config.sources) || !config.sources.length) throw new Error('组件治理配置版本或 sources 无效');
  resolveInside('/', config.registry, 'registry');
  const sourceIds = new Set();
  for (const source of config.sources) {
    exact(source, ['id', 'roots', 'default_level'], '组件 Source');
    if (!ID.test(source.id) || sourceIds.has(source.id) || !LEVELS.has(source.default_level)) throw new Error('组件 Source ID 重复或默认层级无效');
    sourceIds.add(source.id);
    stringList(source.roots, `Source ${source.id} roots`, { nonEmpty: true });
    for (const root of source.roots) resolveInside('/', root, `Source ${source.id} root`, { allowGlob: true });
  }
  exact(config.standard, ['roots', 'contract_pattern', 'stable_entries'], 'standard');
  stringList(config.standard.roots, 'standard.roots', { nonEmpty: true });
  stringList(config.standard.stable_entries, 'standard.stable_entries', { nonEmpty: true });
  for (const root of config.standard.roots) resolveInside('/', root, 'standard root');
  for (const entry of config.standard.stable_entries) resolveInside('/', entry, 'stable entry');
  if (config.standard.contract_pattern !== '<component-dir>/<component-name>.md') throw new Error('当前 Validator 只支持明确的组件目录内同名 Contract 模式');
  exact(config.deep_imports, ['forbidden'], 'deep_imports');
  stringList(config.deep_imports.forbidden, 'deep_imports.forbidden');
  exact(config.validation, ['require_registry_entry', 'require_contract_for_levels', 'require_public_entry_for_levels', 'deprecation_requires_replacement', 'test_policy'], 'validation');
  if (config.validation.require_registry_entry !== true || typeof config.validation.deprecation_requires_replacement !== 'boolean' || config.validation.test_policy !== 'risk-based') throw new Error('validation 门禁值不受支持');
  stringList(config.validation.require_contract_for_levels, 'require_contract_for_levels');
  stringList(config.validation.require_public_entry_for_levels, 'require_public_entry_for_levels');
  if ([...config.validation.require_contract_for_levels, ...config.validation.require_public_entry_for_levels].some((level) => !LEVELS.has(level))) throw new Error('validation 包含未知组件层级');
  if (config.language_analysis !== undefined) {
    exact(config.language_analysis, ['enabled', 'languages', 'consumer_roots', 'compatibility_baseline'], 'language_analysis');
    if (typeof config.language_analysis.enabled !== 'boolean') throw new Error('language_analysis.enabled 必须是布尔值');
    stringList(config.language_analysis.languages, 'language_analysis.languages');
    if (config.language_analysis.languages.some((item) => item !== 'javascript-typescript')) throw new Error('当前只支持 javascript-typescript 静态分析');
    stringList(config.language_analysis.consumer_roots, 'language_analysis.consumer_roots');
    for (const root of config.language_analysis.consumer_roots) resolveInside('/', root, 'consumer root');
    if (config.language_analysis.compatibility_baseline !== null) resolveInside('/', config.language_analysis.compatibility_baseline, 'compatibility baseline');
  }
  return sourceIds;
}

function validateRegistry(registry, sourceIds) {
  exact(registry, ['version', 'components'], '组件 Registry');
  if (registry.version !== 1 || !Array.isArray(registry.components)) throw new Error('组件 Registry 版本或 components 无效');
  const ids = new Set();
  const locations = new Set();
  for (const item of registry.components) {
    exact(item, ['id', 'display_name', 'purpose', 'location', 'source', 'level', 'status', 'keywords', 'contract', 'public_entry', 'replacement', 'alternatives', 'known_consumers', 'validation'], 'Registry Entry', ['exports']);
    if (!ID.test(item.id) || ids.has(item.id)) throw new Error('组件 ID 无效或重复');
    ids.add(item.id);
    if (typeof item.display_name !== 'string' || !item.display_name.trim() || typeof item.purpose !== 'string' || !item.purpose.trim() || !sourceIds.has(item.source) || !LEVELS.has(item.level) || !STATUSES.has(item.status)) throw new Error(`组件 ${item.id} 基础字段无效`);
    resolveInside('/', item.location, `组件 ${item.id} location`);
    if (locations.has(item.location)) throw new Error(`多个组件不能登记同一位置：${item.location}`);
    locations.add(item.location);
    for (const [key, value] of [['keywords', item.keywords], ['alternatives', item.alternatives], ['known_consumers', item.known_consumers], ['validation', item.validation]]) stringList(value, `组件 ${item.id} ${key}`);
    if (item.exports !== undefined) stringList(item.exports, `组件 ${item.id} exports`);
    for (const [key, value] of [['contract', item.contract], ['public_entry', item.public_entry], ['replacement', item.replacement]]) if (value !== null && (typeof value !== 'string' || !value.trim())) throw new Error(`组件 ${item.id} ${key} 无效`);
    if (item.contract !== null) resolveInside('/', item.contract, `组件 ${item.id} contract`);
  }
  return { ids, locations };
}

async function scanCodeFiles(root, forbidden, excluded) {
  const findings = [];
  const prefixes = forbidden.map((pattern) => ({ pattern, prefix: pattern.replace(/\*.*$/u, '') })).filter((item) => item.prefix);
  async function visit(directory, relative = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.agent-foundation') continue;
      const child = relative ? `${relative}/${entry.name}` : entry.name;
      if (excluded.has(child)) continue;
      if (entry.isSymbolicLink()) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute, child);
      else if (entry.isFile() && CODE_EXTENSIONS.has(path.extname(entry.name))) {
        const stat = await lstat(absolute);
        if (stat.size > 2 * 1024 * 1024) continue;
        const text = await readFile(absolute, 'utf8');
        for (const item of prefixes) if (text.includes(item.prefix)) findings.push({ code: 'forbidden-deep-import', path: child, pattern: item.pattern });
      }
    }
  }
  await visit(root);
  return findings;
}

function staticExports(text) {
  const names = new Set();
  let hasUnresolvedStar = false;
  for (const match of text.matchAll(/\bexport\s*\{([^}]+)\}(?:\s*from\s*['"][^'"]+['"])?/gu)) {
    for (const part of match[1].split(',')) {
      const value = part.trim().replace(/^type\s+/u, '');
      if (!value) continue;
      const alias = value.match(/^(?:default|[A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/u);
      const direct = value.match(/^([A-Za-z_$][\w$]*)$/u);
      if (alias) names.add(alias[1]);
      else if (direct) names.add(direct[1]);
    }
  }
  for (const match of text.matchAll(/\bexport\s+(?:declare\s+)?(?:async\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gu)) names.add(match[1]);
  if (/\bexport\s+default\b/u.test(text)) names.add('default');
  if (/\bexport\s*\*\s*from\b/u.test(text)) hasUnresolvedStar = true;
  return { names, hasUnresolvedStar };
}

function staticImports(text) {
  const imports = [];
  for (const match of text.matchAll(/\bimport\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/gu)) {
    const clause = match[1].trim();
    const names = new Set();
    const named = clause.match(/\{([^}]+)\}/u);
    if (named) for (const part of named[1].split(',')) {
      const source = part.trim().replace(/^type\s+/u, '').split(/\s+as\s+/u)[0];
      if (/^[A-Za-z_$][\w$]*$/u.test(source)) names.add(source);
    }
    if (/^[A-Za-z_$][\w$]*(?:\s*,|$)/u.test(clause)) names.add('default');
    imports.push({ specifier: match[2], names: [...names] });
  }
  return imports;
}

async function collectCodeFiles(root, roots) {
  const files = [];
  async function visit(absolute, relative) {
    const stat = await statOrNull(absolute);
    if (!stat) return;
    if (stat.isSymbolicLink()) throw new Error(`消费者目录不能经过 Symlink：${relative}`);
    if (stat.isFile()) {
      if (CODE_EXTENSIONS.has(path.extname(absolute)) && stat.size <= 2 * 1024 * 1024) files.push(relative);
      return;
    }
    if (!stat.isDirectory()) return;
    for (const entry of await readdir(absolute, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.agent-foundation') continue;
      await visit(path.join(absolute, entry.name), `${relative}/${entry.name}`.replace(/^\//u, ''));
    }
  }
  for (const relative of roots) await visit(resolveInside(root, relative, 'consumer root'), relative);
  return [...new Set(files)].sort();
}

async function inspectLanguageContracts(root, config, registry, errors, warnings, checks) {
  const analysis = config.language_analysis;
  if (!analysis?.enabled) return;
  const exported = new Set();
  for (const entry of config.standard.stable_entries) {
    const text = await readFile(resolveInside(root, entry, 'stable entry'), 'utf8');
    const parsed = staticExports(text);
    for (const name of parsed.names) exported.add(name);
    if (parsed.hasUnresolvedStar) warnings.push({ code: 'component-export-star-unresolved', path: entry });
  }
  const exportOwners = new Map();
  for (const item of registry.components) {
    if (!['project-shared', 'project-standard'].includes(item.level) || item.status === 'retired') continue;
    if (!item.exports?.length) { errors.push({ code: 'component-exports-missing', id: item.id }); continue; }
    for (const name of item.exports) {
      if (!exported.has(name)) errors.push({ code: 'component-export-not-public', id: item.id, export: name });
      if (exportOwners.has(name)) errors.push({ code: 'component-export-owner-conflict', id: item.id, export: name, other: exportOwners.get(name) });
      else exportOwners.set(name, item.id);
    }
  }
  if (analysis.compatibility_baseline) {
    const baseline = JSON.parse(await readFile(resolveInside(root, analysis.compatibility_baseline, 'compatibility baseline'), 'utf8'));
    exact(baseline, ['version', 'exports'], 'compatibility baseline');
    stringList(baseline.exports, 'compatibility baseline exports');
    if (baseline.version !== 1) throw new Error('compatibility baseline 版本无效');
    for (const name of baseline.exports) if (!exported.has(name)) errors.push({ code: 'component-breaking-export-removed', export: name });
  }
  const publicEntries = [...new Set(registry.components.map((item) => item.public_entry).filter(Boolean))];
  for (const file of await collectCodeFiles(root, analysis.consumer_roots)) {
    const imports = staticImports(await readFile(path.join(root, file), 'utf8'));
    for (const imported of imports) {
      const deepEntry = publicEntries.find((entry) => imported.specifier.startsWith(`${entry}/`));
      if (deepEntry) errors.push({ code: 'component-public-deep-import', path: file, specifier: imported.specifier });
      if (!publicEntries.includes(imported.specifier)) continue;
      for (const name of imported.names) {
        const ownerId = exportOwners.get(name);
        if (!ownerId) { errors.push({ code: 'component-import-not-registered', path: file, export: name }); continue; }
        const owner = registry.components.find((item) => item.id === ownerId);
        if (!owner.known_consumers.some((prefix) => file === prefix || file.startsWith(`${prefix}/`))) errors.push({ code: 'component-consumer-unregistered', id: owner.id, path: file, export: name });
      }
    }
  }
  checks.push({ code: 'component-language-analysis', language: 'javascript-typescript', exports: exported.size, status: 'pass' });
}

export async function checkComponentRegistry(projectRoot, { configPath = '.component-governance/config.yaml' } = {}) {
  const root = path.resolve(projectRoot);
  const errors = [];
  const warnings = [];
  const checks = [];
  try {
    const configDocument = await readYaml(root, configPath, '组件治理配置');
    const sourceIds = validateConfig(configDocument.value);
    const registryDocument = await readYaml(root, configDocument.value.registry, '组件 Registry');
    const registryInfo = validateRegistry(registryDocument.value, sourceIds);
    const sources = new Map(configDocument.value.sources.map((source) => [source.id, source]));
    for (const stableEntry of configDocument.value.standard.stable_entries) {
      const absolute = resolveInside(root, stableEntry, 'stable entry');
      await assertNoSymlink(root, absolute, 'stable entry');
      const stat = await statOrNull(absolute);
      if (!stat?.isFile() || stat.isSymbolicLink()) errors.push({ code: 'stable-entry-missing', path: stableEntry });
      else checks.push({ code: 'stable-entry', path: stableEntry, status: 'pass' });
    }
    for (const item of registryDocument.value.components) {
      const location = resolveInside(root, item.location, `组件 ${item.id} location`);
      await assertNoSymlink(root, location, `组件 ${item.id} location`);
      const source = sources.get(item.source);
      if (!source.roots.some((pattern) => globRegex(pattern).test(item.location))) errors.push({ code: 'component-source-mismatch', id: item.id, source: item.source, location: item.location });
      const locationStat = await statOrNull(location);
      if (item.status !== 'retired' && (!locationStat || locationStat.isSymbolicLink())) errors.push({ code: 'component-location-missing', id: item.id, path: item.location });
      if (configDocument.value.validation.require_contract_for_levels.includes(item.level)) {
        const expectedContract = `${item.location}/${path.posix.basename(item.location)}.md`;
        if (item.contract !== expectedContract) errors.push({ code: 'component-contract-path-mismatch', id: item.id, expected: expectedContract, actual: item.contract });
        else {
          const contract = resolveInside(root, item.contract, `组件 ${item.id} contract`);
          await assertNoSymlink(root, contract, `组件 ${item.id} contract`);
          const contractStat = await statOrNull(contract);
          if (!contractStat?.isFile() || contractStat.isSymbolicLink()) errors.push({ code: 'component-contract-missing', id: item.id, path: item.contract });
        }
      }
      if (configDocument.value.validation.require_public_entry_for_levels.includes(item.level) && !item.public_entry) errors.push({ code: 'component-public-entry-missing', id: item.id });
      if (configDocument.value.validation.deprecation_requires_replacement && item.status === 'deprecated' && (!item.replacement || !registryInfo.ids.has(item.replacement) || item.replacement === item.id)) errors.push({ code: 'component-replacement-missing', id: item.id, replacement: item.replacement });
      checks.push({ code: 'component-registry-entry', id: item.id, status: 'pass' });
    }
    for (const standardRoot of configDocument.value.standard.roots) {
      const absolute = resolveInside(root, standardRoot, 'standard root');
      await assertNoSymlink(root, absolute, 'standard root');
      const stat = await statOrNull(absolute);
      if (!stat) { warnings.push({ code: 'standard-root-missing', path: standardRoot }); continue; }
      if (!stat.isDirectory() || stat.isSymbolicLink()) { errors.push({ code: 'standard-root-invalid', path: standardRoot }); continue; }
      for (const entry of await readdir(absolute, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        if (entry.isSymbolicLink()) { errors.push({ code: 'standard-component-symlink', path: `${standardRoot}/${entry.name}` }); continue; }
        if (entry.isDirectory()) {
          const location = `${standardRoot}/${entry.name}`;
          if (!registryInfo.locations.has(location)) errors.push({ code: 'standard-component-unregistered', path: location });
        }
      }
    }
    errors.push(...await scanCodeFiles(root, configDocument.value.deep_imports.forbidden, new Set([configPath, configDocument.value.registry])));
    await inspectLanguageContracts(root, configDocument.value, registryDocument.value, errors, warnings, checks);
  } catch (error) {
    errors.push({ code: 'invalid-component-governance-contract', message: error.message });
  }
  return { ok: errors.length === 0, command: 'component-registry-check', status: errors.length ? 'fail' : warnings.length ? 'warn' : 'pass', target: root, errors, warnings, checks };
}
