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
| 维护者决策 | 受限来源中的 Agent 能力应全部进入非公开盘点；公开时按公开依据和独立重建程度分级，不因来源一刀切过滤 | 2026-08-05 | 能力覆盖与公开边界 |
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
- [x] **AC-011** 建立全量能力盘点与分级公开规则，区分通用价值、公开依据、独立重建和权属复核。
- [x] **AC-012** 对受限来源的 Agent 工程结构完成全量覆盖盘点，在仓外保存来源映射，并向公开仓投影不含敏感来源信息的能力问题图谱和缺口。
- [x] **AC-013** 提供 Provider-neutral 的 Integration Manifest 与可注入 Adapter Registry，使采用方可以注册自有 Host 或基建 Adapter，而不修改 Harness 核心解析逻辑；凭证只允许使用不透明引用。

## 约束

- 技术约束：核心能力必须能在没有私有服务的环境中工作；确定性程序优先使用少量公开依赖。
- 兼容约束：现有 Framework、Skill、Blueprint 和模板继续作为有效资产，重构时保持可追溯入口。
- 权限与安全约束：全局安装、外部写入、提交、推送、PR/MR 和发布分别需要明确授权。
- 数据与隐私约束：遥测默认关闭或仅本地，不采集 Prompt、工具原始输入输出、邮箱和稳定个人标识。

## 风险、假设与待确认项

| 类型 | 内容 | 影响 | 处理方式 | 状态 |
| --- | --- | --- | --- | --- |
| Risk | 把通用设计误解为可以直接复制私有实现 | 权属和泄密风险 | 只记录能力点，独立设计 Schema、代码和合成案例 | open |
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
