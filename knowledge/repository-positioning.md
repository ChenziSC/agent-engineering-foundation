# Knowledge：仓库定位与产物分层

## 注册信息

- ID：`repository-positioning`
- 状态、适用范围、复核时间、权威来源和刷新条件以 [Knowledge Registry](registry.yaml) 中的同 ID 条目为准。

## 摘要

本仓库的目标不是只保存提示词或方法论文档，而是为任意项目提供可以快速接入的 Agent 工程治理骨架。设计原因、采用资产和确定性执行必须分层存在，外部平台通过 Adapter 隔离。

## 稳定事实

- 仓库面向其他公司、团队和个人项目，不面向单一业务系统；
- 核心治理在没有私有平台时仍应可使用；
- Framework 和 Knowledge 解释问题、原因、边界与不变量；
- Skill、Starter、Template 和 Blueprint 支持项目采用；
- Harness、Validator 和 Adapter 负责确定性执行和宿主差异；
- 当前最小参考实现覆盖项目级开放 Host、可注入 Host Registry、Starter、Distribution Manifest、受管 Skill 和仓库静态检查；
- 适合程序判定的 Meta、Evidence/Claim、Checkpoint、增量覆盖、Web Evidence、Design Contract、Event Catalog、Skill Eval 和项目组件 Registry 已提供零依赖参考实现，语义真实性、抽象价值和发布授权仍由 Agent 或人工判断；
- 安全变更、Design-to-Code 和埋点治理以独立 Skill 编排 Agent 判断；真实 Coverage、Browser、Design、SDK 和数据平台通过采用方 Adapter 接入；
- 项目自有基建通过 Integration Manifest 和显式 Registry 接入；公共核心不动态加载私有代码；
- 组织专有词表保存在公开 Git 之外，由发布检查时显式注入且不在结果中回显；
- 领域 Skill 可以选装，不应成为核心 Harness 的强制依赖；
- 宠物资源与 Agent 工程主体保持依赖隔离。

## 设计原因

只有文档时，使用方仍需自己发明目录、安装、检查和维护流程；只有工具时，维护者无法理解为什么存在某项门禁，也难以在环境变化后正确演进。因此仓库需要同时保留：

```text
为什么需要
→ Framework / Knowledge / Docs

如何采用
→ Starter / Preset / Skill / Template / Blueprint

如何确定执行
→ Harness / Validator / Adapter / Test
```

## 核心契约

| 契约 | 提供方 | 消费方 | 变化影响 |
| --- | --- | --- | --- |
| 仓库上下文与规则 | AGENTS、Knowledge | Agent、维护者 | 影响任务路由和安全边界 |
| 当前交付状态 | Specflow Meta 与产物 | Agent、CI、维护者 | 影响执行、恢复和归档 |
| Skill 内容 | Skill 源目录 | Harness、Agent Host | 影响发现、安装和行为 |
| Skill 分发版本 | Distribution Manifest 与源目录摘要 | Harness、项目级 Host | 影响允许安装范围和可复核版本 |
| 行为评估证据 | Case、Rubric、脱敏 Trace 与 Replay | Runner、评审者 | 影响成熟度和回归判断，不选择调用模型 |
| 确定性检查 | Harness、Validator | 项目、CI | 影响接入与交付门禁 |
| 领域确定性契约 | Checkpoint、Change Validation、Web Evidence、Design Contract、Event Catalog、Component Registry | Skill、Agent、采用方 Adapter | 约束结构与证据边界，不替代领域语义判断 |
| 外部集成 | Adapter | Harness、Skill | 影响可选平台能力，不改变核心语义 |
| 仓库静态检查 | Harness、仓外私有词表 | 维护者、CI | 提供可重复基线，但不替代法律和人工复核 |

## 常见失败

| 失败模式 | 原因 | 正确做法 |
| --- | --- | --- |
| 只有大量 Markdown，没有快速接入路径 | 把设计完成误当成交付完成 | 为核心治理提供 Starter 和最小 Harness |
| 所有领域 Skill 默认安装 | 没有区分核心与可选能力 | 通过 Preset 和 Manifest 选择能力 |
| 核心依赖某个公司平台 | Adapter 边界缺失 | 核心只认识公开契约和 Provider 接口 |
| 工具存在但没有设计原因 | 只沉淀 HOW | Framework 和 Knowledge 同步说明 WHY 与边界 |
| 文档把未来能力写成已落地 | 成熟度和证据脱节 | 用 Spec 和 Validation Report 区分状态 |
