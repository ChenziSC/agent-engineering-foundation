# Plan：Required Check 与 Workflow 来源绑定语义纠偏

## 方案

1. 保留 Check 的唯一性、Source、App、完成态和成功结论校验。
2. 保留 Workflow Run 的 Check Suite、Path、Source 唯一绑定；移除其整体成功作为第二门禁。
3. 增加同 Workflow Delivery 自依赖回归，更新公开契约与长期 Knowledge。
4. 从干净实现 Commit 构建新制品，升级 fwwb vendored Package 与摘要。
5. 以真实 Active 负向和 Archived 正向 PR Check 收口。

## 决策

- 选择器语义是 `Required Check @ 来源 Workflow`，不是“Required Check 且整个 Workflow”。
- 若采用方还要求其他 Job，必须把它们分别声明为 Required Check，不由 Provider 猜测。
- 既有两个 Receipt 保留各自历史快照；本事项对当前 PR 完整累计候选生成最终 Receipt。

## 验证

- Provider 聚焦测试、107+ 全量测试、2 项规模回归；
- Repository、Doctor、Distribution、Knowledge、Specflow、Projection；
- Foundation PR #2 与 fwwb PR #1 真实 Actions。
