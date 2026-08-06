# Knowledge：能力准入、宿主边界与确定性代码依赖

## 注册信息

- ID：`deterministic-core-boundary`
- 状态、适用范围、复核时间、权威来源和刷新条件以 [Knowledge Registry](registry.yaml) 中的同 ID 条目为准。

## 目标

本仓只沉淀相对主流 Harness Agent 有明确增量价值的工程治理资产。Agent Host 已经提供的通用运行、代码探索和安全能力直接复用；仓库负责领域不变量、跨宿主内容契约、可复核 Evidence、确定性 Validator 和真实外部系统边界。

这条边界同时约束两类浪费：一类是把“认真读代码、使用工具、运行测试”等基础行为重新包装成 Skill；另一类是为假设中的多宿主差异提前建设安装器、Runtime、Capability Registry 或统一 Hook。

## 宿主能力基线

以下能力默认由 Codex、Claude Code 等 Harness Agent 或其原生 Plugin/Skill 机制负责，本仓不建立平行通用实现：

- 发现和加载仓库规则、Skill、Plugin 与 MCP；
- 通用代码搜索、符号定位、编辑、命令执行、测试和 Git 工作树操作；
- 权限确认、沙箱、会话级恢复、任务并行和通用 Hook 生命周期；
- Skill/Plugin 的用户级安装、更新、市场分发和宿主配置；
- 通用 Prompt 编排，例如“先分析、再计划、再实现、最后测试”。

项目级 Spec Meta、Knowledge Registry、领域 Schema 或安全状态机不是宿主原生语义。宿主能读取文件，不等于已经实现了这些契约的确定性校验。

## 增量能力准入

每个新增或实质扩展的能力必须在 Spec 或 Plan 回答以下问题：

| 项目 | 必须回答 | 拒绝信号 |
| --- | --- | --- |
| 目标问题 | 哪个可观察失败或工程成本需要解决 | 只写“提升效率、增强理解” |
| 宿主基线 | 主流 Harness Agent 当前已经能完成什么 | 未做基线比较就声称缺失 |
| 增量缺口 | 本仓补的是领域语义、确定性、跨宿主契约还是外部系统接入 | 只是换一套提示词描述基础行为 |
| 产物与消费者 | 新增 Schema、Validator、Skill、Adapter 或 Evidence 由谁直接消费 | 只有目录和说明，没有调用方或采用路径 |
| 验证 | 用什么测试、Eval 或对照实验证明增益 | 只验证文件存在或 Agent 自述成功 |
| 删除条件 | 什么情况下应合并、降级或删除 | 假设永久保留，没有维护退出条件 |

满足下列至少一项，才允许进入仓库实现：

1. 提供宿主没有的领域不变量、失败分类和可验证工作流；
2. 提供可重复的解析、校验、比较、摘要、状态机、事务或安全门禁；
3. 定义被两个以上真实调用方消费的稳定跨宿主数据契约；
4. 通过薄 Adapter 隔离真实外部系统或语言工具链差异；
5. 对照评估证明其正确率、召回率、风险发现率、上下文成本或操作安全性稳定优于宿主原生行为。

仅有问题价值但尚无实现收益证据时，可以保留为问题图谱中的 `idea` 或 `problem-pattern`，不必创建空 Framework、Blueprint、Skill、Package 或 Adapter。

## 禁止独立包装的内容

以下表述不能单独构成仓库能力：

- 阅读 `AGENTS.md`、README、代码、测试和相关文档；
- 搜索定义、引用、调用者和消费者；
- 先理解需求、列计划、逐步执行、完成后总结；
- 谨慎推理、不要幻觉、证据不足时说明不确定；
- 修改后运行测试、检查 Diff、遵守权限和用户授权；
- 使用宿主已有的 Skill、Plugin、Hook、MCP、Sandbox 或 Checkpoint。

这些原则可以作为某个真实领域流程的局部约束，但必须同时存在明确触发、领域输入、结构化输出、停止条件和 Eval。复制宿主手册、换名重述或增加一层无消费者的 Schema 都不产生增量价值。

