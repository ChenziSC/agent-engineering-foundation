# Tasks：Required Check 与 Workflow 来源绑定语义纠偏

## T-01 修复 Provider 语义

- 状态：`completed`
- 对应：AC-001～AC-003
- 动作：只以显式 Check 判定，保留 Workflow 来源绑定，增加自依赖回归。

## T-02 同步契约与 fwwb 制品

- 状态：`completed`
- 依赖：T-01
- 对应：AC-004、AC-005
- 动作：更新 Reference/Docs/Knowledge，构建干净包并升级 fwwb 摘要与 CI。

## V-01 真实终态复核

- 状态：`in-progress`
- 依赖：T-01、T-02
- 已完成：Foundation Run `31376631603` 与 fwwb Run `31376683138` 均证明显式 Required Check 成功后不再出现 Workflow 整体状态阻断；Delivery 只因 Active Spec 失败关闭，失败后只读复核成功。
- 待完成：获得本事项独立终态授权后生成 Receipt，并用 Archived 候选复核 Foundation 正向 Delivery；fwwb 仍等待其两个事项各自的终态授权。
