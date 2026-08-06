# Tasks：修复全仓自然语言事实漂移与术语不一致

## 执行规则

- 每个任务都必须关联 Spec 完成条件或 Plan 章节。
- 每个任务都必须有验证方式。
- 范围变化时先更新 Spec，再新增任务。
- 不修改已归档产物，不记录 Commit 日记。

## 任务

### T-01 建立修复事项与权威证据

- 状态：`done`
- 依赖：无
- 对应：`AC-001` 至 `AC-006` / `Plan 当前证据与假设`
- 输入：用户授权、全仓审计结论、Meta、实际目录、实现和测试。
- 动作：创建 Meta、Spec、Plan、Tasks 和 Validation Report，固定不可变历史边界。
- 产物：当前事项目录。
- 验证：`context resolve` 证明无相关 Active 事项；新事项 ID 和范围唯一。
- 阻塞条件：发现可继续的相关 Active 事项。

### T-02 修复 Meta 唯一事实来源

- 状态：`done`
- 依赖：`T-01`
- 对应：`AC-001`
- 输入：AGENTS、Specflow Skill、Spec 模板、已归档 Meta/Spec 不一致证据。
- 动作：从 Spec 模板移除状态、影响范围和关系副本，强化 Meta 权威指引。
- 产物：`skills/specflow/SKILL.md`、`skills/specflow/assets/spec.md`、相关 Knowledge。
- 验证：反向搜索模板，运行 Specflow 检查。
- 阻塞条件：当前权威规则出现冲突。

### T-03 校准当前能力与阶段叙事

- 状态：`done`
- 依赖：`T-02`
- 对应：`AC-002`
- 输入：Framework 目录、成熟度表、Web/Evidence 实现和测试。
- 动作：更新 `docs/02`、`docs/05`、P0-01、P0-05 和 P0-08，明确当前子集和未实现完整边界。
- 产物：当前能力与成熟度文档。
- 验证：搜索失效的“当前 Active”、“首期不要求”和“未来参考实现”表达，与实际资产交叉检查。
- 阻塞条件：无法从实现与测试判断子集边界。

### T-04 修复 Validator、Eval、术语和中文说明

- 状态：`done`
- 依赖：`T-03`
- 对应：`AC-003`、`AC-004`、`AC-005`
- 输入：组件 Validator 实现、9 个 Skill Eval 目录、Context Contract Schema 和中文优先规则。
- 动作：更新组件 Template/Blueprint/Reference、P0-06、Knowledge Entry 模板和两个 Schema Example。
- 产物：统一的当前实现说明、Eval 证据分类和术语。
- 验证：动态统计 Eval 形态，搜索旧术语和英文说明。
- 阻塞条件：无。

### T-05 刷新摘要并执行全仓验证

- 状态：`done`
- 依赖：`T-04`
- 对应：`AC-006`
- 输入：全部修复后文件、Distribution Manifest、Knowledge Registry。
- 动作：刷新受影响的 Skill 和 Knowledge 来源摘要，执行反向搜索、仓库检查和全量测试。
- 产物：更新的 Manifest、Registry、Tasks 和 Validation Report。
- 验证：`npm run check`、`npm test`、`git diff --check`、变更范围复核。
- 阻塞条件：任一确定性检查失败。

## 验收任务

### V-01 完成条件复核

- 状态：`done`
- 依赖：`T-05`
- 动作：逐项检查 Spec 的完成条件和历史不可变边界。
- 产物：`validation-report.md`
- 验证：完成项均有执行观察或交叉证据，未完成项不会被标记为完成。

## 状态说明

- `pending`：尚未开始；
- `in-progress`：正在执行；
- `blocked`：缺少输入、授权或依赖；
- `done`：动作和验证均完成；
- `skipped`：经明确决策不再执行，并记录理由。
