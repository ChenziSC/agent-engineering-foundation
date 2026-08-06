# Tasks：将仓库升级为可快速接入的 Agent 工程治理骨架

## 执行规则

- 每个任务关联 Spec 完成条件或 Plan 章节。
- 范围变化先更新 Spec，技术路径变化更新 Plan。
- `done` 必须有真实产物和验证，不记录 Commit 日记。

## 任务

### T-01 重新评估仓库定位和原能力覆盖

- 状态：`done`
- 依赖：无
- 对应：`AC-005`、`AC-009`
- 输入：当前公开仓、可访问的原能力区域、维护者新定位
- 动作：盘点 Harness、Skill、SDD、Knowledge、Eval、门禁、观测和领域能力，完成敏感性分级。
- 产物：本 Spec 的背景、范围和 Plan 证据。
- 验证：覆盖核心治理底座和可选领域 Skill，区分通用内容、独立重写和排除项。
- 阻塞条件：无。

### T-02 将 Specflow 升级为可使用 Skill

- 状态：`done`
- 依赖：`T-01`
- 对应：`AC-004`
- 输入：现有 Specflow Blueprint、模板和通用 SDD 工作流
- 动作：建立 `skills/specflow/`，加入流程、References、Assets、6 个 Eval Case 和 Rubric，并消除重复模板来源。
- 产物：`skills/specflow/` 及相关 README、能力地图和成熟度更新。
- 验证：Skill 目录通过结构校验；无原项目专用标识；链接和差异通过静态检查。
- 阻塞条件：本任务完成时尚未回放；后续 `T-27` 已补正式回放并升级为 `validated`。

### T-03 让仓库开始使用自身 Specflow 和 Knowledge

- 状态：`done`
- 依赖：`T-02`
- 对应：`AC-001`、`AC-002`、`AC-003`、`AC-004`
- 输入：Specflow Assets、AI 友好仓库模板、当前真实工作区状态
- 动作：建立 `specs/`、当前 Active 事项、`knowledge/`、Registry 和根级路由规则。
- 产物：本事项目录、Knowledge 目录、更新后的 `AGENTS.md` 和 README 入口。
- 验证：状态与真实进度一致；不存在虚假归档；Knowledge 不保存当前任务进度。
- 阻塞条件：无。

### T-03A 建立全量能力盘点与分级公开规则

- 状态：`done`
- 依赖：`T-03`
- 对应：`AC-009`、`AC-011`
- 输入：维护者关于通用价值与公开边界的决策、当前迁移和脱敏规则
- 动作：明确全部受限来源能力进入非公开盘点，并建立公开方案等级、成熟度和表达/实现权属相互独立的判断方式。
- 产物：迁移总览、公开化与权属规范、能力说明模板、来源说明、根级规则和长期 Knowledge。
- 验证：规则明确区分通用价值与公开权；不会因来源一刀切排除，也不会把可复用性当作当然公开的证明。
- 阻塞条件：正式发布前的具体权属和保密义务仍需人工复核。

### T-03B 完成 Agent 工程结构全量覆盖盘点

- 状态：`done`
- 依赖：`T-03A`
- 对应：`AC-005`、`AC-009`、`AC-012`
- 输入：受限来源中 Git 已跟踪的 Agent 指令、Skill、确定性工具、SDD、Knowledge、宿主配置、Hook 和工程门禁
- 动作：逐类建立非公开来源映射和公开等级，确认每个来源 Skill、命令组与治理区域均有处理结论；不读取 Hook 运行数据和历史业务事项正文作为迁移输入。
- 产物：仓外私有覆盖台账、公开的 `docs/08-能力问题图谱.md`、当前 Spec 的审计证据。
- 验证：来源 Skill、命令组和治理基础设施均能映射到公开能力簇；公开图谱不包含来源路径、内部平台、真实案例和实现细节。
- 阻塞条件：结构覆盖完成不等于逐行权属或法律审查；正式发布前仍需人工复核具体产物。

