# Plan：将仓库升级为可快速接入的 Agent 工程治理骨架

## 对应 Spec

- 事项 ID：`2026-08-05-self-hosted-agent-governance`
- Spec：`./spec.md`

## 方案摘要

采用渐进自举，而不是先建设一个庞大平台：先让仓库拥有真实 Active Spec、长期 Knowledge 和根级路由规则；再补完整 Specflow Archive；随后建设最小 Starter 与 Harness，通过一个开放 Host 接入闭环验证设计，最后扩展其他 Host、Eval Runner 和可选领域 Preset。

## 当前证据与假设

| 类型 | 内容 | 来源或验证方式 |
| --- | --- | --- |
| Evidence | 仓库已有 Framework、Skill、Blueprint 和模板 | 当前目录与 README |
| Evidence | Skill Runtime 已有项目级安装、更新、冲突计划、Host Registry 和测试 | `blueprints/skill-runtime/`、`packages/harness/` |
| Evidence | AI 友好仓库已有模板和 Repository Doctor；本阶段已补 Active Context 最小加载计划与 Knowledge 来源摘要检查 | `templates/ai-friendly-repository/`、`packages/harness/` 和合成项目测试 |
| Evidence | Specflow 已形成 Skill、Receipt/Event/Relation Transaction 语义和 Schema，并提供单事项目录生命周期与双终态事项关系事务脚本 | `skills/specflow/`、`blueprints/specflow/` 和 23 个合成测试 |
| Evidence | 发布检查清单仍记录旧 Skill 数量 | `docs/06-公开发布检查清单.md` |
| Evidence | 仓库此前没有 `specs/` 和 `knowledge/` | 本事项建立前的 Git 文件清单 |
| Evidence | 既有非公开台账只覆盖较粗的能力分类，遗漏确定性 SDD、Knowledge 生命周期、Repository Doctor、工程门禁和多宿主基础设施等独立问题 | 2026-08-05 仓外结构覆盖审计；公开结论投影到能力问题图谱 |
| Evidence | Node.js 20+ 标准库已足以完成文件发现、内容摘要、原子 Rename、CLI 和端到端测试 | 本机 Node.js 验证与标准库接口 |

## 目标分层

```text
设计原因与问题模型
→ frameworks / knowledge / docs

快速采用
→ starter / presets / skills / templates / blueprints

确定性执行
→ packages / adapters / scripts / tests
```

## 组件与职责

| 组件或目录 | 职责 | 变化类型 |
| --- | --- | --- |
| `specs/` | 当前事项、方案、任务和验证的权威来源 | 新增 |
| `knowledge/` | 长期定位、设计原因、契约和刷新条件 | 新增 |
| `AGENTS.md` | 仓库地图、路由和治理不变量 | 修改 |
| `skills/specflow/` | Agent 语义编排和输出模板 | 已新增、继续完善 |
| `starter/` | 可复制的最小接入骨架 | 已新增最小 Preset |
| `packages/` | Harness、Validator、Eval Kit 等确定性实现 | 已新增最小 Harness，其余按需 |
| `adapters/` | Host、Source Control、Browser、Telemetry 边界 | 已新增开放 Host 与本地 Git Source Control，其余按需 |
| `distribution/` | 可分发 Skill 白名单与内容摘要版本 | 新增可执行 Manifest |
| `frameworks/evidence/`、`frameworks/skill-eval/` | Evidence/Claim 与行为评估确定性契约 | 增加 Schema、Runner/Scorer 和测试 |
| `skills/project-component-governance/scripts/` | 项目组件 Registry 确定性门禁 | 新增 Validator 和测试 |
| `frameworks/checkpoint/` | 长任务恢复契约、完整性和恢复计划 | 从设计升级为参考实现 |
| `frameworks/change-validation/`、`skills/safe-change/` | 增量覆盖、浏览器场景和安全变更闭环 | 新增 |
| `frameworks/web-prefetch/`、两个 Web Skill 的 Scripts | 合成 HAR/Trace 与预请求资格确定性子集 | 增强 |
| `frameworks/design-to-code/`、`skills/design-to-code/` | 设计输入、实现边界与视觉/行为验证 | 新增 |
| `frameworks/tracking-governance/`、`skills/tracking-governance/` | 埋点契约、生成计划与验证边界 | 新增 |
| `.github/workflows/` | 仓库级最小 CI 门禁 | T-07 新增 |
| `docs/` | 能力地图、成熟度和公开发布规则 | 修改 |

