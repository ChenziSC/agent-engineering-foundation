# Validation Report：将仓库升级为可快速接入的 Agent 工程治理骨架

## 结果

- 事项 ID：`2026-08-05-self-hosted-agent-governance`
- 检查日期：`2026-08-06`
- 结果：`pass`
- 发布状态：`not-authorized`

本报告记录当前进度，不构成归档或完成声明。

## 完成条件映射

| 完成条件 | Task | Evidence | 结果 |
| --- | --- | --- | --- |
| AC-001 | T-03 | `specs/README.md`、当前事项目录和 `meta.yaml` | pass |
| AC-002 | T-03 | `knowledge/README.md`、Registry 和长期知识 | pass |
| AC-003 | T-03 | 根 `AGENTS.md` | pass |
| AC-004 | T-02/T-03 | `skills/specflow/` 和本事项 Plan/Tasks | pass |
| AC-005 | T-01/T-05 | README、能力地图、目标仓库设计、成熟度与发布清单 | pass |
| AC-006 | T-04 | Specflow Archive Reference、3 组契约模板与 JSON Schema、收口清单和 Case 07～12 | pass |
| AC-007 | T-06 | `starter/minimal/`、初始化/Doctor CLI 和临时项目自动化测试 | pass |
| AC-008 | T-06 | Skill 发现/检查/计划/安装/更新、内容摘要、受管状态和 `adapters/open-agent/` | pass |
| AC-009 | T-01/T-07 | 仓库检查、仓外已知词模式对工作区与现有 Git 历史的扫描均无命中 | pass |
| AC-010 | T-05/T-07/T-08/T-16～T-34 | 成熟度表、README、目标结构和本报告与真实实现及 80 个测试一致 | pass |
| AC-011 | T-03A | 迁移总览、公开化与权属规范、能力模板、根级规则和 `public-generalization-policy` Knowledge | pass |
| AC-012 | T-03B | 仓外私有覆盖台账和 `docs/08-能力问题图谱.md`；公开仓仅保存通用投影 | pass |
| AC-013 | T-08 | `adapters/registry.mjs`、Manifest v2、Infrastructure Adapter Blueprint、合成配置和自定义 Host 端到端测试 | pass |
| AC-014 | T-09 | Manifest 执行/校验/说明字段分层，`metadata` 受限校验，`safety` 不变量测试 | pass |
| AC-015 | T-10 | Skill 测试从 `skills/` 真实目录动态派生名称 | pass |
| AC-016 | T-09/T-13 | `init plan`、冲突计划和父路径 Symlink 零写入测试 | pass |
| AC-017 | T-11 | 无扩展名、路径、暂存区、可达历史、Reflog 和不可达对象扫描；私有词不回显测试 | pass |
| AC-018 | T-12 | 两个 Web Skill 共 10 个逐 Case 脱敏 Trace 与 Run Report 评分映射 | pass |
| AC-019 | T-13 | Checkpoint 问题、对象、恢复门禁和当前成熟度已进入公开问题图谱 | pass |
| AC-020 | T-14 | 根规则、脱敏规范、长期 Knowledge、来源说明、能力模板和仓外台账均明确“通用组合不推定敏感” | pass |
| AC-021 | T-15 | 新公开方案等级、能力问题图谱、两个 Web 能力说明、Skill Eval 契约和已刷新仓外覆盖状态 | pass |
| AC-022 | T-16 | Receipt Seal/Verify 脚本、固定规范化算法、排他写入、回读校验和 Receipt 合成测试 | pass |
| AC-023 | T-17 | Lifecycle Event 连续摘要链、Meta 状态最后写、同候选恢复和 17 个 Specflow 合成测试 | pass |
| AC-024 | T-18 | `context resolve`、`knowledge check`、Doctor/仓库检查、来源摘要和合成 Context/新鲜度测试 | pass |
| AC-025 | T-19 | Manifest Context 契约、确定性全文分配、真实 Markdown Section Index 和多事项预算测试 | pass |
| AC-026 | T-20 | Source Control Adapter、本地 Git 临时候选树、范围化稳定摘要、CLI 和合成 Git 冲突/脏工作区测试 | pass |
| AC-027 | T-21 | Knowledge Projection Plan/Apply/Verify、路径反向命中、原子 Registry 更新、决策指纹和合成取代/阻断测试 | pass |
| AC-028 | T-22 | Change Gate API/CLI 首版、单 Spec/受控豁免、工作/交付阶段、Receipt/Lifecycle 复核和合成 Git 门禁测试 | pass |
| AC-029 | T-23 | 规则文件预算、精确继承重复、失效入口、结构矛盾、祖先规则发现和 2 个合成 Doctor 测试 | pass |
| AC-030 | T-24 | 双终态事项 Relation Transaction、严格互反校验、不可覆盖事务意图和 6 个中断/恢复/锁接管合成测试 | pass |
| AC-031 | T-25 | 完整 Meta Schema、`specflow check`、产物/关系/循环/终态链校验与当前仓库自检 | pass |
| AC-032 | T-26 | `distribution/manifest.yaml`、Plan/Apply/Verify、内容摘要锁定、冲突与幂等合成测试 | pass |
| AC-033 | T-27 | Evidence Bundle、Eval Runner/Scorer、动态 Case 测试，以及三项 Skill 共 26 个 Case 的脱敏 Trace 与可重算评分 | pass |
| AC-034 | T-28 | Component Registry Validator、Schema、模板和未登记/深导入/废弃替代项合成测试 | pass |
| AC-035 | T-29 | Checkpoint v1 Schema、模板、摘要封存、连续 Event、Resume Plan、CLI 和 3 个合成测试 | pass |
| AC-036 | T-30 | Change Validation Schema、矩阵 Validator、CLI 和 3 个路径/场景/Evidence 合成测试 | pass |
| AC-037 | T-30 | 共享 Web Evidence Parser、预请求资格 Validator、CLI 和 5 个 HAR/Trace/资格合成测试 | pass |
| AC-038 | T-31 | `safe-change`、`design-to-code`、`tracking-governance` 三项 Skill、Framework/契约、模板及 6 个行为 Case | pass |
| AC-039 | T-32 | 组件静态导入导出、消费者登记、深路径和兼容基线实现及 2 个新增合成测试 | pass |
| AC-040 | T-33 | 8 项 Distribution Manifest、README、能力地图、成熟度、问题图谱、Knowledge Projection、CLI E2E 和整仓检查 | pass |
| AC-041 | T-34 | 重复 `--spec-id`、稳定 Spec 集合、Scope 并集与重叠、多 Spec 工作/交付门禁，以及 5 个 Change Gate 合成 Git 测试 | pass |