### T-04 补齐 Provider-neutral 的归档治理资产

- 状态：`done`
- 依赖：`T-03`
- 对应：`AC-006`
- 输入：当前 Lifecycle、Validation Report 和公开化与权属规范
- 动作：设计 Archive Receipt、Lifecycle Event、Knowledge Projection、摘要边界、状态最后写和历史不可篡改规则。
- 产物：Specflow References、Assets、Schema 示例和 Eval Case。
- 验证：完全合成案例覆盖首次归档、取消、取代、过期、篡改和失败保持 Active。
- 阻塞条件：不能直接复制任何私有实现或 Schema。

### T-05 更新仓库定位、能力地图和成熟度

- 状态：`done`
- 依赖：`T-03`
- 对应：`AC-005`、`AC-010`
- 输入：本 Spec 和当前目录状态
- 动作：把 Markdown-first 资料库定位升级为设计说明、Starter 和可运行 Harness 并存的治理骨架。
- 产物：README、能力地图、目标仓库设计、成熟度和发布检查清单。
- 验证：目录、Skill 数量、成熟度和未来计划一致。
- 阻塞条件：未实现产物不得写成已交付。

### T-06 建立最小 Starter 与 Harness 闭环

- 状态：`done`
- 依赖：`T-04`、`T-05`
- 对应：`AC-007`、`AC-008`
- 输入：Skill Runtime Blueprint、AI 友好仓库模板和 Specflow
- 动作：实现项目初始化、Doctor、Skill 发现/检查/计划/安装/更新和一个开放 Host Adapter。
- 产物：`starter/`、最小 `packages/`、Host Adapter、测试和合成项目。
- 验证：9 个自动化测试在临时目录覆盖初始化、重复执行、CLI、冲突、受控更新、用户修改保护、Symlink 阻断和失败保持目标不变；`npm test` 于 2026-08-05 通过。
- 阻塞条件：全局安装和未知文件覆盖不进入首个无授权闭环。

### T-07 建立 Harness 质量与公开发布门禁

- 状态：`done`
- 依赖：`T-06`
- 对应：`AC-009`、`AC-010`
- 输入：Starter、Harness、Skill、Knowledge 和文档
- 动作：接入目录一致性、链接、Schema、Skill Eval、敏感信息和成熟度检查。
- 产物：Doctor 检查、CI 示例和最终验证报告。
- 验证：`npm test` 的 10 个场景、`npm run check`、全部 `.mjs` 语法检查和 `git diff --check` 通过；已知敏感标识在工作区与现有 Git 历史中无命中；私有词表命中不回显原词。
- 发布阻塞：适用的权属确认、二进制资源和正式发布前人工复核仍需维护者完成。

### T-08 补齐项目自有基建 Adapter 插槽

- 状态：`done`
- 依赖：`T-07`
- 对应：`AC-013`
- 输入：现有开放 Host Adapter、Skill Runtime Blueprint、能力问题图谱和维护者关于下游基建补全的要求。
- 动作：建立可注入 Adapter Registry、Provider-neutral Integration Manifest、通用状态与凭证引用边界；使用完全合成的第二 Host 验证下游扩展不需要修改 Harness 核心。
- 产物：Adapter Registry、升级后的 Starter Manifest、Infrastructure Adapter Blueprint、合成模板和自动化测试。
- 验证：12 个自动化场景全部通过；默认 Host 保持兼容，合成 Host 通过注入完成 Plan、Install 与 Doctor；重复、未注册、非法配置引用和越界路径得到稳定错误或警告。
- 阻塞条件：真实公司 Adapter、认证 SDK、动态插件加载、用户级安装和外部网络调用不进入本任务。

### T-09 收紧 Manifest 与初始化安全契约

