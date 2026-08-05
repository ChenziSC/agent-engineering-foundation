import path from 'node:path';

export function resolveProjectSkillsDir(projectRoot) {
  const root = path.resolve(projectRoot);
  return path.join(root, '.agents', 'skills');
}

export const openAgentHost = Object.freeze({
  capability: 'host',
  id: 'open-agent',
  displayName: 'Open Agent Skills',
  scope: 'project',
  projectSkillsPath: '.agents/skills',
  supportsSymlinks: false,
  resolveProjectSkillsDir,
});
