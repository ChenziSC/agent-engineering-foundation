# Tasks：Required Check 与 Workflow 来源绑定语义纠偏

## T-01 修复 Provider 语义

- 状态：`completed`
- 对应：AC-001～AC-003
- 动作：只以显式 Check 判定，保留 Workflow 来源绑定，增加自依赖回归。

## T-02 同步契约与 fwwb 制品

- 状态：`in-progress`
- 依赖：T-01
- 对应：AC-004、AC-005
- 动作：更新 Reference/Docs/Knowledge，构建干净包并升级 fwwb 摘要与 CI。

## V-01 真实终态复核

- 状态：`pending`
- 依赖：T-01、T-02
- 动作：完成两仓真实 Check、Receipt、Commit 与 Push。
