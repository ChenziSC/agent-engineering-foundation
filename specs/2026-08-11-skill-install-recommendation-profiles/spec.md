# Spec：Skill 推荐安装 Profile 与增量 Distribution

## 基本信息

- 事项 ID：`2026-08-11-skill-install-recommendation-profiles`
- 创建日期：`2026-08-11`
- 事项状态、关系和影响范围以本目录 `meta.yaml` 为唯一事实来源。

## 输入来源

| 类型 | 引用或摘要 | 版本/日期 | 适用范围 |
| --- | --- | --- | --- |
| 用户输入 | 其他项目接入 CLI 时，并非每个公开 Skill 都是当前 AI 接入必需能力；要求在主分支合并完成后继续推进 | 2026-08-11 | 推荐集合、安装入口和文档语义 |
| 用户输入 | 首次使用时由 Agent 展示默认核心、接入期和可选 Skill 的理由，询问 `core`、`full` 或 `core + 可选项`；确认后 Plan，另行授权后 Apply | 2026-08-12 | 首次选择门禁、组合选择和 Agent 安装规范 |
| 仓库证据 | 当前 Distribution Manifest 同时承担发布白名单和完整默认安装集合；`preset: minimal` 不选择 Skill 子集 | `6487819` | Distribution、Starter、Install |
| 采用证据 | 真实对照中完整治理集合在部分任务产生 `1.38x`～`1.70x` 输入上下文成本 | 2026-08-07 | 默认安装合理性与适用边界 |

## 背景与目标

当前 `distribution/manifest.yaml` 正确承担全部可发布 Skill 的内容白名单和摘要，但安装文档把同一集合直接解释为所有采用项目的默认安装集合。安装成功不等于项目需要这些领域能力，部分 Host 即使不触发某个 Skill，也可能因完整能力目录产生上下文成本。

本事项把“可发布全集”与“默认推荐集合”分离：以独立、可校验的推荐 Profile 声明 `core` 与 `full`；普通采用项目默认推荐 `core`，当前只要求 `specflow`；完整治理目录仍可通过 `full` 显式选择。首次写入前，Agent 必须向用户展示核心条件、理由、接入期与可选能力，并取得 `core`、`full` 或 `core + 可选项` 的明确选择；CLI 用显式 Profile 和可选项参数阻止静默首次 Apply。Distribution 继续维护目标项目中已经受管且仍在发布白名单内的 Skill，不因选择更小 Profile 自动卸载或停止升级已有能力。

## 非目标

- 不建设通用 Package Manager、Capability Registry、依赖求解器、Marketplace 或用户级安装器；
- 不根据代码内容自动猜测项目类型或静默安装领域 Skill；
- 不自动卸载、删除或降级已经受管的 Skill；
- 不把 Profile 选择写成项目配置、Adapter 或外部工具已经就绪；
- 不为每个领域组合提前建立大量 Preset；当前只提供 `core` 与 `full`。
- 不在 CLI 内建立 TTY 问答；用户对话由 Agent Host 承担，CLI 只提供结构化推荐和确定性选择门禁。

## 用户或调用场景

1. 新采用项目运行 Distribution Plan 时，默认看到 `core` 推荐集合及其理由，不安装无关领域 Skill。
2. 需要完整能力目录的维护者显式选择 `full`，安装并验证 Manifest 中全部可发布 Skill。
3. 已安装可选 Skill 的项目继续使用 `core` 时，Upgrade 仍更新并验证这些已有受管 Skill，不把 Profile 当作卸载指令。
4. 维护者只读查询推荐清单，区分基础、接入期和领域可选能力，再决定是否追加单项安装或选择 `full`。
5. Foundation 源码生产者模式继续暴露唯一 `skills/` Source Link，不因消费者 Profile 破坏源码唯一事实源。
6. 首次接入 Agent 读取推荐输出，向用户展示 `specflow` 的条件性必需理由、onboarding 与各可选 Skill，再根据用户选择执行只读 Plan；Apply 在没有显式选择时失败关闭。
7. 维护者选择 `core + safe-change` 等组合时，用同一次 Distribution Plan/Apply 处理，不需要用单项安装拼装后再猜测维护范围。

## 输出与行为契约

