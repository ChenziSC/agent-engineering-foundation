# 安全变更报告：GitHub Delivery Check 事件去重纠偏

## 范围与风险

- 只修改 Workflow 触发、失败后只读复核、公共模板、静态测试和长期契约说明。
- 风险是默认分支非 `main` 时 Push 治理不运行；模板明确要求采用方替换，当前两个真实仓库默认分支均为 `main`。
- Provider 歧义规则保持不变，避免以任意顺序接受错误 Check。

## 回滚

- 若 PR 不再触发 Verify，恢复事件过滤并保留 Provider 失败关闭；
- 若默认分支 Push 不运行，先核对真实默认分支，再调整显式分支名。

## 当前状态

- `validated`：本地自动检查、fwwb 真实去重和 Foundation Active 负向 Evidence 已通过；Archived 正向 Check 在 Receipt 推送后复核。
