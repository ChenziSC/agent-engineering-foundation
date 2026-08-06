function strings(value, label, required = false) {
  if (!Array.isArray(value) || (required && !value.length) || value.some((item) => typeof item !== 'string' || !item.trim()) || new Set(value).size !== value.length) throw new Error(`${label} 必须是无重复字符串数组`);
}
function exact(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).sort().join() !== [...keys].sort().join()) throw new Error(`${label} 字段与契约不一致`);
}
export function validateDesignContract(contract) {
  exact(contract, ['version', 'design', 'implementation', 'acceptance', 'evidence'], 'Design Contract');
  if (contract.version !== 1) throw new Error('Design Contract 版本无效');
  exact(contract.design, ['source_type', 'source_ref', 'source_version', 'frames'], 'design');
  if (!['design-file', 'image', 'document', 'other'].includes(contract.design.source_type) || !contract.design.source_ref?.trim() || !contract.design.source_version?.trim()) throw new Error('design 输入无效');
  strings(contract.design.frames, 'design.frames', true);
  exact(contract.implementation, ['target_paths', 'reuse_candidates', 'constraints'], 'implementation');
  strings(contract.implementation.target_paths, 'implementation.target_paths', true); strings(contract.implementation.reuse_candidates, 'implementation.reuse_candidates'); strings(contract.implementation.constraints, 'implementation.constraints');
  exact(contract.acceptance, ['viewports', 'states', 'interactions', 'accessibility'], 'acceptance');
  strings(contract.acceptance.viewports, 'acceptance.viewports', true); strings(contract.acceptance.states, 'acceptance.states', true); strings(contract.acceptance.interactions, 'acceptance.interactions'); strings(contract.acceptance.accessibility, 'acceptance.accessibility');
  if (contract.acceptance.states.some((state) => !['normal', 'loading', 'empty', 'error', 'disabled', 'permission'].includes(state))) throw new Error('acceptance.states 包含未知状态');
  exact(contract.evidence, ['visual_refs', 'behavior_refs', 'status'], 'evidence');
  strings(contract.evidence.visual_refs, 'evidence.visual_refs'); strings(contract.evidence.behavior_refs, 'evidence.behavior_refs');
  if (!['planned', 'partial', 'validated'].includes(contract.evidence.status)) throw new Error('evidence.status 无效');
  if (contract.evidence.status === 'validated' && (!contract.evidence.visual_refs.length || !contract.evidence.behavior_refs.length)) throw new Error('validated 必须同时包含视觉与行为 Evidence');
  return { ok: true, status: contract.evidence.status, source_version: contract.design.source_version, target_paths: contract.implementation.target_paths };
}
