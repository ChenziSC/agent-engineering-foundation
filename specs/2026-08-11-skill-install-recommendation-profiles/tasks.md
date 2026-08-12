# Tasks：Skill 推荐安装 Profile 与增量 Distribution

## 执行规则

- 每个任务关联 Spec 完成条件并保留执行 Evidence。
- 不把 Profile 选择解释为卸载授权。
- 不自动 Commit、Push、发布或进入终态。

## 任务

### T-01 建立推荐契约与 Profile 解析

- 状态：`done`
- 依赖：无
- 对应：`AC-001`、`AC-004`
- 输入：Distribution Manifest、Skill 触发边界和当前 CLI。
- 动作：新增推荐契约；实现交叉校验、默认/显式/旧状态 Profile 解析和只读推荐输出。
- 产物：推荐数据、Harness/CLI 与聚焦测试。
- 验证：正常、未知、重复、遗漏和 `full` 漂移用例。
- 阻塞条件：需要建立通用依赖求解或自动项目分类。

### T-02 接入增量 Distribution 与 Upgrade

- 状态：`done`
- 依赖：`T-01`
- 对应：`AC-002`、`AC-003`、`AC-005`
- 输入：已校验 Profile、安装状态和既有 Plan/Apply/Verify。
- 动作：计算 Profile 与已有受管项并集；保存 Profile；复用到 Verify、Source Link 和 Upgrade。
- 产物：Distribution/Upgrade 实现与兼容回归。
- 验证：新 core、显式 full、旧 full、core+可选、冲突和 Source Link 场景。
- 阻塞条件：实现必须删除采用方内容或绕过现有冲突保护。

### T-03 收敛接入文档、Bootstrap 与长期知识

- 状态：`done`
- 依赖：`T-02`
- 对应：`AC-006`
- 输入：最终 CLI 行为和现有完整安装表述。
- 动作：更新 Install、Harness、Blueprint、模板、Bootstrap Skill、Docs 与 Knowledge；定向搜索冲突术语。
- 产物：一致的默认推荐、完整集合和能力就绪说明。
- 验证：Markdown 链接、Skill Replay、Repository Check 和术语复查。
- 阻塞条件：出现权威不明或需要新增领域 Profile 的要求。

### T-04 建立首次选择与组合安装闭环

- 状态：`done`
- 依赖：`T-01`、`T-02`、`T-03`
- 对应：`AC-008`、`AC-009`、`AC-010`、`AC-011`
- 输入：推荐契约、用户确认流程、现有 Distribution/Upgrade 安全语义。
- 动作：补充必需条件和推荐理由；实现 `--include-skill` 与首次 Apply 显式 Profile 门禁；更新 Agent 安装规范和 Bootstrap。
- 产物：推荐输出、Harness/CLI、测试、Install/Skill/Docs 与更新后的验证报告。
- 验证：首次 Plan/Apply、core+可选、未知/重复/冗余组合、已有项目、Upgrade、Source Link、npm pack 与全量回归。
- 阻塞条件：实现需要 CLI TTY 问答、自动项目分类、依赖求解或卸载。

## 验收任务

### V-01 完成条件复核

- 状态：`done`
- 动作：执行聚焦、全量、规模、Repository、Doctor、Distribution、Knowledge、Specflow 与源码仓外包回归，逐项检查 Spec 完成条件。
- 产物：完成条件证据矩阵；风险需要独立报告时创建 `validation-report.md`。
- 验证：未完成项保持可见，不因测试数量或文档齐全推断完成。

## 状态说明

- `pending`：尚未开始；
- `in-progress`：正在执行；
- `blocked`：缺少输入、授权或依赖；
- `done`：动作和验证均完成；
- `skipped`：经明确决策不再执行，并记录理由。
