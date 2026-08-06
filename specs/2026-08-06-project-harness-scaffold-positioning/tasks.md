# Tasks：澄清通用项目 Harness 化脚手架定位

## 执行规则

- 每个任务都必须关联 Spec 完成条件或 Plan 章节。
- 每个任务都必须有验证方式。
- 范围变化时先更新 Spec，再新增任务。
- 不记录 Commit 日记。

## 任务

### T-01 收敛入口定位与边界

- 状态：`done`
- 依赖：无
- 对应：`AC-001` / `Plan：组件与职责`
- 输入：README 现有定位、`repository-positioning` 稳定事实和当前实现边界。
- 动作：增加一句话定位，并区分仓库直接提供项与采用方补齐项。
- 产物：`README.md`
- 验证：入口无需跨文档推导即可回答“是什么、提供什么、不提供什么”。
- 阻塞条件：现有稳定事实不足以支持该定位。

### T-02 统一能力术语并补充接入路径

- 状态：`done`
- 依赖：`T-01`
- 对应：`AC-002` / `Plan：数据流或调用流`
- 输入：三层能力、Starter 接入和 Adapter 边界。
- 动作：统一“项目级 Harness 化接入内核”术语，增加 Harness 化阶段和职责分界。
- 产物：`docs/01-能力地图.md`、`docs/02-目标仓库设计.md`
- 验证：术语一致，且明确 Starter 初始化不是完整 Harness 化的完成条件。
- 阻塞条件：需要新增实现才能支持文档主张。

### T-03 校准成熟度声明

- 状态：`done`
- 依赖：`T-02`
- 对应：`AC-003` / `Plan：验证策略`
- 输入：当前 Starter、Harness、Doctor 和 Adapter 的已有证据与缺口。
- 动作：将成熟度绑定到通用接入内核，明确不能外推完整 Runtime 或企业基础设施。
- 产物：`docs/05-交付形态与成熟度.md`
- 验证：成熟度措辞与能力地图中的当前边界一致。
- 阻塞条件：证据不足以支持 `reference-implemented`。

### T-04 刷新 Knowledge 来源摘要

- 状态：`done`
- 依赖：`T-03`
- 对应：`AC-004` / `Plan：验证策略`
- 输入：README 变更、`repository-positioning`、`public-generalization-policy` 和 Knowledge Registry。
- 动作：记录 `still-valid` 判断并执行 Projection Plan/Apply/Verify，只刷新本事项命中的 Registry 条目。
- 产物：`knowledge-projection.yaml`、`knowledge/registry.yaml`。
- 验证：Projection Verify 与 `knowledge check` 通过，`repository-positioning` 不再报告来源摘要漂移。
- 阻塞条件：并行 Registry 写入导致候选不一致，或 Knowledge 语义复核不成立。

## 验收任务

### V-01 完成条件复核

- 状态：`done`
- 动作：逐项检查 Spec 的完成条件，运行 Specflow、仓库检查、测试和差异检查。
- 产物：`validation-report.md`
- 验证：完成项均有证据，未完成项不会被标记为完成。

## 状态说明

- `pending`：尚未开始；
- `in-progress`：正在执行；
- `blocked`：缺少输入、授权或依赖；
- `done`：动作和验证均完成；
- `skipped`：经明确决策不再执行，并记录理由。