## 确定性代码依赖

共享确定性代码必须由稳定代码所有者持有，不能藏在某个 Skill 的私有目录中再被 Harness 反向导入。

```text
Framework Contract
        ↓
Shared Deterministic Module ← Thin Provider / Language Adapter
        ↓
Harness CLI / Repository Gate
        ↑
Skill 只编排公开入口或携带真正自包含的脚本
```

| 层 | 可以拥有 | 禁止拥有或依赖 |
| --- | --- | --- |
| `frameworks/` | 问题模型、Schema、窄领域 Validator | Host 安装状态、通用 Runtime |
| `packages/` | 多调用方共享的解析、校验、事务和仓库门禁 | `skills/**` 私有脚本 |
| `adapters/` | 真实 Provider、语言工具链或 Host 差异的薄转换 | 核心领域状态和通用安装框架 |
| `skills/` | 领域触发、步骤、停止条件、References、Assets、Evals；必要时自包含脚本 | 被 Package 当作共享库、未声明仓外私有依赖 |
| `distribution/` | 发布白名单、源目录和内容摘要 | Skill Runtime、权限模型、宿主 Capability 协商 |

当前已存在的 `packages/** → skills/**` 导入属于待迁移债务，不得新增。迁移顺序是先把共享 Parser、Validator 或事务原语移到稳定所有者，再保留必要的 Skill 薄入口，最后增加静态依赖门禁。

## Skill 发布边界

- Skill 源内容尽量遵循开放格式，由各 Agent Host 的原生目录、Plugin 或 Marketplace 负责安装和更新。
- `distribution/manifest.yaml` 只作为本仓发布白名单和内容摘要，不演进为通用安装协议或运行时能力协商层。
- Skill 内脚本必须自包含，或通过宿主原生机制声明外部命令、MCP、Package 或 Plugin 依赖；不能依赖本仓未随包发布的相对路径。
- 跨宿主差异优先通过相同内容兼容；只有经过真实宿主验证且无法消除的差异才增加薄 Adapter。
- 现有项目级 `skill install/update` 与 `distribution apply` 是参考兼容实现，可以维护安全性和回归测试，但不继续扩展用户级安装、动态插件、通用 Hook、权限、Sandbox 或 Capability Registry。

## 成熟度与名称

- 自然语言 Skill 的正式回放只证明所测行为，不证明底层静态分析、运行态或完整性语义。
- 没有确定性实现时，可以称“调研”“审计”“候选生成”或 `designed`，不能称“AST 切片已实现”“完整调用图”“运行态验证”或 `reference-implemented`。
- Adapter 支撑的能力必须分别标记核心契约与 Adapter 成熟度，不能用合成 Schema 测试替代真实 Provider Evidence。
- 能力名称、Docs 投影、Eval Rubric 和实际代码必须指向同一层交付事实。

以 Context 为例：`init plan` 只判断 Starter 的结构差异，`project-context-bootstrap` 只生成存量项目规则、稳定契约、Knowledge 与代码入口候选；候选经维护者审核并另行授权落地后，`context resolve` 才承担日常任务和新会话的最小上下文加载。局部代码阅读只是候选取证方法，普通任务代码探索由 Agent Host 和当前 Spec 承担，不形成独立 Skill 模式。字段级正反向 AST 数据流、读写/累加/透传边、风险规则和结构化时序尚无确定性实现；只有出现真实消费者、语言 Adapter 和相对 Host 基线的收益证据后，才作为独立能力建设。

## 复核与清理

出现以下任一情况时，能力进入合并、降级或删除复核：

- Agent Host 已原生覆盖且本仓没有领域差异或增益证据；
- 没有直接消费者、真实采用方或有效 Eval；
- 只有自然语言说明，且内容可以被更上层规则完整替代；
- Schema、模板或 Registry 没有程序或工作流消费；
- 多个能力重复维护相同事实、状态或安全规则；
- 维护成本持续高于已观察收益。

清理时保留仍有价值的问题、失败模式和验证结论；不为保留目录而维持无消费者实现。
