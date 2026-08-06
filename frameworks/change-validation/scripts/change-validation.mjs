const ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u;

function exact(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} 必须是对象`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) throw new Error(`${label} 字段与契约不一致`);
}

function unique(items, label) {
  if (!Array.isArray(items) || new Set(items).size !== items.length || items.some((item) => typeof item !== 'string' || !item.trim())) throw new Error(`${label} 必须是无重复字符串数组`);
}

function indexById(items, label) {
  const result = new Map();
  for (const item of items) {
    if (!ID.test(item.id) || result.has(item.id)) throw new Error(`${label} ID 无效或重复`);
    result.set(item.id, item);
  }
  return result;
}

function validateResult(item, label) {
  if (!['planned', 'passed', 'failed', 'blocked'].includes(item.status)) throw new Error(`${label} status 无效`);
  if (item.status === 'passed' && (typeof item.evidence_ref !== 'string' || !item.evidence_ref.trim())) throw new Error(`${label} passed 时必须引用 Evidence`);
}

export function evaluateChangeValidation(matrix) {
  exact(matrix, ['version', 'change_id', 'changed_paths', 'rules', 'checks', 'browser_scenarios', 'manual_gates'], 'Change Validation Matrix');
  if (matrix.version !== 1 || !ID.test(matrix.change_id)) throw new Error('Change Validation 标识或版本无效');
  unique(matrix.changed_paths, 'changed_paths');
  if (!matrix.changed_paths.length || !Array.isArray(matrix.rules) || !matrix.rules.length) throw new Error('changed_paths 和 rules 不能为空');
  const checks = indexById(matrix.checks, 'Check');
  const scenarios = indexById(matrix.browser_scenarios, 'Browser Scenario');
  const gates = indexById(matrix.manual_gates, 'Manual Gate');
  for (const check of checks.values()) {
    exact(check, ['id', 'command', 'status', 'evidence_ref'], `Check ${check.id}`);
    if (!check.command?.trim()) throw new Error(`Check ${check.id} command 无效`);
    validateResult(check, `Check ${check.id}`);
  }
  for (const scenario of scenarios.values()) {
    exact(scenario, ['id', 'page', 'version', 'preconditions', 'actions', 'expected', 'status', 'evidence_ref'], `Browser Scenario ${scenario.id}`);
    unique(scenario.preconditions, `Scenario ${scenario.id} preconditions`);
    unique(scenario.actions, `Scenario ${scenario.id} actions`);
    unique(scenario.expected, `Scenario ${scenario.id} expected`);
    if (!scenario.page?.trim() || !scenario.version?.trim() || !scenario.actions.length || !scenario.expected.length) throw new Error(`Browser Scenario ${scenario.id} 内容不完整`);
    validateResult(scenario, `Browser Scenario ${scenario.id}`);
  }
  for (const gate of gates.values()) {
    exact(gate, ['id', 'question', 'status', 'evidence_ref'], `Manual Gate ${gate.id}`);
    if (!gate.question?.trim()) throw new Error(`Manual Gate ${gate.id} question 无效`);
    validateResult(gate, `Manual Gate ${gate.id}`);
  }
  const ruleIds = new Set();
  const coverage = matrix.changed_paths.map((changedPath) => ({ path: changedPath, rule_ids: [] }));
  for (const rule of matrix.rules) {
    exact(rule, ['id', 'path_prefixes', 'required_checks', 'required_browser_scenarios', 'required_manual_gates'], `Rule ${rule.id}`);
    if (!ID.test(rule.id) || ruleIds.has(rule.id)) throw new Error('Rule ID 无效或重复');
    ruleIds.add(rule.id);
    for (const key of ['path_prefixes', 'required_checks', 'required_browser_scenarios', 'required_manual_gates']) unique(rule[key], `Rule ${rule.id} ${key}`);
    if (!rule.path_prefixes.length) throw new Error(`Rule ${rule.id} path_prefixes 不能为空`);
    for (const id of rule.required_checks) if (!checks.has(id)) throw new Error(`Rule ${rule.id} 引用不存在的 Check ${id}`);
    for (const id of rule.required_browser_scenarios) if (!scenarios.has(id)) throw new Error(`Rule ${rule.id} 引用不存在的 Browser Scenario ${id}`);
    for (const id of rule.required_manual_gates) if (!gates.has(id)) throw new Error(`Rule ${rule.id} 引用不存在的 Manual Gate ${id}`);
    for (const item of coverage) if (rule.path_prefixes.some((prefix) => item.path === prefix || item.path.startsWith(prefix))) item.rule_ids.push(rule.id);
  }
  const uncovered = coverage.filter((item) => item.rule_ids.length === 0).map((item) => item.path);
  const required = new Set();
  for (const rule of matrix.rules) for (const [kind, ids] of [['check', rule.required_checks], ['browser', rule.required_browser_scenarios], ['manual', rule.required_manual_gates]]) for (const id of ids) required.add(`${kind}:${id}`);
  const results = [...required].sort().map((ref) => {
    const [kind, id] = ref.split(':');
    const item = kind === 'check' ? checks.get(id) : kind === 'browser' ? scenarios.get(id) : gates.get(id);
    return { ref, status: item.status, evidence_ref: item.evidence_ref };
  });
  const incomplete = results.filter((item) => item.status !== 'passed');
  return { ok: uncovered.length === 0 && incomplete.length === 0, command: 'change-validation-check', status: uncovered.length ? 'uncovered' : incomplete.length ? 'incomplete' : 'passed', coverage, uncovered_paths: uncovered, required_results: results, incomplete_results: incomplete };
}