- 状态：`completed`
- 依赖：`T-08`
- 对应：`AC-014`、`AC-016`
- 输入：Starter Manifest、Harness 初始化逻辑和已有项目冲突行为。
- 动作：明确执行/校验/说明字段，验证项目级安全不变量，阻断父路径 Symlink，并增加只读接入计划。
- 产物：Harness、CLI、Starter/Adapter 说明和自动化测试。
- 验证：合成父路径 Symlink 不产生写入；已有项目冲突计划不修改目标；Manifest 安全字段与实际行为一致。

### T-10 让 Skill 测试随真实目录演进

- 状态：`completed`
- 依赖：`T-09`
- 对应：`AC-015`
- 输入：真实 `skills/` 目录和当前发现测试。
- 动作：从真实目录动态派生 Skill 名称，不把当前数量或名称写死为能力契约。
- 产物：更新后的 Harness 测试。
- 验证：并行开发中的合法第五个 Skill 不再仅因数量变化导致发现测试失败。

### T-11 扩展敏感信息与 Git 对象检查

- 状态：`completed`
- 依赖：`T-09`
- 对应：`AC-017`
- 输入：当前 Repository Check、发布清单和 Git 仓库边界。
- 动作：扫描路径和更完整文本集合，增加工作区、暂存、可达历史与不可达对象模式，并保持私有词不回显。
- 产物：Harness、CLI 参数/报告、测试和发布说明。
- 验证：合成敏感文件名、`.env`/脚本、暂存内容和 Git 对象均可被发现；二进制语义限制保持可见。

### T-12 保存脱敏行为 Trace Evidence

- 状态：`completed`
- 依赖：`T-10`
- 对应：`AC-018`
- 输入：两个 Web Skill 的 Case、Rubric、Run Report 和现有输出摘要。
- 动作：保存不含会话、路径、模型、业务环境和工具原文的逐 Case 可复核证据，并从 Run Report 建立链接。
- 产物：两个 Skill 的 `evals/traces/` 与更新后的运行报告。
- 验证：每个分数、状态和阻塞结论能追溯到 Case 与脱敏观察；不伪造已丢失的原始工具 Trace。

### T-13 补全 Checkpoint 与既有项目接入说明

- 状态：`completed`
- 依赖：`T-11`
- 对应：`AC-016`、`AC-019`
- 输入：Checkpoint Framework、私有覆盖台账、公开问题图谱和接入命令。
- 动作：补充 Checkpoint 问题行和已有项目只读 Plan/人工合并路径。
- 产物：问题图谱、README/Blueprint 和 CLI 使用说明。
- 验证：31 个私有通用能力簇均有公开处理结论；已有项目不需要通过覆盖文件才能理解接入步骤。

### T-14 修正通用组合的公开判断规则

- 状态：`completed`
- 依赖：`T-13`
- 对应：`AC-020`
- 输入：维护者对原仓通用解决方案复用边界的明确决策。
- 动作：移除“多个通用细节组合后即可能敏感”的默认推定，允许保留通用流程、顺序、职责和模块排布；继续过滤实际内部事实，并区分通用设计与具体表达/实现的复用权。
- 产物：根规则、公开规范、长期 Knowledge、来源说明、能力模板和仓外覆盖台账。
- 验证：公开规则不再要求为了区别来源而重排通用方案，也未放宽内部标识、真实拓扑、私有平台行为、配置、数据、权限和专有实现表达的门禁。

### T-15 分离公开方案等级与成熟度

- 状态：`completed`
- 依赖：`T-14`
- 对应：`AC-021`
- 输入：整仓复核结论、当前公开图谱、能力说明、Skill Eval 契约和仓外覆盖台账。
- 动作：用公开方案深度替代“重建方式”分类；重新判定 Adapter 依赖能力；修正过期成熟度和覆盖状态；移除 Eval 对具体模型与推理强度的配置要求。
- 产物：根规则、公开规范、能力地图与问题图谱、能力说明、Eval 模板、长期 Knowledge 和仓外覆盖台账。
- 验证：旧等级无残留；Web 两项能力说明与 `validated` 一致；Eval 继承调用环境选择；台账中的已实现能力不再标记为待规划。

