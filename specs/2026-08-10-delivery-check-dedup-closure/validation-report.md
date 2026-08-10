# Validation Report：GitHub Delivery Check 事件去重纠偏

## 当前状态

- 结果：`pass`
- 已确认真实根因为同 SHA 的 Push/PR 双 Check；实现、本地回归、fwwb 真实去重和 Foundation Active 负向 Evidence 已完成，满足归档前置条件。

## 完成条件映射

| 完成条件 | Evidence | 状态 |
| --- | --- | --- |
| AC-001 | Foundation Workflow 的 Push 仅 `main`；静态测试 | pass |
| AC-002 | Delivery `if: always()`；静态测试 | pass |
| AC-003 | 公共 Continuous/Delivery 模板与 107/107 回归 | pass |
| AC-004 | fwwb PR #1 Run `31375058637`：Source SHA 只有 Pull Request Run；治理成功；Delivery 仅为 Active Spec 失败；失败后只读复核成功 | pass |
| AC-005 | Foundation PR #2 Run `31375350452`：Source SHA 只有 Pull Request Run；Verify 成功；Delivery 仅因本事项 Active 失败；失败后只读复核成功 | pass（归档前）；Archived 正向 Check 是 Receipt 推送后的终态复核 |

## 已执行验证

- `npm test`：107/107；`npm run test:scale`：2/2。
- Repository Check、Context Resolver、Knowledge Projection Plan/Apply/Verify、Specflow 与空白检查通过。
- Provider 的歧义阻断逻辑未修改；历史 `github-delivery-check-ambiguous` Run 保留为负向回归 Evidence。
- Foundation Run `31375350452` 没有同 SHA Push Run，Delivery JSON 只包含 `change-gate-spec-not-archived`；工作区只读复核步骤成功。

## 边界

- Check 成功不等于 Branch Protection、审批、合入或发布。
- 不删除历史 Actions Run；历史歧义失败保留为回归 Evidence。
- Archived 正向 Check 依赖先生成并推送 Receipt，是终态后的交付复核，不作为归档前授权或伪造 Evidence。
