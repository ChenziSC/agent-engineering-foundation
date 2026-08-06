import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateDesignContract } from '../scripts/design-contract.mjs';
const value = () => ({ version: 1, design: { source_type: 'design-file', source_ref: 'opaque:synthetic', source_version: 'v1', frames: ['main'] }, implementation: { target_paths: ['src/page.tsx'], reuse_candidates: ['Button'], constraints: [] }, acceptance: { viewports: ['desktop'], states: ['normal', 'loading', 'empty', 'error'], interactions: ['提交'], accessibility: ['键盘可达'] }, evidence: { visual_refs: ['image:comparison'], behavior_refs: ['test:page'], status: 'validated' } });
test('Design Contract 验证版本、状态和双类 Evidence', () => { assert.equal(validateDesignContract(value()).ok, true); });
test('只有视觉证据不能声明 validated', () => { const item = value(); item.evidence.behavior_refs = []; assert.throws(() => validateDesignContract(item), /视觉与行为/u); });
