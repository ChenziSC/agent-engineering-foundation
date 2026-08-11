# Spec：Specflow 按需产物与低风险交付豁免

## 基本信息

- 事项 ID：`2026-08-11-on-demand-specflow-artifacts`
- 创建日期：2026-08-11
- 事项状态、关系和影响范围以同目录 `meta.yaml` 为唯一事实来源。

## 输入来源

| 类型 | 引用或摘要 | 版本/日期 | 适用范围 |
| --- | --- | --- | --- |
| 用户输入 | 简单需求不应强制完整 Spec 套件；改动应做减法、降低消费者接入后的文件和 Token 成本，不增加复杂度 | 2026-08-11 | 本事项整体 |
| 只读对照 | 一个业务产品仓把行为需求默认收敛为 Spec、按复杂度增加 Plan/Tasks，并用确定性路径放行低风险变更 | 2026-08-11 | 问题与方案启发，不复制其内部实现或专有表达 |
| 仓库证据 | 本仓已有 Meta、Context、Receipt、Change Gate 和五类低风险豁免，但 Meta/Receipt/Context 仍固定要求 Plan、Tasks、Validation Report，本仓 Delivery 脚本未接通豁免 | 当前分支 | 直接实现范围 |

## 背景与目标

本仓当前把 Spec、Plan、Tasks、Validation Report 作为每个事项的固定产物。该契约适合跨阶段、高风险或需要正式审计的工作，但会让简单行为需求生成和加载没有独立消费者的文档。与此同时，Change Gate 已实现 `docs-only`、`tests-only`、`styles-only`、`assets-only`、`generated-only` 五类路径型豁免，本仓自身和消费者交付模板却没有完整暴露这条无 Spec 路径。

目标是在不删除 Meta、Context、Receipt、Lifecycle、Knowledge Registry 或 Change Gate 的前提下，把公共 Specflow 契约收敛为“Spec 必需，其余产物按任务需要存在”，并让本仓自举与采用项目使用同一规则。改动不新增 Profile、复杂度评分器、生命周期状态、命令或平行门禁。

## 非目标

- 不引入 `lightweight/standard` 等配置、字段或新状态；
- 不采用新的 `alignment` 状态或 HEAD 顶部对齐提交约定；
- 不删除 Meta、Context Resolver、Receipt、Lifecycle、Knowledge Registry、Change Gate 或多 Spec 候选关联；
- 不按代码行数、文件数或主观分值给需求分级；
- 不为既有完整事项目录批量迁移、删文件或伪造历史；
- 不增加 Host 专属 Skill 副本、软链接或新的分发机制；
- 不以减少文档为由降低高风险契约的验证证据要求。

## 用户或调用场景

1. 采用项目处理无语义低风险变更，完整候选命中受控路径类型时，不建 Spec 并通过现有 Change Gate 豁免交付。
2. Agent 处理范围清楚的简单行为需求，只建立 Meta 与 Spec；完成条件和必要验证证据直接保存在 Spec 与 Receipt 中。
3. 事项存在方案取舍、公共契约、跨模块、高风险、多个交付单元、跨会话或重大未知时，按需增加 Plan、Tasks、Validation Report 或 Research。
4. 新会话运行 Context Resolver 时，只加载该事项实际存在的 Spec、Plan、Tasks，不因缺少条件产物失败。
5. 既有完整事项继续通过 Specflow、Receipt、Lifecycle 和 Change Gate 检查，无需迁移。

## 输出与行为契约

- `meta.yaml` 仍是事项身份、状态、关系、Scope 和产物路径的唯一事实来源；`spec` 始终为项目内路径，`plan`、`tasks`、`research`、`validation_report` 可以为项目内路径或 `null`。
- Plan 仅在存在多方案取舍、公共契约/迁移、安全/性能/灰度/非平凡回滚、跨主要模块或必须实验才能决策时存在。
- Tasks 仅在存在多个依赖或并行交付单元、多人/多 Agent、多阶段环境或跨会话交接时存在。
- Research 仅在重大未知需要独立限时实验时存在；Validation Report 仅在风险或交付需要独立证据矩阵时存在。
- Archive Receipt 始终冻结 Spec，并冻结 Meta 实际声明的其他产物；`validation` 结构继续保存完成条件、Blocker 和 Evidence，因此缺少独立 Validation Report 不等于缺少验证。
- Context Resolver 只读取安全、存在且由 Meta 声明的 Spec/Plan/Tasks；返回产物集合和体量时不虚构缺失文档。
- Change Gate 继续使用 `spec` 或 `exemption` 二选一；本仓 CI 和采用模板只暴露现有五类豁免，不新增自由文本 bypass。

