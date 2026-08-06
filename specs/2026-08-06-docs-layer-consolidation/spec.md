# Spec：收敛 Docs 与仓库结构分层

## 基本信息

- 事项 ID：`2026-08-06-docs-layer-consolidation`
- 创建日期：`2026-08-06`
- 事项状态、关系和影响范围以 [meta.yaml](meta.yaml) 为唯一事实来源。

## 输入来源

| 类型 | 引用或摘要 | 日期 | 适用范围 |
| --- | --- | --- | --- |
| 用户输入 | 同意取消重复的能力说明层，并要求修改后使用 `refactor-natural-language-content` 重新审计 | 2026-08-06 | `docs/`、README 与相关 Knowledge |
| 用户输入 | 同意按全仓审计建议继续治理：取消 Docs 编号、迁移 Pet、下沉 Harness 说明、拆分共享 Web Evidence，并设计确定性核心与 Skill Distribution 依赖契约 | 2026-08-06 | 全仓目录结构及其内容 |
| 用户输入 | 同意按 Agent Host 原生能力重新收敛仓库；要求保留字段级语义切片的问题价值，并新增规则禁止包装 Harness Agent 已有的基础行为 | 2026-08-06 | 仓库定位、能力准入、Context、Skill 发布和成熟度 |
| 用户输入 | 要求 Context Resolver 依照原仓聚焦新会话恢复，不在同一任务的每个后续请求中机械重复执行 | 2026-08-06 | Specflow 自举、Starter、Context 与相关 Skill |
| 用户输入 | 确认 `project-context-bootstrap` 应聚焦存量项目知识候选推导，并同意移除公开 Slice 模式、重新审计当前 Skill | 2026-08-06 | Context Bootstrap Skill、模板、Eval、成熟度和相关 Knowledge |
| 用户输入 | 明确无 Harness 不是长期降级模式；未 Harness 化项目应先使用本仓只读计划，再生成项目特有候选、审核并完成 Harness 化 | 2026-08-06 | 项目接入顺序、Bootstrap Case 03、Harness 与采用模板 |
| 用户输入 | 明确要求提交并推送当前实现；提交 `c9bb70d` 已推送至 `origin/main`，但该授权不能推断归档授权 | 2026-08-06 | 当前不可变实现候选与生命周期事实 |
| 用户输入 | 要求基于本 Spec 主线深入 Review 整个仓库，并按 Review 顺序连续修复 | 2026-08-06 | Spec Scope、Context Resolver、Knowledge 路由、能力投影与最终验证 |
| 用户输入 | 明确要求对 Review 修复执行 Commit、Push 和归档 | 2026-08-06 | 最终不可变候选、两阶段 Change Gate、Archive Receipt 与终态转换 |
| 参考材料 | 《人机协作的 AI Native 实践：复杂业务的工程化落地》公开可泛化的问题模型 | 2026-08-06 | 高密度上下文、存量提取、字段级正反向切片和人机边界；不复制内部实现与案例 |
| 仓库证据 | 22 个 Docs 文件、反向引用、Framework/Skill/Template/Blueprint 权威产物 | 当前工作树 | 文档职责和唯一事实来源 |

## 背景与目标

`docs/能力说明/` 的 13 篇文件重复维护了能力触发、契约、职责、成熟度和缺口；`docs/00`、`docs/03`、`docs/04` 又分别与历史 Spec、公开泛化 Knowledge 和模板职责重叠。本事项先把唯一内容迁入对应权威层，保留六个面向读者的核心 Docs 入口；随后继续处理全仓审计发现的结构债务。进一步复核主流 Agent Host 后，发现原依赖契约又把 Skill 安装、Capability 协商、通用 Hook 和用户级状态等宿主原生职责规划进本仓，同时把提示词驱动的任务调研与字段级 AST 语义切片混称为同一能力。最终目标是保留真实治理增量，删除或降级宿主已覆盖、没有直接消费者或没有确定性实现的内容。

## 非目标

- 不删除仍有直接消费者或独立验证价值的 Framework、Skill、Template、Blueprint、Schema、测试或 Eval；无人消费且只制造完成感的资产可以在保留有效原则后删除。
- 不改写 Archived Spec、Receipt 或 Lifecycle Event。
- 不改变已有实现事实；发现名称或成熟度外推超过 Evidence 时必须修正投影。
- 未获得对应授权时不执行本仓 Commit、Push 或归档；本事项后续 Commit/Push 已单独获得授权并完成，归档仍未授权。
- 不在本轮改变既有 CLI 命令和对外数据契约。

## 输出与行为契约

