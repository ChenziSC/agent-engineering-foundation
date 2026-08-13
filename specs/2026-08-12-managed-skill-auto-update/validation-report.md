# Validation Report：受管 Skill 触发时自动更新

## 结论

- 结果：`validated`
- 验收范围：`AC-001`～`AC-008`
- 当前状态：`0.3.0` 发布候选实现与本地验证完成；尚未发布，也没有外部采用数据。

## 验收矩阵

| 验收条件 | Evidence | 结果 |
| --- | --- | --- |
| AC-001～AC-004 | `packages/harness/test/update-guard.test.mjs` 覆盖生产者跳过、TTL、同版、新版、并发锁、Registry/Upgrade 退化、非法状态和预发布版本 | pass |
| AC-005 | Harness Distribution 回归覆盖消费者 Guard 安装、摘要记录、Verify，以及迁移生产者时只删除摘要一致的受管 Guard | pass |
| AC-006 | 九个 `SKILL.md` 包含同一完整声明；Repository Check 正例与缺失声明负例通过 | pass |
| AC-007 | `README.md`、`Install.md`、Distribution/Harness 说明与三项长期 Knowledge 已同步 | pass |
| AC-008 | 全量测试、规模回归、Repository、Doctor、Distribution、Knowledge、Specflow 与 Knowledge Projection | pass |

## 执行观察

| 命令或检查 | 结果 |
| --- | --- |
| `node --test packages/harness/test/update-guard.test.mjs packages/harness/test/harness.test.mjs` | 54/54 pass |
| `node --test --test-reporter=dot packages/harness/test/*.test.mjs skills/*/tests/*.test.mjs frameworks/*/tests/*.test.mjs` | 129/129 pass |
| `npm run test:scale` | 2/2 pass |
| `npm run check` | pass；九个 Skill 的声明、Eval Replay、Manifest、Knowledge 与敏感扫描均通过 |
| `agent-foundation doctor` | pass |
| `agent-foundation distribution verify --target .` | pass；`runtimeMode: source-link`，`distribution-update-guard: producer-skip` |
| `agent-foundation knowledge check` | pass |
| `agent-foundation specflow check` | pass |
| Knowledge Projection `plan` / `apply` / `verify` | pass |
| 在仓外目录运行 `npx --yes --package=agent-engineering-foundation@0.2.0 agent-foundation skill list` | pass；验证消费者目录中的精确版本 npx bin 解析 |
| `npm pack --dry-run --json` | pass；发布包包含 `packages/harness/src/runtime/update-guard.mjs` |
| `git diff --check` | pass |

## 风险与限制

- “触发时”由 Skill 内容契约要求 Agent 在领域步骤前调用 Guard；当前不存在跨 Host 的确定性触发 Hook，不能把内容契约表述为 Host 级强制执行。
- 默认 24 小时 TTL 内仅增加一次本地 Node.js 启动；TTL 过期的 Registry 查询在 2026-08-12 本地观察约为 0.74～1.21 秒，真实升级通常为数秒。
- 当前公开 `0.2.0` 尚不包含本次实现；消费项目只有在 `0.3.0` 发布并首次通过 Distribution 安装后才获得 Guard。
- 没有外部消费项目，真实 Host 遵循率和长期网络失败率尚无 Evidence。

## Knowledge 结论

- `repository-positioning`：updated
- `deterministic-core-boundary`：updated
- `self-hosted-governance`：updated
- `public-generalization-policy`：still-valid