### T-16 实现首次终态 Receipt 完整性子集

- 状态：`completed`
- 依赖：`T-15`
- 对应：`AC-022`
- 输入：Archive Receipt Schema、收口顺序、不可覆盖与状态最后写规则。
- 动作：为 Specflow 增加零运行时依赖的 YAML 子集解析、规范化摘要、产物摘要、Receipt Seal/Verify、排他写入和回读校验；不自动修改 Meta。
- 产物：`skills/specflow/scripts/archive-receipt.mjs`、合成测试、更新后的 Skill/Reference/Blueprint/能力说明和成熟度表。
- 验证：首次 Seal、相同候选幂等、候选冲突、产物篡改、Archived Blocker 和路径安全得到确定性结果。

### T-17 实现本地 Lifecycle Event 与 Meta 状态最后写

- 状态：`completed`
- 依赖：`T-16`
- 对应：`AC-023`
- 输入：已验证 Receipt、Lifecycle Event Schema、状态转换与故障恢复规则。
- 动作：在同一零依赖脚本中增加连续 Event 摘要链、排他追加、单事项关系前置校验、Meta 锁内原子替换和同候选恢复；授权仍由 Agent/人工先行确认，跨事项双向关系不伪装成单目录事务。
- 产物：扩展后的 `archive-receipt.mjs`、17 个 Specflow 合成测试，以及同步后的 Skill、Reference、Blueprint、能力说明、Knowledge 和成熟度文档。
- 验证：Receipt 与 Event 都遵循证据先写、Meta 最后写；Event 跳号、文件名不一致、链篡改、候选差异、关系前置值变化和链尾未投影均阻断；模拟 Meta 写入失败后可用同一候选恢复。

### T-18 补充确定性 Context 与 Knowledge 新鲜度检查

- 状态：`completed`
- 依赖：`T-17`
- 对应：`AC-024`
- 输入：Active Meta、Knowledge Registry、Code Entry Map、Starter 与 Doctor 现有契约。
- 动作：增加 YAML/JSON 索引解析、Registry/引用/项目内路径校验、权威来源摘要检查，以及按任务类型和相关路径生成最小加载计划的只读命令；接入项目 Doctor 和仓库检查。
- 产物：Harness/CLI/测试、Registry `source_evidence`、Starter/README/Blueprint/Knowledge/能力说明和成熟度更新。
- 验证：空 Starter 返回空上下文；合成 Active Spec 与 Knowledge 被正确选择；权威来源变化会使 `current` 条目检查失败；命令不读取或拼接全部正文，也不自动改写状态。

### T-19 实现 Context 全文预算与 Section Index

- 状态：`completed`
- 依赖：`T-18`
- 对应：`AC-025`
- 输入：Active Spec 核心 Markdown、Starter Manifest 和 Context Resolver 现有加载计划。
- 动作：增加受校验的单事项/总全文预算与单产物索引上限；按事项体量和 ID 确定性分配全文预算，超限时从原文生成 H1–H3 行区间、字节数、规则编号位置和清单完成度，不生成摘要。
- 产物：Harness/测试、Starter/Manifest 示例、README、Blueprint、Knowledge、能力说明和成熟度更新。
- 验证：两个合成 Active Spec 分别触发总预算与单事项预算降级；Section Index 与真实标题和行号一致；降级事项不进入全文 `loadPlan`；非法 Manifest Context 被 Doctor 阻断。

### T-20 实现本地 Git Merge Candidate 变更摘要 Provider