## 结构与内容检查

- [x] 当前事项包含 Spec、Plan、Tasks、Meta 和 Validation Report。
- [x] ID 和相互引用一致。
- [x] Spec 有目标、非目标和可判定完成条件。
- [x] Plan 能追溯到当前仓库证据。
- [x] Tasks 有依赖、对应条件、产物和验证。
- [x] 未决问题和 Blocker 保持可见。
- [x] 全量盘点的私有来源映射与公开问题投影分离。
- [x] `npm run check` 动态校验真实目录、JSON/JSON Schema、YAML 子集、Markdown 链接、Skill/Eval、无扩展名文本、路径和高置信秘密格式。
- [x] 私有词表从仓外注入，命中结果只返回摘要，不回显词条。
- [x] 使用仓外 17 项派生词表和 `--git-scope all` 扫描 474 个 Git 对象，其中 297 个文本对象进入内容扫描，结果无命中。
- [x] 本轮再次以通用高置信规则和 `--git-scope all` 扫描 513 个 Git 对象，其中 320 个文本对象进入内容扫描，结果无错误或警告；私有词表结论仍以前述仓外扫描为准。
- [x] 旧 “重建方式”等级已从当前公开资产和仓外覆盖台账移除；适配器型条目仍保留完整通用流程。
- [x] Web 首屏预请求与 Web 性能评审的能力说明已和正式行为回放状态同步为 `validated`。
- [x] Skill Eval 模板不要求指定模型或推理强度，运行时继承调用环境选择。
- [x] `specflow`、项目组件治理和自然语言重构均通过仓库 Skill/Eval 检查；Skill Creator 的可选快速校验器因本机缺少 PyYAML 未运行成功，未额外安装依赖，不影响仓库自身零依赖校验结论。
- [x] 既有归档事项的旧规范化标识仍可验证，且零 Event 的生命周期链从 Receipt 正确起算。
- [x] 当前 Registry 的每个权威来源都有匹配摘要；Context Resolver 可以选择本 Active 事项和相关长期 Knowledge。
- [x] 新增三个 Skill 均有 Rubric 与合成 Case，成熟度保持 `usable`，没有伪装成已经完成正式行为回放。
- [x] Checkpoint、增量验证、Web Evidence、Design Contract、Event Catalog 和组件语言分析均由零依赖程序测试覆盖。
- [x] 全部 8 个可分发 Skill 在独立合成项目完成 Distribution Plan、Apply 与 Verify；临时项目随后移动到系统废纸篓，可恢复。

## 生命周期检查

- [x] 当前事项保持 `In Progress`。
- [x] 没有从现有未提交改动、Commit 或 Push 推断归档授权。
- [x] 没有为历史提交伪造归档回执或验证证据。
- [ ] 终态和归档回执尚未进入验收范围。

## 已证明的最小实现范围

