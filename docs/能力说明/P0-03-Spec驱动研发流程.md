# P0-03 Spec 驱动研发流程

## 定位

给定研发目标、仓库上下文和生命周期操作，生成并维护可审计的 Spec、Plan、Tasks 和 Meta，让新会话可恢复业务上下文，并让 CI 执行确定性结构检查。

## 交付形态

- 当前：已验证 Skill + Blueprint + 完整 Meta Schema/检查 + 全套生命周期模板 + 本地 Receipt/Event/Meta 与双终态事项关系事务脚本 + Context/Knowledge 检查 + Knowledge Projection Registry 更新器 + 本地 Git Merge Candidate 摘要与 Change Gate；
- 当前成熟度：Skill `validated`；Meta、本地终态、Event 链、状态最后写、双终态事项 Relation Transaction、Context 解析、Knowledge 来源摘要/Registry 投影、Git 摘要与两阶段 Change Gate 子集 `reference-implemented`；
- 当前未实现：Active/多事项/跨仓库关系事务、其他版本控制 Provider、受保护历史检查、Knowledge 正文生成与刷新触发语义和 CI 插件；
- 未来可选：完整结构检查器和 CI 集成。

当前产物：[`specflow` Skill](../../skills/specflow/SKILL.md)与[项目接入 Blueprint](../../blueprints/specflow/README.md)。

## 触发与不触发条件

应该触发：

- 需求需要跨会话、跨阶段持续执行；
- 需要把范围、决策、任务和验收条件落在仓库内；
- 需要发现 Active 工作或检查归档内容是否过期；
- 需要 CI 检查结构、关系和生命周期。

不应触发：

- 一次性的小修改不需要长期产物；
- 用户只要求保存某次 Agent 的执行进度；
- 用户希望用结构检查替代业务评审或测试。

缺少研发目标、完成条件或目标仓库时，可以生成澄清项，但不能进入 Planned。

## 输入

必需输入：

- 研发目标和动机；
- 范围与非目标；
- 完成条件；
- 目标仓库或等价的结构上下文。

可选输入：

- PRD、Figma 设计稿、Issue、评审纪要或自然语言需求；
- 已有 Spec、Plan、Tasks、Meta；
- 公开 Issue 或工作项引用；
- 架构约束、测试要求和风险；
- 代码变化摘要；
- Checkpoint Run 引用。

## 输出契约

| 产物 | 唯一职责 |
| --- | --- |
| `spec` | 做什么、为什么做、怎样算完成 |
| `plan` | 如何实现、依据是什么、风险是什么 |
| `tasks` | 先做什么、如何验证 |
| `meta` | 业务生命周期状态、关系和影响范围 |
| `research` | 重大技术未知的限时实验与结论，按需创建 |
| `validation-report` | Schema、关系、终态和新鲜度检查结果 |
| `archive-receipt` | 首次终态的授权、实现边界、产物摘要、验证和 Knowledge Projection 快照 |
| `lifecycle-event` | 首次终态之后的状态与关系变化，只追加不覆盖 |
| `relation-transaction` | 两个终态事项之间父子或取代关系的互反校验与恢复依据 |

生命周期为：

```text
Draft
→ Planned
→ In Progress
→ Archived / Superseded / Cancelled
```

部分信息不足时，输出必须保留在 Draft 并列出 Blocker。

## 职责划分

Agent 负责：

- 理解目标、范围、风险和技术决策；
- 生成或更新 Spec、Plan、Tasks；
- 判断代码变化是否影响既有设计；
- 编写或复核 Knowledge 正文与 Projection 动作；
- 提出归档、取代或取消建议。

程序负责：

- 校验 Schema、关系和生命周期转换；
- 发现 Active 工作；
- 为大型文档生成 Section Index；
- 检查归档后的代码变化和新鲜度；
- 计划、应用并验证 Knowledge Registry 的确定性投影；
- 对完整不可变候选执行一个或多个 Spec 的显式集合关联和 Scope 并集覆盖，或者使用受控路径型豁免，并在交付阶段逐项复核 Receipt/Lifecycle 证据；
- 对两个终态事项的父子或取代关系执行互反校验、证据先写和幂等补齐；
- 输出 Provider Neutral 的 CI 报告。

