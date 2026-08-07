# Spec：Harness 共享基础设施模块边界

## 基本信息

- 事项 ID：`2026-08-07-harness-shared-modules`
- 状态、影响范围和终态授权以同目录 `meta.yaml` 为唯一事实来源。

## 背景与准入

`packages/harness/src/harness.mjs` 已超过 3300 行。文件安全、内容摘要、错误类型和 JSON/YAML 子集解析同时被 Specflow、Knowledge、Context、Skill Distribution、Doctor 与 Repository Check 使用，已经存在多个真实消费者；继续把这些共享原语留在单体文件，会扩大每次领域修改的阅读面并增加循环依赖风险。

主流 Agent Host 可以编辑和检索大文件，但不会替项目提供稳定的确定性代码所有权、路径安全不变量和结构化文档解析契约。本事项的增量是内部模块边界，不是新的 Agent 能力或 Runtime。

## 目标

- 把 `FoundationError` 抽到无依赖错误模块；
- 把路径边界、Symlink 检查、文件收集和 SHA-256 树摘要抽到共享文件模块；
- 把受支持 JSON/YAML 子集的解析和序列化抽到共享结构化文档模块；
- 保持 `harness.mjs` 的全部公开导出、CLI、错误码、JSON 输出和 pack 运行时行为不变；
- 用默认回归、千级规模回归、隔离 pack 和仓库检查证明等价。

## 非目标

- 不按函数数量机械拆分全部领域；
- 不新增 Package、CLI 命令、Schema、Capability Registry 或 Host Adapter；
- 不改变 YAML 支持范围、错误文本、摘要算法或 Symlink 策略；
- 不迁移尚未出现多个真实消费者的领域实现。

## 直接消费者

- Harness 内的 Specflow、Knowledge、Context、Skill Distribution、Doctor 与 Repository Check；
- 通过现有 `harness.mjs` API 或 `agent-foundation` CLI 使用这些能力的采用项目；
- 维护 Harness 的后续研发事项。

## 完成条件

- [x] **AC-001** `FoundationError` 只有一个实现，`harness.mjs` 继续以相同名称导出。
- [x] **AC-002** 路径安全、文件收集和摘要逻辑由共享模块提供，既有错误码与摘要结果不变。
- [x] **AC-003** JSON/YAML 子集解析与序列化由共享模块提供，Repository Check 和治理索引行为不变。
- [x] **AC-004** `harness.mjs` 行数和共享基础设施职责明显下降，没有形成反向依赖或循环导入。
- [x] **AC-005** 默认测试、独立规模测试、仓库检查、隔离 pack、Knowledge Projection 和 `git diff --check` 通过。

## 删除条件

如果抽取后出现循环依赖、公开行为漂移，或模块只有单一消费者且增加的跳转成本高于维护收益，则回退对应抽取，不为保持目录形式保留空壳。
