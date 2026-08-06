#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  FoundationError,
  applyDistribution,
  applyKnowledgeProjection,
  checkChangeGate,
  checkRepository,
  checkKnowledgeGovernance,
  checkSpecflowGovernance,
  checkSkill,
  discoverSkills,
  doctorProject,
  initProject,
  installSkill,
  inspectSourceControlSnapshot,
  planKnowledgeProjection,
  planDistribution,
  planProjectInit,
  planSkill,
  resolveProjectContext,
  updateSkill,
  verifyDistribution,
  verifyKnowledgeProjection,
} from '../src/harness.mjs';
import { checkEvidenceBundleFile } from '../../../frameworks/evidence/scripts/evidence-bundle.mjs';
import { buildEvalRun, compareEvalRuns } from '../../../frameworks/skill-eval/scripts/eval-runner.mjs';
import { checkComponentRegistry } from '../../../skills/project-component-governance/scripts/validate-registry.mjs';
import { deriveResumePlan, validateCheckpoint } from '../../../frameworks/checkpoint/scripts/checkpoint.mjs';
import { evaluateChangeValidation } from '../../../frameworks/change-validation/scripts/change-validation.mjs';
import { validateDesignContract } from '../../../frameworks/design-to-code/scripts/design-contract.mjs';
import { validateEventCatalog } from '../../../frameworks/tracking-governance/scripts/event-catalog.mjs';
import { summarizeWebEvidence } from '../../../frameworks/web-evidence/scripts/web-evidence.mjs';
import { evaluatePrefetchCandidate } from '../../../frameworks/web-prefetch/scripts/prefetch-candidate.mjs';

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
    const parsedValue = !next || next.startsWith('--') ? true : next;
    if (key === 'spec-id' && Object.hasOwn(options, key)) {
      options[key] = Array.isArray(options[key]) ? [...options[key], parsedValue] : [options[key], parsedValue];
      if (parsedValue !== true) index += 1;
      continue;
    }
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
  const [command, subcommand, operation] = positional;
  const target = options.target && options.target !== true ? options.target : process.cwd();
  const host = options.host && options.host !== true ? options.host : undefined;
  const commaList = (key) =>
    options[key] && options[key] !== true
      ? options[key].split(',').map((value) => value.trim()).filter(Boolean)
      : [];
  const repeatedList = (key) => {
    const values = Array.isArray(options[key]) ? options[key] : [options[key]];
    return values
      .filter((value) => typeof value === 'string')
      .flatMap((value) => value.split(','))
      .map((value) => value.trim())
      .filter(Boolean);
  };
  const readJsonOption = async (key = 'file') => JSON.parse(await readFile(required(options, key), 'utf8'));

  if (command === 'init' && !subcommand) return initProject(target);
  if (command === 'init' && subcommand === 'plan') return planProjectInit(target);
  if (command === 'doctor' && !subcommand) return doctorProject(target);
  if (command === 'specflow' && subcommand === 'check') return checkSpecflowGovernance(target);
  if (command === 'knowledge' && subcommand === 'check') return checkKnowledgeGovernance(target);
  if (command === 'knowledge' && subcommand === 'projection' && ['plan', 'apply', 'verify'].includes(operation)) {
    const projectionOptions = {
      projectionPath: required(options, 'projection'),
      specId: required(options, 'spec-id'),
      reviewedAt: required(options, 'reviewed-at'),
      changedPaths: commaList('paths'),
    };
    if (operation === 'plan') return planKnowledgeProjection(target, projectionOptions);
    if (operation === 'apply') return applyKnowledgeProjection(target, projectionOptions);
    return verifyKnowledgeProjection(target, projectionOptions);
  }
  if (command === 'context' && subcommand === 'resolve') {
    const taskType = options['task-type'] && options['task-type'] !== true ? options['task-type'] : undefined;
    const paths = options.paths && options.paths !== true ? options.paths.split(',').map((value) => value.trim()).filter(Boolean) : [];
    return resolveProjectContext(target, { taskType, paths });
  }
  if (command === 'source-control' && subcommand === 'inspect') {
    return inspectSourceControlSnapshot(target, {
      baseRevision: required(options, 'base'),
      sourceRevision: options.source && options.source !== true ? options.source : 'HEAD',
      includePaths: commaList('include'),
      excludePaths: commaList('exclude'),
      provider: options.provider && options.provider !== true ? options.provider : 'local-git',
    });
  }
  if (command === 'change' && subcommand === 'gate' && operation === 'check') {
    return checkChangeGate(target, {
      baseRevision: required(options, 'base'),
      sourceRevision: options.source && options.source !== true ? options.source : 'HEAD',
      specIds: repeatedList('spec-id'),
      exemption: options.exemption && options.exemption !== true ? options.exemption : undefined,
      phase: options.phase && options.phase !== true ? options.phase : 'work',
      includePaths: commaList('include'),
      excludePaths: commaList('exclude'),
      provider: options.provider && options.provider !== true ? options.provider : 'local-git',
    });
  }
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
    const gitScope = options['git-scope'] && options['git-scope'] !== true ? options['git-scope'] : 'none';
    return checkRepository({ repoRoot: target, denyTerms, gitScope });
  }
  if (command === 'distribution' && ['plan', 'apply', 'verify'].includes(subcommand)) {
    const distributionOptions = {
      target,
      manifestPath:
        options.manifest && options.manifest !== true ? options.manifest : 'distribution/manifest.yaml',
    };
    if (subcommand === 'plan') return planDistribution(distributionOptions);
    if (subcommand === 'apply') return applyDistribution(distributionOptions);
    return verifyDistribution(distributionOptions);
  }
  if (command === 'evidence' && subcommand === 'check') {
    return checkEvidenceBundleFile(required(options, 'file'));
  }
  if (command === 'component' && subcommand === 'check') {
    return checkComponentRegistry(target, {
      configPath:
        options.config && options.config !== true ? options.config : '.component-governance/config.yaml',
    });
  }
  if (command === 'checkpoint' && subcommand === 'check') return validateCheckpoint(await readJsonOption());
  if (command === 'checkpoint' && subcommand === 'resume') {
    return deriveResumePlan(await readJsonOption(), {
      currentInputDigest: options['input-digest'] && options['input-digest'] !== true ? options['input-digest'] : undefined,
    });
  }
  if (command === 'change-validation' && subcommand === 'check') return evaluateChangeValidation(await readJsonOption());
  if (command === 'web-evidence' && subcommand === 'summarize') return summarizeWebEvidence(await readJsonOption());
  if (command === 'prefetch' && subcommand === 'check') return evaluatePrefetchCandidate(await readJsonOption());
  if (command === 'design' && subcommand === 'check') return validateDesignContract(await readJsonOption());
  if (command === 'tracking' && subcommand === 'check') return validateEventCatalog(await readJsonOption());
  if (command === 'eval' && subcommand === 'run') {
    const name = required(options, 'skill');
    return buildEvalRun({
      skillRoot: path.join(target, 'skills', name),
      replayPath: options.replay && options.replay !== true ? options.replay : 'evals/replay.json',
    });
  }
  if (command === 'eval' && subcommand === 'compare') {
    const baseline = JSON.parse(await readFile(required(options, 'baseline'), 'utf8'));
    const candidate = JSON.parse(await readFile(required(options, 'candidate'), 'utf8'));
    return compareEvalRuns(baseline, candidate);
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
    '用法：init [plan] | doctor | specflow check | knowledge check | knowledge projection plan|apply|verify --projection <file> --spec-id <id> --reviewed-at <YYYY-MM-DD> [--paths <path,...>] | context resolve [--task-type <type>] [--paths <path,...>] | source-control inspect --base <ref> [--source <ref>] [--include <path,...>] [--exclude <path,...>] | change gate check --base <ref> (--spec-id <id> [--spec-id <id>...] | --exemption <code>) [--phase work|delivery] [--source <ref>] [--include <path,...>] [--exclude <path,...>] | repository check [--deny-file <file>] [--git-scope none|staged|reachable|all] | distribution plan|apply|verify [--manifest <file>] [--target <dir>] | evidence check --file <bundle.json> | checkpoint check|resume --file <checkpoint.json> [--input-digest <sha256>] | change-validation check --file <matrix.json> | web-evidence summarize --file <evidence.json> | prefetch check --file <candidate.json> | design check --file <contract.json> | tracking check --file <catalog.json> | component check [--target <project>] [--config <file>] | eval run --skill <name> [--target <repo>] [--replay <file>] | eval compare --baseline <report.json> --candidate <report.json> | skill list | skill check|plan|install|update --name <skill> [--target <dir>] [--host <adapter-id>]',
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
