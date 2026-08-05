---
name: specflow
description: 将 PRD、Figma 设计稿、Issue、评审纪要或自然语言需求转化为可审计、可验证、可跨会话恢复的 Spec、Plan、Tasks 和研发交付。用于需要分析或实现产品需求、规划跨阶段研发事项、继续既有 Spec、核对实现与验收条件，或在明确授权后收口交付时；不用于无需长期产物的一次性小改、单纯记录 Agent 执行断点，或未经授权提交、推送、创建 PR/MR 和变更外部工作项。
---

# Spec 驱动研发流程

## 目标

把产品输入推进为有明确范围、技术依据、执行清单和验证证据的研发交付。PRD、Figma、Issue 和评审纪要都是输入来源，不是 Spec 的替代品，也不绑定任何公司内部平台。

核心产物为 `meta.yaml`、`spec.md`、`plan.md`、`tasks.md` 和 `validation-report.md`。存在需要独立验证的重大技术未知时，再增加 `research.md`。

## 开始条件

至少需要：

- 可描述的研发目标；
- 目标仓库或等价的实现上下文；
- 可以继续澄清的完成条件。

输入不足时仍可建立 Draft 并记录 Blocker，但不得进入 Planned 或声称可以实施。先按 [input-and-evidence.md](references/input-and-evidence.md) 固定输入来源、仓库版本和证据边界。

## 工作流

1. 搜索目标仓库中的既有 Specflow 事项，判断是新建、继续、修改还是取代；不要为同一事项建立重复目录。
2. 使用 [spec.md](assets/spec.md) 把输入整理成目标、非目标、场景、行为契约和可判定的完成条件，不逐句搬运 PRD。
3. 读取相关代码、测试、配置、文档和版本证据，再使用 [plan.md](assets/plan.md) 记录实现方案、关键决策、风险和验证策略。
4. 只有重大未知需要独立实验时，使用 [research.md](assets/research.md)；普通代码调研直接写入 Plan 的证据部分。
5. 使用 [tasks.md](assets/tasks.md) 按依赖拆解工作，使每个任务都能追溯到 Spec 或 Plan，并具有验证方式。
6. 用户明确要求实现时，按 Tasks 修改授权范围内的代码和文档；范围变化先更新 Spec，技术路径变化更新 Plan，新增工作更新 Tasks。
7. 执行与风险匹配的测试、静态检查或人工验证，并使用 [validation-report.md](assets/validation-report.md) 核对完成条件、产物关系和未解决问题。
8. 只有用户明确要求收口、归档或准备最终交付时，才按 [archive-and-lifecycle.md](references/archive-and-lifecycle.md) 复核最终产物、实现摘要、Knowledge Projection、Receipt 和状态最后写；一般状态与上下文恢复规则见 [lifecycle-and-context.md](references/lifecycle-and-context.md)。提交、推送、PR/MR 和外部工作项变更分别服从用户授权及宿主规则。

各阶段的退出条件和回退规则见 [workflow.md](references/workflow.md)。

## 产物职责

| 产物 | 唯一职责 | 不应包含 |
| --- | --- | --- |
| Spec | 做什么、为什么做、怎样算完成 | 逐步文件修改和执行日志 |
| Plan | 如何实现、依据、风险和验证策略 | 当前任务勾选状态和重复需求正文 |
| Tasks | 执行顺序、依赖、产物和验证 | 新的需求范围和 Commit 日记 |
| Meta | 状态、关系、影响范围和新鲜度 | 聊天摘要和测试正文 |
| Research | 对重大未知的限时实验及结论 | 普通代码浏览记录 |
| Validation Report | 完成条件、结构、关系和验证结果 | 没有证据的完成声明 |

`meta.yaml` 是事项生命周期的唯一事实来源。Checkpoint 只能保存一次 Agent 执行的恢复位置，不得复制 `Draft`、`Planned`、`In Progress` 或终态。

## 硬性门禁

- 不把 PRD、Figma 或 Issue 原样复制为 Spec。
- 没有仓库证据时，不编造代码入口、接口、影响范围或技术方案。
- Spec 的范围和关键完成条件未闭合时，保持 Draft。
- Plan 的关键决策没有证据时，明确标记 Assumption 或 Blocker。
- Task 没有关联目标或验证方式时，不得标记为完成。
- 不用文档齐全代替代码、测试或行为验证完成。
- 不从 Commit、Push、Draft PR/MR 或 Agent 自述推断归档授权。
- 不先写终态再补 Receipt；首次终态必须先形成并回读不可覆盖的归档证据，Meta 状态最后写。
- 不伪造实现或产物 Digest；缺少确定性计算条件时保持 Active 并报告阻塞。
- 不覆盖、删除或重排既有 Receipt 和 Lifecycle Event；摘要不一致时停止自动修复。
- 不把过期或 `review-required` 的 Knowledge 直接标记为 `still-valid`。
- 不把 Archived 解释为已合并、已部署或已上线。
- 不自动提交、推送、创建 PR/MR、修改外部工作项或发布；这些动作需要用户明确授权。
- 不依赖某个 Issue、设计、代码托管或 CI 平台；平台操作作为可选 Adapter 或宿主能力处理。

常见错误及修正方式见 [failure-modes.md](references/failure-modes.md)。

## 输出状态

- `draft`：范围、完成条件或关键输入仍需闭合；
- `planned`：Spec 和 Plan 足以进入实施；
- `in-progress`：至少一个 Task 正在执行或验证；
- `archived`：经明确授权完成收口，产物反映最终实现和验证；
- `superseded`：经明确授权被另一个事项取代；
- `cancelled`：经明确授权停止，且不是被其他事项取代。

最终回复说明当前状态、已生成或更新的产物、已验证内容、未验证内容、Blocker 和下一步。代码托管交付存在时，可以附 PR/MR 描述草案，但不得把草案描述成已创建的外部对象。

## 资源边界

本 Skill 提供 Provider-neutral 的 Receipt、Lifecycle Event、Knowledge Projection 模板、收口清单和行为案例，但当前不包含确定性 Validator、摘要计算器、原子写入器、CI 插件和代码托管 Adapter。Agent 可以设计和走查候选产物，不能在没有确定性程序证据时伪造 Digest 或宣称不可变性已经由程序保证。
