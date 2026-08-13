#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { lstat, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const PACKAGE_NAME = 'agent-engineering-foundation';
const PUBLIC_REGISTRY = 'https://registry.npmjs.org/';
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const STALE_LOCK_MS = 5 * 60 * 1000;
const INSTALL_STATE = path.join('.agent-foundation', 'installed-skills.json');
const UPDATE_STATE = path.join('.agent-foundation', 'auto-update-state.json');
const UPDATE_LOCK = path.join('.agent-foundation', 'auto-update.lock');

function stableVersion(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u);
  return match ? match.slice(1).map(Number) : null;
}

function compareStableVersions(left, right) {
  const leftParts = stableVersion(left);
  const rightParts = stableVersion(right);
  if (!leftParts || !rightParts) return null;
  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] < rightParts[index] ? -1 : 1;
  }
  return 0;
}

async function readJsonFile(filePath) {
  const fileStat = await lstat(filePath).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!fileStat) return null;
  if (!fileStat.isFile() || fileStat.isSymbolicLink()) throw new Error('unsafe-state-file');
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJsonAtomic(filePath, value) {
  const directory = path.dirname(filePath);
  const directoryStat = await lstat(directory);
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) throw new Error('unsafe-state-directory');
  const temporary = `${filePath}.tmp-${randomUUID()}`;
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
    await rename(temporary, filePath);
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
  }
}

function isProducerState(state) {
  const records = state?.records && typeof state.records === 'object' ? Object.values(state.records) : [];
  return records.length > 0 && records.every((record) => record?.mode === 'source' && record?.scope === 'project');
}

function validConsumerState(state) {
  if (!state || state.schemaVersion !== 1 || stableVersion(state.foundationVersion) === null) return false;
  const records = state.records && typeof state.records === 'object' ? Object.values(state.records) : [];
  return records.length > 0 && records.every((record) => record?.scope === 'project' && typeof record?.digest === 'string');
}

