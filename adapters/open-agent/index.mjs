import path from 'node:path';

export const FOUNDATION_SOURCE_SKILLS_REF = 'foundation-source://skills';

export function resolveProjectSkillsDir(projectRoot) {
  const root = path.resolve(projectRoot);
  return path.join(root, '.agents', 'skills');
}

export function resolveProjectSourceSkillsDir(projectRoot, integration) {
  if (integration?.configRef !== FOUNDATION_SOURCE_SKILLS_REF) return null;
  return path.join(path.resolve(projectRoot), 'skills');
}

export const openAgentHost = Object.freeze({
  capability: 'host',
  id: 'open-agent',
  displayName: 'Open Agent Skills',
  scope: 'project',
  projectSkillsPath: '.agents/skills',
  supportsSymlinks: false,
  supportsProjectSourceLink: true,
  resolveProjectSkillsDir,
  resolveProjectSourceSkillsDir,
});
