import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'node:test';
import { createAdapterRegistry } from '../../../adapters/registry.mjs';
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

const temporaryRoots = [];
const CLI = path.resolve('packages/harness/bin/agent-foundation.mjs');

function runCli(args) {
  const result = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8' });
  return {
    ...result,
    json: result.stdout ? JSON.parse(result.stdout) : null,
  };
}

async function makeTemporaryRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'agent-foundation-test-'));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  while (temporaryRoots.length) await rm(temporaryRoots.pop(), { recursive: true, force: true });
});

async function makeFakeSkillRepo(root, content = '# Demo\n') {
  const skillRoot = path.join(root, 'skills', 'demo-skill');
  await mkdir(skillRoot, { recursive: true });
  await writeFile(
    path.join(skillRoot, 'SKILL.md'),
    `---\nname: demo-skill\ndescription: 在合成测试中执行一个通用演示任务。\n---\n\n${content}`,
  );
  return skillRoot;
}

test('init 创建最小 Starter，重复执行保持幂等，Doctor 通过', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  const first = await initProject(target);
  assert.equal(first.status, 'initialized');
  assert.ok(first.added.includes('AGENTS.md'));

  const second = await initProject(target);
  assert.equal(second.status, 'unchanged');
  assert.deepEqual(second.added, []);

  const doctor = await doctorProject(target);
  assert.equal(doctor.ok, true);
  assert.equal(doctor.status, 'pass');
  assert.equal(doctor.errors.length, 0);
});

test('init 遇到既有不同内容时整体阻断，不写入其他 Starter 文件', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await mkdir(target);
  await writeFile(path.join(target, 'AGENTS.md'), '# 用户已有规则\n');

  await assert.rejects(
    initProject(target),
    (error) => error instanceof FoundationError && error.code === 'init-conflict',
  );
  assert.equal(await readFile(path.join(target, 'AGENTS.md'), 'utf8'), '# 用户已有规则\n');
  await assert.rejects(readFile(path.join(target, 'agent-foundation.json')), { code: 'ENOENT' });
});

test('Skill 发现与检查从真实源目录派生', async () => {
  const skills = await discoverSkills();
  assert.deepEqual(
    skills.map((skill) => skill.name),
    ['project-component-governance', 'specflow', 'web-first-screen-prefetch', 'web-performance-review'],
  );
  for (const skill of skills) {
    assert.match(skill.digest, /^sha256:[a-f0-9]{64}$/u);
    assert.equal((await checkSkill(skill.name)).ok, true);
  }
});

test('Skill Plan 是只读操作，Install 幂等并被 Doctor 复核', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);

  const plan = await planSkill({ target, name: 'web-performance-review' });
  assert.equal(plan.ok, true);
  assert.equal(plan.action, 'add');
  await assert.rejects(readFile(path.join(target, '.agent-foundation', 'installed-skills.json')), { code: 'ENOENT' });

  const installed = await installSkill({ target, name: 'web-performance-review' });
  assert.equal(installed.status, 'installed');
  const repeated = await installSkill({ target, name: 'web-performance-review' });
  assert.equal(repeated.status, 'unchanged');

  const doctor = await doctorProject(target);
  assert.equal(doctor.ok, true);
  assert.ok(doctor.checks.some((check) => check.code === 'installed-skill'));
});

test('Install 不覆盖未纳管的同名目录', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  const destination = path.join(target, '.agents', 'skills', 'specflow');
  await mkdir(destination, { recursive: true });
  await writeFile(path.join(destination, 'KEEP.txt'), 'user-owned');

  await assert.rejects(
    installSkill({ target, name: 'specflow' }),
    (error) => error instanceof FoundationError && error.code === 'skill-conflict',
  );
  assert.equal(await readFile(path.join(destination, 'KEEP.txt'), 'utf8'), 'user-owned');
});

test('Update 检测用户修改并保持目标内容不变', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  await installSkill({ target, name: 'specflow' });
  const skillFile = path.join(target, '.agents', 'skills', 'specflow', 'SKILL.md');
  await writeFile(skillFile, `${await readFile(skillFile, 'utf8')}\n用户本地修改\n`);
  const before = await readFile(skillFile, 'utf8');

  await assert.rejects(
    updateSkill({ target, name: 'specflow' }),
    (error) => error instanceof FoundationError && error.code === 'skill-conflict',
  );
  assert.equal(await readFile(skillFile, 'utf8'), before);
  assert.equal((await doctorProject(target)).ok, false);
});

test('Update 只更新已纳管且未被用户修改的 Skill', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  const fakeRepo = path.join(root, 'source');
  const sourceSkill = await makeFakeSkillRepo(fakeRepo, '# 第一版\n');
  await initProject(target);
  await installSkill({ target, name: 'demo-skill', repoRoot: fakeRepo });

  await writeFile(
    path.join(sourceSkill, 'SKILL.md'),
    '---\nname: demo-skill\ndescription: 在合成测试中执行一个通用演示任务。\n---\n\n# 第二版\n',
  );
  const plan = await planSkill({ target, name: 'demo-skill', operation: 'update', repoRoot: fakeRepo });
  assert.equal(plan.action, 'update');
  const updated = await updateSkill({ target, name: 'demo-skill', repoRoot: fakeRepo });
  assert.equal(updated.status, 'updated');
  assert.match(await readFile(path.join(target, '.agents', 'skills', 'demo-skill', 'SKILL.md'), 'utf8'), /第二版/u);
  assert.equal((await doctorProject(target)).ok, true);
});

