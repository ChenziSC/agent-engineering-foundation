# Validation Report：Bootstrap 行为增益与连续采用验证

## 结果

- 状态：`pass`
- 7 个正式 Replay Case 全部通过，平均分 `91.86`，无阻塞级失败。
- 三类同源码、同任务、同只读边界的 baseline/candidate 独立会话均完成，真实样本与 baseline 工作树没有新增改动。
- candidate 在触发边界、状态语义、不确定性和敏感信息控制上存在可解释增益，但规则审计和普通任务的输入上下文约为 baseline 的 `1.38x` 和 `1.70x`；契约复核约为 `0.56x`。
- 因成本收益不稳定且样本、任务与 Host 均有限，`project-context-bootstrap` 保持 `usable`，不升级为 `validated`。

## 完成条件

| 完成条件 | Evidence | 结果 |
| --- | --- | --- |
| AC-001/002 | 三类任务的同条件 baseline/candidate 独立只读观察与脱敏对照报告 | pass |
| AC-003 | 普通有界任务未触发 Bootstrap；规则审计按 Bootstrap 契约输出并在完成结论后停止 | pass |
| AC-004 | 六个会话无写入、无虚构批准、无敏感值进入公开 Trace、无构建/提交/推送 | pass |
| AC-005 | 7 个真实 Case 由 `evals/replay.json` 动态覆盖，Runner 结果 7/7 pass | pass |
| AC-006 | 对照报告明确限定为首批连续采用观察，不外推为长期或大型项目 | pass |
| AC-007 | Docs 与 Knowledge 保持 Skill `usable`，同时记录收益和成本回归 | pass |
| AC-008 | 93 项测试、仓库检查、Specflow、Knowledge、Projection、Skill Eval、敏感标识检查与差异检查通过 | pass |

## 执行证据

- `agent-foundation eval run --skill project-context-bootstrap`：7/7 pass，摘要 `sha256:3c013b073726f8d321b47921eb4f4e01a74c23c69edfbc6cc2c60b5ac132fef7`。
- `npm test`：93/93 通过。
- `npm run check`：通过；仓库检查识别并验证 Bootstrap Replay。
- Knowledge Projection：Plan、Apply、Verify 均通过；更新 `repository-positioning` 与 `self-hosted-governance`，复核其他两条 Knowledge 仍有效。
- `specflow check`、`knowledge check`、`git diff --check` 与脱敏标识扫描通过。
- 原始会话输出仅在临时目录用于人工复核，生成脱敏 Trace 后已删除；baseline 临时工作树已移除。

## Evidence 边界

- 维护者自有的存量 Web 项目只作为真实采用样本；公开报告不保存其名称、远端、绝对路径、业务配置或原始会话日志。
- baseline/candidate 只比较可观察行为，不记录或评判私有推理过程。
- 首批三类任务不能外推为长期、大型项目或其他 Agent Host 已验证。

## 尚未解决

- 完整项目级 Skill 集合在规则审计和普通任务中的上下文成本需要独立治理；当前证据不能把成本全部归因于 Bootstrap。
- 仍缺少更多独立任务、长期重复观察和其他 Host 原生发现对照。
- 正式 CLI 发布渠道、项目业务验证和外部 Adapter 不在本事项范围内。

## 生命周期

- 事项保持 `in-progress`。
- 未取得 Commit、Push、归档或发布授权。
- Work/Delivery Change Gate 需要不可变候选，本轮未自行提交以满足该前置条件。
