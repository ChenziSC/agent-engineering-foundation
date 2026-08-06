import { openAgentHost } from './open-agent/index.mjs';
import { localGitSourceControl } from './source-control/local-git.mjs';

const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/u;

function validateAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') throw new TypeError('Adapter 必须是对象');
  if (!IDENTIFIER_PATTERN.test(adapter.capability || '')) throw new TypeError('Adapter capability 不合法');
  if (!IDENTIFIER_PATTERN.test(adapter.id || '')) throw new TypeError('Adapter id 不合法');
}

export function createAdapterRegistry(adapters = []) {
  const records = new Map();
  for (const source of adapters) {
    validateAdapter(source);
    const adapter = Object.freeze({ ...source });
    const key = `${adapter.capability}:${adapter.id}`;
    if (records.has(key)) throw new TypeError(`Adapter 重复注册：${key}`);
    records.set(key, adapter);
  }

  return Object.freeze({
    get(capability, id) {
      return records.get(`${capability}:${id}`) || null;
    },
    list(capability) {
      return [...records.values()].filter((adapter) => !capability || adapter.capability === capability);
    },
  });
}

export const defaultAdapterRegistry = createAdapterRegistry([openAgentHost, localGitSourceControl]);
