# Validation Report：治理上下文成本归因与最小加载优化

## 结果

- 事项 ID：`2026-08-10-governance-context-cost-optimization`
- 检查日期：2026-08-10
- 结果：`pass`
- 结论：完成归因、最小实现和回归。可证明的收益是 Specflow 高频主入口固定输入减少约 27%、普通规划两轮 Specflow 相关命令输出平均减少约 34%；端到端输入 Token 未稳定下降，不计为已解决。

## 完成条件映射

| 完成条件 | Task | Test / Evidence | 结果 |
| --- | --- | --- | --- |
| AC-001 | T-01 | 静态输入盘点、Resolver Load Plan 复核、三类只读变体事件分类 | pass |
| AC-002 | T-02 | 同源码、任务、模型、只读沙箱的两轮独立会话；公开材料仅保留脱敏聚合结果 | pass |
| AC-003 | T-03/T-04 | 拒绝选择性安装与 Resolver 停止字段，只缩减已有 Specflow 主入口并复用既有 Reference | pass |
| AC-004 | T-04/T-05 | 主入口 `12,986 → 9,534` 字节；Specflow 相关输出平均约 `-34%`；Case 13 行为通过 | pass |
| AC-005 | T-05 | 全量 Skill/readiness 专项仍由现有 Bootstrap 触发边界与 7 Case Replay 承载 | pass |
| AC-006 | T-05 | `npm test` 93/93；Specflow 13/13；Bootstrap 7/7；Repository、Specflow、Knowledge 检查通过 | pass |
| AC-007 | T-05/V-01 | 记录临时副本限制、模型波动和 `compact-specflow` 总输入 `+25%` 的未改善结果 | pass |
| AC-008 | T-06 | Knowledge Projection Plan/Apply/Verify 通过；能力地图与成熟度文档仅记录固定输入收益 | pass |

## Evidence 来源关系

| 待验证主张 | 设计来源 | 验证 Evidence | 来源关系 | 结论 |
| --- | --- | --- | --- | --- |
| 成本不能全部归因于 Bootstrap | Spec 背景 | 普通任务未触发 Bootstrap 的采用观察、Resolver 与事件分类 | 交叉验证 | pass |
| 完整 Skill 安装是主要成本来源 | Plan 假设 | `selective-skills` 平均输入比完整候选高约 32% | 反证 | rejected |
| Resolver 需要新增停止边界 | Plan 假设 | `load-plan-stop` 平均输入比完整候选高约 16% | 反证 | rejected |
| Specflow 主入口含普通规划不需要的固定材料 | T-03 决策门 | 文件体量、两轮行为 Trace、Case 13 | 执行观察 | pass |
| 渐进披露可稳定降低端到端 Token | 优化候选 | `compact-specflow` 平均总输入反而高约 25% | 未证明 | rejected |

## 结构、行为与仓库检查

- [x] Spec、Plan、Tasks、Research、Meta、Validation Report 和 Knowledge Projection 存在且 ID 一致。
- [x] Specflow 13 Case 全部通过，平均分 99.54，无 blocker。
- [x] Project Context Bootstrap 7 Case 全部通过，平均分 91.86。
- [x] Harness 测试 93/93 通过。
- [x] Repository Check、Specflow Check、Knowledge Check 和 `git diff --check` 通过。
- [x] 未新增通用 Runtime、Resolver 字段、项目模板规则或选择性安装语义。

## Knowledge Projection

- `self-hosted-governance`：`update`，记录高频 Skill 主入口渐进披露，以及固定治理输入与端到端 Token 分层报告规则。
- `repository-positioning`、`deterministic-core-boundary`、`public-generalization-policy`：`still-valid`。
- Projection Plan、Apply、Verify 均通过，无漂移。

## 未改善与外推限制

- `compact-specflow` 两轮平均端到端输入为 `758,063` Token，相对完整候选高约 25%；代码搜索、跨仓探测、缓存和模型轮次仍主导总成本。
- 三类临时副本均不含 Git 元数据，也未暴露全局 Harness 命令；可恢复探测失败使结果只适合方向性判断，不构成性能 SLA。
- 当前只验证一个脱敏存量 Web 项目的普通有界任务，不能外推到大型项目、其他语言、其他 Agent Host 或稳定计费节省。
- 本事项不改变 `project-context-bootstrap` 的成熟度判断，也不证明 Change Gate Provider 已实现。

## 生命周期结论

- 实施与验证任务已完成；`meta.yaml` 保持 `in-progress`，等待用户明确决定是否归档。
- 未执行 commit 或 push。
