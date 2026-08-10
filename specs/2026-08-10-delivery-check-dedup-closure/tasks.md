# Tasks：GitHub Delivery Check 事件去重纠偏

## T-01 修复 Foundation Workflow

- 状态：`done`
- 对应：AC-001、AC-002
- 已完成：功能分支不再触发 Push Run；Delivery 工作区复核使用 `if: always()`。

## T-02 同步模板与 fwwb

- 状态：`done`
- 依赖：T-01
- 对应：AC-003、AC-004
- 已完成：公共模板、静态测试和 fwwb Workflow 已同步。fwwb Run `31375058637` 在 Source SHA `9acbff1…` 上只有 Pull Request Run，治理成功，Delivery 仅因两个 Active Spec 失败，失败后只读复核成功。

## V-01 最终真实 PR 复核

- 状态：`in-progress`
- 依赖：T-01、T-02
- 对应：AC-005
- 已完成：107/107 单测、2/2 规模回归、Repository、Context、Projection 与本地治理检查通过。
- 待完成：Foundation PR #2 的唯一 Active 负向 Check、归档 Receipt 和最终正向 Check。