- 状态：`completed`
- 依赖：`T-19`
- 对应：`AC-026`
- 输入：Receipt 的 Provider-neutral 版本边界/变更摘要契约、Adapter Registry 和 Harness CLI。
- 动作：增加可替换 Source Control Adapter 接口与本地 Git 实现；解析不可变 Base/Source，在临时对象库中计算 Merge Candidate，按显式 Include/Exclude 范围对稳定排序的路径和候选对象 ID 生成摘要，状态只作为复核证据；不执行 Stage、Commit、Push 或引用写入。
- 产物：`adapters/source-control/local-git.mjs`、Harness API/CLI/合成测试，以及同步后的 Skill、Reference、Blueprint、Knowledge、能力图谱和成熟度文档。
- 验证：摘要重复计算一致；Rename 保留旧/新路径和候选对象；排除范围内的脏文件不影响摘要，纳入范围的脏文件阻断；未知 Provider 与合并冲突明确失败；CLI 与 API 输出一致。

### T-21 实现 Knowledge Projection Registry 更新器

- 状态：`completed`
- 依赖：`T-20`
- 对应：`AC-027`
- 输入：Knowledge Projection Schema、Registry、Code Entry Map、权威来源摘要和 Specflow 收口顺序。
- 动作：增加 Plan/Apply/Verify API 与 CLI；按显式变更路径反向命中 Scope；验证已准备正文、动作、退役路由和取代关系；在排他锁内原子更新 Registry，并以 `last_projection` 决策指纹保证幂等复核。
- 产物：Harness/CLI、Registry 扩展校验、20 个 Harness 合成测试，以及同步后的 Specflow、Blueprint、Knowledge、能力地图和成熟度文档。
- 验证：`create` 从 `review-required` 进入 `current` 后可重复应用并独立 Verify；命中 Scope 的 `impact: none`、遗漏决策和仍被路由的退役知识阻断；`supersede` 目标、来源摘要与 Registry 关系通过 Knowledge Check。
- 边界：正文、动作与业务正确性由 Agent/人工判断；程序不生成 Knowledge 内容，未传变更路径时保留覆盖警告。

### T-22 实现事项—变更关联与交付门禁

- 状态：`completed`
- 依赖：`T-20`、`T-21`
- 对应：`AC-028`
- 输入：本地 Git Merge Candidate、Active/Archived Meta、Receipt/Lifecycle 证据和低风险变更分流原则。
- 动作：增加 Provider-neutral Change Gate API/CLI；首版完整候选只接受显式单 Spec 或受控路径型豁免；工作阶段校验 Active Scope，交付阶段复核 Archived Receipt、Lifecycle 链和最终候选摘要。单 Spec 限制后续由 `T-34` 修正。
- 产物：Harness/CLI、Change Gate Reference、收口清单、3 个合成门禁测试，以及同步后的 Specflow、Knowledge、能力图谱和成熟度文档。
- 验证：错误 Scope、双重关联、未知或混合豁免、脏工作区、过早交付和 Receipt 摘要漂移均阻断；合法 Spec 关联和纯文档豁免通过；Include/Exclude 不缩小关联候选。
- 边界：程序不创建 Commit、不确认终态授权、不检查外部 PR/MR 或部署；Owner Override 和其他版本控制 Provider 由采用方策略层扩展。

### T-23 补强 Repository Doctor 的规则与导航检查

- 状态：`completed`
- 依赖：`T-18`、`T-19`
- 对应：`AC-029`
- 输入：Code Entry Map、根级/模块 `AGENTS.md`、Manifest Context 预算和 AI 友好仓库分层原则。
- 动作：增加可配置单规则文件预算、失效起始路径、路由数组重复、同路径纳入/排除矛盾和父子规则精确重复检查；Context 按请求路径自动发现根级与祖先规则。
- 产物：Harness、Starter Manifest、2 个合成测试，以及同步后的 AI 友好仓库模板、Knowledge、能力图谱和成熟度文档。
- 验证：祖先规则进入加载计划；精确重复产生不回显正文的稳定指纹警告；结构矛盾、失效入口、重复值和超预算规则阻断 Doctor。
- 边界：不使用关键词或模型自动裁决自然语言规则冲突，不自动删除、合并或改写规则。