async function defaultFetchLatest() {
  const response = await fetch(`${PUBLIC_REGISTRY}${PACKAGE_NAME}/latest`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('registry-request-failed');
  const metadata = await response.json();
  if (metadata?.name !== PACKAGE_NAME || stableVersion(metadata?.version) === null) {
    throw new Error('invalid-registry-version');
  }
  return metadata.version;
}

function defaultRunUpgrade(target, version) {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(
    command,
    [
      '--yes',
      '--package',
      `${PACKAGE_NAME}@${version}`,
      '--',
      'agent-foundation',
      'upgrade',
      'apply',
      '--target',
      target,
    ],
    { encoding: 'utf8', env: process.env, maxBuffer: 8 * 1024 * 1024 },
  );
  if (result.error || result.status !== 0) return { ok: false, code: 'upgrade-command-failed' };
  try {
    const output = JSON.parse(result.stdout);
    return output?.ok === true && output?.foundationVersion === version
      ? { ok: true }
      : { ok: false, code: 'upgrade-result-invalid' };
  } catch {
    return { ok: false, code: 'upgrade-result-invalid' };
  }
}

async function acquireLock(lockPath, nowMs) {
  try {
    await mkdir(lockPath);
    return true;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const lockStat = await stat(lockPath).catch(() => null);
    if (!lockStat || nowMs - lockStat.mtimeMs <= STALE_LOCK_MS) return false;
    await rm(lockPath, { recursive: true, force: true });
    try {
      await mkdir(lockPath);
      return true;
    } catch (retryError) {
      if (retryError.code === 'EEXIST') return false;
      throw retryError;
    }
  }
}

function compactFailure(code) {
  return { ok: false, status: 'degraded', code, reloadSkill: false };
}

export async function runManagedSkillUpdate({
  target = process.cwd(),
  now = () => Date.now(),
  ttlMs = DEFAULT_TTL_MS,
  fetchLatest = defaultFetchLatest,
  runUpgrade = defaultRunUpgrade,
} = {}) {
  const projectRoot = path.resolve(target);
  const foundationDirectory = path.join(projectRoot, '.agent-foundation');
  const installStatePath = path.join(projectRoot, INSTALL_STATE);
  const updateStatePath = path.join(projectRoot, UPDATE_STATE);
  const lockPath = path.join(projectRoot, UPDATE_LOCK);
  try {
    const foundationStat = await lstat(foundationDirectory);
    if (!foundationStat.isDirectory() || foundationStat.isSymbolicLink()) return compactFailure('unsafe-foundation-directory');
    const installState = await readJsonFile(installStatePath);
    if (isProducerState(installState)) {
      return { ok: true, status: 'producer-skipped', reloadSkill: false };
    }
    if (!validConsumerState(installState)) return compactFailure('invalid-consumer-state');

    const currentTime = now();
    const updateState = await readJsonFile(updateStatePath).catch(() => null);
    const checkedAt = Date.parse(updateState?.lastCheckedAt || '');
    if (Number.isFinite(checkedAt) && currentTime >= checkedAt && currentTime - checkedAt < ttlMs) {
      return {
        ok: updateState.lastStatus !== 'degraded',
        status: 'cached',
        cachedStatus: updateState.lastStatus || 'current',
        reloadSkill: false,
      };
    }

    if (!(await acquireLock(lockPath, currentTime))) {
      return { ok: true, status: 'cached', cachedStatus: 'update-in-progress', reloadSkill: false };
    }
    try {
      let latestVersion;
      try {
        latestVersion = await fetchLatest();
      } catch {
        const result = compactFailure('registry-unavailable');
        await writeJsonAtomic(updateStatePath, {
          schemaVersion: 1,
          lastCheckedAt: new Date(currentTime).toISOString(),
          latestVersion: null,
          lastStatus: result.status,
        });
        return result;
      }
      const comparison = compareStableVersions(installState.foundationVersion, latestVersion);
      if (comparison === null) return compactFailure('invalid-version-state');
      if (comparison >= 0) {
        await writeJsonAtomic(updateStatePath, {
          schemaVersion: 1,
          lastCheckedAt: new Date(currentTime).toISOString(),
          latestVersion,
          lastStatus: 'current',
        });
        return {
          ok: true,
          status: 'current',
          foundationVersion: installState.foundationVersion,
          latestVersion,
          reloadSkill: false,
        };
      }
      const upgrade = await runUpgrade(projectRoot, latestVersion);
      if (!upgrade?.ok) {
        const result = compactFailure(upgrade?.code || 'upgrade-failed');
        await writeJsonAtomic(updateStatePath, {
          schemaVersion: 1,
          lastCheckedAt: new Date(currentTime).toISOString(),
          latestVersion,
          lastStatus: result.status,
        });
        return result;
      }
      await writeJsonAtomic(updateStatePath, {
        schemaVersion: 1,
        lastCheckedAt: new Date(currentTime).toISOString(),
        latestVersion,
        lastStatus: 'updated',
      });
      return {
        ok: true,
        status: 'updated',
        previousFoundationVersion: installState.foundationVersion,
        foundationVersion: latestVersion,
        reloadSkill: true,
      };
    } finally {
      await rm(lockPath, { recursive: true, force: true }).catch(() => {});
    }
  } catch {
    return compactFailure('update-guard-failed');
  }
}

function parseTarget(argv) {
  const index = argv.indexOf('--target');
  if (index === -1) return process.cwd();
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error('missing-target');
  return value;
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  Promise.resolve()
    .then(() => runManagedSkillUpdate({ target: parseTarget(process.argv.slice(2)) }))
    .then((result) => process.stdout.write(`${JSON.stringify(result)}\n`))
    .catch(() => {
      process.stdout.write(`${JSON.stringify(compactFailure('update-guard-failed'))}\n`);
    });
}

export const internals = Object.freeze({
  DEFAULT_TTL_MS,
  compareStableVersions,
  isProducerState,
  validConsumerState,
});
