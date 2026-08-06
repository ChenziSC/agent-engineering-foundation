# Spec：将仓库升级为可快速接入的 Agent 工程治理骨架

## 基本信息

- 事项 ID：`2026-08-05-self-hosted-agent-governance`
- 状态：`In Progress`
- 创建日期：`2026-08-05`
- 影响范围：仓库定位、自举治理、Specflow、Knowledge、未来 Starter 与 Harness

## 输入来源

| 类型 | 引用或摘要 | 日期 | 适用范围 |
| --- | --- | --- | --- |
| 维护者决策 | 仓库应成为任意项目可快速接入的 Agent Harness、Skill 和 AI 工程治理骨架 | 2026-08-05 | 全仓定位 |
| 维护者决策 | 仓库自身必须使用 Spec、Plan、Tasks、验证和 Knowledge 管理后续演进 | 2026-08-05 | 自举治理 |
| 维护者决策 | 受限来源中的 Agent 能力应全部进入非公开盘点；通用且已移除具体内部信息的设计可以完整沉淀，具体表达和实现按权属或许可处理，不因来源一刀切过滤 | 2026-08-05 | 能力覆盖与公开边界 |
| 维护者决策 | 通用解决方案及多个通用细节的组合与排布可以保留，不因来自原仓或可能映射到原仓结构而自动降级；过滤对象是实际内部信息和无复用权的具体表达/实现 | 2026-08-05 | 能力覆盖与公开边界 |
| 当前仓库证据 | README、能力地图、Skill Runtime Blueprint、AI 友好仓库模板和 Specflow Skill | 2026-08-05 | 现状与缺口 |

本公开 Spec 不记录私有来源仓库、内部平台、人员、链接或生产实例。私有来源覆盖只在仓库外管理。

## 背景与目标

当前仓库已经沉淀 Framework、Skill、Blueprint 和模板，但整体仍偏向 Markdown-first 的能力资料库。缺少可以直接复制的 Starter、最小可运行 Harness、自校验以及仓库自身的 Spec/Knowledge 闭环，使用方仍需自行决定如何接入和维护。

目标是把仓库升级为三层同时成立的 Agent 工程治理骨架：

1. Framework 和 Knowledge 解释为什么需要某项能力、解决什么问题以及边界是什么；
2. Starter、Template、Blueprint 和 Skill 让项目可以快速采用；
3. Harness、Validator 和 Adapter 负责可确定执行和检查的部分。

仓库自身必须使用同一套 Specflow、Knowledge 和验证规则管理后续演进，从真实使用中发现设计缺口。

## 非目标

- 本事项不要求一次实现全部未来 Package、Adapter 和领域 Skill；
- 本事项不实现任何公司、供应商或私有平台的真实 Adapter、认证流程或接口调用；
- 不把任何私有仓库的代码、Schema、测试、业务配置或生产实例直接迁入；
- 不绑定单一 Agent、代码托管、Issue、CI、设计或观测平台；
- 不为本仓库已有历史批量伪造 SDD 产物或归档证据；
- 不把文档存在等同于 Harness 已经可运行。

## 用户或调用场景

1. 一个新项目选择最小或标准 Preset，初始化仓库指令、Skill、Specflow 和 Knowledge 骨架，并运行 Doctor 检查接入结果。
2. 仓库维护者新增或实质修改 Skill 时，通过 Spec、Plan、Tasks、Eval 和验证报告追溯设计与结果。
3. 新会话读取 Active Meta，恢复当前工作而不加载全部历史文档。
4. 项目归档研发事项时，冻结交付证据并把长期稳定设计投影到 Knowledge，而不是把当前进度写入长期知识。
5. 外部平台不可用或未配置时，核心治理仍能本地运行，Adapter 返回明确的未执行或阻塞状态。

## 输出与行为契约