### T-24 实现双终态事项关系事务

- 状态：`completed`
- 依赖：`T-17`
- 对应：`AC-030`
- 输入：双方已验证 Receipt/Event 链、Meta 链尾、明确授权和父子/取代关系变化候选。
- 动作：增加 Relation Transaction 候选与不可覆盖事务意图；严格验证双方 Event 互反，先 Seal 双侧 Event，再逐侧投影 Meta，并以同一候选支持任一阶段幂等恢复。
- 产物：Relation Transaction 模板、Schema、脚本命令、6 个跨事项合成测试，以及同步后的 Skill、Reference、Blueprint、Knowledge、能力说明和自举文档。
- 验证：父子与取代关系成功；单侧或夹带变化在落证据前阻断；第二侧 Event 或 Meta 失败后 Verify 报告未完成，重跑补齐并最终通过；崩溃遗留锁可接管且存活进程锁不被覆盖。
- 边界：只支持同一 Specs Root 下两个终态事项；跨文件 Meta 投影可能出现可诊断中间态，不承诺绝对原子可见性；Active/多事项/跨仓库和远端平台事务未实现。

### T-25 完成 Meta Schema 与仓库级关系检查

- 状态：`completed`
- 依赖：`T-24`
- 对应：`AC-031`
- 动作：冻结完整 Meta v1 Schema，把精确结构、产物路径、终态链、本地关系互反和循环检查接入 Harness、Doctor 与 CLI。
- 产物：Meta Schema、`specflow check`、Harness 实现和测试。
- 验证：当前两项 Spec 的 Meta 与关系通过；非法结构、悬空产物、单边关系和循环由确定性检查阻断。

### T-26 实现 Distribution Manifest 执行契约

- 状态：`completed`
- 依赖：`T-10`、`T-25`
- 对应：`AC-032`
- 动作：增加可分发白名单、内容摘要锁定、全量 Plan、项目级 Apply 和独立 Verify，复用已有安全安装/更新原语。
- 产物：`distribution/`、Harness API/CLI、Blueprint 和合成测试。
- 验证：合成 Skill 完成 Plan/Apply/Verify 与重复幂等；源摘要漂移在任何新增写入前阻断。

### T-27 实现 Evidence/Claim 与通用 Skill Eval

- 状态：`completed`
- 依赖：`T-12`
- 对应：`AC-033`
- 动作：实现 Evidence Bundle 完整性与引用校验、动态 Case Runner、阻塞优先 Scorer、版本比较器；为三项 Skill 保存脱敏回放 Trace 和评分配置。
- 产物：`frameworks/evidence/`、`frameworks/skill-eval/`、三项 Skill 的 `evals/replay.json` 与 Trace。
- 验证：Evidence 篡改/悬空引用阻断；Eval 遗漏 Case、缺失 Evidence 和阻塞级回归阻断；三项回放共 26 个 Case 全部可重算通过。

### T-28 实现项目组件 Registry Validator

- 状态：`completed`
- 依赖：`T-27`
- 对应：`AC-034`
- 动作：实现技术栈中立的 Registry、Source、标准目录、Contract、稳定入口、废弃替代项和深路径导入检查，并接入可选 Doctor 与 CLI。
- 产物：Validator、Schema、配置/Registry 模板、说明和合成测试。
- 验证：合法项目通过；未登记标准组件、深路径导入和无替代项废弃组件阻断。

### T-29 实现 Checkpoint Core

- 状态：`completed`
- 依赖：`T-27`
- 对应：`AC-035`
- 动作：冻结 Checkpoint v1，增加内容摘要、连续 Event、引用状态和恢复计划的零依赖参考实现。
- 产物：`frameworks/checkpoint/` Schema、模板、Script 和测试。
- 验证：合成 Run 覆盖继续、重验、人工确认、篡改与断序。

