# 工作流与边界

## 证据优先级

按接入目标选择最窄、最直接的来源：

1. 项目规则和已批准的长期 Knowledge 定义现有边界；
2. 公开 Schema、类型、模块出口、契约测试和发布接口支持稳定契约；
3. 实现与邻近测试用于核对候选是否仍然成立；
4. Active Spec、任务文档和当前分支差异只说明正在变化的内容，不能直接成为长期事实；
5. 文档、注释和历史说明用于解释原因，与当前权威来源冲突时显式报告；
6. Agent 推断只能标为 `inferred` 或 `unresolved`。

## 最小 Bootstrap

优先回答五个问题：

1. 采用方需要补齐哪类长期上下文？
2. 当前项目从哪里进入，哪些规则决定允许和禁止的修改？
3. 哪些稳定契约一旦猜错会持续导致实现错误？
4. 哪些代码入口和测试值得进入长期索引？
5. 哪些候选缺少权威来源、刷新条件或维护者批准？

能形成可裁决候选后停止。除非用户明确要求完整治理审计，否则不扩展到无关模块。

## Harness 化接入序列

未 Harness 化是接入前状态，不是长期降级模式：

```text
init plan 或等价只读结构盘点
→ Bootstrap 推导项目特有候选
→ 维护者审核规则、Knowledge、入口和冲突
→ 明确授权后执行 init 或人工合并
→ 独立授权后执行 Distribution Plan / Apply / Verify，安装完整公开 Skill 集合
→ 启用 Doctor / Knowledge / Specflow 等门禁
→ 后续新会话使用 context resolve
```

- `init plan` 只判断 Starter 文件应新增、复用还是冲突，不生成项目语义；
- Bootstrap 只补充通用 Starter 无法知道的项目事实，不写入目标项目；
- 维护者分别批准候选内容和写入动作，报告完成不能推断两者已授权；
- `init` 或人工合并属于后续 Harness 化动作，不由本 Skill 自动执行；
- 完整底座默认安装 Manifest 中全部公开 Skill，使 Host 可以按任务发现；安装不表示项目配置、工具、Adapter 或外部基建已经就绪；
- Distribution 写入与结构初始化分别计划和授权；局部 `skill install` 只用于维护者明确选择的有限采用，不作为完整接入的默认路径；
- 完成接入后，日常任务和新会话不重复 Bootstrap。

## 复用现有导航

若目标项目已完成或正在进行 Harness 化，并已有 Resolver、Registry、Code Entry Map 或 Section Index，优先复用其加载计划与定位结果：

- 已有 Resolver 时，先等待其返回，再读取被选中的 Active Spec 或 Knowledge；
- 大型 Spec 已有 Section Index 时，先选相关章节，再局部读取原文；
- 接入前没有这些设施时，先消费 `init plan` 或记录等价结构盘点，再从根规则、目录入口和目标模块逐步收窄；
- 不重新实现目标项目已经提供的解析器，也不要求采用方先把 Harness 安装进目标项目。

## 分开验证 Host 与 Harness

Agent Host 原生发现和本仓 Harness 命令是两个独立验证面：

- Host 负责发现项目规则和项目级 Skill 内容；安装到目标 Host 约定目录并由新会话实际加载，才能证明原生发现成立；
- 本仓 Harness 负责 Manifest、受管安装记录、Doctor、Knowledge、Specflow 和 Context Resolver 等项目治理语义；
- Host 能加载 Skill，不表示 `context`、`specflow` 或其他 Harness 命令已经进入采用项目的 `PATH`；
- 采用项目只使用本 Skill 时，不要求额外安装 Harness；需要日常 Resolver 或确定性门禁时，通过可复核的本仓 CLI、稳定分发包或 CI 入口提供，不在项目文件中硬编码临时同级仓库绝对路径。

验证接入时分别记录 Host 实际加载的 Skill/规则路径，以及 Harness 的 Doctor、Knowledge、Specflow 或 Context 结果。任一侧缺失时只降低对应结论，不把另一侧已经通过的证据一并否定。

## 能力就绪矩阵

完整 Distribution 安装后，动态读取 Manifest 或受管安装记录，不手写 Skill 名称与数量。逐项读取 Skill 的触发、开始条件、硬性门禁和项目扩展点，再用项目规则、Knowledge、包清单、配置入口、测试和公开 Adapter 证据填写矩阵。

