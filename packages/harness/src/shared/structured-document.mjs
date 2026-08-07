import { readFile } from 'node:fs/promises';
import { FoundationError } from './errors.mjs';

export function validateYamlSubset(text) {
  const issues = [];
  const lines = text.split(/\r?\n/u);
  let previousIndent = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (/\t/u.test(line)) issues.push({ line: index + 1, reason: 'tab-indentation' });
    const indent = line.match(/^ */u)[0].length;
    if (indent % 2 !== 0) issues.push({ line: index + 1, reason: 'odd-indentation' });
    if (indent > previousIndent + 2) issues.push({ line: index + 1, reason: 'indentation-jump' });
    const body = line.trim();
    if (!/^(?:-\s+(?:[A-Za-z0-9_-]+:\s*)?.+|[A-Za-z0-9_-]+:\s*.*)$/u.test(body)) {
      issues.push({ line: index + 1, reason: 'unsupported-yaml-shape' });
    }
    const doubleQuotes = (body.match(/(?<!\\)"/gu) || []).length;
    const singleQuotes = (body.match(/(?<!\\)'/gu) || []).length;
    if (doubleQuotes % 2 !== 0 || singleQuotes % 2 !== 0) {
      issues.push({ line: index + 1, reason: 'unbalanced-quotes' });
    }
    previousIndent = indent;
  }
  return issues;
}

function parseSupportedYamlScalar(raw, line) {
  const value = raw.trim();
  if (value === '') throw new FoundationError('invalid-yaml', 'YAML 标量不能为空', { line });
  if (value === 'null' || value === '~') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === '[]') return [];
  if (value === '{}') return {};
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/u.test(value)) return Number(value);
  if (value.startsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      throw new FoundationError('invalid-yaml', 'YAML 双引号字符串无效', { line });
    }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'")) throw new FoundationError('invalid-yaml', 'YAML 单引号字符串无效', { line });
    return value.slice(1, -1).replace(/''/gu, "'");
  }
  return value;
}

export function parseSupportedYaml(text) {
  const tokens = text
    .split(/\r?\n/u)
    .map((raw, index) => ({ raw, line: index + 1 }))
    .filter(({ raw }) => raw.trim() && !raw.trimStart().startsWith('#'))
    .map(({ raw, line }) => {
      if (raw.includes('\t')) throw new FoundationError('invalid-yaml', 'YAML 不允许 Tab 缩进', { line });
      const indent = raw.match(/^ */u)[0].length;
      if (indent % 2 !== 0) throw new FoundationError('invalid-yaml', 'YAML 缩进必须为两个空格的倍数', { line });
      return { indent, body: raw.trim(), line };
    });

  function splitMapping(body, line) {
    const match = body.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/u);
    if (!match) throw new FoundationError('invalid-yaml', 'YAML 只支持简单 Mapping Key', { line });
    return { key: match[1], rawValue: match[2] || '' };
  }

  function parseBlock(start, indent) {
    const token = tokens[start];
    if (!token || token.indent !== indent) throw new FoundationError('invalid-yaml', 'YAML 缩进层级不连续', { line: token?.line });
    return token.body === '-' || token.body.startsWith('- ') ? parseSequence(start, indent) : parseMapping(start, indent);
  }

  function readMappingEntry(target, token, body, nextIndex, childIndent) {
    const { key, rawValue } = splitMapping(body, token.line);
    if (Object.hasOwn(target, key)) throw new FoundationError('invalid-yaml', 'YAML 包含重复 Key', { line: token.line, key });
    if (rawValue !== '') {
      target[key] = parseSupportedYamlScalar(rawValue, token.line);
      return nextIndex;
    }
    const next = tokens[nextIndex];
    if (!next || next.indent <= token.indent) {
      target[key] = null;
      return nextIndex;
    }
    if (next.indent !== childIndent) throw new FoundationError('invalid-yaml', 'YAML 子级缩进不连续', { line: next.line });
    const parsed = parseBlock(nextIndex, childIndent);
    target[key] = parsed.value;
    return parsed.next;
  }

  function parseMapping(start, indent, initial = {}) {
    const value = initial;
    let index = start;
    while (index < tokens.length && tokens[index].indent === indent && !tokens[index].body.startsWith('-')) {
      const token = tokens[index];
      index = readMappingEntry(value, token, token.body, index + 1, indent + 2);
    }
    return { value, next: index };
  }

  function parseSequence(start, indent) {
    const value = [];
    let index = start;
    while (index < tokens.length && tokens[index].indent === indent && (tokens[index].body === '-' || tokens[index].body.startsWith('- '))) {
      const token = tokens[index];
      const rest = token.body.slice(1).trim();
      index += 1;
      if (!rest) {
        const parsed = parseBlock(index, indent + 2);
        value.push(parsed.value);
        index = parsed.next;
      } else if (/^[A-Za-z0-9_-]+:/u.test(rest)) {
        const item = {};
        index = readMappingEntry(item, token, rest, index, indent + 2);
        if (index < tokens.length && tokens[index].indent === indent + 2 && !tokens[index].body.startsWith('-')) {
          const parsed = parseMapping(index, indent + 2, item);
          index = parsed.next;
        }
        value.push(item);
      } else value.push(parseSupportedYamlScalar(rest, token.line));
    }
    return { value, next: index };
  }

  if (!tokens.length) return {};
  if (tokens[0].indent !== 0) throw new FoundationError('invalid-yaml', 'YAML 根级必须从零缩进开始');
  const parsed = parseBlock(0, 0);
  if (parsed.next !== tokens.length) throw new FoundationError('invalid-yaml', 'YAML 存在无法解析的剩余内容');
  return parsed.value;
}