## 数据流

```text
维护者需求或项目变化
→ 选择或建立 Active Spec
→ Spec / Plan / Tasks
→ 实现与验证
→ Archive Receipt / Lifecycle Event / Meta 状态最后写
→ Knowledge Projection
→ Starter / Harness / Skill 的可验证发布
```

## 关键决策

| 决策 | 备选方案 | 选择理由 | 代价 |
| --- | --- | --- | --- |
| 仓库自身使用 `specs/` | 只提供模板，不自用 | 能真实验证跨会话、归档和知识边界 | 增加持续维护要求 |
| 当前事项保持 In Progress | 为已有改动补一个 Archived Spec | 不伪造尚未发生的归档、验证和授权 | 历史提交仍没有 SDD 产物 |
| Knowledge 与 Spec 分层 | 把定位和当前计划都放 README | 避免长期事实与任务状态双写 | 需要 Registry 和刷新规则 |
| 先做单一 Host 闭环 | 一开始覆盖全部 Agent | 降低过度设计，先验证核心契约 | 其他 Host 稍后接入 |
| 外部集成走 Adapter | 在核心内支持具体平台 | 保持跨项目和公开可用 | 使用方需要配置 Adapter |
| 全量盘点、分级公开 | 只盘点看起来可以直接公开的内容 | 不遗漏真实问题价值，同时把通用性与公开权分开判断 | 需要维护非公开覆盖台账并逐项判断 |
| 先完成结构覆盖审计 | 直接继续完善归档实现 | 先确认要沉淀的问题全集，避免治理骨架完整但能力覆盖遗漏 | 归档实现顺延一个任务 |
| Node.js 20+ ESM、零运行时依赖 | 立即引入 CLI 框架和 YAML 依赖 | 降低项目接入和供应链成本，首版命令面较小 | 参数解析和错误格式自行实现 |
| 首版只支持项目级开放 Host | 同时支持多个宿主和用户级安装 | 先验证安全写入、幂等和冲突语义，不扩大用户目录权限 | 其他 Host 与全局安装后续增加 |
| Starter 使用 JSON Manifest | 首版直接解析 YAML | 标准库可以确定性读取并校验，避免只为一个文件引入依赖 | 人工可读性略弱于 YAML |
| Adapter Registry 通过构造参数注入 | 让 Harness 扫描目录或硬编码全部 Adapter | 下游可以显式组装自有 Adapter，核心不执行动态代码发现 | 采用方需要提供自己的组合入口 |
| Integration Manifest 只保存 Adapter ID 和不透明配置引用 | 在公开骨架中定义平台字段和凭证结构 | 保留扩展能力，同时避免核心接触公司基建细节和秘密 | 能力级配置由下游 Adapter 自行校验 |
| Manifest 字段按执行、校验、说明三类公开语义 | 只允许运行时已消费字段；或保留未声明语义的任意字段 | 保留辅助理解能力，同时避免安全字段产生虚假保证 | Harness 需要拒绝未知顶层字段并验证已声明安全不变量 |
| 既有项目先生成接入计划 | 自动合并已有规则；或遇到冲突只返回异常 | 在不覆盖用户内容的前提下给出可执行迁移路径 | 首版只报告，不自动合并自然语言规则 |
| 发布敏感检查同时覆盖文件系统和 Git 对象 | 只扫描当前工作区常见扩展名 | 降低文件名、暂存内容、历史和已删除对象遗漏风险 | 扫描成本增加，二进制语义仍需人工复核 |
| 通用组合不作为敏感推定依据 | 为避免相似而强制重排流程；或把原仓组合一律降级为框架 | 保留经过实践验证的通用解决方案完整性，风险判断落在实际内部事实和具体表达/实现的复用权上 | 维护者需要逐项区分设计思想、内部事实和受保护表达 |
| 公开方案等级与成熟度分离 | 用“重建方式”同时描述公开边界与完成度 | 用 `complete-solution`、`adapter-backed`、`problem-pattern`、`exclude` 描述公开深度，继续用成熟度标记交付状态 | 需要同步公开图谱和仓外覆盖台账 |
| 分阶段实现本地生命周期 | 一次实现所有版本控制 Provider、跨事项事务、Receipt、Event、Meta 和 CI 全闭环 | T-16/T-17 先冻结 Receipt/Event/Meta，T-20 补本地 Git Merge Candidate 摘要，T-24 只补同一 Root 的双终态事项关系事务；授权判断和其他版本控制仍保持显式边界 | 采用方仍需按需补其他版本控制及 Active/多事项/跨仓库事务 Adapter |
| Context Resolver 只输出最小加载计划 | 自动读取并拼接全部正文 | 保持可审计、低上下文占用，并让 Agent 在读取所选正文后继续判断相关性 | 调用方需要执行后续加载 |
| Knowledge 新鲜度使用权威来源摘要 | 只比较日期或自动理解全部刷新触发条件 | 摘要能确定性发现来源变化，同时不把机械变化误判为知识结论 | 语义复核、正文更新和状态变化仍由 Agent/维护者完成 |
| Knowledge Projection 分离语义准备与机械投影 | 让程序自动撰写正文；或只保存无执行力模板 | Agent/人工决定内容和动作，Harness 只校验路径覆盖、来源证据、状态、路由和取代关系并原子改写 Registry | 采用方仍需提供真实变更路径并完成语义 Review |
| Change Gate 使用显式 Spec 集合或受控路径型豁免 | 限制一个分支/候选只能关联一个 Spec；从分支名/Commit 文本猜测关联；或允许自由文本跳过 | 分支可以承载多个独立事项，Scope 并集仍能机械证明全部变更归属；单 Spec 是集合大小为一的普通情况 | Spec 集合与豁免互斥；原子发布等额外关系只在真实需要时由采用方表达 |
| 完整候选负责关联，筛选范围只负责 Receipt 摘要复核 | 同一个 Include/Exclude 同时控制关联和证据 | 防止通过路径筛选隐藏未关联变更，同时允许排除事项目录等不属于实现摘要的证据文件 | 输出需要同时暴露完整候选与 Receipt Scope 两组摘要 |
| 工作门禁与交付门禁分阶段 | 只在最后检查一次；或工作阶段就要求 Archived | 开发期检查 Active Scope，交付期再复核终态证据与最终快照，符合状态所有权 | 当前工作区若没有获准形成不可变版本，只能记录未执行，不能自行 Commit |
| Doctor 只判断结构矛盾与精确重复 | 用关键词或模型自动裁决自然语言规则冲突 | 路径存在性、数组重复、纳入/排除矛盾、体量和精确文本重复可以稳定复核；语义冲突需要上下文和权威判断 | 首版不能自动发现改写措辞后的重复或冲突 |
| Eval Runner 消费脱敏 Trace 与显式评分 | Runner 自行调用并锁定某个模型；或只保留不可复核的文字结论 | 评估可以独立重算，调用环境继续决定模型与推理强度，语义评分责任保持可见 | Trace 归一化和评分判断仍需宿主、评审 Agent 或人工 |
| Distribution 以内容摘要锁定项目级白名单 | 继续只按真实目录临时发现；或直接支持用户级与远端分发 | 版本与允许范围可独立复核，同时复用已有冲突保护 | 多 Skill Apply 可重入但不提供跨目录事务 |
| 组件 Validator 只做确定性结构门禁 | 用目录和字段自动决定组件准入 | Registry、路径、Contract、稳定入口和深导入适合程序检查，抽象价值仍需要语义判断 | 不覆盖所有语言的导出语法与兼容差异 |
| 新增确定性能力采用窄输入契约 | 直接控制真实浏览器、设计或数据平台 | 合成输入可稳定验证核心推导，外部事实由 Adapter 和 Evidence 负责 | 采用方仍需提供真实采集器 |
| JavaScript/TypeScript 只解析静态导入导出子集 | 构建完整编译器或声称覆盖全部语法 | 对常见稳定入口提供有用门禁，同时明确动态语义边界 | 复杂重导出和其他语言需要专用 Parser |
| Context 沿请求路径发现祖先规则 | 只依赖人工维护的 `module_rules` 清单 | 避免新模块规则因遗漏映射而完全不可见，同时保留显式映射用于任务类型路由 | 采用方仍需维护 Code Entry Map 的知识和常用入口 |

