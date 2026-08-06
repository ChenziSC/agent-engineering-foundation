# 外部副作用恢复回执框架

成熟度：`reference-implemented`

这个框架只用于采用方确实需要跨进程恢复、且包含非幂等外部副作用的领域流程。它记录执行位置、状态变化和人工决策，重点避免结果未知时重复执行外部动作；普通 Agent 会话、代码编辑和无外部副作用的长任务直接使用 Host 原生恢复能力。

它不是任务队列、业务状态持久化服务或通用 Session Checkpoint。仓库提供 [v1 Schema](checkpoint.schema.json)、[模板](checkpoint.template.json) 和最小[参考实现](scripts/checkpoint.mjs)，用于确定性校验完整性、事件顺序、引用状态与恢复策略；存储、锁和外部动作确认由采用方负责。没有真实跨进程副作用消费者时，不应接入本框架。

## 核心对象

| 对象 | 职责 |
| --- | --- |
| Run | 一次独立执行 |
| Stage | 当前执行阶段、状态和退出门禁 |
| Event | 只追加的状态变化 |
| Decision | 人工或策略作出的执行决策 |
| ExternalRef | 对 Evidence、Claim、文件或外部产物的不透明引用 |
| ResumePlan | 恢复时继续、跳过、重新验证或人工确认的步骤 |

## 参考实现边界

- `sealCheckpoint` 为候选对象计算内容摘要并立即回读校验；
- `validateCheckpoint` 检查精确字段、阶段引用、Event 连续序号和不可篡改摘要；
- `deriveResumePlan` 只根据已声明的重放策略、输入摘要、退出门禁和外部引用状态生成计划；
- `manual-only` 和 `verify-before-replay` 永远不会被自动转换成重放动作；
- 参考实现不写文件、不调用外部系统，也不把 Checkpoint 状态同步成业务状态。

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
