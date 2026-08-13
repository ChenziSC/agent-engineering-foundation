---
name: specflow
description: 将 PRD、Figma 设计稿、Issue、评审纪要或自然语言需求转化为可审计、可验证、可跨会话恢复的研发事项，并按需要生成 Spec、Plan、Tasks 和验证证据。用于需要分析或实现产品需求、规划跨阶段研发事项、继续既有 Spec、核对实现与验收条件，或在明确授权后收口交付时；不用于无需长期产物的一次性小改、单纯记录 Agent 执行断点，或未经授权提交、推送、创建 PR/MR 和变更外部工作项。
---

<!-- foundation-managed-auto-update:v1 -->
执行领域步骤前，若项目根存在 `.agent-foundation/update-guard.mjs`，先运行 `node .agent-foundation/update-guard.mjs --target <项目根>`；返回 `updated` 时重读本文件，`degraded` 时报告原因码并继续使用当前版本。生产者 Source Link 不安装该 Guard。

# Spec 驱动研发流程

## 目标

把产品输入推进为有明确范围、技术依据、执行清单和验证证据的研发交付。PRD、Figma、Issue 和评审纪要都是输入来源，不是 Spec 的替代品，也不绑定任何公司内部平台。

需要长期追溯的行为事项以 `meta.yaml + spec.md` 为最小集合；其余产物只在承担独立职责时创建，不用空文件换取形式完整：

| 产物 | 创建条件 |
| --- | --- |
| Plan | 存在多种可行方案需要取舍，或涉及公共契约、跨模块协作、安全、性能、兼容、回滚等需要显式设计的决策 |
| Tasks | 工作需要多个执行单元、多个参与者、分阶段推进或跨会话恢复 |
| Research | 重大技术未知必须通过限时实验才能决策 |
| Validation Report | 风险、交付或审计要求需要一份独立的完成条件—证据映射 |

`meta.yaml` 始终保留完整 Artifact Map：`spec` 必须指向安全的本地路径；未创建的 `plan`、`tasks`、`research`、`validation_report` 写 `null`。这不是复杂度评分，不新增事项类型或生命周期状态；发现上述条件时直接补建对应产物。

`meta.yaml` 使用 [meta.schema.json](assets/meta.schema.json) 的完整契约。采用本仓 Harness 时，使用以下只读命令校验所有事项的 Meta、产物路径、终态链和本地关系互反性：

```bash
agent-foundation specflow check --target <project-root>
```

## 开始条件

至少需要：

- 可描述的研发目标；
- 目标仓库或等价的实现上下文；
- 可以继续澄清的完成条件。

输入不足时仍可建立 Draft 并记录 Blocker，但不得进入 Planned 或声称可以实施。先按 [input-and-evidence.md](references/input-and-evidence.md) 固定输入来源、仓库版本和证据边界。

## 工作流

1. 搜索目标仓库中的既有 Specflow 事项，判断是新建、继续、修改还是取代；不要为同一事项建立重复目录。
2. 使用 [spec.md](assets/spec.md) 把输入整理成目标、非目标、场景、行为契约和可判定的完成条件，不逐句搬运 PRD。
3. 读取相关代码、测试、配置、文档和版本证据。命中 Plan 条件时，使用 [plan.md](assets/plan.md) 记录实现方案、关键决策、风险和验证策略；否则把必要实现约束和验证方式留在 Spec，不生成 Plan。
4. 只有重大未知需要独立实验时，使用 [research.md](assets/research.md)；普通代码调研直接写入 Plan 的证据部分。
5. 命中 Tasks 条件时，使用 [tasks.md](assets/tasks.md) 按依赖拆解工作，使每个任务都能追溯到 Spec 或 Plan，并具有验证方式；单一执行单元直接实施，`next_task_id` 保持 `null`。
6. 用户明确要求实现时，按已声明产物修改授权范围内的代码和文档；目标、范围或用户行为变化返回 Spec，公共契约、不变量、兼容或回滚策略变化时补建或更新 Plan，执行拆分达到触发条件时补建或更新 Tasks。
7. 执行与风险匹配的测试、静态检查或人工验证。命中独立报告条件时使用 [validation-report.md](assets/validation-report.md)；否则直接保留可复核证据，终态 Receipt 仍使用自身固定的 `validation` 结构。同一设计的复述或自生成清单不能作为该设计正确的唯一证据。有不可变 Base/Source 候选时，按 [change-gate.md](references/change-gate.md) 运行工作态关联检查；没有提交授权或候选仍含未提交内容时保持未验证，不能为了通过门禁自行 Commit。
8. 只有用户明确要求收口、归档或准备最终交付时，才按 [archive-and-lifecycle.md](references/archive-and-lifecycle.md) 复核最终产物、实现摘要、Knowledge Projection、Receipt 和状态最后写；一般状态与上下文恢复规则见 [lifecycle-and-context.md](references/lifecycle-and-context.md)。提交、推送、PR/MR 和外部工作项变更分别服从用户授权及宿主规则。

