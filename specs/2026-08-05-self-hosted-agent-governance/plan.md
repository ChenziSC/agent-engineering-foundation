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
| Evidence | Skill Runtime 只有 Blueprint 和模板，没有安装器 | `blueprints/skill-runtime/`、`templates/skill-runtime/` |
| Evidence | AI 友好仓库只有模板和人工检查，没有 Doctor | `templates/ai-friendly-repository/` |
| Evidence | Specflow 已形成 Skill，但归档仍只有语义规则 | `skills/specflow/`、`blueprints/specflow/` |
| Evidence | 发布检查清单仍记录旧 Skill 数量 | `docs/06-公开发布检查清单.md` |
| Evidence | 仓库此前没有 `specs/` 和 `knowledge/` | 本事项建立前的 Git 文件清单 |
| Evidence | 既有非公开台账只覆盖较粗的能力分类，遗漏确定性 SDD、Knowledge 生命周期、Repository Doctor、工程门禁和多宿主基础设施等独立问题 | 2026-08-05 仓外结构覆盖审计；公开结论投影到能力问题图谱 |
| Evidence | Node.js 18+ 标准库已足以完成文件发现、内容摘要、原子 Rename、CLI 和端到端测试 | 本机 Node.js 验证与标准库接口 |

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
| `adapters/` | Host、Source Control、Browser、Telemetry 边界 | 已新增单一开放 Host，其余按需 |
| `.github/workflows/` | 仓库级最小 CI 门禁 | T-07 新增 |
| `docs/` | 能力地图、成熟度和公开发布规则 | 修改 |

## 数据流

```text
维护者需求或项目变化
→ 选择或建立 Active Spec
→ Spec / Plan / Tasks
→ 实现与验证
→ Archive Receipt（后续补齐）
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
| Node.js 18+ ESM、零运行时依赖 | 立即引入 CLI 框架和 YAML 依赖 | 降低项目接入和供应链成本，首版命令面较小 | 参数解析和错误格式自行实现 |
| 首版只支持项目级开放 Host | 同时支持多个宿主和用户级安装 | 先验证安全写入、幂等和冲突语义，不扩大用户目录权限 | 其他 Host 与全局安装后续增加 |
| Starter 使用 JSON Manifest | 首版直接解析 YAML | 标准库可以确定性读取并校验，避免只为一个文件引入依赖 | 人工可读性略弱于 YAML |
| Adapter Registry 通过构造参数注入 | 让 Harness 扫描目录或硬编码全部 Adapter | 下游可以显式组装自有 Adapter，核心不执行动态代码发现 | 采用方需要提供自己的组合入口 |
| Integration Manifest 只保存 Adapter ID 和不透明配置引用 | 在公开骨架中定义平台字段和凭证结构 | 保留扩展能力，同时避免核心接触公司基建细节和秘密 | 能力级配置由下游 Adapter 自行校验 |

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

## 风险

| 风险 | 可能性 | 影响 | 缓解方式 |
| --- | --- | --- | --- |
| 自举规则过重 | 中 | 小修改成本上升 | 明确低风险小改豁免，不为所有改动建 Spec |
| Knowledge 重复 README | 中 | 内容漂移 | README 只做入口，稳定 WHY 由 Knowledge 管理 |
| Harness 过早绑定技术栈 | 中 | 后续迁移成本 | 先定义文件契约和 Host Adapter，再锁实现 |
| 敏感概念进入公开实例 | 低到中 | 法律与泄密风险 | 只使用合成案例并执行发布扫描和人工复核 |

## 未决问题

- [x] 最小 Harness 使用 Node.js 18+ ESM 和仓库内 CLI，不在本阶段发布 npm Package。
- [x] Starter 首版只支持项目级接入和一个开放 Agent Skills Host。
- [x] T-06 Doctor 只验证 Starter、Skill 和安装状态；Archive Digest/Receipt Validator 留到后续质量任务，避免在一个任务中混入版本控制事务。
