#!/usr/bin/env node
import { buildReleasePackage } from '../src/release-package.mjs';

function options(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) throw new Error('用法：build-release-package --target <root> --output <directory>');
    result[key.slice(2)] = value;
  }
  return result;
}

try {
  const parsed = options(process.argv.slice(2));
  const result = await buildReleasePackage({ target: parsed.target || '.', output: parsed.output });
  process.stdout.write(`${JSON.stringify({
    ok: true,
    command: 'build-release-package',
    status: 'built',
    artifact: result.artifactPath,
    manifest: result.manifestPath,
    release: result.manifest,
  }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
