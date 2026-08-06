---
name: specflow
description: 将 PRD、Figma 设计稿、Issue、评审纪要或自然语言需求转化为可审计、可验证、可跨会话恢复的 Spec、Plan、Tasks 和研发交付。用于需要分析或实现产品需求、规划跨阶段研发事项、继续既有 Spec、核对实现与验收条件，或在明确授权后收口交付时；不用于无需长期产物的一次性小改、单纯记录 Agent 执行断点，或未经授权提交、推送、创建 PR/MR 和变更外部工作项。
---

# Spec 驱动研发流程

## 目标

把产品输入推进为有明确范围、技术依据、执行清单和验证证据的研发交付。PRD、Figma、Issue 和评审纪要都是输入来源，不是 Spec 的替代品，也不绑定任何公司内部平台。

核心产物为 `meta.yaml`、`spec.md`、`plan.md`、`tasks.md` 和 `validation-report.md`。存在需要独立验证的重大技术未知时，再增加 `research.md`。

`meta.yaml` 使用 [meta.schema.json](assets/meta.schema.json) 的完整契约。采用本仓 Harness 时，使用以下只读命令校验所有事项的 Meta、产物路径、终态链和本地关系互反性：

```bash
node <foundation-repo>/packages/harness/bin/agent-foundation.mjs specflow check --target <project-root>
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
3. 读取相关代码、测试、配置、文档和版本证据，再使用 [plan.md](assets/plan.md) 记录实现方案、关键决策、风险和验证策略；同时判断改变的是产品行为、稳定契约、技术路径还是局部实现，列出不能猜测的不变量、允许依赖的事实和相对独立的验证来源。
4. 只有重大未知需要独立实验时，使用 [research.md](assets/research.md)；普通代码调研直接写入 Plan 的证据部分。
5. 使用 [tasks.md](assets/tasks.md) 按依赖拆解工作，使每个任务都能追溯到 Spec 或 Plan，并具有验证方式。
6. 用户明确要求实现时，按 Tasks 修改授权范围内的代码和文档；目标、范围或用户行为变化返回 Spec，公共契约、不变量、兼容或回滚策略变化返回 Plan 并按需同步 Spec，局部实现和纯验证变化更新 Plan/Tasks。
7. 执行与风险匹配的测试、静态检查或人工验证，并使用 [validation-report.md](assets/validation-report.md) 核对完成条件、产物关系、Evidence 来源关系和未解决问题。同一设计的复述或自生成清单不能作为该设计正确的唯一证据。有不可变 Base/Source 候选时，按 [change-gate.md](references/change-gate.md) 运行工作态关联检查；没有提交授权或候选仍含未提交内容时保持未验证，不能为了通过门禁自行 Commit。
8. 只有用户明确要求收口、归档或准备最终交付时，才按 [archive-and-lifecycle.md](references/archive-and-lifecycle.md) 复核最终产物、实现摘要、Knowledge Projection、Receipt 和状态最后写；一般状态与上下文恢复规则见 [lifecycle-and-context.md](references/lifecycle-and-context.md)。提交、推送、PR/MR 和外部工作项变更分别服从用户授权及宿主规则。

各阶段的退出条件和回退规则见 [workflow.md](references/workflow.md)。

## 确定性终态与 Lifecycle Event

首次终态收口时，把 [archive-receipt.template.yaml](assets/archive-receipt.template.yaml) 复制为事项目录内的候选文件，填写授权、版本边界、变更摘要、验证和 Knowledge Projection。采用本仓 Harness 且项目使用 Git 时，先从 Meta Scope 中确认实际实现范围，排除当前 Spec 目录等已由产物摘要覆盖的路径，再运行：

```bash
node <foundation-repo>/packages/harness/bin/agent-foundation.mjs source-control inspect --target <project-root> --base <base-ref> --source HEAD --include <path,...> --exclude <path,...>
```

把输出的不可变 `baseRevision`、`sourceRevision` 和 `change.digest` 写入候选 Receipt。Provider 会在临时对象库中计算 Merge Candidate；范围内存在未提交内容或合并冲突时阻断，不会自行提交、暂存或选择范围。使用其他版本控制系统时，由采用方 Adapter 产生同一中立契约。

接着由 Agent 或人工完成 Knowledge 语义判断：先更新或创建正文和 Registry 候选条目，再填写 [knowledge-projection.template.yaml](assets/knowledge-projection.template.yaml)。采用本仓 Harness 时，按真实实现范围依次运行：

```bash
node <foundation-repo>/packages/harness/bin/agent-foundation.mjs knowledge projection plan --target <project-root> --projection <project-relative-projection> --spec-id <spec-id> --reviewed-at <YYYY-MM-DD> --paths <path,...>
node <foundation-repo>/packages/harness/bin/agent-foundation.mjs knowledge projection apply --target <project-root> --projection <project-relative-projection> --spec-id <spec-id> --reviewed-at <YYYY-MM-DD> --paths <path,...>
node <foundation-repo>/packages/harness/bin/agent-foundation.mjs knowledge projection verify --target <project-root> --projection <project-relative-projection> --spec-id <spec-id> --reviewed-at <YYYY-MM-DD> --paths <path,...>
```

`plan` 和 `verify` 只读；`apply` 只机械更新 Registry 状态、来源摘要、取代关系和可复核的 `last_projection` 指纹。它不会撰写正文、决定动作或推断 `impact: none`。路径反向命中未被决策覆盖、退役知识仍被代码入口引用、正文未准备或取代关系无效都会阻断。省略 `--paths` 会保留覆盖范围未提供的警告。

只有已经取得明确终态授权后，才运行：

```bash
node <skill-dir>/scripts/archive-receipt.mjs finalize-receipt --spec-dir <spec-dir> --candidate ./archive-receipt.candidate.yaml
```

程序会计算 Spec、Plan、Tasks 和 Validation Report 摘要，固定 `canonical-json-v1` Payload 摘要，以 `wx` 语义写入不可覆盖的 `archive-receipt.yaml` 并回读验证，然后在锁内原子执行 Meta 状态最后写。已有 Receipt 只有与当前候选完全一致时才允许恢复；任何差异都阻断。脚本消费候选中的授权证据，但不自行推断或确认授权。

复核已有 Receipt：

```bash
node <skill-dir>/scripts/archive-receipt.mjs verify-receipt --spec-dir <spec-dir>
```

首次终态后的状态或关系变化，把 [lifecycle-event.template.yaml](assets/lifecycle-event.template.yaml) 复制为候选文件并运行：

```bash
node <skill-dir>/scripts/archive-receipt.mjs finalize-event --spec-dir <spec-dir> --candidate ./lifecycle-event.candidate.yaml
```

程序校验连续 Sequence、精确文件名、Previous Digest、状态链和关系前置值；只有 Meta 已投影到现有链尾时才允许追加下一事件，追加后再最后投影 Meta。使用 `verify-chain` 可以从 Receipt 开始复核完整事件链。

两个终态事项需要建立或解除父子关系，或建立取代关系时，分别准备双方 Lifecycle Event，再把 [relation-transaction.template.yaml](assets/relation-transaction.template.yaml) 复制到共同的 Specs Root 并运行：

```bash
node <skill-dir>/scripts/archive-receipt.mjs finalize-relation --specs-root <specs-root> --candidate ./relation-transaction.candidate.yaml
node <skill-dir>/scripts/archive-receipt.mjs verify-relation --specs-root <specs-root> --transaction ./.specflow-transactions/<transaction-id>.yaml
```

程序先校验两侧关系是否严格互反，再写不可覆盖的事务意图和两条 Event，最后逐侧投影 Meta。跨文件写入不能保证单一文件系统操作级原子性：第二侧失败时可能短暂出现一侧 Meta 已更新的中间态，但事务证据和双方 Event 不会被删除；用完全相同的候选重跑会补齐未完成投影。v1 只支持同一 Specs Root 下的两个终态事项，不处理 Active Meta、跨仓库或远端平台事务。

Receipt、Meta 和最终实现已经形成不可变版本后，运行 `change gate check --phase delivery`，重新计算完整候选关联和 Receipt Scope 摘要。门禁通过只表示仓库内证据闭环；外部 PR/MR、CI、部署或发布仍分别等待对应系统结果与授权。

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
- 不把同一设计的说明、自生成检查清单或无外部观察的 Agent 复述作为设计正确的唯一 Evidence；高风险契约至少需要测试执行、运行观察、静态契约检查或独立 Review 中与主张匹配的一类真实观察。
- Task 没有关联目标或验证方式时，不得标记为完成。
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
- `planned`：Spec 和 Plan 足以进入实施；
- `in-progress`：至少一个 Task 正在执行或验证；
- `archived`：经明确授权完成收口，产物反映最终实现和验证；
- `superseded`：经明确授权被另一个事项取代；
- `cancelled`：经明确授权停止，且不是被其他事项取代。

最终回复说明当前状态、已生成或更新的产物、已验证内容、未验证内容、Blocker 和下一步。代码托管交付存在时，可以附 PR/MR 描述草案，但不得把草案描述成已创建的外部对象。

## 资源边界

本 Skill 提供 Provider-neutral 的 Receipt、Lifecycle Event、双事项 Relation Transaction、Knowledge Projection 模板、收口清单和行为案例，并提供零运行时依赖的首次终态、Event 摘要链、不可覆盖写入、状态最后写和恢复脚本。仓库 Harness 另提供本地 Git Merge Candidate 摘要、Change Gate，以及 Knowledge Projection Registry 的 Plan/Apply/Verify 子集；知识正文和动作仍由 Agent/人工判断。Active 事项关系事务、三个及以上事项的关系变更、跨仓库事务、其他版本控制 Adapter、受保护 Git 历史检测和 CI 插件仍未实现，这些边界不能由本地链校验通过推断出来。