test('未知 Skill 和 Symlink 目标均在写入前阻断', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  const outside = path.join(root, 'outside');
  await initProject(target);
  await mkdir(outside);

  await assert.rejects(
    installSkill({ target, name: 'missing-skill' }),
    (error) => error instanceof FoundationError && error.code === 'skill-not-found',
  );
  await mkdir(path.join(target, '.agents'));
  await symlink(outside, path.join(target, '.agents', 'skills'));
  await assert.rejects(
    installSkill({ target, name: 'specflow' }),
    (error) => error instanceof FoundationError && error.code === 'unsafe-symlink',
  );
  assert.deepEqual(await readdirNames(outside), []);
});

test('CLI 暴露初始化、Doctor、Skill 列表和参数错误退出码', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');

  const initialized = runCli(['init', '--target', target]);
  assert.equal(initialized.status, 0, initialized.stderr);
  assert.equal(initialized.json.status, 'initialized');

  const doctor = runCli(['doctor', '--target', target]);
  assert.equal(doctor.status, 0, doctor.stderr);
  assert.equal(doctor.json.status, 'pass');

  const listed = runCli(['skill', 'list']);
  assert.equal(listed.status, 0, listed.stderr);
  assert.ok(listed.json.skills.some((skill) => skill.name === 'specflow'));

  const repository = runCli(['repository', 'check']);
  assert.equal(repository.status, 0, repository.stderr);
  assert.equal(repository.json.status, 'pass');

  const invalid = runCli(['skill', 'install', '--target', target]);
  assert.equal(invalid.status, 2);
  assert.equal(invalid.json.error.code, 'invalid-arguments');

  const missingDenyFile = runCli(['repository', 'check', '--deny-file']);
  assert.equal(missingDenyFile.status, 2);
  assert.equal(missingDenyFile.json.error.code, 'invalid-arguments');
});

test('仓库检查支持私有词表且不在结果中回显词条', async () => {
  const passed = await checkRepository();
  assert.equal(passed.ok, true);

  const privateTerm = 'Agent 工程治理骨架';
  const blocked = await checkRepository({ denyTerms: [privateTerm] });
  assert.equal(blocked.ok, false);
  assert.ok(blocked.errors.some((error) => error.code === 'denied-sensitive-term'));
  assert.equal(JSON.stringify(blocked).includes(privateTerm), false);
});

test('采用方可以注入合成 Host Adapter，无需修改 Harness 核心', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  const manifestPath = path.join(target, 'agent-foundation.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.integrations = [
    {
      capability: 'host',
      adapterId: 'synthetic-host',
      configRef: 'env://SYNTHETIC_HOST_CONFIG',
    },
  ];
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const syntheticHost = {
    capability: 'host',
    id: 'synthetic-host',
    displayName: 'Synthetic Host',
    scope: 'project',
    supportsSymlinks: false,
    resolveProjectSkillsDir(projectRoot) {
      return path.join(projectRoot, '.synthetic-agent', 'skills');
    },
  };
  const adapterRegistry = createAdapterRegistry([syntheticHost]);

  const plan = await planSkill({ target, name: 'specflow', adapterRegistry });
  assert.equal(plan.host, 'synthetic-host');
  assert.equal(plan.target, '.synthetic-agent/skills/specflow');
  assert.equal((await installSkill({ target, name: 'specflow', adapterRegistry })).status, 'installed');
  assert.equal((await doctorProject(target, { adapterRegistry })).status, 'pass');
  assert.equal((await doctorProject(target)).ok, false);
});

test('Integration Manifest 对重复、未知和越界 Adapter 保持明确边界', async () => {
  const root = await makeTemporaryRoot();
  const target = path.join(root, 'project');
  await initProject(target);
  const manifestPath = path.join(target, 'agent-foundation.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  manifest.integrations.push({
    capability: 'work-item',
    adapterId: 'synthetic-tracker',
    configRef: 'env://SYNTHETIC_TRACKER_CONFIG',
  });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const warningDoctor = await doctorProject(target);
  assert.equal(warningDoctor.ok, true);
  assert.equal(warningDoctor.status, 'warn');
  assert.ok(warningDoctor.warnings.some((warning) => warning.code === 'adapter-unavailable'));

  manifest.integrations.push({ ...manifest.integrations[0] });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.ok((await doctorProject(target)).errors.some((error) => error.code === 'duplicate-integration'));

  manifest.integrations = [manifest.integrations[0]];
  manifest.integrations[0].configRef = 'inline-secret-like-value';
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.ok((await doctorProject(target)).errors.some((error) => error.code === 'invalid-integration'));

  manifest.integrations[0].configRef = null;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const escapingRegistry = createAdapterRegistry([
    {
      capability: 'host',
      id: 'open-agent',
      scope: 'project',
      resolveProjectSkillsDir(projectRoot) {
        return path.resolve(projectRoot, '..', 'outside-skills');
      },
    },
  ]);
  await assert.rejects(
    planSkill({ target, name: 'specflow', adapterRegistry: escapingRegistry }),
    (error) => error instanceof FoundationError && error.code === 'unsafe-path',
  );
  assert.ok(
    (await doctorProject(target, { adapterRegistry: escapingRegistry })).errors.some(
      (error) => error.code === 'unsafe-path',
    ),
  );
  assert.throws(
    () => createAdapterRegistry([{ capability: 'host', id: 'same' }, { capability: 'host', id: 'same' }]),
    /重复注册/u,
  );
});

async function readdirNames(directory) {
  const { readdir } = await import('node:fs/promises');
  return (await readdir(directory)).sort();
}