- `docs/` 只保留能力导航、目标结构、成熟度投影、发布检查、来源声明和问题图谱。
- 稳定公开治理原则进入 Knowledge；执行契约继续由 Framework、Skill、Blueprint 和 Template 拥有。
- 能力地图和成熟度文档直接指向权威资产，不再经过第二套完整能力说明。
- 删除文件的当前有效引用必须更新；Archived 产物保持不可变。
- Docs 文件名不再表达不存在的阅读顺序；历史归档证据中的旧路径保持不变。
- 根 README 只承担定位、快速开始和入口，完整 Harness 命令与边界由包级 README 拥有。
- 确定性代码依赖方向、可分发 Skill 的自包含边界和运行时依赖声明必须有唯一长期契约。
- 通用 Web Evidence 与 Prefetch 判断分属不同 Framework；现有 CLI 行为保持兼容。
- Pet 资源迁入维护者独立 GitHub 仓库，本仓当前内容、规则、导航和扫描路由不再包含 Pet。
- 新能力必须说明宿主基线、增量缺口、直接消费者、验证和删除条件；通用 Agent 基础行为不能单独形成仓库能力。
- Skill/Plugin 安装、权限、Sandbox、Hook、MCP、会话和通用代码探索归 Agent Host；本仓 Distribution 只拥有发布白名单、内容摘要和现有项目级兼容安装。
- 当前 `project-context-bootstrap` 只负责存量项目规则、稳定契约、Knowledge 与代码入口候选；普通任务代码调研由 Agent Host 原生能力和当前 Spec 承担，不作为独立 Skill 模式。
- 字段级 AST 正反向切片保留为需要真实语言 Adapter 和增益验证的独立候选，不由 Bootstrap 的提示词或回放替代。
- `context resolve` 的强制触发收敛为新会话首次仓库请求；同一会话、分支和任务范围内复用结果，只在分支、Active 事项集合、任务目标或相关路径显著变化及显式刷新时重新执行。
- “新会话上下文恢复”与 `project-context-bootstrap` 的“存量项目接入”保持分层命名，不能因共享 `bootstrap` 词根而混为同一工作流。
- 未 Harness 化是存量项目的接入前状态，不是需要长期维护的 fallback；顺序是只读 `init plan`、Bootstrap 候选、维护者审核、授权后 `init` 或人工合并，完成后由 `context resolve` 承担新会话恢复。

## 完成条件

