const ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u;

function list(value) {
  return Array.isArray(value) ? value : [];
}

export function evaluatePrefetchCandidate(candidate) {
  const requiredKeys = [
    'version',
    'id',
    'method',
    'side_effect_free',
    'repeat_safe',
    'request_contract',
    'cache_key_dimensions',
    'required_dimensions',
    'identity_stable_before_trigger',
    'consumer_reuses_result',
    'fallback_preserves_original_path',
    'states_covered',
  ];
  if (
    !candidate ||
    typeof candidate !== 'object' ||
    Array.isArray(candidate) ||
    Object.keys(candidate).sort().join() !== requiredKeys.sort().join()
  ) {
    throw new Error('预请求候选字段与契约不一致');
  }
  if (candidate.version !== 1 || !ID.test(candidate.id)) throw new Error('预请求候选标识或版本无效');
  const blockers = [];
  if (!['GET', 'HEAD'].includes(candidate.method) || candidate.side_effect_free !== true || candidate.repeat_safe !== true) {
    blockers.push('request-not-safe-to-repeat');
  }
  if (candidate.request_contract?.consumer !== candidate.request_contract?.prefetch) {
    blockers.push('request-contract-drift');
  }
  const cacheDimensions = new Set(list(candidate.cache_key_dimensions));
  if (list(candidate.required_dimensions).some((dimension) => !cacheDimensions.has(dimension))) {
    blockers.push('cache-key-incomplete');
  }
  if (candidate.identity_stable_before_trigger !== true) blockers.push('identity-not-stable');
  if (candidate.consumer_reuses_result !== true) blockers.push('result-not-reused');
  if (candidate.fallback_preserves_original_path !== true) blockers.push('fallback-not-preserved');
  const states = new Set(list(candidate.states_covered));
  for (const state of ['normal', 'empty', 'error', 'permission']) {
    if (!states.has(state)) blockers.push(`state-not-covered:${state}`);
  }
  return {
    ok: blockers.length === 0,
    id: candidate.id,
    status: blockers.length ? 'blocked' : 'ready',
    blockers,
    verified: false,
    verification_required: ['在同一候选版本运行行为矩阵', '在固定条件下采集基线与候选多次性能证据'],
  };
}