- Starter 可以初始化空的合成项目，并对既有项目中的 Starter 文件冲突整体阻断；
- Harness 可以向项目级 `.agents/skills` 安装和更新受管 Skill，保护未知目录、用户修改与 Symlink 目标；
- CLI、幂等执行、内容摘要、状态复核、Context/Knowledge、规则导航与 Doctor、Knowledge Projection、Source Control、Change Gate、仓库检查、Adapter 注入和失败保持目标不变已纳入本轮 80 个整仓自动化测试；
- 采用方可以显式注入项目级 Host，默认 CLI 不动态加载未知代码；
- 未注册的非核心基建 Adapter 产生警告，未注册 Host、重复声明、非法配置引用和项目外路径会阻断。
- 已有项目可以先生成只读初始化计划，且父路径 Symlink 在任何写入前阻断；
- 两个 `validated` Web Skill 已保存 10 份可独立重评分的脱敏最终输出。
- Specflow 可以在单事项目录内确定性 Seal/Verify/Finalize Receipt 与 Lifecycle Event，并在证据回读后最后原子更新 Meta；另以不可覆盖事务意图协调两个终态事项的父子或取代关系。23 个合成测试覆盖幂等、冲突、旧规范兼容恢复、篡改、Blocker、路径越界、事件跳号、文件名与关系链连续性、双向关系、Event/Meta 阶段中断恢复和崩溃遗留锁接管。
- Context Resolver 返回需要加载的规则、Knowledge 与 Active Spec；预算内事项进入全文计划，超限事项返回真实 Markdown Section Index，且不生成摘要；Knowledge Check 通过来源摘要发现漂移，并已接入 Doctor 与仓库检查。
- 本地 Git Source Control Adapter 在临时对象库中生成 Merge Candidate，按显式范围输出不可变版本与稳定摘要；纳入范围的脏内容、未知 Provider 和候选冲突均阻断。
- Knowledge Projection 能按变更路径发现 Scope 命中，阻断遗漏决策和仍被路由的退役知识，对已准备正文执行幂等 Registry 更新，并通过 `last_projection` 指纹独立复核来源摘要、状态和取代关系。
- Change Gate 始终用完整 Merge Candidate 校验一个或多个 Spec 的显式集合与 Scope 并集，或者使用受控路径型豁免；工作阶段逐项校验 Active 状态，交付阶段逐项复核 Archived Receipt、Lifecycle 链和同一最终候选摘要；筛选范围不能隐藏未关联路径。
- Context Resolver 会按请求路径加入根级与祖先 `AGENTS.md`；Doctor 阻断失效入口、路由数组重复、同路径纳入/排除矛盾和规则超预算，对父子规则精确重复只输出不含正文的指纹警告。
- Checkpoint v1 能封存和复核执行快照，并依据输入摘要、ExternalRef、重放策略和退出门禁生成 `continue`、`revalidate`、`confirm-manually` 或阻断计划，不持久化业务状态。
- Change Validation 能确定性阻断未覆盖路径、失败或缺证据的自动检查/浏览器场景/人工门禁；`safe-change` Skill 负责消费者、风险和回滚语义。
- Web Evidence Parser 只输出 HAR 网络 Observation 与 Trace 明确任务，不跨证据类型推断；预请求资格通过时只返回 `ready`。
- Design Contract 要求设计版本、目标路径、状态和视觉/行为双证据；Event Catalog 要求触发、属性来源、隐私审批和验证场景。
- 组件 Validator 显式启用后可检查 JavaScript/TypeScript 静态命名导出、Registry 所有者、公共入口消费者、深路径与兼容基线。

## 尚未证明

- 其他版本控制系统仍需采用方 Provider；本地 Git Change Gate 不验证受保护远端历史、外部 PR/MR、部署或发布状态；
- Knowledge Projection 的 Registry 状态和来源证据可以机械更新；内容决策、正文编写、业务正确性与刷新触发的语义判断仍不能由程序证明；
- Doctor 不能判断改写措辞后的规则是否语义重复或冲突，也不自动选择权威来源；
- 尚未提供 Active 事项、三个及以上事项或跨仓库的关系变更事务，以及受保护远端历史校验；
- 多 Spec Change Gate 不表达原子发布、共同灰度或共同回滚，也不提供跨 Spec 原子归档事务；采用方确有需要时应在外部交付流程补充，而不是把共同出现在一个分支中自动解释为交付组；
- 各类真实基建 Adapter、认证和外部系统行为由采用方实现，本仓未作集成验证；
- Coverage、Browser、Design、SDK 和数据平台的真实 Adapter 尚未提供；当前只证明核心契约和合成输入行为。
- 组件语言分析不解析 `export *`、动态加载、条件导出、完整类型兼容性或其他语言；这些结果仍需专用 Parser 或人工复核。
- 三项新增正式回放基于脱敏可观察行为与显式评分；Runner 能重算结构、摘要和阻塞规则，但不能独立证明评审者的语义判断正确；
- 正式公开发布所需权属确认尚未完成。
- 当前真实工作区包含未提交变化，且维护者未授权为验证创建 Commit；因此本事项没有伪造不可变 Source 来宣称自举交付门禁已通过。该边界由合成 Git 测试验证，待有权主体形成最终不可变候选后再执行真实交付门禁。

## 下一步

- 维护者人工复核私有覆盖台账、最终差异、二进制资源、权属和保密义务；
- 如维护者明确要求事项终态，再按 Specflow 归档契约收口；
- Commit、Push 和公开发布仍分别需要明确授权。
