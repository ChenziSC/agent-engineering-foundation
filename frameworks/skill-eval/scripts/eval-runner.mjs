import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIGEST = /^sha256:[a-f0-9]{64}$/u;
const CASE_ID = /^[a-z0-9][a-z0-9._-]{0,127}$/u;
const RUN_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u;
const EVIDENCE_ID = /^[A-Z][A-Z0-9-]{1,31}$/u;

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function digest(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}

function exact(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} 必须是对象`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) throw new Error(`${label} 字段与契约不一致`);
}

async function statOrNull(file) {
  try { return await lstat(file); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function inside(root, relative, label) {
  if (typeof relative !== 'string' || path.isAbsolute(relative)) throw new Error(`${label} 必须是相对路径`);
  const absolute = path.resolve(root, relative);
  const rel = path.relative(path.resolve(root), absolute);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`${label} 越出 Skill 目录`);
  return absolute;
}

async function assertPlainFile(root, relative, label) {
  const absolute = inside(root, relative, label);
  let current = path.resolve(root);
  for (const segment of path.relative(root, absolute).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const stat = await statOrNull(current);
    if (stat?.isSymbolicLink()) throw new Error(`${label} 不能经过 Symlink`);
    if (!stat) break;
  }
  const stat = await statOrNull(absolute);
  if (!stat?.isFile() || stat.isSymbolicLink()) throw new Error(`${label} 必须是普通文件`);
  return absolute;
}

async function collectBehaviorFiles(skillRoot) {
  const files = [];
  async function visit(directory, relative = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const child = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Skill 行为来源包含 Symlink：${child}`);
      if (child.startsWith('evals/traces/') || /^evals\/replay(?:\.[a-z0-9_-]+)?\.json$/u.test(child) || /^evals\/run-report(?:\.|$)/u.test(child)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute, child);
      else if (entry.isFile()) files.push(child);
    }
  }
  await visit(skillRoot);
  return files;
}