- [x] **AC-001** `docs/能力说明/`、`docs/00`、`docs/03`、`docs/04` 不再作为当前文档层存在，唯一有效内容已迁移或由既有权威资产覆盖。
- [x] **AC-002** `docs/` 保留的六个文件职责互斥且入口完整，README 不再链接被删除内容。
- [x] **AC-003** 公开泛化政策、Knowledge Registry 和 Code Entry Map 使用新的权威来源与路由。
- [x] **AC-004** 能力地图与成熟度说明能够直接导航到各能力的 Framework、Skill、Template 或 Blueprint。
- [x] **AC-005** 使用 `refactor-natural-language-content` 完成删除后的全仓深层复审，旧标题、旧路径、语义重复、术语漂移和失效引用均有结论。
- [x] **AC-006** Knowledge Projection、仓库检查、全量测试和 `git diff --check` 通过。
- [x] **AC-007** 六个并列 Docs 使用无编号文件名，所有当前有效入口和路由已更新；Archived 证据未改写。
- [x] **AC-008** README 收敛为仓库入口，Harness 命令和执行边界迁入 `packages/harness/README.md`，Adapter 本地入口补齐。
- [x] **AC-009** Pet 独立仓完成创建、初始提交和推送，文件摘要与原资源一致；本仓不再存在 Pet 文件、目录、规则或当前文档引用。
- [x] **AC-010** 确定性核心与 Skill Distribution 依赖契约进入长期 Knowledge，并明确允许依赖、禁止反向依赖、可分发包边界和迁移策略。
- [x] **AC-011** Harness 在单一 Package 内按现有职责拆分最小模块；共享 Web Evidence 从 Prefetch Framework 分离，既有 CLI 和测试保持兼容。
- [x] **AC-012** 结构变更后重新执行 `refactor-natural-language-content` 全仓深层审计、Knowledge Projection、仓库检查、全量测试和差异检查。
- [x] **AC-013** 根规则和长期 Knowledge 提供可判定的能力准入门禁，明确禁止把宿主基础行为包装成独立 Skill、Framework、Blueprint 或 Runtime。
- [x] **AC-014** Skill Runtime/Distribution 定位收敛为发布白名单、Host 原生接入与现有项目级兼容实现，不再把 Manifest v2、Capability Registry、用户级安装或通用 Hook 作为建设缺口。
- [x] **AC-015** Context Bootstrap、任务调研与字段级语义切片分层命名；当前 Skill/Eval 的成熟度不再暗示 AST、完整数据流或运行态分析已经实现。
- [x] **AC-016** 新规则实施后，当前内容不存在无消费者 Capability Registry 模板，Knowledge Projection、仓库检查、全量测试、Skill Check/Eval 一致性和差异检查通过。
- [x] **AC-017** 根规则、Starter、Specflow Blueprint 与 Skill Reference 使用一致的新会话首次恢复和刷新语义，同一任务的后续请求不再机械触发 `context resolve`。
- [x] **AC-018** `project-context-bootstrap` 明确区分存量项目接入与新会话恢复；自然语言复审、Skill/Distribution/Repository Check、全量测试和差异检查通过。
- [x] **AC-019** `project-context-bootstrap` 的触发、步骤、模板和 Agent 元数据只面向存量项目知识候选推导，不再提供公开 `slice` 模式或普通任务调研入口。
- [x] **AC-020** Bootstrap 输出使用 `ready-for-review`、`partial`、`blocked`，新候选不得标为 `approved`；行为案例全部覆盖 Bootstrap，失真的旧正式回放被移除，当前成熟度诚实标为 `usable`。
- [x] **AC-021** Skill 校验、Distribution 摘要、Knowledge Projection、仓库检查、全量测试、自然语言复审和差异检查通过。
- [x] **AC-022** Skill、Case 03、报告模板和采用入口将未 Harness 化项目表达为 Harness 化接入前阶段，不再把“缺少 Harness 时长期降级执行”作为能力或验证目标。
- [x] **AC-023** `init plan`、Bootstrap、人工审核、授权写入和后续 Resolver 的职责顺序一致；Skill/Distribution/Projection/Repository Check、全量测试和差异检查通过。
- [x] **AC-024** Active Spec Scope 覆盖最终 Merge Candidate 的全部实现路径，工作态 Change Gate 不再返回范围遗漏。
- [x] **AC-025** `context resolve --paths .` 将项目根视为全仓范围并加载相关 Active Spec、Knowledge 与根规则；具体路径行为保持兼容并有回归测试。
- [x] **AC-026** 修改根 `AGENTS.md` 时，仓库定位任务路由能够加载 `repository-positioning`、`deterministic-core-boundary`、`self-hosted-governance` 和 `public-generalization-policy`。
- [ ] **AC-027** 能力地图和问题图谱明确区分 Host 原生任务调研、仓库 Context Resolver 与尚未实现的语义切片候选；Projection、全量测试、深度扫描和 Change Gate 通过。

## 风险与约束

| 类型 | 内容 | 处理 |
| --- | --- | --- |
| Risk | 删除历史入口导致当前链接失效 | 删除前做反向引用清单，删除后全仓反向搜索和链接检查 |
| Risk | 把摘要误当重复正文删除 | 只删除承担第二事实源的完整说明，保留 01/05/08 的读者任务 |
| Risk | 稳定公开原则随 docs/03 丢失 | 先迁入 `knowledge/public-generalization-policy.md` 再删除 |
| Constraint | Archived 事项不可改写 | 历史 Scope 和非链接文本保留原样 |
| Risk | Skill 自包含与共享核心抽取相冲突 | 先定义依赖契约；本轮只抽取不影响独立分发的共享模块 |
| Risk | Pet 迁移中丢失二进制或来源记录 | 新仓 Push 后按 SHA-256 和远端树验证，再删除本仓内容 |
| Risk | 代码拆分改变 CLI 行为 | 保持导出和命令不变，以 81 项既有测试为回归门禁 |
| Risk | 以“宿主已支持”为由误删领域增量 | 分别比较原生通用行为与领域不变量、确定性和外部接入，不以工具存在代替能力等价 |
| Risk | 字段级切片再次被提示词实现冒名 | 名称、成熟度和 Eval 必须区分 Agent 调研与语言 Adapter 支撑的语义切片 |
| Risk | 把会话内复用误解为永久缓存 | 不写磁盘会话状态；分支、Active 事项集合、任务目标、相关路径或显式刷新触发重新解析 |

## Section Index

| 章节 | 用途 |
| --- | --- |
| 背景与目标 | 理解为何取消能力说明层 |
| 输出与行为契约 | 判断新的目录与权威边界 |
| 完成条件 | 实施和复审验收 |