各阶段的退出条件和回退规则见 [workflow.md](references/workflow.md)。

## 终态与恢复按需加载

普通分析、规划、实施和验证任务不需要读取归档脚本、Lifecycle Event、关系事务或 Delivery Gate 的完整契约。只有用户明确要求收口、归档、取消、取代、恢复终态写入或准备最终交付时，才完整读取[归档与生命周期](references/archive-and-lifecycle.md)；涉及交付候选关联时再读取[事项—变更关联与交付门禁](references/change-gate.md)，并按场景使用对应模板和脚本。

终态路径始终遵守以下不变量：

1. 明确终态授权、完成条件、不可变 Base/Source 和相关 Knowledge 缺一不可；
2. 先确定性计算实现与产物摘要，写入并回读不可覆盖 Receipt，最后更新 Meta；
3. Receipt 或 Event 已存在时只允许验证一致和幂等恢复，不覆盖、删除或重建历史；
4. 终态后的单事项变化使用连续 Event，两个终态事项的关系变化使用 Relation Transaction；新业务实现必须新建 Spec；
5. Commit、Push、PR/MR、CI、部署和发布仍是分别授权与验证的外部动作，不能由 Archived 推断。

进入终态场景后，以 Reference、Schema、模板和脚本为完整事实来源；本节只负责触发和安全路由，不复制命令与字段细节。

## 硬性门禁

- 不把 PRD、Figma 或 Issue 原样复制为 Spec。
- 没有仓库证据时，不编造代码入口、接口、影响范围或技术方案。
- Spec 的范围和关键完成条件未闭合时，保持 Draft。
- 已创建 Plan 的关键决策没有证据时，明确标记 Assumption 或 Blocker。
- 不把同一设计的说明、自生成检查清单或无外部观察的 Agent 复述作为设计正确的唯一 Evidence；高风险契约至少需要测试执行、运行观察、静态契约检查或独立 Review 中与主张匹配的一类真实观察。
- 已创建 Task 没有关联目标或验证方式时，不得标记为完成。
- 不用文档齐全代替代码、测试或行为验证完成。
- 不从 Commit、Push、Draft PR/MR 或 Agent 自述推断归档授权。
- 不先写终态再补 Receipt；首次终态必须先形成并回读不可覆盖的归档证据，Meta 状态最后写。
- 不伪造实现或产物 Digest；缺少确定性计算条件时保持 Active 并报告阻塞。
- 不覆盖、删除或重排既有 Receipt 和 Lifecycle Event；摘要不一致时停止自动修复。
- 不用两个独立的 `finalize-event` 冒充跨事项一致性；父子或取代关系使用 Relation Transaction，并接受其可恢复而非绝对原子的边界。
- 不把过期或 `review-required` 的 Knowledge 直接标记为 `still-valid`。
- 不让 Projection 更新器生成 Knowledge 正文或替代语义复核；先准备正文和 Registry 条目，再执行 Plan/Apply/Verify。
- 不用自由文本或 `--include/--exclude` 绕过 Change Gate；一个候选可以显式关联一个或多个 Spec，由其 Scope 并集覆盖完整实现变更，或者使用能由完整路径机械证明的受控低风险豁免。Spec 与豁免不能混用。
- 不把 Archived 解释为已合并、已部署或已上线。
- 不自动提交、推送、创建 PR/MR、修改外部工作项或发布；这些动作需要用户明确授权。
- 不依赖某个 Issue、设计、代码托管或 CI 平台；平台操作作为可选 Adapter 或宿主能力处理。

常见错误及修正方式见 [failure-modes.md](references/failure-modes.md)。

## 输出状态

- `draft`：范围、完成条件或关键输入仍需闭合；
- `planned`：Spec 已闭合，必要的设计决策已解决，可以进入实施；
- `in-progress`：实现或验证已经开始；
- `archived`：经明确授权完成收口，产物反映最终实现和验证；
- `superseded`：经明确授权被另一个事项取代；
- `cancelled`：经明确授权停止，且不是被其他事项取代。

最终回复说明当前状态、已生成或更新的产物、已验证内容、未验证内容、Blocker 和下一步。代码托管交付存在时，可以附 PR/MR 描述草案，但不得把草案描述成已创建的外部对象。

## 资源边界

本 Skill 提供 Provider-neutral 的 Receipt、Lifecycle Event、双事项 Relation Transaction、Knowledge Projection 模板、收口清单和行为案例，并提供零运行时依赖的首次终态、Event 摘要链、不可覆盖写入、状态最后写和恢复脚本。仓库 Harness 另提供本地 Git Merge Candidate 摘要、Change Gate，以及 Knowledge Projection Registry 的 Plan/Apply/Verify 子集；知识正文和动作仍由 Agent/人工判断。Active 事项关系事务、三个及以上事项的关系变更、跨仓库事务、其他版本控制 Adapter、受保护 Git 历史检测和 CI 插件仍未实现，这些边界不能由本地链校验通过推断出来。
