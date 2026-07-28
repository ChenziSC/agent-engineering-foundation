# 长任务 Checkpoint 框架

成熟度：`designed`

这个框架用于记录多阶段 Agent 任务的执行位置、状态变化和人工决策，使任务中断后能够恢复，同时避免重复执行非幂等动作。

它是设计框架，不是持久化组件。配套的 [Schema 示例](checkpoint.schema.example.json) 用于走查对象关系，不承诺稳定 API。

## 核心对象

| 对象 | 职责 |
| --- | --- |
| Run | 一次独立执行 |
| Stage | 当前执行阶段、状态和退出门禁 |
| Event | 只追加的状态变化 |
| Decision | 人工或策略作出的执行决策 |
| ExternalRef | 对 Evidence、Claim、文件或外部产物的不透明引用 |
| ResumePlan | 恢复时继续、跳过、重新验证或人工确认的步骤 |

## 状态原则

1. Event 和 Decision 只追加，不静默覆盖历史。
2. “步骤已经执行”不等于“业务已经完成”。
3. 阶段退出必须由明确门禁决定。
4. 恢复前先判断步骤是否幂等以及外部结果是否已知。
5. 非幂等动作结果未知时，不自动重放。
6. Checkpoint 不保存业务生命周期的第二份状态。

## 与 Evidence 的边界

- Checkpoint 只保存 Evidence 和 Claim 的 `ExternalRef`；
- Claim 是否有效由 Evidence 框架判断；
- 上层组合门禁把 Claim 状态转换为 Stage 退出结果；
- Checkpoint 可以记录“引用失效”事件，但不推导新的 Claim。

## 与 Specflow 的边界

- Specflow `meta` 是研发事项生命周期的唯一事实来源；
- Checkpoint 只记录某一次 Agent 执行的恢复位置；
- Checkpoint 不镜像 Draft、Planned、In Progress 或终态；
- Checkpoint 丢失不改变 Specflow 业务状态。

## 合成走查

### 普通中断

一个合成分析任务在 `verify-behavior` 阶段中断。恢复时跳过已经完成且输入未变化的采集步骤，从行为验证继续。

### 人工门禁缺失

下一阶段包含外部写操作，但没有人工 Decision。Stage 退出被拒绝，Run 保持 `paused`。

### Evidence 失效

组合门禁发现关键 Claim 已经 `stale`。Checkpoint 追加失效事件，并把恢复计划指向重新采集 Evidence。

### 非幂等结果未知

外部动作已发送但没有结果。恢复计划标记 `confirm-manually`，不得自动重放。
