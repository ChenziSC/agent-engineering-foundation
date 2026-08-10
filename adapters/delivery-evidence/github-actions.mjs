const REVISION_PATTERN = /^[0-9a-f]{40,64}$/u;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
const APP_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/u;
const WORKFLOW_PATH_PATTERN = /^\.github\/workflows\/[A-Za-z0-9_.\/-]+\.ya?ml$/u;
const API_VERSION = '2022-11-28';

export function resolveGitHubRemoteRepository(remote) {
  if (!remote || remote.host !== 'github.com' || typeof remote.repositoryPath !== 'string') return null;
  return REPOSITORY_PATTERN.test(remote.repositoryPath) ? remote.repositoryPath : null;
}

export class DeliveryEvidenceAdapterError extends Error {
  constructor(code, message, details) {
    super(message);
    this.name = 'DeliveryEvidenceAdapterError';
    this.code = code;
    this.details = details;
  }
}

function fail(code, message, details) {
  throw new DeliveryEvidenceAdapterError(code, message, details);
}

function normalizeRequiredChecks(requiredChecks) {
  if (!Array.isArray(requiredChecks) || requiredChecks.length === 0) {
    fail('github-delivery-check-required', '必须提供至少一个 GitHub Check 选择器');
  }
  const normalized = requiredChecks.map((selector) => {
    if (typeof selector !== 'string') fail('invalid-github-delivery-check', 'GitHub Check 选择器必须是字符串');
    const workflowSeparator = selector.lastIndexOf('@');
    const checkSelector = selector.slice(0, workflowSeparator);
    const workflowPath = selector.slice(workflowSeparator + 1);
    const checkSeparator = checkSelector.indexOf('/');
    const app = checkSelector.slice(0, checkSeparator);
    const name = checkSelector.slice(checkSeparator + 1);
    if (
      workflowSeparator <= 0 ||
      checkSeparator <= 0 ||
      !APP_SLUG_PATTERN.test(app) ||
      app !== 'github-actions' ||
      !name ||
      name.length > 255 ||
      /[\0\r\n]/u.test(name) ||
      !WORKFLOW_PATH_PATTERN.test(workflowPath) ||
      workflowPath.split('/').some((segment) => segment === '..')
    ) {
      fail(
        'invalid-github-delivery-check',
        'GitHub Check 选择器必须使用 github-actions/check-name@.github/workflows/file.yml 格式',
      );
    }
    return { selector: `${app}/${name}@${workflowPath}`, app, name, workflowPath };
  });
  const unique = new Map(normalized.map((entry) => [entry.selector, entry]));
  if (unique.size !== normalized.length) fail('github-delivery-check-duplicate', 'GitHub Check 选择器不得重复');
  return [...unique.values()].sort((left, right) => left.selector.localeCompare(right.selector));
}

async function defaultRequest(url, { token } = {}) {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'agent-engineering-foundation',
        'X-GitHub-Api-Version': API_VERSION,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    fail('github-delivery-api-unavailable', '无法连接 GitHub Checks API', { reason: error?.name || 'request-failed' });
  }
  if (!response.ok) {
    if ([401, 403].includes(response.status)) {
      fail('github-delivery-auth-failed', 'GitHub Checks API 认证或权限不足', { status: response.status });
    }
    if (response.status === 404) fail('github-delivery-revision-not-found', 'GitHub 仓库或 Source Revision 不存在');
    if (response.status === 429 || response.headers.get('x-ratelimit-remaining') === '0') {
      fail('github-delivery-rate-limited', 'GitHub Checks API 已限流');
    }
    fail('github-delivery-api-failed', 'GitHub Checks API 返回非成功状态', { status: response.status });
  }
  try {
    return await response.json();
  } catch {
    fail('github-delivery-response-invalid', 'GitHub Checks API 返回无效 JSON');
  }
}

function normalizeCheckRun(entry) {
  const app = entry?.app?.slug;
  if (
    !entry ||
    !['number', 'string'].includes(typeof entry.id) ||
    typeof entry.name !== 'string' ||
    typeof app !== 'string' ||
    !['number', 'string'].includes(typeof entry.check_suite?.id) ||
    typeof entry.head_sha !== 'string' ||
    typeof entry.status !== 'string' ||
    (entry.conclusion !== null && typeof entry.conclusion !== 'string')
  ) {
    fail('github-delivery-response-invalid', 'GitHub Check Run 结构无效');
  }
  return {
    id: String(entry.id),
    name: entry.name,
    app,
    revision: entry.head_sha,
    status: entry.status,
    conclusion: entry.conclusion,
    checkSuiteId:
      ['number', 'string'].includes(typeof entry.check_suite?.id) ? String(entry.check_suite.id) : null,
    detailsUrl: typeof entry.details_url === 'string' ? entry.details_url : null,
  };
}

function normalizeWorkflowRun(entry) {
  if (
    !entry ||
    !['number', 'string'].includes(typeof entry.id) ||
    !['number', 'string'].includes(typeof entry.check_suite_id) ||
    typeof entry.path !== 'string' ||
    typeof entry.head_sha !== 'string' ||
    typeof entry.status !== 'string' ||
    (entry.conclusion !== null && typeof entry.conclusion !== 'string')
  ) {
    fail('github-delivery-response-invalid', 'GitHub Workflow Run 结构无效');
  }
  return {
    id: String(entry.id),
    checkSuiteId: String(entry.check_suite_id),
    path: entry.path,
    revision: entry.head_sha,
    status: entry.status,
    conclusion: entry.conclusion,
  };
}