## Agent、程序与人工分工

- Agent：理解范围、编写和更新 Spec/Plan/Tasks、判断 Knowledge Projection、设计 Skill 和解释风险。
- 确定性程序：初始化骨架、发现与安装 Skill、检查目录和引用、验证 Schema、归档摘要与 Eval 运行。
- 人工：确认定位、风险取舍、终态、用户级安装、外部写入、发布和权属。

## 兼容与迁移

- 现有文档和 Skill 不批量移动，先新增权威入口并逐步更新引用。
- 已有历史不补虚假 Spec；未来实质变化从本事项开始执行。
- Specflow 模板继续由 Skill Assets 单一维护。
- 新增 Package 前先证明确定性实现具有重复使用价值。

## 验证策略

| 完成条件 | 实现路径 | 验证方式 |
| --- | --- | --- |
| AC-001～AC-004 | `specs/`、`knowledge/`、AGENTS 和当前产物 | 文件、引用、状态和内容人工/静态检查 |
| AC-005 | README、能力地图、目标设计、成熟度 | 文档一致性扫描 |
| AC-006 | Specflow Archive Reference、Assets、Evals | Skill 校验与合成行为回放 |
| AC-007～AC-008 | Starter、Harness、Host Adapter | 临时项目端到端初始化、Doctor、安装和更新测试 |
| AC-013 | Adapter Registry、Integration Manifest 和合成 Adapter | 自定义 Host 无需修改核心即可完成计划、安装和 Doctor 测试 |
| AC-009 | 独立重写与敏感信息检查 | 工作区、暂存快照和 Git 历史扫描 |
| AC-010 | 成熟度表和验证报告 | 产物与实际测试证据对照 |
| AC-014～AC-016 | Manifest、动态 Skill 测试、初始化和接入计划 | 合成 Manifest、动态目录与父级 Symlink 测试 |
| AC-017 | 扩展仓库敏感检查 | 合成路径、扩展名、暂存、历史和不可达对象测试 |
| AC-018 | 两个已验证 Web Skill 的脱敏 Trace | Trace 与 Run Report 摘要、Case、Rubric 逐项对照 |
| AC-019 | 能力问题图谱 | 私有能力簇与公开问题行数及语义映射复核 |
| AC-020 | 公开分级规则、Knowledge 和私有覆盖台账 | 检查规则不再以通用组合本身降级，同时仍明确过滤具体内部信息 |
| AC-021 | 公开分级规则、能力问题图谱、能力说明、Eval 契约和私有覆盖台账 | 检查旧等级无残留、适配器型能力保留完整流程、成熟度与等级独立、Eval 不锁定调用模型 |
| AC-022 | `skills/specflow/scripts/`、`skills/specflow/tests/`、Receipt 资产与说明 | 合成事项验证 Seal、Verify、重复幂等、篡改失败、Blocker 阻断和路径安全 |
| AC-023 | 同一脚本、Lifecycle Event 资产、Meta 与归档说明 | 合成事项验证连续事件链、排他追加、状态最后写、幂等、Meta 写入失败恢复、篡改和跳号阻断 |
| AC-024 | Harness `knowledge check`、`context resolve`、Doctor、Registry 来源证据和文档 | 合成项目验证空上下文、按路径选择、Active Spec、Knowledge 路由、来源摘要漂移和 CLI 输出 |
| AC-025 | Manifest Context 契约、Resolver 预算分配和 Markdown Section Index | 合成多事项验证单事项/总预算、稳定分配、真实标题行区间、规则编号、清单完成度与全文加载计划排除 |
| AC-026 | Source Control Adapter、本地 Git Merge Candidate 摘要和 CLI | 合成 Git 仓库验证稳定摘要、范围排除、Rename、脏工作区、未知 Provider、候选冲突和临时对象隔离 |
| AC-027 | Knowledge Projection Plan/Apply/Verify、Registry 投影指纹和路径反向命中 | 合成 JSON Registry 验证准备态、幂等应用、独立复核、无影响阻断、退役路由和取代关系 |
| AC-028、AC-041 | Change Gate API/CLI、多 Spec 集合、受控豁免与 Receipt/Lifecycle 交付复核 | 合成 Git 仓库验证单/多 Spec 关联、Scope 并集与重叠、完整候选不可被筛选隐藏、豁免分类、过早交付和归档摘要漂移 |
| AC-029 | Repository Doctor 规则/路由检查与 Context 祖先规则发现 | 合成项目验证精确继承重复、不回显正文、祖先加载、路由矛盾、失效入口、重复数组值和规则预算 |
| AC-030 | 双终态事项 Relation Transaction | 合成双方 Receipt/Event/Meta 验证父子与取代互反、不可覆盖事务意图、Event/Meta 阶段中断和同候选恢复 |
| AC-031 | Meta Schema、`specflow check` 与 Doctor/仓库检查 | 当前仓库和合成事项验证精确结构、产物、关系互反、循环与终态链 |
| AC-032 | Distribution Manifest Plan/Apply/Verify | 合成项目验证内容摘要、全量预检、幂等安装/更新、漂移和冲突阻断 |
| AC-033 | Evidence Bundle、Eval Runner/Scorer 与三项正式回放 | 单元测试、动态 Case 覆盖、Trace 引用、完整性、阻塞级回归和仓库级重算 |
| AC-034 | Component Registry Validator | 合成项目验证标准目录登记、Contract、稳定入口、替代项和深路径导入 |
| AC-035 | Checkpoint Schema、封存器与恢复计划 | 单元测试覆盖篡改、断序、输入漂移、失效引用和非幂等阶段 |
| AC-036 | Change Validation Manifest 与 Validator | 合成路径覆盖、浏览器关键场景、失败证据和人工门禁测试 |
| AC-037 | Web Evidence Parser 与预请求资格 Validator | 合成 HAR/Trace 验证 Observation 边界、契约漂移和行为阻断 |
| AC-038 | 三项 Skill、Framework、Template 与 Eval | Skill 检查、合成案例和确定性契约测试 |
| AC-039 | 组件 Export/Consumer/Compatibility 检查 | 合成 TS 项目验证缺失导出、深路径消费和破坏性导出变化 |
| AC-040 | Distribution、Knowledge 与仓库导航 | `npm test`、`npm run check`、Specflow、Distribution 和 Knowledge 检查 |
| AC-042 | Knowledge、迁移总览、能力问题图谱、成熟度表、发布检查与资源来源记录 | 以各能力目录的实现、测试、Case、Trace 和 Replay 为证据复核成熟度；执行旧字段/重复清单搜索、链接、Knowledge、Specflow、Repository Check 与敏感扫描 |

## 风险

| 风险 | 可能性 | 影响 | 缓解方式 |
| --- | --- | --- | --- |
| 自举规则过重 | 中 | 小修改成本上升 | 明确低风险小改豁免，不为所有改动建 Spec |
| Knowledge 重复 README | 中 | 内容漂移 | README 只做入口，稳定 WHY 由 Knowledge 管理 |
| Harness 过早绑定技术栈 | 中 | 后续迁移成本 | 先定义文件契约和 Host Adapter，再锁实现 |
| 敏感概念进入公开实例 | 低到中 | 法律与泄密风险 | 只使用合成案例并执行发布扫描和人工复核 |

## 未决问题

- [x] 最小 Harness 使用 Node.js 20+ ESM 和仓库内 CLI，不在本阶段发布 npm Package。
- [x] Starter 首版只支持项目级接入和一个开放 Agent Skills Host。
- [x] T-06 Doctor 只验证 Starter、Skill 和安装状态；Archive Digest/Receipt Validator 留到后续质量任务，避免在一个任务中混入版本控制事务。
