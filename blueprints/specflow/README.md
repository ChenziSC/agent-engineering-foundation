# Specflow Blueprint

成熟度：Skill 与模板 `usable`；本地 Receipt/Event/Meta、双终态事项 Relation Transaction、Knowledge Projection Registry、Git 摘要与 Change Gate 子集 `reference-implemented`；Active 事项关系事务、三个及以上事项关系事务、跨仓库关系事务与其他 Provider 自动化 `designed`

Specflow 用仓库内的 Meta、Spec 和按需产物管理一个研发事项的目标、技术决策、执行拆分和业务生命周期。它优先解决跨会话恢复与可审计性，不要求接入特定 Issue、代码托管或 CI 平台。

## 推荐目录

使用方可以调整根目录，但同一事项的产物应位于同一个事项目录。`meta.yaml + spec.md` 是需要长期追溯的行为事项最小集合；其他 Markdown 仅在 [Specflow Skill 的创建条件](../../skills/specflow/SKILL.md#目标)命中时存在：

```text
.agent-work/
├── .specflow-transactions/    # 跨事项事务意图，不可覆盖
│   └── <transaction-id>.yaml
└── <work-id>/
    ├── spec.md
    ├── meta.yaml
    ├── plan.md                # 按需：设计决策
    ├── tasks.md               # 按需：多执行单元或跨会话恢复
    ├── research.md            # 按需：重大未知实验
    ├── validation-report.md   # 按需：独立证据映射
    ├── archive-receipt.yaml   # 首次终态生成，不可覆盖
    └── lifecycle/             # 归档后的追加式事件，按需创建
        └── 0001-<event>.yaml
```

Agent 执行流程由 [`specflow` Skill](../../skills/specflow/SKILL.md) 定义。采用方必须保留 Meta 的完整 Artifact Map：`spec` 为安全路径，未创建的 `plan`、`tasks`、`research`、`validation_report` 为 `null`；Context、校验和 Receipt 只处理实际声明的产物。项目接入时可复制以下 Skill 资产：

- [spec.md](../../skills/specflow/assets/spec.md)
- [plan.md](../../skills/specflow/assets/plan.md)
- [tasks.md](../../skills/specflow/assets/tasks.md)
- [meta.template.yaml](../../skills/specflow/assets/meta.template.yaml)
- [research.md](../../skills/specflow/assets/research.md)
- [validation-report.md](../../skills/specflow/assets/validation-report.md)
- [archive-receipt.template.yaml](../../skills/specflow/assets/archive-receipt.template.yaml)
- [archive-receipt.schema.json](../../skills/specflow/assets/archive-receipt.schema.json)
- [lifecycle-event.template.yaml](../../skills/specflow/assets/lifecycle-event.template.yaml)
- [lifecycle-event.schema.json](../../skills/specflow/assets/lifecycle-event.schema.json)
- [relation-transaction.template.yaml](../../skills/specflow/assets/relation-transaction.template.yaml)
- [relation-transaction.schema.json](../../skills/specflow/assets/relation-transaction.schema.json)
- [knowledge-projection.template.yaml](../../skills/specflow/assets/knowledge-projection.template.yaml)
- [knowledge-projection.schema.json](../../skills/specflow/assets/knowledge-projection.schema.json)
- [archive-checklist.md](../../skills/specflow/assets/archive-checklist.md)
- [archive-receipt.mjs](../../skills/specflow/scripts/archive-receipt.mjs)

## 产物所有权

| 产物 | 唯一职责 |
| --- | --- |
| Spec | 做什么、为什么做、怎样算完成 |
| Plan（按需） | 如何实现、依据、风险和验证策略 |
| Tasks（按需） | 可执行步骤、顺序和验证 |
| Meta | 状态、关系、影响范围和新鲜度 |
| Research（按需） | 对重大未知的限时实验与结论 |
| Validation Report（按需） | 结构、关系和新鲜度检查结果 |
| Archive Receipt | 首次终态的最终实现、产物、验证、授权和知识投影快照 |
| Lifecycle Event | 首次终态之后的状态或关系变化 |
| Relation Transaction | 两个终态事项之间互反关系的协调意图和双方 Event 摘要 |

## 生命周期

```text
Draft
→ Planned
→ In Progress
→ Archived
  ├── Superseded
  └── Cancelled
```

- `Draft`：范围或完成条件尚未闭合；
- `Planned`：Spec 已闭合，必要的设计决策已解决，可以执行；
- `In Progress`：实现或验证已经开始；
- `Archived`：完成条件已经验证且用户明确归档；
- `Superseded`：被另一个事项取代；
- `Cancelled`：不再继续，但不是由另一个事项取代。

Markdown 中使用上面的展示名称；`meta.yaml` 使用对应的小写标识：`draft`、`planned`、`in-progress`、`archived`、`superseded`、`cancelled`。

不能从 Commit、Push、合并请求或 Agent 自述推断归档授权。

首次终态必须先生成并回读不可覆盖的 Archive Receipt，最后更新 Meta 状态。归档后的真实状态或关系变化只追加 Lifecycle Event；两个终态事项的父子或取代关系由 Relation Transaction 先校验双向一致，再写双方 Event 和 Meta。该事务可幂等恢复，但跨文件投影不承诺绝对原子可见性。新的业务实现变化建立新事项，不能用 Event 绕过新的 Spec 和验证。完整语义见[归档回执、生命周期事件与 Knowledge Projection](../../skills/specflow/references/archive-and-lifecycle.md)。

当项目能够提供不可变 Base/Source 时，可以在实现阶段执行工作门禁，在交付阶段复核最终候选。完整候选必须显式关联一个或多个 Active Spec，并由其 Scope 并集覆盖全部变更；也可以使用由全部路径机械证明的受控低风险豁免，但不能同时使用两种关联，也不能用 Include/Exclude 隐藏候选。交付门禁会逐项复核 Archived Receipt、Lifecycle 摘要链，并要求各事项对应同一最终候选摘要，详见[事项—变更关联与交付门禁](../../skills/specflow/references/change-gate.md)。

采用本仓 Harness 时，Knowledge Projection 遵循 `plan → apply → verify`：Agent/人工先准备正文、Registry 条目和动作，程序再按真实变更路径检查 Scope 覆盖，机械更新来源摘要、状态与取代关系。`apply` 不生成正文；退役知识仍被代码入口引用、取代目标无效或命中知识没有决策时阻断。

## 恢复上下文

新会话第一次收到仓库相关请求时，按以下顺序加载：

1. 读取全部 `meta.yaml`；
2. 找出非终态事项；
3. 根据影响范围和当前请求选择相关事项；
4. 只加载所选事项在 Meta 中实际声明的 Spec、Plan 和 Tasks；
5. 大文档优先读取 Section Index，再加载相关章节。

如果没有 Active 事项，返回空结果，不创建虚构上下文。

同一会话、同一分支和同一任务范围内复用已加载结果，不因追问、继续实施或验证重复执行。切换分支、Active 事项集合变化、任务目标或相关路径明显变化、用户明确要求刷新时，重新加载。

采用本仓 Harness 时，可以使用 `context resolve` 按任务类型和相关路径生成上述最小加载计划。Resolver 读取 Active Spec 核心 Markdown 的字节数：在单事项与总预算内时加入全文加载计划，超限时返回 H1–H3 的真实行区间、字节数、AC/FR 等规则编号位置和清单完成度。它不生成摘要，也不替代 Agent 阅读所选章节后的相关性判断；命令可重复运行不等于每个对话回合都应运行。

## 新鲜度

归档内容不是永久有效。以下变化需要重新检查：

- 影响范围内的代码入口变化；
- 依赖的契约或 Schema 变化；
- 被引用的架构决策被取代；
- 完成条件或外部约束变化。

发现变化时只标记 `freshness: review-required`，不自动把终态改回 In Progress。

## 与 Checkpoint 的关系

- Meta 是业务生命周期的唯一事实来源；
- Checkpoint 只记录一次 Agent 执行的恢复位置；
- Checkpoint 可以引用 Specflow 文件；
- Checkpoint 丢失不改变 Meta；
- Markdown 首版不依赖 Checkpoint。

## 人工走查

至少检查：

1. Spec 的范围、非目标和完成条件是否闭合；
2. 已创建的 Plan 是否能追溯到 Spec；
3. 已创建的每个 Task 是否有验证方法；
4. Meta 的关系是否双向一致；
5. 终态是否有明确授权和完成证据；
6. 代码变化是否使归档内容过期。