export async function inspectGitHubActionsEvidence({
  repository,
  revision,
  requiredChecks,
  token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN,
  request = defaultRequest,
} = {}) {
  if (typeof repository !== 'string' || !REPOSITORY_PATTERN.test(repository)) {
    fail('invalid-github-delivery-repository', 'GitHub repository 必须使用 owner/repo 格式');
  }
  if (typeof revision !== 'string' || !REVISION_PATTERN.test(revision)) {
    fail('invalid-github-delivery-revision', 'GitHub Source Revision 必须是不可变十六进制 Commit SHA');
  }
  if (typeof request !== 'function') fail('invalid-github-delivery-client', 'GitHub 请求客户端无效');
  const checks = [];
  const [owner, repo] = repository.split('/');
  const normalizedChecks = normalizeRequiredChecks(requiredChecks);
  const workflowQuery = new URLSearchParams({ head_sha: revision, per_page: '100' });
  const workflowUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/actions/runs?${workflowQuery}`;
  const workflowPayload = await request(workflowUrl, { token });
  if (!workflowPayload || !Number.isInteger(workflowPayload.total_count) || !Array.isArray(workflowPayload.workflow_runs)) {
    fail('github-delivery-response-invalid', 'GitHub Workflow Run 列表结构无效');
  }
  if (workflowPayload.total_count > workflowPayload.workflow_runs.length) {
    fail('github-delivery-workflow-truncated', 'GitHub Workflow Run 结果超过单次可验证范围');
  }
  const workflowRuns = workflowPayload.workflow_runs.map(normalizeWorkflowRun);
  for (const required of normalizedChecks) {
    const query = new URLSearchParams({ check_name: required.name, filter: 'latest', per_page: '100' });
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits/${revision}/check-runs?${query}`;
    const payload = await request(url, { token });
    if (!payload || !Number.isInteger(payload.total_count) || !Array.isArray(payload.check_runs)) {
      fail('github-delivery-response-invalid', 'GitHub Check Run 列表结构无效');
    }
    if (payload.total_count > payload.check_runs.length) {
      fail('github-delivery-check-truncated', 'GitHub Check Run 结果超过单次可验证范围', { selector: required.selector });
    }
    const candidates = payload.check_runs.map(normalizeCheckRun).filter((entry) => entry.name === required.name);
    const exact = candidates.filter((entry) => entry.app === required.app);
    if (exact.length === 0 && candidates.length > 0) {
      fail('github-delivery-check-app-mismatch', 'GitHub Check 存在但 App 不匹配', { selector: required.selector });
    }
    if (exact.length === 0) {
      fail('github-delivery-check-missing', '缺少必需的 GitHub Check', { selector: required.selector });
    }
    if (exact.length > 1) {
      fail('github-delivery-check-ambiguous', 'GitHub Check 匹配结果不唯一', { selector: required.selector });
    }
    const [check] = exact;
    if (check.revision !== revision) {
      fail('github-delivery-check-revision-mismatch', 'GitHub Check 不属于请求的 Source Revision', {
        selector: required.selector,
      });
    }
    if (check.status !== 'completed') {
      fail('github-delivery-check-incomplete', 'GitHub Check 尚未完成', { selector: required.selector, status: check.status });
    }
    if (check.conclusion !== 'success') {
      fail('github-delivery-check-unsuccessful', 'GitHub Check 未成功', {
        selector: required.selector,
        conclusion: check.conclusion,
      });
    }
    const matchingWorkflows = workflowRuns.filter(
      (workflow) =>
        workflow.checkSuiteId === check.checkSuiteId &&
        workflow.path === required.workflowPath &&
        workflow.revision === revision,
    );
    if (matchingWorkflows.length === 0) {
      fail('github-delivery-workflow-mismatch', 'GitHub Check 未绑定到指定 Workflow', { selector: required.selector });
    }
    if (matchingWorkflows.length > 1) {
      fail('github-delivery-workflow-ambiguous', 'GitHub Check 对应的 Workflow Run 不唯一', {
        selector: required.selector,
      });
    }
    const [workflow] = matchingWorkflows;
    if (workflow.status !== 'completed' || workflow.conclusion !== 'success') {
      fail('github-delivery-workflow-unsuccessful', 'GitHub Workflow Run 未成功', {
        selector: required.selector,
        status: workflow.status,
        conclusion: workflow.conclusion,
      });
    }
    checks.push({
      id: check.id,
      name: check.name,
      app: check.app,
      status: check.status,
      conclusion: check.conclusion,
      workflowPath: workflow.path,
      workflowRunId: workflow.id,
      detailsUrl: check.detailsUrl,
    });
  }
  return {
    schemaVersion: 1,
    capability: 'delivery-evidence',
    provider: 'github-actions',
    repository,
    revision,
    checks,
  };
}

export const githubActionsDeliveryEvidence = Object.freeze({
  capability: 'delivery-evidence',
  id: 'github-actions',
  displayName: 'GitHub Actions',
  resolveRemoteRepository: resolveGitHubRemoteRepository,
  inspectDeliveryEvidence: inspectGitHubActionsEvidence,
});
