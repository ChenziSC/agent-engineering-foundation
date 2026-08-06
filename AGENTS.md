# 协作约束

本仓库用于建设可由任意项目快速接入的通用 Agent 工程治理骨架，并使用自身能力管理自身演进。

## 语言约定

- 中文是仓库内容和协作沟通的首要语言。
- Skill、规范、模板、示例、评估材料和说明文档默认使用中文编写。
- 代码标识符、命令、文件格式固有字段和通行技术术语可以保留英文；必要时补充中文解释，确保中文读者无需依赖英文材料即可理解核心内容。
- 除非用户明确要求，不得将现有中文内容整体改写为英文。

## 内容边界

- 受限来源中的 Agent 能力全部进入非公开能力盘点，不因来源而丢弃问题价值；是否进入公开仓库另行判断。
- 跨项目通用且已移除具体内部信息的设计可以沉淀；具体文字、代码、Schema、测试和数据是否能直接复用，另按权属或许可判断。公开形态按 `complete-solution`、`adapter-backed`、`problem-pattern`、`exclude` 分级，成熟度另行标记。
- 不复制公司代码、内部文档、生产数据、真实接口、内部域名、私有包名、人员信息和操作手册。
- 不以“只替换名称”的方式发布仍含内部事实的材料；通用问题、解决思路、状态机、步骤顺序、职责划分和能力组合可以保留，不要求为了与来源不同而刻意重排。
- 通用方案可以完整沉淀为问题、设计、Skill 和参考实现，不因来自受限来源或由多个通用细节组成而自动降级为空框架。
- 只有具体内部标识、真实系统拓扑、私有平台行为、配置、数据、权限、专有实现表达、特有阈值或事故结论需要移除、替换或降低公开深度；不能仅以“组合后可能反推”为由排除通用方案。
- 示例、测试和评估数据必须自行构造。
- 外部系统必须通过接口隔离，核心模块不得依赖某一家公司的研发平台。
- 遥测默认关闭或仅保存在本地，不记录 Prompt、工具原始输入输出、邮箱和稳定个人标识。

## 工程约束

- Agent 负责需要理解、判断和权衡的部分；程序负责解析、校验、比较、持久化和结构性门禁。
- 事实、程序推导和 Agent 推断必须分层表达。
- 分析、生成、评审、规划类 Skill 必须有行为评估用例。
- 共享能力只实现一次，上层能力通过依赖复用。
- 未经用户明确要求，不进行 commit 或 push。

具体分级和公开边界见 [`knowledge/public-generalization-policy.md`](knowledge/public-generalization-policy.md)。

## 仓库地图

| 目录 | 职责 |
| --- | --- |
| `specs/` | 当前研发事项的 Spec、Plan、Tasks、Meta 和验证报告 |
| `knowledge/` | 长期稳定事实、设计原因、契约、代码入口和刷新条件 |
| `frameworks/` | 通用问题模型、不变量和职责边界 |
| `skills/` | Agent 可直接执行的能力编排及其 Assets、References 和 Evals |
| `templates/` | 不属于单一 Skill、可供项目复制采用的模板 |
| `blueprints/` | 项目接入、扩展点和未来确定性实现边界 |
| `starter/` | 可复制的最小项目接入骨架与 Integration Manifest |
| `packages/` | Harness、Doctor 和其他确定性参考实现 |
| `adapters/` | 显式注册的开放 Host 与下游基建扩展契约 |
| `docs/` | 能力地图、成熟度、公开规范和总体说明 |
| `pets/` | 与 Agent 工程主体隔离的可选附加资源 |

目录只有存在真实产物时才创建；公司或项目专有 Adapter 保留在采用方仓库，通过公开 Registry 显式注入，不进入本仓。

## Specflow 自举

- 每次仓库相关请求先读取 `specs/` 中全部 `meta.yaml`，按状态和影响范围选择相关 Active 事项；没有相关事项时不要虚构上下文。
- 改变仓库定位、公开契约、目录职责、治理规则，或新增/实质修改 Skill、Framework、Blueprint、Harness、Adapter、Validator 时，建立或继续一个 Spec。
- 不改变语义的错别字、链接、格式修正和单一低风险维护动作通常不要求 Spec，除非现有事项或规则另有要求。
- 范围与完成条件变化写 Spec，技术路径和关键决策变化写 Plan，执行拆分、状态和验证结果写 Tasks。
- `meta.yaml` 是事项生命周期、关系和影响范围的唯一事实来源；Checkpoint 不复制业务状态。
- 归档、取代和取消需要明确授权。Commit、Push、Draft PR/MR、检查错误或 Agent 自述都不能推断终态。
- 不为采用本规则之前的历史批量伪造 Spec、Plan、Tasks、归档回执或验证证据。

当前事项和目录规则见 [`specs/README.md`](specs/README.md)。

## Knowledge 治理

- 执行任务前优先使用 `context resolve` 生成 Active Spec 与 Knowledge 的最小加载计划；不可用时再按 [`knowledge/registry.yaml`](knowledge/registry.yaml) 和 [`knowledge/code-entry-map.yaml`](knowledge/code-entry-map.yaml) 人工解析，不无差别加载全部正文。
- Knowledge 只记录跨任务稳定的事实、设计原因、契约、失败模式和刷新条件，不保存当前任务进度和聊天摘要。
- Specflow 管理当前写模型，Knowledge 管理长期读模型；两者不能复制相同状态。
- 归档前判断是否产生需要 `create`、`update`、`still-valid`、`supersede` 或 `retire` 的长期知识；自动化尚未实现时在 Validation Report 中明确记录结论和证据。
- 发现代码入口、契约或仓库定位变化时，将相关 Knowledge 标记为 `review-required`，不得静默删除。

Knowledge 准入与状态规则见 [`knowledge/README.md`](knowledge/README.md)。

## 工作入口

1. 读取根 `AGENTS.md`。
2. 运行 `node packages/harness/bin/agent-foundation.mjs context resolve --task-type "<任务类型>" --paths <相关路径>`；没有 Harness 时人工读取索引。
3. 按结果加载相关 Active Spec、长期 Knowledge 和代码入口；空结果不生成虚构上下文。
4. 执行范围内工作并同步 Spec、Plan、Tasks 和验证证据。
5. 只有用户明确要求收口时才进入归档；提交、推送和外部操作分别遵循用户授权。