### T-30 实现增量验证与 Web 证据子集

- 状态：`completed`
- 依赖：`T-29`
- 对应：`AC-036`、`AC-037`
- 动作：增加路径覆盖矩阵、浏览器关键场景、HAR/Trace Observation 解析和预请求资格门禁。
- 产物：`frameworks/change-validation/`、Web Skill Scripts、模板和测试。
- 验证：合成输入覆盖未映射变更、失败场景、契约漂移和证据边界。

### T-31 实现安全变更、Design-to-Code 与埋点治理

- 状态：`completed`
- 依赖：`T-30`
- 对应：`AC-038`
- 动作：为三类真实工程问题补充独立 Framework、Skill、模板和行为 Eval。
- 产物：三个能力目录及其合成案例。
- 验证：Skill 检查通过，外部平台能力明确保留 Adapter 边界。

### T-32 增强项目组件语言级检查

- 状态：`completed`
- 依赖：`T-31`
- 对应：`AC-039`
- 动作：在显式配置下解析 JavaScript/TypeScript 静态导出与消费，比较兼容性基线。
- 产物：Validator、Schema、模板、文档与测试。
- 验证：合成项目覆盖导出缺失、深路径消费与破坏性变化。

### T-33 完成新增能力自举投影与整仓验证

- 状态：`completed`
- 依赖：`T-32`
- 对应：`AC-040`
- 动作：更新 Distribution、README、能力地图、成熟度、Knowledge 与验证报告，运行全部门禁。
- 产物：导航、注册表、验证证据和未证明边界。
- 验证：`npm test`、`npm run check`、Specflow、Distribution 和 Knowledge 检查通过。

### T-34 让 Change Gate 支持多 Spec 候选

- 状态：`completed`
- 依赖：`T-22`
- 对应：`AC-041`
- 输入：一条分支或 Merge Candidate 同时承载多个独立产品/技术事项的真实工程场景。
- 动作：让 CLI 重复接收 `--spec-id`，把关联项规范化为稳定集合，以 Scope 并集覆盖完整实现变更，并在交付阶段逐项复核所有关联事项；不新增 Delivery Group 或归档事务模型。
- 产物：Harness API/CLI、Change Gate Reference、Skill/能力说明和合成测试。
- 验证：单 Spec 保持兼容；遗漏任一关联事项时未覆盖代码和事项目录阻断；多 Spec 的互补或重叠 Scope 均可覆盖；Spec 与豁免混用仍阻断。

### T-35 修复全仓自然语言审计发现的事实漂移

- 状态：`completed`
- 依赖：`T-34`
- 对应：`AC-042`
- 输入：全仓自然语言审计发现的 Knowledge 元数据双写、迁移总览遗漏、成熟度标签漂移、正式回放名称重复维护和宠物资源来源证据不足。
- 动作：确立 Registry 的易变元数据所有权；补齐迁移演进说明；逐项读取能力目录中的实现、测试、Case、Trace 与 Replay 后修正图谱成熟度，并消除确定性测试与正式行为回放的标签重叠；把正式回放清单改为动态核对规则；增加不含敏感材料的宠物资源来源记录。
- 产物：Knowledge 规则与正文、迁移总览、能力问题图谱、目标设计、发布清单、公开来源说明和宠物来源记录。
- 验证：成熟度与对应目录证据逐项复核；旧元数据字段和重复名称清单无残留；Knowledge、Specflow、Repository Check、全量测试、链接、摘要和敏感扫描通过。

## 验收任务

### V-01 完成条件复核

- 状态：`done`
- 依赖：`T-35`
- 动作：逐项检查 AC-001～AC-042，并区分已实现、已设计和未完成。
- 产物：`validation-report.md`
- 验证：AC-001～AC-042 均映射到文件、自动化测试、行为 Trace、规则复核或结构审计证据；人工发布与终态授权不由技术验收推断。
