# Plan：GitHub Delivery Check 事件去重纠偏

## 方案

1. 保留 `pull_request` 触发；把 `push` 限制到 `main`，使功能分支 SHA 不再同时创建两个同名 Verify。
2. 给 Delivery 的工作区复核增加 `if: always()`，确保门禁失败后仍能观察副作用。
3. 同步公共模板、Foundation 静态测试和 fwwb 真实 Workflow。
4. 先以 Active Spec 验证唯一 PR Check 与预期负向门禁，再归档并复核最终正向 Check。

## 关键决策

- 不在 Provider 内按创建时间、事件类型或任意顺序挑选同名 Check；歧义继续失败关闭。
- 默认分支名属于采用方配置；公开模板使用 `main` 占位并要求非 `main` 仓库显式替换。
- 本事项 Receipt 覆盖当前 PR 的完整累计 Merge Candidate；旧 Receipt 继续保存其形成时的历史实现快照，不覆盖、不删除。

## 验证

- Workflow 静态测试、107 项 Harness 回归、2 项规模回归；
- Repository、Doctor、Distribution、Knowledge、Specflow、Projection；
- Foundation PR #2 与 fwwb PR #1 的真实 Actions Evidence。