export async function behaviorDigest(skillRoot) {
  const hash = createHash('sha256');
  for (const relative of await collectBehaviorFiles(skillRoot)) {
    hash.update(relative); hash.update('\0'); hash.update(await readFile(path.join(skillRoot, relative))); hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

function validateEvidenceRefs(value, traceIds, label) {
  if (!Array.isArray(value) || !value.length || value.some((id) => !EVIDENCE_ID.test(id)) || new Set(value).size !== value.length) throw new Error(`${label} 必须引用至少一个无重复 Trace Evidence ID`);
  for (const id of value) if (!traceIds.has(id)) throw new Error(`${label} 引用 Trace 中不存在的 ${id}`);
}

function scoreCase(candidate, traceIds, threshold) {
  exact(candidate, ['id', 'case_path', 'trace_path', 'blocking_violations', 'dimensions', 'required_actions', 'forbidden_actions', 'inconclusive'], `Case ${candidate.id || ''}`);
  if (!CASE_ID.test(candidate.id) || !Array.isArray(candidate.blocking_violations) || !Array.isArray(candidate.dimensions) || !candidate.dimensions.length || !Array.isArray(candidate.required_actions) || !Array.isArray(candidate.forbidden_actions) || !Array.isArray(candidate.inconclusive) || candidate.inconclusive.some((item) => typeof item !== 'string' || !item.trim())) throw new Error(`Case ${candidate.id || ''} 结构无效`);
  for (const item of candidate.blocking_violations) {
    exact(item, ['id', 'evidence_refs'], `Case ${candidate.id} blocking violation`);
    if (!CASE_ID.test(item.id)) throw new Error(`Case ${candidate.id} blocking violation ID 无效`);
    validateEvidenceRefs(item.evidence_refs, traceIds, `Case ${candidate.id} blocking violation`);
  }
  let score = 0;
  let weight = 0;
  let dimensionInconclusive = false;
  const dimensionNames = new Set();
  for (const item of candidate.dimensions) {
    exact(item, ['name', 'weight', 'score', 'status', 'evidence_refs'], `Case ${candidate.id} dimension`);
    if (typeof item.name !== 'string' || !item.name.trim() || dimensionNames.has(item.name) || !Number.isFinite(item.weight) || item.weight <= 0 || !Number.isFinite(item.score) || item.score < 0 || item.score > item.weight || !['assessed', 'inconclusive'].includes(item.status)) throw new Error(`Case ${candidate.id} dimension 无效`);
    dimensionNames.add(item.name);
    validateEvidenceRefs(item.evidence_refs, traceIds, `Case ${candidate.id} dimension ${item.name}`);
    weight += item.weight;
    score += item.score;
    if (item.status === 'inconclusive') dimensionInconclusive = true;
  }
  if (weight !== 100) throw new Error(`Case ${candidate.id} dimension 权重总和必须为 100`);
  for (const item of candidate.required_actions) {
    exact(item, ['id', 'status', 'evidence_refs'], `Case ${candidate.id} required action`);
    if (!CASE_ID.test(item.id) || !['pass', 'fail', 'inconclusive'].includes(item.status)) throw new Error(`Case ${candidate.id} required action 无效`);
    validateEvidenceRefs(item.evidence_refs, traceIds, `Case ${candidate.id} required action ${item.id}`);
  }
  for (const item of candidate.forbidden_actions) {
    exact(item, ['id', 'occurred', 'evidence_refs'], `Case ${candidate.id} forbidden action`);
    if (!CASE_ID.test(item.id) || typeof item.occurred !== 'boolean') throw new Error(`Case ${candidate.id} forbidden action 无效`);
    validateEvidenceRefs(item.evidence_refs, traceIds, `Case ${candidate.id} forbidden action ${item.id}`);
  }
  const blocking = candidate.blocking_violations.length > 0 || candidate.forbidden_actions.some((item) => item.occurred);
  const requiredFailure = candidate.required_actions.some((item) => item.status === 'fail');
  const inconclusive = dimensionInconclusive || candidate.inconclusive.length > 0 || candidate.required_actions.some((item) => item.status === 'inconclusive');
  const result = blocking || requiredFailure || score < threshold ? 'fail' : inconclusive ? 'inconclusive' : 'pass';
  return { result, score, blocking };
}

export async function buildEvalRun({ skillRoot, replayPath = 'evals/replay.json' }) {
  const root = path.resolve(skillRoot);
  const replayAbsolute = await assertPlainFile(root, replayPath, 'Replay');
  const replay = JSON.parse(await readFile(replayAbsolute, 'utf8'));
  exact(replay, ['schema_version', 'run_id', 'skill_name', 'executed_at', 'environment', 'threshold', 'cases'], 'Replay');
  if (replay.schema_version !== 1 || !RUN_ID.test(replay.run_id) || !/^[a-z0-9][a-z0-9-]{0,63}$/u.test(replay.skill_name) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/u.test(replay.executed_at) || !Number.isFinite(replay.threshold) || replay.threshold < 0 || replay.threshold > 100 || !Array.isArray(replay.cases) || !replay.cases.length) throw new Error('Replay 顶层字段无效');
  exact(replay.environment, ['host', 'tools', 'configuration_ref'], 'Replay environment');
  if (typeof replay.environment.host !== 'string' || !replay.environment.host.trim() || !Array.isArray(replay.environment.tools) || replay.environment.tools.some((item) => typeof item !== 'string' || !item.trim()) || new Set(replay.environment.tools).size !== replay.environment.tools.length || (replay.environment.configuration_ref !== null && typeof replay.environment.configuration_ref !== 'string')) throw new Error('Replay environment 无效');
  const skillMarkdown = await readFile(await assertPlainFile(root, 'SKILL.md', 'SKILL.md'), 'utf8');
  const nameMatch = skillMarkdown.match(/^name:\s*([^\r\n]+)$/mu);
  if (!nameMatch || nameMatch[1].trim() !== replay.skill_name) throw new Error('Replay skill_name 与 SKILL.md 不一致');
  const rubricPath = 'evals/rubric.md';
  const rubric = await readFile(await assertPlainFile(root, rubricPath, 'Rubric'), 'utf8');
  const caseDirectory = inside(root, 'evals/cases', 'Case 目录');
  const actualCasePaths = (await readdir(caseDirectory, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.endsWith('.md')).map((entry) => `evals/cases/${entry.name}`).sort();
  const declaredCasePaths = replay.cases.map((item) => item.case_path).sort();
  if (new Set(declaredCasePaths).size !== declaredCasePaths.length || actualCasePaths.length !== declaredCasePaths.length || actualCasePaths.some((item, index) => item !== declaredCasePaths[index])) throw new Error('Replay 必须动态覆盖 evals/cases 中的全部真实 Case，不能遗漏或写死名称');
  const cases = [];
  const ids = new Set();
  for (const candidate of replay.cases) {
    if (ids.has(candidate.id)) throw new Error(`Replay Case ID 重复：${candidate.id}`);
    ids.add(candidate.id);
    const caseContent = await readFile(await assertPlainFile(root, candidate.case_path, `Case ${candidate.id}`));
    const traceContent = await readFile(await assertPlainFile(root, candidate.trace_path, `Trace ${candidate.id}`), 'utf8');
    const traceIds = new Set([...traceContent.matchAll(/\[([A-Z][A-Z0-9-]{1,31})\]/gu)].map((match) => match[1]));
    if (!traceIds.size) throw new Error(`Trace ${candidate.id} 没有可引用的 Evidence ID`);
    const scored = scoreCase(candidate, traceIds, replay.threshold);
    cases.push({ id: candidate.id, case_path: candidate.case_path, case_digest: digest(caseContent), trace_path: candidate.trace_path, trace_digest: digest(traceContent), result: scored.result, score: scored.score, blocking_violations: candidate.blocking_violations, dimensions: candidate.dimensions, required_actions: candidate.required_actions, forbidden_actions: candidate.forbidden_actions, inconclusive: candidate.inconclusive });
  }
  const counts = { pass: cases.filter((item) => item.result === 'pass').length, fail: cases.filter((item) => item.result === 'fail').length, inconclusive: cases.filter((item) => item.result === 'inconclusive').length };
  const report = { schema_version: 1, run_id: replay.run_id, skill: { name: replay.skill_name, behavior_digest: await behaviorDigest(root) }, executed_at: replay.executed_at, environment: replay.environment, rubric: { path: rubricPath, digest: digest(rubric), threshold: replay.threshold }, cases, summary: { result: counts.fail ? 'fail' : counts.inconclusive ? 'inconclusive' : 'pass', ...counts, blocking_failures: cases.filter((item) => item.blocking_violations.length || item.forbidden_actions.some((action) => action.occurred)).length, average_score: Number((cases.reduce((sum, item) => sum + item.score, 0) / cases.length).toFixed(2)) } };
  report.integrity = { algorithm: 'sha256', canonicalization: 'canonical-json-without-integrity', payload_digest: digest(canonical(report)) };
  return report;
}

export function validateEvalRun(report) {
  exact(report, ['schema_version', 'run_id', 'skill', 'executed_at', 'environment', 'rubric', 'cases', 'summary', 'integrity'], 'Eval Run');
  exact(report.skill, ['name', 'behavior_digest'], 'Eval Run skill');
  exact(report.environment, ['host', 'tools', 'configuration_ref'], 'Eval Run environment');
  exact(report.rubric, ['path', 'digest', 'threshold'], 'Eval Run rubric');
  exact(report.summary, ['result', 'pass', 'fail', 'inconclusive', 'blocking_failures', 'average_score'], 'Eval Run summary');
  exact(report.integrity, ['algorithm', 'canonicalization', 'payload_digest'], 'Eval Run integrity');
  if (
    report.schema_version !== 1 ||
    !RUN_ID.test(report.run_id) ||
    !/^[a-z0-9][a-z0-9-]{0,63}$/u.test(report.skill.name) ||
    !DIGEST.test(report.skill.behavior_digest) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/u.test(report.executed_at) ||
    typeof report.environment.host !== 'string' ||
    !report.environment.host.trim() ||
    !Array.isArray(report.environment.tools) ||
    report.environment.tools.some((item) => typeof item !== 'string' || !item.trim()) ||
    new Set(report.environment.tools).size !== report.environment.tools.length ||
    (report.environment.configuration_ref !== null && typeof report.environment.configuration_ref !== 'string') ||
    report.rubric.path !== 'evals/rubric.md' ||
    !DIGEST.test(report.rubric.digest) ||
    !Number.isFinite(report.rubric.threshold) ||
    report.rubric.threshold < 0 ||
    report.rubric.threshold > 100 ||
    !Array.isArray(report.cases) ||
    !report.cases.length ||
    !DIGEST.test(report.integrity.payload_digest)
  ) throw new Error('Eval Run 顶层字段无效');
  const caseIds = new Set();
  for (const item of report.cases) {
    exact(item, ['id', 'case_path', 'case_digest', 'trace_path', 'trace_digest', 'result', 'score', 'blocking_violations', 'dimensions', 'required_actions', 'forbidden_actions', 'inconclusive'], `Eval Run Case ${item?.id || ''}`);
    if (!CASE_ID.test(item.id) || caseIds.has(item.id) || typeof item.case_path !== 'string' || typeof item.trace_path !== 'string' || !DIGEST.test(item.case_digest) || !DIGEST.test(item.trace_digest) || !['pass', 'fail', 'inconclusive'].includes(item.result) || !Number.isFinite(item.score) || item.score < 0 || item.score > 100 || !Array.isArray(item.blocking_violations) || !Array.isArray(item.dimensions) || !item.dimensions.length || !Array.isArray(item.required_actions) || !Array.isArray(item.forbidden_actions) || !Array.isArray(item.inconclusive)) throw new Error(`Eval Run Case ${item.id || ''} 字段无效`);
    caseIds.add(item.id);
    let weight = 0;
    let score = 0;
    let hasInconclusiveDimension = false;
    for (const dimension of item.dimensions) {
      exact(dimension, ['name', 'weight', 'score', 'status', 'evidence_refs'], `Eval Run Case ${item.id} dimension`);
      if (typeof dimension.name !== 'string' || !dimension.name.trim() || !Number.isFinite(dimension.weight) || dimension.weight <= 0 || !Number.isFinite(dimension.score) || dimension.score < 0 || dimension.score > dimension.weight || !['assessed', 'inconclusive'].includes(dimension.status) || !Array.isArray(dimension.evidence_refs) || !dimension.evidence_refs.length || dimension.evidence_refs.some((id) => !EVIDENCE_ID.test(id))) throw new Error(`Eval Run Case ${item.id} dimension 无效`);
      weight += dimension.weight;
      score += dimension.score;
      if (dimension.status === 'inconclusive') hasInconclusiveDimension = true;
    }
    if (weight !== 100 || score !== item.score) throw new Error(`Eval Run Case ${item.id} 权重或总分不一致`);
    for (const violation of item.blocking_violations) {
      exact(violation, ['id', 'evidence_refs'], `Eval Run Case ${item.id} blocking violation`);
      if (!CASE_ID.test(violation.id) || !Array.isArray(violation.evidence_refs) || !violation.evidence_refs.length || violation.evidence_refs.some((id) => !EVIDENCE_ID.test(id))) throw new Error(`Eval Run Case ${item.id} blocking violation 无效`);
    }
    for (const action of item.required_actions) {
      exact(action, ['id', 'status', 'evidence_refs'], `Eval Run Case ${item.id} required action`);
      if (!CASE_ID.test(action.id) || !['pass', 'fail', 'inconclusive'].includes(action.status) || !Array.isArray(action.evidence_refs) || !action.evidence_refs.length || action.evidence_refs.some((id) => !EVIDENCE_ID.test(id))) throw new Error(`Eval Run Case ${item.id} required action 无效`);
    }
    for (const action of item.forbidden_actions) {
      exact(action, ['id', 'occurred', 'evidence_refs'], `Eval Run Case ${item.id} forbidden action`);
      if (!CASE_ID.test(action.id) || typeof action.occurred !== 'boolean' || !Array.isArray(action.evidence_refs) || !action.evidence_refs.length || action.evidence_refs.some((id) => !EVIDENCE_ID.test(id))) throw new Error(`Eval Run Case ${item.id} forbidden action 无效`);
    }
    const blocking = item.blocking_violations.length > 0 || item.forbidden_actions.some((action) => action.occurred);
    const requiredFailure = item.required_actions.some((action) => action.status === 'fail');
    const inconclusiveCase = hasInconclusiveDimension || item.inconclusive.length > 0 || item.required_actions.some((action) => action.status === 'inconclusive');
    const expectedResult = blocking || requiredFailure || item.score < report.rubric.threshold ? 'fail' : inconclusiveCase ? 'inconclusive' : 'pass';
    if (item.result !== expectedResult) throw new Error(`Eval Run Case ${item.id} 结果与评分不一致`);
  }
  const payload = { ...report }; delete payload.integrity;
  if (report.integrity.algorithm !== 'sha256' || report.integrity.canonicalization !== 'canonical-json-without-integrity' || report.integrity.payload_digest !== digest(canonical(payload))) throw new Error('Eval Run 完整性摘要不匹配');
  const pass = report.cases.filter((item) => item.result === 'pass').length;
  const fail = report.cases.filter((item) => item.result === 'fail').length;
  const inconclusive = report.cases.filter((item) => item.result === 'inconclusive').length;
  const blockingFailures = report.cases.filter((item) => item.blocking_violations.length || item.forbidden_actions.some((action) => action.occurred)).length;
  const averageScore = Number((report.cases.reduce((sum, item) => sum + item.score, 0) / report.cases.length).toFixed(2));
  if (pass !== report.summary.pass || fail !== report.summary.fail || inconclusive !== report.summary.inconclusive || blockingFailures !== report.summary.blocking_failures || averageScore !== report.summary.average_score || report.summary.result !== (fail ? 'fail' : inconclusive ? 'inconclusive' : 'pass')) throw new Error('Eval Run 汇总与 Case 不一致');
  return { ok: true, runId: report.run_id, result: report.summary.result, digest: report.integrity.payload_digest };
}

export async function writeEvalRun({ skillRoot, replayPath = 'evals/replay.json', outputPath = 'evals/run-report.json' }) {
  const report = await buildEvalRun({ skillRoot, replayPath });
  validateEvalRun(report);
  const output = inside(path.resolve(skillRoot), outputPath, 'Eval Run 输出');
  const content = `${JSON.stringify(report, null, 2)}\n`;
  const stat = await statOrNull(output);
  if (stat) {
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Eval Run 输出必须是普通文件');
    if (await readFile(output, 'utf8') !== content) throw new Error('Eval Run 输出已存在且内容不同，拒绝覆盖；请使用新的 run_id 或显式移走旧报告');
    return { ...validateEvalRun(report), file: output, status: 'unchanged' };
  }
  await writeFile(output, content, { flag: 'wx' });
  return { ...validateEvalRun(report), file: output, status: 'written' };
}

export function compareEvalRuns(baseline, candidate) {
  validateEvalRun(baseline); validateEvalRun(candidate);
  if (baseline.skill.name !== candidate.skill.name) throw new Error('只能比较同一 Skill 的 Eval Run');
  const baselineCases = new Map(baseline.cases.map((item) => [item.id, item]));
  const candidateCases = new Map(candidate.cases.map((item) => [item.id, item]));
  const ids = [...new Set([...baselineCases.keys(), ...candidateCases.keys()])].sort();
  const changes = ids.map((id) => ({ id, baseline: baselineCases.get(id)?.result || 'missing', candidate: candidateCases.get(id)?.result || 'missing', scoreDelta: baselineCases.has(id) && candidateCases.has(id) ? candidateCases.get(id).score - baselineCases.get(id).score : null }));
  const comparableEnvironment = canonical(baseline.environment) === canonical(candidate.environment);
  const blockingRegression = candidate.cases.some((item) => item.blocking_violations.length || item.forbidden_actions.some((action) => action.occurred)) && !baseline.cases.some((item) => item.blocking_violations.length || item.forbidden_actions.some((action) => action.occurred));
  const regression = changes.some((item) => item.baseline === 'pass' && item.candidate !== 'pass') || blockingRegression;
  return { ok: true, command: 'eval-compare', comparableEnvironment, result: !comparableEnvironment ? 'inconclusive' : regression ? 'regression' : 'no-blocking-regression', blockingRegression, changes };
}
