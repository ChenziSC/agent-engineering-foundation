import { createHash } from 'node:crypto';

export const MAX_SCANNABLE_TEXT_BYTES = 5 * 1024 * 1024;

export function genericSecretPatterns() {
  return [
    { kind: 'github-token', pattern: /\bghp_[A-Za-z0-9]{36}\b/gu },
    { kind: 'github-fine-grained-token', pattern: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/gu },
    { kind: 'gitlab-token', pattern: /\bglpat-[A-Za-z0-9_-]{20,}\b/gu },
    { kind: 'aws-access-key', pattern: /\bAKIA[0-9A-Z]{16}\b/gu },
    { kind: 'google-api-key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/gu },
    { kind: 'npm-token', pattern: /\bnpm_[A-Za-z0-9]{36}\b/gu },
    { kind: 'openai-style-secret', pattern: /\bsk-[A-Za-z0-9]{32,}\b/gu },
    { kind: 'slack-token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/gu },
    { kind: 'stripe-live-secret', pattern: /\bsk_live_[A-Za-z0-9]{20,}\b/gu },
    { kind: 'private-key', pattern: new RegExp('-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', 'gu') },
  ];
}

function termId(term) {
  return createHash('sha256').update(term).digest('hex').slice(0, 12);
}

export function isScannableText(buffer) {
  return buffer.length <= MAX_SCANNABLE_TEXT_BYTES && !buffer.includes(0);
}

function redactSensitivePath(candidatePath, normalizedTerms) {
  const lowerPath = candidatePath.toLocaleLowerCase();
  if (!normalizedTerms.some((term) => lowerPath.includes(term.toLocaleLowerCase()))) return candidatePath;
  return `sha256:${createHash('sha256').update(candidatePath).digest('hex').slice(0, 12)}`;
}

export function scanSensitiveText(content, context, normalizedTerms, secretPatterns, errors) {
  const safeContext = {
    ...context,
    ...(context.path ? { path: redactSensitivePath(context.path, normalizedTerms) } : {}),
    ...(context.paths
      ? { paths: context.paths.map((candidatePath) => redactSensitivePath(candidatePath, normalizedTerms)) }
      : {}),
  };
  for (const { kind, pattern } of secretPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(content)) errors.push({ code: 'high-confidence-secret', kind, ...safeContext });
  }
  const lowerContent = content.toLocaleLowerCase();
  for (const term of normalizedTerms) {
    if (lowerContent.includes(term.toLocaleLowerCase())) {
      errors.push({ code: 'denied-sensitive-term', ...safeContext, termId: termId(term) });
    }
  }
}

export function scanSensitivePath(candidatePath, context, normalizedTerms, errors) {
  const lowerPath = candidatePath.toLocaleLowerCase();
  const { path: _path, paths: _paths, ...safeContext } = context;
  for (const term of normalizedTerms) {
    if (lowerPath.includes(term.toLocaleLowerCase())) {
      errors.push({
        code: 'denied-sensitive-term-in-path',
        ...safeContext,
        pathId: createHash('sha256').update(candidatePath).digest('hex').slice(0, 12),
        termId: termId(term),
      });
    }
  }
}
