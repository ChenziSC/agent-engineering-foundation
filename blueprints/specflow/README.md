# Specflow Blueprint

成熟度：模板 `usable`，自动化 `designed`

Specflow 用仓库内的 Spec、Plan、Tasks 和 Meta 管理一个研发事项的目标、技术决策、执行拆分和业务生命周期。它优先解决跨会话恢复与可审计性，不要求接入特定 Issue、代码托管或 CI 平台。

## 推荐目录

使用方可以调整根目录，但四类产物应位于同一个事项目录：

```text
.agent-work/
└── <work-id>/
    ├── spec.md
    ├── plan.md
    ├── tasks.md
    ├── meta.yaml
    └── validation-report.md
```

可复制以下模板：

- [spec.md](../../templates/specflow/spec.md)
- [plan.md](../../templates/specflow/plan.md)
- [tasks.md](../../templates/specflow/tasks.md)
- [meta.template.yaml](../../templates/specflow/meta.template.yaml)
- [validation-report.md](../../templates/specflow/validation-report.md)

## 产物所有权

| 产物 | 唯一职责 | 不应包含 |
| --- | --- | --- |
| Spec | 做什么、为什么做、怎样算完成 | 逐步实现过程 |
| Plan | 如何实现、依据、风险和验证策略 | 当前任务勾选状态 |
| Tasks | 可执行步骤、顺序和验证 | 新的需求范围 |
| Meta | 状态、关系、影响范围和新鲜度 | 聊天摘要和运行日志 |
| Validation Report | 结构、关系和新鲜度检查结果 | 业务评审结论 |

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
- `Planned`：Spec 和 Plan 已完成评审，可以执行；
- `In Progress`：至少一个 Task 正在执行；
- `Archived`：完成条件已经验证且用户明确归档；
- `Superseded`：被另一个事项取代；
- `Cancelled`：不再继续，但不是由另一个事项取代。

Markdown 中使用上面的展示名称；`meta.yaml` 使用对应的小写标识：`draft`、`planned`、`in-progress`、`archived`、`superseded`、`cancelled`。

不能从 Commit、Push、合并请求或 Agent 自述推断归档授权。

## 恢复上下文

新会话按以下顺序加载：

1. 读取全部 `meta.yaml`；
2. 找出非终态事项；
3. 根据影响范围和当前请求选择相关事项；
4. 只加载所选事项的 Spec、Plan 和未完成 Tasks；
5. 大文档优先读取 Section Index，再加载相关章节。

如果没有 Active 事项，返回空结果，不创建虚构上下文。

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
2. Plan 是否能追溯到 Spec；
3. 每个 Task 是否有验证方法；
4. Meta 的关系是否双向一致；
5. 终态是否有明确授权和完成证据；
6. 代码变化是否使归档内容过期。

## 未来可选工程化

- Meta Schema Validator；
- Active Context 发现器；
- Section Index 生成器；
- 新鲜度检查；
- Provider Neutral 的 CI 报告；
- Specflow Skill 和行为 Eval。