## 完成条件

- [x] **AC-001** Meta Schema、确定性 Validator 和模板允许 Plan、Tasks、Research、Validation Report 按需为 `null`，Spec 仍必需；现有完整 Meta 保持合法。
- [x] **AC-002** Archive Receipt 至少要求 Spec，并准确冻结 Meta 实际声明的产物集合；现有完整 Receipt、Lifecycle 和摘要验证保持兼容。
- [x] **AC-003** Context Resolver 对只有 Meta + Spec 的 Active 事项正常生成最小 Load Plan，对完整事项保持现有排序、预算和 Section Index 行为。
- [x] **AC-004** Specflow Skill、根规则、Specs 说明、Starter 与 Blueprint 使用同一套按需触发规则，唯一权威定义清楚，不新增 Profile、评分器、状态、命令或目录。
- [x] **AC-005** 本仓 GitHub Delivery 允许显式 Spec 集合或一个既有受控豁免二选一，采用项目 Delivery 模板允许原有 Spec 关联或既有受控豁免二选一；混用、自由文本和路径不匹配继续失败关闭。
- [x] **AC-006** 既有 Specflow、Context、Receipt、Lifecycle、Change Gate、Knowledge、Distribution 和仓库检查通过；新增或调整的测试覆盖最小事项、完整事项和非法缺失 Spec。
- [x] **AC-007** 现有行为 Eval 覆盖无 Spec 小改、简单 Meta + Spec、需要 Plan/Tasks 的复杂需求和不应新增复杂度的边界，不另建重复 Eval 体系。
- [x] **AC-008** 普通简单事项的文件数和 Context 加载字节数低于固定完整套件；Specflow 主入口、公共命令和生命周期概念数量不增加，未观察到净减法时不声称 Token 已优化。

## 约束

- 技术约束：复用现有 Meta 的可空产物键、Change Gate 豁免和 Context 路由，不建设平行实现。
- 兼容约束：既有完整事项和终态证据链继续合法；不要求历史迁移。
- 权限与安全约束：不自行 Commit、Push、创建 PR 或归档；豁免只由完整不可变候选路径机械证明。
- 数据与隐私约束：公开实现和测试使用自行构造的数据，不保存仓外路径、内部标识或私有平台行为。

## 风险、假设与待确认项

| 类型 | 内容 | 影响 | 处理方式 | 状态 |
| --- | --- | --- | --- | --- |
| Risk | 可选产物导致消费者误解为无需验证 | 可能弱化交付证据 | Receipt validation 继续必需；高风险触发独立 Validation Report | open |
| Risk | 文档多入口重复描述触发条件 | 后续术语漂移和 Token 增长 | Skill/Blueprint 为权威契约，其他入口保留短摘要和链接 | open |
| Assumption | Meta 键保持存在但允许 `null` 比删除字段或增加 Profile 更兼容 | 决定 Schema 方案 | 用既有完整与最小 fixture 交叉验证 | open |
| Risk | 消费者 CI 的 Spec/豁免输入增加配置分支 | 可能形成新复杂度 | 只复用 CLI 既有二选一，不增加豁免类型和自由文本 | open |

## Section Index

| 章节 | 说明 | 何时需要读取 |
| --- | --- | --- |
| 输出与行为契约 | 按需产物与豁免的公共规则 | 修改 Skill、Schema、Harness 或模板时 |
| 完成条件 | 兼容、减法和验证边界 | 实施与验收时 |
| 非目标 | 禁止新增的复杂度 | 方案扩张时 |
