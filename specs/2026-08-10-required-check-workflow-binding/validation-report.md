# Validation Report：Required Check 与 Workflow 来源绑定语义纠偏

## 当前状态

- 结果：`pass`
- Provider 已取消整个 Workflow 成功前置条件，同时保留显式 Check 与来源的全部失败关闭校验。
- 本地聚焦测试、108 项全量测试、2 项规模回归与治理检查均通过；fwwb 已固定升级到本事项实现 Commit 构建的制品，两仓真实 Active 负向 PR 均符合预期。
- 全仓自然语言内容审计发现的 Change Gate 冲突句和过期 self-host Evidence 已在本事项范围内修正；成熟度投影漂移与中文模板问题转入独立后续事项，不混入本次 Receipt。

## 完成条件映射

| 条件 | Evidence | 状态 |
| --- | --- | --- |
| AC-001 | `github-delivery-evidence.test.mjs` 保持缺失、错误 App、歧义、未完成、失败 Check 阻断 | pass |
| AC-002 | Check Suite、Workflow Path、Source SHA 唯一来源绑定测试 | pass |
| AC-003 | 显式成功 Check + Workflow `in_progress`/整体 `failure` 回归 | pass |
| AC-004 | 聚焦 7/7、全量 108/108、规模 2/2；Repository、Doctor、Distribution、Knowledge、Specflow、Projection 均通过 | pass |
| AC-005 | Foundation Run `31376631603`：Verify 成功，Delivery 仅因本事项 Active 失败；fwwb Run `31376683138`：Governance 成功，Delivery 仅因两个事项 Active 失败；两边失败后只读复核成功 | pass（Active 负向）；Foundation Archived 正向作为归档后的同一 PR 外部复核 |

## 边界

- 只验证显式 Required Check；未声明 Job 不自动成为门禁。
- fwwb 正向 Archived 候选仍需其事项独立终态授权。
- Foundation/fwwb 真实 Evidence 只证明所声明 Check 与 Change Gate 行为，不证明 Branch Protection、审批、合入或发布。
- Foundation Archived 正向 Delivery 必须在 Receipt 与归档提交产生后执行，因此不伪造为归档前 Evidence；该结果作为归档提交的外部复核记录在 PR 检查中。
