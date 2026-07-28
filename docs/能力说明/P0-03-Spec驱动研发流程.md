# P0-03 Spec 驱动研发流程

## 定位

给定研发目标、仓库上下文和生命周期操作，生成并维护可审计的 Spec、Plan、Tasks 和 Meta，让新会话可恢复业务上下文，并让 CI 执行确定性结构检查。

## 交付形态

- 首期：Blueprint + Spec、Plan、Tasks、Meta 的 Markdown 模板；
- 成熟度目标：`usable`；
- 首期不要求：Package、CI 插件、自动 Validator 或可运行 Skill；
- 未来可选：结构检查器、CI 集成和专用 Skill。

当前产物：[Specflow Blueprint 与模板](../../blueprints/specflow/README.md)。

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
| `validation-report` | Schema、关系、终态和新鲜度检查结果 |

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
- 提出归档、取代或取消建议。

程序负责：

- 校验 Schema、关系和生命周期转换；
- 发现 Active 工作；
- 为大型文档生成 Section Index；
- 检查归档后的代码变化和新鲜度；
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

- Blueprint：生命周期规则、状态所有权、关系语义和失败模式；
- 模板：Spec、Plan、Tasks、Meta 和检查报告；
- 合成案例：继续开发、归档过期、取代关系和无 Active 工作；
- `scripts/`、`evals/` 和 `tests/`：首期不需要。

## 合成应用案例

1. 合成项目存在一个 Active Spec，新会话应恢复正确上下文而不加载全部历史。
2. 合成已归档方案依赖的代码发生变化，应标记新鲜度风险但不能自动重开事项。
3. 合成新需求取代旧 Spec，应建立关系并经明确授权进入 Superseded。
4. 合成仓库没有 Active 工作，应返回空结果而不是虚构任务。

## 文档与模板首版验收

- 核心字段说明与 Markdown 模板完整；
- `meta` 被明确验证为业务生命周期的唯一事实来源；
- Blueprint 说明 Active 上下文发现和大文档 Section Index；
- 生命周期、关系和新鲜度规则可以人工走查；
- 模板不依赖 Checkpoint 即可采用；
- 四个合成案例能够验证边界和状态所有权。

## 未来可选工程化

- Schema、Parser 和 Validator；
- Active Context 与 Section Index 生成器；
- 新鲜度检查和 CI 报告；
- Specflow Skill 及行为 Eval；
- 确定性程序测试。