- `distribution/manifest.yaml` 继续是可发布内容的唯一白名单，不增加推荐语义。
- 独立推荐契约声明默认 Profile、Profile 内 Skill 和每个 Skill 的推荐层级与适用条件；其中 `full` 必须精确覆盖 Manifest 全集。
- `distribution plan/apply/verify` 支持显式 `--profile <name>` 和可重复的 `--include-skill <name>`；实际维护集合继续与已有受管发布 Skill 取并集。
- 普通副本模式首次 Plan 未显式指定时可以只读展示默认 `core`；首次 Apply 必须显式传入 `--profile core|full`，否则返回 `skill-selection-required`。已有安装状态的维护和 Upgrade 不重复要求首次选择。
- 已存在安装状态时，未显式指定 Profile 应复用已记录 Profile；旧状态没有 Profile 时按 `full` 兼容迁移。
- 实际维护集合为“所选 Profile 与现有受管发布 Skill 的并集”；更小 Profile 不删除、不忽略已有受管 Skill。
- 生产者 Source Link 模式固定使用 `full`；显式请求其他 Profile 时给出明确边界，不伪装为子集安装。
- `skill recommend` 只读输出默认 Profile、可选 Profile、首次 Apply 门禁、三种选择方式，以及每个 Skill 的默认选择、条件性必需说明、理由和适用场景。
- 安装状态记录所选 Distribution Profile；Upgrade 复用该 Profile，不自动扩张为 `full`。

## 完成条件

- [x] **AC-001** 发布 Manifest 与推荐 Profile 是两个独立、可校验的事实源；`core` 只包含 `specflow`，`full` 精确覆盖全部可发布 Skill，未知、重复或遗漏条目失败关闭。
- [x] **AC-002** 新项目默认 Distribution Plan/Apply/Verify 使用 `core`；显式 `full` 安装全部公开 Skill；输出包含选定 Profile、选择来源和实际维护集合。
- [x] **AC-003** 已有完整安装状态无 Profile 时保持 `full` 兼容；已有可选受管 Skill 不因选择 `core` 被删除、遗漏升级或跳过验证。
- [x] **AC-004** `skill recommend` 和 `--profile` CLI 参数可从源码与 npm pack 入口使用，未知 Profile 返回稳定、可操作错误。
- [x] **AC-005** Source Link、用户修改、未知文件、Symlink、Foundation 版本和 Upgrade 的现有失败关闭语义不回归。
- [x] **AC-006** Install、Harness、Blueprint、Bootstrap Skill、模板、能力地图和长期 Knowledge 一致区分“默认推荐集合”“完整发布集合”“能力就绪”。
- [x] **AC-007** 聚焦测试、全量测试、Repository、Doctor、Distribution、Knowledge、Specflow 和源码仓外打包回归通过。
- [x] **AC-008** `skill recommend` 提供 Agent 可直接展示的选择方式、默认选择、条件性必需说明、理由和简介；`specflow` 只在采用本仓完整治理流程时声明为核心必需，不冒充所有 CLI 用法的无条件依赖。
- [x] **AC-009** 首次副本模式 Apply 没有显式 `--profile` 时以 `skill-selection-required` 失败关闭；只读 Plan 仍可展示默认 `core`，已有安装状态、Upgrade 和 Foundation Source Link 不受首次门禁干扰。
- [x] **AC-010** `--include-skill` 支持 `core + 若干可选项` 的同一次 Plan/Apply/Verify，拒绝未知、重复、core 重复包含和与 `full` 冗余组合，并保持既有受管并集与安全冲突语义。
- [x] **AC-011** Install 与 Bootstrap 明确规定：Agent 先 Recommend 并询问，用户确认后 Plan，维护者单独授权后 Apply；源码 CLI、npm pack、全量和治理回归证明该闭环。

## 约束

- 技术约束：Node.js 20+，继续保持零运行时依赖；推荐契约必须可由当前结构化文档读取器解析。
- 兼容约束：旧安装状态无 Profile 时解释为 `full`；现有单项 `skill install/update` 继续可用。
- 权限与安全约束：Plan/Recommend/Verify 只读；Apply 继续只写受管目录，不自动删除已有内容。
- 数据与隐私约束：推荐理由只描述通用场景，不记录采用项目代码、Prompt、工具日志或稳定个人标识。

## 风险、假设与待确认项

| 类型 | 内容 | 影响 | 处理方式 | 状态 |
| --- | --- | --- | --- | --- |
| Risk | 默认从完整集合改为 `core` 可能让依赖隐式领域 Skill 的新项目少装能力 | 新项目行为变化 | Install 明确推荐理由；需要完整目录时显式 `full` | mitigated |
| Risk | Profile 被误解为卸载期望状态 | 用户预期错误 | 明确增量并集语义；不实现删除 | mitigated |
| Assumption | `specflow` 是当前唯一跨项目日常基础 Skill | 默认集合选择 | 由 Starter/AGENTS 的直接消费者和当前能力边界支持；后续以评测刷新 | accepted |

## Section Index

| 章节 | 说明 | 何时需要读取 |
| --- | --- | --- |
| 输出与行为契约 | Profile、旧状态与增量维护语义 | 实现 CLI、Distribution 和 Upgrade 时 |
| 完成条件 | 可判定验收边界 | 测试与交付复核时 |