- 仓库有明确、公开且一致的快速接入定位；
- `specs/` 是当前事项和交付生命周期的权威目录；
- `knowledge/` 只保存长期稳定事实、设计原因、契约和刷新条件；
- 根 `AGENTS.md` 规定 Spec、Knowledge、低风险小改和外部操作的边界；
- Specflow Skill 包含可执行工作流、模板和行为案例；
- 后续提供 Starter、Harness、Host Adapter、Validator 和 Preset 时，必须保留设计说明和安全边界；
- 所有外部平台集成默认可替换，遥测默认关闭或仅本地。

## 完成条件

- [x] **AC-001** 仓库建立 `specs/` 规则和一个反映当前真实状态的 Active 事项，不伪造历史完成证据。
- [x] **AC-002** 仓库建立 `knowledge/`、Registry 和至少两项长期知识，明确与 Specflow 的单一事实来源边界。
- [x] **AC-003** 根 `AGENTS.md` 可以把后续 Agent 路由到 Active Spec、相关 Knowledge 和正确目录。
- [x] **AC-004** 当前 Specflow Skill 变更被本事项的 Plan、Tasks 和验证报告覆盖。
- [x] **AC-005** README、能力地图、目标仓库设计和成熟度说明与“快速接入骨架”定位一致。
- [x] **AC-006** Specflow 补齐 Provider-neutral 的归档回执、追加式生命周期事件、知识投影和对应 Eval 设计。
- [x] **AC-007** 提供至少一个可复制 Starter 和最小 Harness 接入闭环，能够执行初始化与 Doctor 检查。
- [x] **AC-008** Skill 运行时能够发现、检查、计划安装并安全更新至少一种开放宿主目录。
- [x] **AC-009** 新增公开内容不包含组织专有名称、域名、接口、凭证、人员、真实业务数据或生产实例。
- [x] **AC-010** 最终验证区分已实现、仅设计和未完成内容，不把未运行的能力标记为 `validated`。
- [x] **AC-011** 建立全量能力盘点与分级公开规则，区分通用设计、具体内部信息、表达/实现复用权和权属复核。
- [x] **AC-012** 对受限来源的 Agent 工程结构完成全量覆盖盘点，在仓外保存来源映射，并向公开仓投影不含敏感来源信息的能力问题图谱和缺口。
- [x] **AC-013** 提供 Provider-neutral 的 Integration Manifest 与可注入 Adapter Registry，使采用方可以注册自有 Host 或基建 Adapter，而不修改 Harness 核心解析逻辑；凭证只允许使用不透明引用。
- [x] **AC-014** Manifest 中的字段必须明确标记并实现为执行契约、校验元数据或说明信息；具有安全含义的字段不得只展示而不生效。
- [x] **AC-015** Harness 的 Skill 测试从真实目录动态派生预期结果，新增合法 Skill 不要求手工修改固定名称清单。
- [x] **AC-016** 初始化拒绝穿过项目根及其父路径中的 Symlink 写入，并为已有文件冲突提供不写入的接入计划。
- [x] **AC-017** 仓库敏感检查覆盖文件路径、常见文本文件、工作区、Git 暂存快照、可达历史和不可达对象，并明确二进制与权属仍需人工复核。
- [x] **AC-018** 标记为 `validated` 的 Skill 保存脱敏 Trace Evidence，使评分、阻塞项和摘要可以独立复核。
- [x] **AC-019** 公开能力问题图谱包含长任务 Checkpoint 与恢复，不遗漏私有覆盖台账中的通用能力簇。
- [x] **AC-020** 公开规则不以通用细节的组合、顺序或模块排布推定敏感；仅对实际内部标识、真实拓扑、私有平台行为、配置、数据、权限和专有实现表达设置过滤或授权门禁。
- [x] **AC-021** 公开方案等级与资产成熟度分离；依赖采用方基建的能力保留完整通用流程并标记为适配器型，不再因需要 Adapter 而降级为空框架。
- [x] **AC-022** Specflow 首次终态 Receipt 具备确定性产物摘要、固定规范化 Payload 摘要、不可覆盖写入和回读校验；程序不自行确认授权、不计算未知变更边界，也不先写 Meta 终态。
- [x] **AC-023** Specflow 支持单事项目录内 Receipt、Lifecycle Event 与 Meta 的确定性生命周期：事件序号、摘要和状态链连续，证据先写且 Meta 最后原子更新，Meta 写入中断后可用同一候选恢复。
- [x] **AC-024** Harness 能按任务类型、相关路径、Active Meta、Knowledge Registry 和 Code Entry Map 生成最小上下文加载计划，并通过权威来源摘要检查 Knowledge 新鲜度；摘要变化只触发阻断或复核提示，不自动改写知识正文。
- [x] **AC-025** Context Resolver 对 Active Spec 核心 Markdown 执行可配置的单事项和总全文预算；超限事项确定性降级为 H1–H3 Section Index、规则编号位置与清单完成度，输出不复制正文、不生成摘要，且全文分配顺序不依赖目录遍历偶然性。
- [x] **AC-026** Harness 提供可替换的 Source Control Adapter，并以本地 Git 参考实现从不可变 Base/Source 生成范围化 Merge Candidate 摘要；范围内脏内容、非法版本和合并冲突必须阻断，候选计算不得修改工作树、Index、引用或残留项目 Git 对象。
- [x] **AC-027** Harness 提供 Knowledge Projection 的 Plan/Apply/Verify：按变更路径反向检查 Scope 覆盖，只对已准备正文和 Registry 条目执行确定性状态、来源摘要与取代关系更新，以投影指纹支持幂等复核；程序不得生成正文或替代语义判断。
- [x] **AC-028** Harness 提供 Provider-neutral 的两阶段 Change Gate 首版：完整不可变 Merge Candidate 必须显式关联单个且 Scope 覆盖完整的 Active Spec，或满足一个受控路径型低风险豁免；交付阶段复核 Archived Receipt、Lifecycle 摘要链和最终候选摘要。Include/Exclude 不得缩小关联检查范围，程序不得创建 Commit、确认终态授权或伪装外部交付成功。单 Spec 限制后续由 `AC-041` 取代。
- [x] **AC-029** Repository Doctor 检查 Code Entry Map 的失效起始路径、重复值、同路径纳入/排除矛盾和规则文件预算，并对父子 `AGENTS.md` 的精确重复输出不回显正文的警告；Context Resolver 按请求路径自动加入根级与祖先规则。程序不得把精确文本比较伪装为自然语言语义冲突判断。
- [x] **AC-030** Specflow 对同一 Specs Root 下两个终态事项的父子或取代关系提供可恢复事务：严格校验双方 Event 互反，事务意图和 Event 先写，Meta 逐侧最后投影；任一阶段中断后可用相同候选幂等补齐，且不得把跨文件过程表述为绝对原子写入或完整回滚。
- [x] **AC-031** Specflow 提供完整 Meta v1 Schema 与仓库级只读检查：校验精确字段、状态不变量、产物路径、终态 Receipt/Lifecycle 链、本地关系互反和循环，不根据 Commit 或文件存在推断授权。
- [x] **AC-032** Skill Distribution Manifest 成为可执行白名单：以内容摘要固定源版本，支持项目级 Plan/Apply/Verify，摘要漂移、目标冲突、未知文件和用户修改在写入前阻断；多项 Apply 可重入但不宣称跨目录绝对原子。
- [x] **AC-033** Evidence/Claim 与 Skill Eval 提供零依赖参考实现：Evidence Bundle 校验引用和完整性；Eval Runner 动态读取真实 Case 与脱敏 Trace，执行阻塞优先评分和版本比较，不固定模型或推理强度；Specflow、项目组件治理和自然语言重构均保存正式回放证据。
- [x] **AC-034** 项目组件治理提供技术栈无关的 Registry Validator 子集：检查 Source/路径归属、标准目录登记、Contract、稳定入口、废弃替代项和禁止深路径导入，不把程序结构通过解释为组件值得提升层级。
- [x] **AC-035** Checkpoint 提供 v1 Schema、完整性封存、连续事件校验和恢复计划参考实现；输入漂移、失效引用与非幂等阶段不能被自动重放。
- [x] **AC-036** 增量验证提供变更路径到确定性检查、浏览器场景和人工门禁的显式覆盖矩阵；未覆盖路径、缺失关键场景和失败证据必须阻断通过。
- [x] **AC-037** Web 首屏预请求与性能评审具备平台无关的合成 Evidence 解析器：只从 HAR/Trace 中导出可观察事实，不从网络数据推断主线程或从单次数据承诺收益。
- [x] **AC-038** 安全变更、Design-to-Code 和埋点治理分别提供独立 Skill、Framework/Template 与行为 Eval，外部设计、浏览器和数据平台只通过可替换输入或 Adapter 接入。
- [x] **AC-039** 项目组件治理在显式启用时解析 JavaScript/TypeScript 稳定入口的静态导出与消费者导入，检查 Registry 声明、实际导出、深路径消费和兼容性基线；动态导出与其他语言保持人工复核边界。
- [x] **AC-040** 新增能力被纳入 Distribution、README、能力地图、成熟度、Knowledge 路由和整仓检查；所有测试数据均为合成内容，未宣称外部系统已集成。
- [x] **AC-041** Change Gate 允许完整不可变 Merge Candidate 显式关联一个或多个 Spec，以稳定排序的 Spec 集合参与门禁摘要，并以所有关联 Scope 的并集覆盖实现变更；工作阶段逐项校验 Active 状态，交付阶段逐项复核各自 Receipt/Lifecycle 与同一候选摘要。Spec 集合与受控豁免仍互斥，不要求引入额外交付组或跨事项归档事务。