export async function readJson(filePath, label) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    throw new FoundationError('invalid-json', `${label} 不是有效 JSON`, { path: filePath, reason: error.message });
  }
}

export async function readStructuredDocument(filePath, label) {
  if (filePath.endsWith('.json')) return readJson(filePath, label);
  try {
    return parseSupportedYaml(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error instanceof FoundationError) throw error;
    throw new FoundationError('invalid-yaml', `${label} 不是受支持的 YAML`, { path: filePath, reason: error.message });
  }
}

function yamlScalar(value) {
  if (value === null) return 'null';
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value) && value.length === 0) return '[]';
  if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) return '{}';
  return null;
}

function serializeYamlLines(value, indent = 0) {
  const prefix = ' '.repeat(indent);
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const scalar = yamlScalar(item);
      if (scalar !== null) return [`${prefix}- ${scalar}`];
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const entries = Object.entries(item);
        const [firstKey, firstValue] = entries[0];
        const firstScalar = yamlScalar(firstValue);
        const lines =
          firstScalar !== null
            ? [`${prefix}- ${firstKey}: ${firstScalar}`]
            : [`${prefix}- ${firstKey}:`, ...serializeYamlLines(firstValue, indent + 4)];
        for (const [key, child] of entries.slice(1)) {
          const childScalar = yamlScalar(child);
          if (childScalar !== null) lines.push(`${' '.repeat(indent + 2)}${key}: ${childScalar}`);
          else lines.push(`${' '.repeat(indent + 2)}${key}:`, ...serializeYamlLines(child, indent + 4));
        }
        return lines;
      }
      return [`${prefix}-`, ...serializeYamlLines(item, indent + 2)];
    });
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => {
      const scalar = yamlScalar(child);
      return scalar !== null
        ? [`${prefix}${key}: ${scalar}`]
        : [`${prefix}${key}:`, ...serializeYamlLines(child, indent + 2)];
    });
  }
  throw new FoundationError('invalid-yaml', '无法序列化超出支持范围的 YAML 值');
}

export function serializeStructuredDocument(filePath, value) {
  if (filePath.endsWith('.json')) return `${JSON.stringify(value, null, 2)}\n`;
  return `${serializeYamlLines(value).join('\n')}\n`;
}
