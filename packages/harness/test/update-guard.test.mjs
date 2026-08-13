import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'node:test';
import { runManagedSkillUpdate } from '../src/runtime/update-guard.mjs';

const temporaryRoots = [];

afterEach(async () => {
  while (temporaryRoots.length) await rm(temporaryRoots.pop(), { recursive: true, force: true });
});

async function fixture({ version = '0.2.0', producer = false } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'foundation-update-guard-'));
  temporaryRoots.push(root);
  const directory = path.join(root, '.agent-foundation');
  await mkdir(directory);
  await writeFile(
    path.join(directory, 'installed-skills.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      foundationVersion: version,
      distributionProfile: 'core',
      records: {
        specflow: producer
          ? { host: 'open-agent', mode: 'source', scope: 'project', path: '.agents/skills/specflow' }
          : { host: 'open-agent', scope: 'project', path: '.agents/skills/specflow', digest: `sha256:${'a'.repeat(64)}` },
      },
    }, null, 2)}\n`,
  );
  return root;
}

test('生产者模式不查询 Registry 且不写自动更新状态', async () => {
  const root = await fixture({ producer: true });
  let fetches = 0;
  const result = await runManagedSkillUpdate({
    target: root,
    fetchLatest: async () => {
      fetches += 1;
      return '0.3.0';
    },
  });
  assert.equal(result.status, 'producer-skipped');
  assert.equal(fetches, 0);
  await assert.rejects(readFile(path.join(root, '.agent-foundation', 'auto-update-state.json')), { code: 'ENOENT' });
});

test('消费者 TTL 命中只读取本地状态', async () => {
  const root = await fixture();
  const now = Date.parse('2026-08-12T10:00:00Z');
  await writeFile(
    path.join(root, '.agent-foundation', 'auto-update-state.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      lastCheckedAt: '2026-08-12T09:00:00.000Z',
      latestVersion: '0.2.0',
      lastStatus: 'current',
    })}\n`,
  );
  let fetches = 0;
  const result = await runManagedSkillUpdate({
    target: root,
    now: () => now,
    fetchLatest: async () => {
      fetches += 1;
      return '0.3.0';
    },
  });
  assert.equal(result.status, 'cached');
  assert.equal(result.cachedStatus, 'current');
  assert.equal(fetches, 0);
});

test('消费者远端版本相同时刷新检查状态', async () => {
  const root = await fixture();
  const now = Date.parse('2026-08-12T10:00:00Z');
  const result = await runManagedSkillUpdate({ target: root, now: () => now, fetchLatest: async () => '0.2.0' });
  assert.equal(result.status, 'current');
  assert.equal(result.reloadSkill, false);
  const state = JSON.parse(await readFile(path.join(root, '.agent-foundation', 'auto-update-state.json'), 'utf8'));
  assert.equal(state.lastCheckedAt, '2026-08-12T10:00:00.000Z');
  assert.equal(state.latestVersion, '0.2.0');
});

test('消费者发现更高稳定版本时使用精确版本升级并要求重读 Skill', async () => {
  const root = await fixture();
  const calls = [];
  const result = await runManagedSkillUpdate({
    target: root,
    fetchLatest: async () => '0.3.0',
    runUpgrade: async (target, version) => {
      calls.push({ target, version });
      return { ok: true };
    },
  });
  assert.equal(result.status, 'updated');
  assert.equal(result.previousFoundationVersion, '0.2.0');
  assert.equal(result.foundationVersion, '0.3.0');
  assert.equal(result.reloadSkill, true);
  assert.deepEqual(calls, [{ target: root, version: '0.3.0' }]);
});

test('并发触发只允许一个检查持锁，其他触发快速继续', async () => {
  const root = await fixture();
  let releaseFetch;
  const first = runManagedSkillUpdate({
    target: root,
    fetchLatest: () => new Promise((resolve) => {
      releaseFetch = resolve;
    }),
  });
  while (!releaseFetch) await new Promise((resolve) => setImmediate(resolve));
  const concurrent = await runManagedSkillUpdate({ target: root, fetchLatest: async () => '9.9.9' });
  assert.deepEqual(concurrent, {
    ok: true,
    status: 'cached',
    cachedStatus: 'update-in-progress',
    reloadSkill: false,
  });
  releaseFetch('0.2.0');
  assert.equal((await first).status, 'current');
});

test('Registry 和 Upgrade 失败均保留旧版并返回紧凑 degraded 状态', async () => {
  const networkRoot = await fixture();
  const network = await runManagedSkillUpdate({
    target: networkRoot,
    fetchLatest: async () => {
      throw new Error('secret network response must not escape');
    },
  });
  assert.deepEqual(network, { ok: false, status: 'degraded', code: 'registry-unavailable', reloadSkill: false });

  const upgradeRoot = await fixture();
  const upgrade = await runManagedSkillUpdate({
    target: upgradeRoot,
    fetchLatest: async () => '0.3.0',
    runUpgrade: async () => ({ ok: false, code: 'upgrade-command-failed', raw: 'must not escape' }),
  });
  assert.deepEqual(upgrade, { ok: false, status: 'degraded', code: 'upgrade-command-failed', reloadSkill: false });
});

test('无效消费状态和预发布 latest 不执行升级', async () => {
  const invalidRoot = await fixture({ version: 'legacy' });
  let upgrades = 0;
  const invalid = await runManagedSkillUpdate({
    target: invalidRoot,
    fetchLatest: async () => '0.3.0',
    runUpgrade: async () => {
      upgrades += 1;
      return { ok: true };
    },
  });
  assert.equal(invalid.code, 'invalid-consumer-state');

  const prereleaseRoot = await fixture();
  const prerelease = await runManagedSkillUpdate({
    target: prereleaseRoot,
    fetchLatest: async () => '0.3.0-beta.1',
    runUpgrade: async () => {
      upgrades += 1;
      return { ok: true };
    },
  });
  assert.equal(prerelease.code, 'invalid-version-state');
  assert.equal(upgrades, 0);
});