| 状态 | 使用条件 |
| --- | --- |
| `ready` | Skill 可被 Host 发现，且开展其适用任务不缺少必须长期配置；任务特有输入仍可在触发时收集 |
| `needs-project-config` | Skill 适用于项目，但缺少需要跨任务复用的本地规则、命令、目录、阈值或验收约定 |
| `needs-adapter` | Skill 适用于项目，但其核心闭环依赖尚未接入的外部事实来源、工具或 Provider Adapter |
| `not-applicable` | 存在明确项目事实或维护者决策证明当前不采用；不能仅凭搜索无结果推断 |
| `unresolved` | 适用性、责任边界或关键输入必须由维护者裁决，当前 Evidence 不足 |

每一行至少记录 Skill、状态、项目 Evidence、缺口、建议落点和是否需要维护者回答。安装摘要只能证明内容一致，不是 `ready` Evidence。

先自动取证，再把多个 Skill 依赖的同一决策合并提问。例如测试、构建和浏览器验证约定只问一次；设计输入、埋点和组件治理没有采用证据时分别保留为未决决策。不要在安装阶段要求维护者填写所有领域配置，也不要把任务特有的页面、版本或设计稿输入误写成长期项目缺口。

就绪结果属于当前接入事项，优先放在 Spec Research 或审核报告；只有经维护者确认且跨任务稳定的命令、目录、契约或 Adapter 引用，才投影到项目规则、Knowledge 或领域配置。

## 候选取证顺序

```text
接入或知识审计目标
→ 现有规则 / Knowledge / 入口索引
→ 公开契约 / Schema / 测试
→ 必要时定位最小实现证据
→ 判断长期稳定性与准入动作
→ 停止并提交维护者审核
```

只有以下情况才继续深入实现：

- 现有文档与公开契约冲突，需要判断当前事实；
- 候选契约的刷新条件或真实所有者无法从入口确定；
- 邻近测试显示存在兼容、异常或状态约束；
- 代码入口索引需要核对公开入口与真实实现是否仍一致。

每次深入都必须支持一个长期候选决策。若只是回答当前开发任务的调用关系，停止 Bootstrap，改由当前任务工作流处理。

## 准入决策

| 建议动作 | 适用条件 | 结果状态 |
| --- | --- | --- |
| `create` | 跨任务稳定、存在权威 Evidence、现有长期层缺失 | 新草稿 `draft` |
| `update` | 既有内容仍应保留，但与当前权威 Evidence 不一致 | `review-required` |
| `still-valid` | 既有内容与当前 Evidence 一致且批准证据仍有效 | `existing-approved` |
| `review-required` | 稳定性可能成立，但来源、责任人或冲突尚未裁决 | `review-required` |
| `no-admission` | 当前任务状态、易变实现、临时调用链或无长期消费者 | 不进入长期层 |

报告中的建议动作不是写入授权。即使用户授权生成文件，新内容仍先以草稿出现，批准流程由采用方拥有。

## 建议位置

| 内容 | 建议位置 | 条件 |
| --- | --- | --- |
| 仓库工作边界和禁止事项 | 根级或模块级规则 | 跨任务稳定且维护者确认 |
| API、Schema、不变量和兼容边界 | Knowledge | 有权威来源、刷新条件和维护者批准 |
| 代码与契约测试入口 | Code Entry Map 或等价索引 | 路径稳定且有明确任务路由价值 |
| 当前任务调用链和消费者 | 当前 Spec Research / Evidence | 绑定 revision，不进入长期层 |
| 证据冲突或缺失 | Bootstrap 报告或当前 Spec 未决问题 | 未解决前不得提升为稳定事实 |

## Knowledge README 导航

当项目已经存在或本次建议创建真实 Knowledge 时，为目录 README 生成可供维护者审核的人类导航候选。最小内容包括：

1. 项目知识库解决什么问题，以及明确不覆盖什么；
2. 已批准或待批准正文的标题、相对链接、用途和典型加载场景；
3. 常见任务到入口与 Knowledge 的少量示例；
4. README、Registry、Code Entry Map、项目规则和 Specflow 的职责边界。

README 不保存 Digest、完整 Scope、状态原因、全部刷新条件或 Resolver 结果。这些机器事实仍由 Registry、Code Entry Map 与真实文件生成。若 Registry 为空且没有获批候选，只保留治理说明，不生成虚假项目总览或空条目表。

## 新鲜度

至少为候选记录以下刷新触发：

- 公开入口、导出、Schema、类型或契约测试变化；
- 对应模块的所有权或目录职责变化；
- 候选依赖的实现路径发生实质变更；
- 相关 Knowledge 进入 `review-required`、被取代或退休；
- 维护者批准范围或兼容政策变化。
