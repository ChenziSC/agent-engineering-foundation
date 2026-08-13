---
name: project-component-governance
description: 基于可访问的代码仓库和组件证据，评估项目组件的复用、薄封装、扩展、新建、分层准入、历史迁移与废弃方案。用于新增或修改 UI 组件前的复用判断、组件放置决策、共享或标准组件准入、组件治理评审以及维护计划；不用于脱离仓库证据猜测组件能力、单纯生成视觉代码或未经授权直接迁移和发布组件。
---

<!-- foundation-managed-auto-update:v1 -->
执行领域步骤前，若项目根存在 `.agent-foundation/update-guard.mjs`，先运行 `node .agent-foundation/update-guard.mjs --target <项目根>`；返回 `updated` 时重读本文件，`degraded` 时报告原因码并继续使用当前版本。生产者 Source Link 不安装该 Guard。

# 项目组件治理与维护

## 目标

让组件位于正确层级，并在生命周期中保持可发现、可复用、可验证和可演进。

本 Skill 管理项目内全部组件来源，不把共享组件包视为唯一入口，也不以“进入组件库”作为默认目标。

## 开始条件

至少需要：

- 可访问的代码仓库、组件源码或组件文档；
- 待实现、待修改或待评审的组件需求。

设计稿、截图、PRD、交互说明、调用方清单和历史变更均为可选输入。没有设计稿也可以执行本 Skill。

先按 [input-and-evidence.md](references/input-and-evidence.md) 固定范围、版本和证据边界。仓库不可读且没有组件文档时，将结果标记为 `blocked`，不得编造候选或文件位置。

## 工作流

1. 识别需求中的交互、状态、数据适配、运行端和预期复用范围。
2. 按 [component-discovery.md](references/component-discovery.md) 搜索页面、应用、项目共享包和已安装基础组件。
3. 比较候选的公开 API、状态模型、依赖、示例和真实调用方，不以名称或截图相似代替证据。
4. 按 [placement-and-admission.md](references/placement-and-admission.md) 选择：
   - `reuse`
   - `wrap`
   - `extend`
   - `new-local`
   - `promote`
5. 涉及历史组件、兼容变更或废弃时，继续读取 [lifecycle-and-migration.md](references/lifecycle-and-migration.md)。
6. 按 [validation-boundaries.md](references/validation-boundaries.md) 分配 Agent、程序与人工职责，并设计风险匹配的验证。
7. 使用 [component-decision-report-template.md](assets/component-decision-report-template.md) 输出结论；涉及迁移或废弃时，附加对应模板。

项目已接入 `.component-governance/config.yaml` 时，可运行确定性结构检查：

```bash
agent-foundation component check --target <project-root>
```

程序默认验证 Registry、路径、Contract、稳定入口、替代项和禁止深路径导入；显式启用语言分析后，还验证 JavaScript/TypeScript 静态导出、公共入口消费者和兼容基线。它不替代复用价值、抽象边界、动态语义和兼容策略判断。

## 硬性门禁

- 未搜索当前项目中的已有组件，不得建议新建。
- 未核实公开 API、状态或示例，不得声称候选可以直接复用。
- 只有样式、文案、默认值、数据映射或局部布局差异时，优先考虑 `reuse` 或 `wrap`。
- 一次性页面编排或单一业务流程不得仅因“以后可能复用”进入项目标准层。
- 发现近似组件时，必须比较扩展已有组件与新建组件的兼容成本。
- 迁移公开组件前必须识别调用方、深路径引用和兼容策略。
- 废弃组件必须说明替代项、迁移窗口和剩余调用方；没有替代项时不得伪装成可安全删除。
- 分析或评审请求不自动修改代码；实现请求只修改用户授权范围。
- 发布 Package、删除公开导出和批量迁移调用方需要单独确认。

常见错误及修正方式见 [failure-modes.md](references/failure-modes.md)。

## 输出状态

- `complete`：关键候选和调用边界已有证据，决策、风险与验证路径完整。
- `partial`：仍能给出有限决策，但部分组件文档、调用方或运行约束不可确认。
- `blocked`：缺少仓库、组件文档或需求边界，无法作出可靠的复用与放置判断。

`complete` 只表示治理决策完成，不表示代码已经实现、迁移完成或组件已经发布。

## 与相邻能力的边界

- 设计稿到代码能力负责视觉和结构生成；本 Skill 只消费其结果作为候选输入。
- 组件测试工具负责执行测试；本 Skill 决定需要验证哪些风险。
- Package 发布能力负责版本、制品和发布；本 Skill 只给出兼容与发布前条件。
- 仓库级确定性门禁负责结构检查，不替代 Agent 对复用价值和抽象边界的判断。