归档、取代和取消属于业务生命周期变更，应由用户或明确策略授权，不能从 Commit、Push 或 Draft PR 推断。

## 依赖与状态所有权

- `specflow-core/meta` 是研发事项生命周期的唯一事实来源；
- `spec`、`plan`、`tasks` 是对应内容的权威仓库产物；
- Checkpoint 只在长时间 Agent 执行需要恢复时接入；
- Checkpoint Run 可以引用 Specflow 产物，但不得镜像 Draft、Planned、In Progress 或终态；
- Checkpoint 中断或丢失不改变 Specflow 业务状态；
- Specflow 第一版不强制依赖 Checkpoint。

## 非目标与安全边界

- 不用结构检查代替业务 Review；
- 不假设某个 Issue、MR 或代码托管平台；
- 不保存聊天摘要作为第二事实源；
- 不从代码提交或推送推断归档授权；
- 不自动修改外部工作项；
- 不把当前执行进度写成长期架构知识。

## 首期资源

- Skill：输入整理、事项发现、Spec、Plan、Tasks、实施验证和授权收口流程；
- Blueprint：项目目录、生命周期规则、状态所有权和接入边界；
- 模板：Spec、Plan、Tasks、Meta、Research 和 Validation Report；
- 合成案例：继续开发、归档过期、取代关系和无 Active 工作；
- Eval：完全合成的行为 Case 和 Rubric；
- `scripts/` 和 `tests/`：已提供 Receipt/Event/Meta 生命周期、Relation Transaction 与合成测试；Harness 提供 Context/Knowledge、Projection Plan/Apply/Verify 和 Change Gate 命令。

Change Gate 的工作阶段要求不可变 Merge Candidate 明确关联一个或多个 Active Spec，并由其 Scope 并集覆盖完整实现变更；也可以在没有 Spec 时满足一个受控路径型低风险豁免。交付阶段逐项要求 Archived Meta、可验证的 Receipt/Lifecycle 链，以及仍与同一最终候选一致的变更摘要。该检查不创建 Commit，不从 Commit/Push 推断终态授权，也不证明外部平台已经交付。

## 合成应用案例

1. 合成项目存在一个 Active Spec，新会话应恢复正确上下文而不加载全部历史。
2. 合成已归档方案依赖的代码发生变化，应标记新鲜度风险但不能自动重开事项。
3. 合成新需求取代旧 Spec，应建立关系并经明确授权进入 Superseded。
4. 合成仓库没有 Active 工作，应返回空结果而不是虚构任务。

## 当前验收

- 核心字段说明与 Markdown 模板完整；
- `meta` 被明确验证为业务生命周期的唯一事实来源；
- Blueprint 说明 Active 上下文发现和大文档 Section Index；
- 生命周期、关系和新鲜度规则可以人工走查；
- 模板不依赖 Checkpoint 即可采用；
- 行为 Eval Case 能够验证触发、证据、生命周期、授权和 Provider-neutral 边界。
- 生命周期脚本能够确定性计算摘要、拒绝覆盖、连续追加 Event，并在证据回读后最后原子更新 Meta；中断后可用同一候选恢复。
- Relation Transaction 能阻断单侧或夹带变化，在双方 Event 之后逐侧投影 Meta，并在任一侧中断后用同一候选补齐；不把跨文件过程表述为绝对原子写入。
- Context Resolver 能按任务类型、相关路径和 Active Meta 返回最小加载计划，并按可配置预算在全文与真实 Markdown Section Index 间确定性选择；Knowledge Check 能以权威来源摘要暴露过期风险。
- 本地 Git Provider 能从不可变 Base/Source 生成范围化 Merge Candidate 摘要，并阻断范围内脏内容和合并冲突。
- Knowledge Projection 能检查路径反向命中、已准备正文、退役路由和取代关系，原子更新 Registry 来源证据，并以决策指纹支持幂等重试和独立验证。
- `specflow check` 能校验完整 Meta、产物路径、本地关系互反、关系循环和终态证据链；12 个 Case 的正式脱敏回放可由通用 Runner 重算。

## 未来可选工程化

- Active 事项、三个及以上事项或跨仓库的关系事务；
- 其他版本控制 Provider 和受保护历史检查；
- Knowledge 正文生成；
- 刷新触发语义检查和 CI 报告；
- 更大事项集和更多 Provider 的确定性程序测试。
