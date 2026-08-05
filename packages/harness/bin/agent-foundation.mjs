#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import {
  FoundationError,
  checkRepository,
  checkSkill,
  discoverSkills,
  doctorProject,
  initProject,
  installSkill,
  planSkill,
  updateSkill,
} from '../src/harness.mjs';

function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) {
      positional.push(value);
      continue;
    }
    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      options[key] = true;
    } else {
      options[key] = next;
      index += 1;
    }
  }
  return { positional, options };
}

function required(options, key) {
  const value = options[key];
  if (!value || value === true) {
    throw new FoundationError('invalid-arguments', `缺少 --${key}`);
  }
  return value;
}

async function run() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const [command, subcommand] = positional;
  const target = options.target && options.target !== true ? options.target : process.cwd();
  const host = options.host && options.host !== true ? options.host : undefined;

  if (command === 'init' && !subcommand) return initProject(target);
  if (command === 'doctor' && !subcommand) return doctorProject(target);
  if (command === 'repository' && subcommand === 'check') {
    let denyTerms = [];
    if (Object.hasOwn(options, 'deny-file')) {
      const denyFilePath = required(options, 'deny-file');
      const denyFile = await readFile(denyFilePath, 'utf8').catch(() => {
        throw new FoundationError('invalid-deny-file', '无法读取敏感词文件');
      });
      denyTerms = denyFile
        .split(/\r?\n/u)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));
    }
    return checkRepository({ repoRoot: target, denyTerms });
  }
  if (command === 'skill' && subcommand === 'list') return { ok: true, skills: await discoverSkills() };
  if (command === 'skill' && subcommand === 'check') return checkSkill(required(options, 'name'));
  if (command === 'skill' && subcommand === 'plan') {
    const operation = options.operation && options.operation !== true ? options.operation : 'install';
    return planSkill({ target, name: required(options, 'name'), host, operation });
  }
  if (command === 'skill' && subcommand === 'install') {
    return installSkill({ target, name: required(options, 'name'), host });
  }
  if (command === 'skill' && subcommand === 'update') {
    return updateSkill({ target, name: required(options, 'name'), host });
  }

  throw new FoundationError(
    'invalid-arguments',
    '用法：init | doctor | repository check [--deny-file <file>] | skill list | skill check|plan|install|update --name <skill> [--target <dir>] [--host <adapter-id>]',
  );
}

try {
  const result = await run();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.ok === false) process.exitCode = 1;
} catch (error) {
  const known = error instanceof FoundationError;
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: false,
        error: {
          code: known ? error.code : 'unexpected-error',
          message: error.message,
          details: known ? error.details : undefined,
        },
      },
      null,
      2,
    )}\n`,
  );
  process.exitCode = known && error.code === 'invalid-arguments' ? 2 : 1;
}
