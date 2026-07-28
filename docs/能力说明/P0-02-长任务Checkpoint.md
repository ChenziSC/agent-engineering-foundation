# P0-02 长任务 Checkpoint

## 定位

给定一次多阶段任务的阶段定义、状态变化和外部引用，持久化可恢复、可审计的执行记录，并通过确定性门禁阻止无效状态转换。

## 交付形态

- 首期：设计框架 + 状态模型 + Schema 示例；
- 成熟度目标：`designed`；
- 首期不要求：可运行持久化、状态机 Package 或程序测试；
- 未来可选：`checkpoint-core` 参考实现。

当前产物：[长任务 Checkpoint 框架与 Schema 示例](../../frameworks/checkpoint/README.md)。

## 调用与不调用条件

应该调用：

- 任务跨多个阶段并可能被中断；
- 任务包含人工确认或外部操作；
- 恢复时必须避免重复执行；
- 需要审计阶段变化和决策。

不应调用：

- 一次性、短时且天然幂等的操作；
- 只需要保存业务生命周期状态；
- 调用方希望把聊天摘要直接当作完成证据。

Checkpoint 是供上层 Skill 或应用采用的设计框架，不由用户单独触发。未来形成 Package 时继续遵守本说明。

## 输入

必需输入：

- `runId` 和任务类型；
- Stage 定义及合法转换；
- 当前事件或转换请求；
- 阶段退出门禁结果。

可选输入：

- 上一次持久化快照；
- 人工或策略 Decision；
- Evidence、Claim、文件或外部产物的 `ExternalRef`；
- 幂等键和调用方定义的扩展字段。

## 输出契约

- `RunSnapshot`：当前 Run、Stage、状态和恢复位置；
- `EventLog`：只追加的状态变化；
- `DecisionLog`：决策、决策者类型和时间；
- `ExternalRefs`：不透明外部引用；
- `TransitionResult`：允许、拒绝及原因；
- `ResumePlan`：恢复时应继续、跳过或重新验证的步骤。

Checkpoint 不输出业务结论，也不保存 Evidence 或 Claim 的内容副本。

## 职责划分

调用方 Agent 负责：

- 定义业务 Stage 和业务语义；
- 判断是否需要人工确认；
- 解释恢复后的任务上下文。

程序负责：

- 校验状态转换；
- 追加 Event 和 Decision；
- 持久化快照及不透明引用；
- 检查幂等键和阶段退出门禁；
- 计算确定性的恢复位置；
- 拒绝伪造完成状态。

人工负责需要显式授权的外部动作。Checkpoint 只记录授权结果，不替代授权。

## 核心对象

- `Run`：一次独立执行；
- `Stage`：当前执行阶段及退出条件；
- `Event`：已经发生的状态变化；
- `Decision`：人工或策略作出的执行决策；
- `ExternalRef`：对 Evidence、Claim、文件或外部产物的不透明引用；
- `TransitionResult`：一次状态转换的校验结果；
- `ResumePlan`：恢复时的确定性执行计划。

## 依赖与状态所有权

Checkpoint 是横向共享 Package：

```text
checkpoint-core
├── web-first-screen-prefetch
├── specflow 执行恢复层（可选）
├── design-to-code
├── migration-workflow
└── audit-workflow
```

边界固定为：

- `checkpoint-core` 不定义 Evidence、Claim、Blocker 或 Verification；
- 对这些对象只保存 `ExternalRef`；
- Evidence 和 Claim 的有效性由 `evidence-core` 判断；
- 组合 Validator 把证据校验结果作为阶段退出门禁输入；
- Checkpoint 追加“引用已失效”事件，但不自行推导 Claim；
- Specflow 的业务生命周期保存在 `specflow-core/meta`，Checkpoint 只保存一次执行的恢复状态。

## 非目标与安全边界

- 不理解业务语义；
- 不把“步骤执行过”自动视为“业务完成”；
- 不代替 Evidence Core 管理证据和结论；
- 不成为 Specflow 生命周期的第二事实源；
- 不自动重放非幂等外部操作；
- 不在日志中保存工具原始输入输出或敏感正文。

## 首期资源

- 框架文档：状态模型、幂等原则、恢复模式和失败模式；
- Schema 示例：Run、Stage、Event、Decision 和 ExternalRef；
- 合成案例：中断、恢复、人工门禁和非幂等重放；
- `scripts/`、`evals/` 和 `tests/`：首期不需要。

## 合成应用案例

1. 合成长任务在第二阶段中断，恢复后应跳过已完成的幂等步骤。
2. 合成人工决策缺失，必须拒绝进入包含外部写操作的阶段。
3. 合成 Claim 被 Evidence Core 标记失效，组合 Validator 必须阻止完成。
4. 合成非幂等操作已经发出但结果未知，恢复计划必须要求人工确认而不是自动重放。

## 文档首版验收

- 核心对象、状态变化和恢复语义定义完整；
- 提供可讨论的 JSON Schema 示例，不承诺稳定公共 API；
- `ExternalRef` 不复制 Evidence 内容；
- 明确与 Evidence Core、Specflow 的单向边界；
- 四个合成案例可以按文档完成状态走查；
- 文档不会把执行过的步骤自动视为业务完成。

## 未来可选工程化

- `checkpoint-core`；
- 状态转换与恢复计划函数；
- 内存和文件持久化实现；
- Schema 校验、迁移检查和日志完整性检查；
- 状态机、幂等和恢复测试。
- 文档明确与 Evidence Core、Specflow 的单向边界。
