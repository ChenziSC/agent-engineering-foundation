import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateEventCatalog } from '../scripts/event-catalog.mjs';
const catalog = () => ({ version: 1, events: [{ name: 'item_viewed', purpose: '衡量合成条目查看', trigger: '合成条目首次可见', status: 'active', properties: [{ name: 'item_type', type: 'string', required: true, source: '页面模型', privacy: 'none', approval_ref: null }], replacement: null, validation_scenarios: ['首次可见触发一次', '重复渲染不重复触发'] }] });
test('Event Catalog 校验事件、属性来源和验证场景', () => { assert.equal(validateEventCatalog(catalog()).ok, true); });
test('敏感属性必须有显式审批引用', () => { const value = catalog(); value.events[0].properties[0].privacy = 'sensitive'; assert.throws(() => validateEventCatalog(value), /审批引用/u); });
