# 安全变更报告：Required Check 与 Workflow 来源绑定语义纠偏

## 风险

- 风险是采用方误以为同 Workflow 的其他 Job 也被校验；文档明确要求逐个声明 Required Check。
- 不改变 Check 唯一性、完成态、成功、Source SHA、App、Check Suite 或 Workflow Path 校验。

## 回滚

- 若真实平台无法稳定绑定 Check Suite 与 Workflow Path，保持失败关闭并回滚 Provider 变化；不退化为名称匹配。

## 状态

- `local-verified`：聚焦 Provider 测试 7/7、全量测试 108/108、规模回归 2/2，Repository、Doctor、Distribution、Knowledge、Specflow 与 Knowledge Projection 均通过。
- 真实 Active 负向 Evidence 已完成：Foundation Run `31376631603`、fwwb Run `31376683138` 均只剩 `change-gate-spec-not-archived`，且失败后只读复核成功。
- Archived 正向 Evidence 待独立终态授权。
