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
- 阻塞条件：尚未完成正式行为回放，因此保持 `usable`。

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
- 动作：明确全部受限来源能力进入非公开盘点，并建立 `full-rebuild`、`design-rebuild`、`framework-only`、`exclude` 四级公开处理方式。
- 产物：迁移总览、脱敏与独立重写规范、能力说明模板、来源说明、根级规则和长期 Knowledge。
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
- 输入：当前 Lifecycle、Validation Report 和独立重写规范
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

## 验收任务

### V-01 完成条件复核

- 状态：`done`
- 依赖：`T-08`
- 动作：逐项检查 AC-001～AC-013，并区分已实现、已设计和未完成。
- 产物：`validation-report.md`
- 验证：AC-001～AC-013 均映射到文件、12 个自动化测试或结构审计证据；人工发布与终态授权不由技术验收推断。