## 约束

- 技术约束：核心能力必须能在没有私有服务的环境中工作；确定性程序优先使用少量公开依赖。
- 兼容约束：现有 Framework、Skill、Blueprint 和模板继续作为有效资产，重构时保持可追溯入口。
- 权限与安全约束：全局安装、外部写入、提交、推送、PR/MR 和发布分别需要明确授权。
- 数据与隐私约束：遥测默认关闭或仅本地，不采集 Prompt、工具原始输入输出、邮箱和稳定个人标识。

## 风险、假设与待确认项

| 类型 | 内容 | 影响 | 处理方式 | 状态 |
| --- | --- | --- | --- | --- |
| Risk | 把允许复用通用设计误解为可以直接复制无授权的具体文字、代码、Schema、测试或数据 | 权属和泄密风险 | 保留通用解决方案及排布，同时过滤内部事实，并自行编写或确认具体表达与实现的复用权 | open |
| Risk | 一次建设过多 Package 和 Adapter | 过度设计、验证困难 | 先完成 Starter、Doctor、Specflow 和单一 Host 闭环 | open |
| Risk | 文档和实际目录再次漂移 | 使用方得到错误接入结论 | Harness Doctor 与静态检查作为 P0 | open |
| Assumption | Node.js 或等价跨平台运行时可以承载首个参考 Harness | 影响实现技术选型 | 在实现前用最小 Spike 验证，不在本阶段锁死 | open |

## 关联事项

- 父事项：无
- 子事项：后续 Harness、归档 Validator 或领域 Preset 可以按范围拆分新 Spec
- 取代：无
- 被取代：无

## Section Index

| 章节 | 说明 | 何时需要读取 |
| --- | --- | --- |
| 背景与目标 | 新定位和三层产物模型 | 修改 README、目录或能力地图时 |
| 完成条件 | 本轮及后续交付边界 | 规划、执行和验收时 |
| 约束 | 公开、安全和权限要求 | 增加代码、Adapter 或外部集成时 |
