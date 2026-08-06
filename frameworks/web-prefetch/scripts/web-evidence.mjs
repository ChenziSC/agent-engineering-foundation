const ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u;

function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
function list(value) { return Array.isArray(value) ? value : []; }

export function summarizeHar(har) {
  const entries = list(har?.log?.entries);
  const observations = [];
  let totalTransferBytes = 0;
  const requests = [];
  for (const [index, entry] of entries.entries()) {
    const request = entry?.request || {};
    const response = entry?.response || {};
    const url = typeof request.url === 'string' ? request.url : `unknown:${index}`;
    const started_at = typeof entry.startedDateTime === 'string' ? entry.startedDateTime : null;
    const duration_ms = finite(entry.time) ? entry.time : null;
    const transfer_bytes = finite(response._transferSize) ? response._transferSize : finite(response.bodySize) && response.bodySize >= 0 ? response.bodySize : null;
    if (transfer_bytes !== null) totalTransferBytes += transfer_bytes;
    requests.push({ url, method: request.method || null, status: finite(response.status) ? response.status : null, started_at, duration_ms, transfer_bytes });
  }
  observations.push({ kind: 'network-request-count', value: requests.length, unit: 'count', source: 'har' });
  observations.push({ kind: 'known-transfer-size', value: totalTransferBytes, unit: 'bytes', source: 'har' });
  return {
    source_type: 'har', observations, requests,
    limitations: ['HAR 不包含主线程执行、DOM 状态或绘制因果。', '请求数量和体积本身不能证明其位于用户可感知关键路径。'],
  };
}

export function summarizeTrace(trace) {
  const events = list(trace?.traceEvents);
  const complete = events.filter((event) => event?.ph === 'X' && finite(event.ts) && finite(event.dur));
  const mainThreadTasks = complete.filter((event) => event.cat?.includes('devtools.timeline') || ['RunTask', 'EvaluateScript', 'FunctionCall'].includes(event.name));
  const longTasks = mainThreadTasks.filter((event) => event.dur >= 50_000).map((event) => ({ name: event.name || 'unknown', start_us: event.ts, duration_ms: event.dur / 1000 }));
  return {
    source_type: 'trace',
    observations: [
      { kind: 'trace-event-count', value: events.length, unit: 'count', source: 'trace' },
      { kind: 'main-thread-task-count', value: mainThreadTasks.length, unit: 'count', source: 'trace' },
      { kind: 'long-task-count', value: longTasks.length, unit: 'count', source: 'trace' },
    ],
    long_tasks: longTasks,
    limitations: ['没有 Source Map 或性能标记时，Trace 任务不能自动归因到具体源码模块。', '单次 Trace 不能证明稳定收益或真实用户分布。'],
  };
}

export function summarizeWebEvidence({ version, page_version, har = null, trace = null }) {
  if (version !== 1 || typeof page_version !== 'string' || !page_version.trim() || (!har && !trace)) throw new Error('Web Evidence 输入版本、页面版本或证据无效');
  const sources = [];
  if (har) sources.push(summarizeHar(har));
  if (trace) sources.push(summarizeTrace(trace));
  return {
    ok: true, page_version, sources,
    claims_allowed: ['请求时序、方法、状态、已知传输体积', 'Trace 中直接记录的任务时序与持续时间'],
    claims_not_derived: ['从 HAR 推断主线程或渲染成本', '从 Trace 自动归因到未映射源码', '从单次采集承诺稳定性能收益'],
  };
}

export function evaluatePrefetchCandidate(candidate) {
  const requiredKeys = ['version', 'id', 'method', 'side_effect_free', 'repeat_safe', 'request_contract', 'cache_key_dimensions', 'required_dimensions', 'identity_stable_before_trigger', 'consumer_reuses_result', 'fallback_preserves_original_path', 'states_covered'];
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) || Object.keys(candidate).sort().join() !== requiredKeys.sort().join()) throw new Error('预请求候选字段与契约不一致');
  if (candidate.version !== 1 || !ID.test(candidate.id)) throw new Error('预请求候选标识或版本无效');
  const blockers = [];
  if (!['GET', 'HEAD'].includes(candidate.method) || candidate.side_effect_free !== true || candidate.repeat_safe !== true) blockers.push('request-not-safe-to-repeat');
  if (candidate.request_contract?.consumer !== candidate.request_contract?.prefetch) blockers.push('request-contract-drift');
  const cacheDimensions = new Set(list(candidate.cache_key_dimensions));
  if (list(candidate.required_dimensions).some((dimension) => !cacheDimensions.has(dimension))) blockers.push('cache-key-incomplete');
  if (candidate.identity_stable_before_trigger !== true) blockers.push('identity-not-stable');
  if (candidate.consumer_reuses_result !== true) blockers.push('result-not-reused');
  if (candidate.fallback_preserves_original_path !== true) blockers.push('fallback-not-preserved');
  const states = new Set(list(candidate.states_covered));
  for (const state of ['normal', 'empty', 'error', 'permission']) if (!states.has(state)) blockers.push(`state-not-covered:${state}`);
  return { ok: blockers.length === 0, id: candidate.id, status: blockers.length ? 'blocked' : 'ready', blockers, verified: false, verification_required: ['在同一候选版本运行行为矩阵', '在固定条件下采集基线与候选多次性能证据'] };
}
