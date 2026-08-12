# Plan：Skill 推荐安装 Profile 与增量 Distribution

## 对应 Spec

- 事项 ID：`2026-08-11-skill-install-recommendation-profiles`
- Spec：`./spec.md`

## 方案摘要

新增独立的推荐契约，由 Harness 读取并与 Distribution Manifest 交叉校验。Distribution 在副本模式下选择 Profile 后，对 Profile Skill、显式 `include-skill` 与现有受管发布 Skill 的并集执行既有 Plan/Apply/Verify；安装状态记录 Profile，受管记录保存已选可选项，Upgrade 自动复用。生产者 Source Link 继续保持全部源码可见，固定为 `full`。CLI 提供只读 `skill recommend`、`--profile` 和 `--include-skill`，并在首次 Apply 缺少显式 Profile 时失败关闭；不增加 TTY 问答、卸载或自动项目识别。

## 当前证据与假设

| 类型 | 内容 | 来源或验证方式 |
| --- | --- | --- |
| Evidence | Manifest 当前包含 9 个可发布 Skill，并由摘要和 Repository Check 校验 | `distribution/manifest.yaml`、`repository check` |
| Evidence | Distribution 状态已有 `foundationVersion` 与逐 Skill 受管记录，Upgrade 复用 Distribution | `harness.mjs` 与合成升级测试 |
| Evidence | Source Link 模式必须精确指向仓内完整 `skills/` | Host Adapter 与 Distribution 测试 |
| Baseline | Host 原生安装与触发由 Host 负责；本仓兼容层不应扩张为通用 Runtime | `knowledge/deterministic-core-boundary.md` |
| Assumption | 当前 Profile 只需 `core` 和 `full`，领域能力继续单项选择 | 用户问题与避免过度设计约束 |

## 变更深度与上下文契约

| 改变对象 | 层级 | 不能猜测的不变量 | 允许依赖的事实 | 回流位置 |
| --- | --- | --- | --- | --- |
| 推荐 Profile | 公共安装契约 | 默认集合、全集、推荐理由 | Manifest、Skill 触发描述、采用证据 | Spec / Plan / Knowledge |
| Distribution | 稳定 CLI 契约 | 旧状态兼容、受管并集、失败关闭 | 现有状态与 Plan/Apply/Verify | Spec / Plan |
| Install/Bootstrap | 产品行为 | 安装不等于能力就绪 | 当前接入流程和 Profile 输出 | Spec / Docs |

## 组件与职责

| 组件或目录 | 职责 | 变化类型 |
| --- | --- | --- |
| `distribution/recommendations.json` | 默认 Profile、完整 Profile 和逐 Skill 推荐元数据 | 新增 |
| `harness.mjs` | 校验推荐契约、解析维护集合、保存/迁移 Profile | 修改 |
| CLI | 暴露 `skill recommend` 与 `--profile` | 修改 |
| CLI 选择门禁 | 暴露可重复 `--include-skill`，首次 Apply 要求显式 Profile | 修改 |
| Harness 测试 | 新项目、旧状态、可选已安装项、Source Link 和错误 Profile | 修改 |
| Install/Docs/Knowledge/Bootstrap | 区分发布全集、默认推荐和能力就绪 | 修改 |

## 数据流或调用流

```text
推荐契约 + Distribution Manifest + 安装状态
→ 校验 Profile 与发布白名单
→ 选择显式 / 已记录 / 旧状态兼容 / 默认 Profile
→ Profile Skill ∪ 显式 include-skill ∪ 已有受管发布 Skill
→ 既有 Plan / Apply / Verify
→ 保存 Foundation 版本与 Profile
```

## 关键决策

| 决策 | 备选方案 | 选择理由 | 代价 |
| --- | --- | --- | --- |
| 推荐契约独立于 Manifest | 在 Manifest 条目增加推荐字段 | 避免发布白名单和安装策略再次混为同一事实 | 需要交叉校验两个文件 |
| 只提供 `core` 与 `full` | 为 Web、UI、Tracking 建多个 Preset | 当前只有默认最小集合与全集是稳定直接消费者 | 领域组合仍需单项选择 |
| 维护集合取 Profile 与已有记录并集 | Profile 精确期望状态并自动删除；只更新 Profile 项 | 保持已有能力、用户修改保护和 Upgrade 连续性 | 选择更小 Profile不会卸载 |
| 旧状态无 Profile 视为 `full` | 按新默认 `core` 解释 | 保持已安装项目的既有验证与升级范围 | 旧项目不会自动缩小集合 |
| Source Link 固定 `full` | 为 Profile 创建多个 Symlink 或副本 | 保持 Foundation 源码唯一事实源 | 生产者不能演示子集物理安装 |
| 首次 Apply 要求显式 Profile | 继续静默使用默认 `core`；CLI 内做 TTY 问答 | 显式参数可由 Agent/CI 稳定审计，同时不把对话 Runtime 塞进 CLI | Agent 必须先调用 Recommend 并询问用户 |
| 可选项作为 Profile 上的增量集合 | 为每种组合建 Profile；继续用多次单项安装拼装 | 直接表达 `core + 可选项`，且复用既有 Distribution 安全门禁 | 需要拒绝重复、未知和 `full + include` 冗余组合 |

## Agent、程序与人工分工

- Agent：维护推荐理由、文档语义与领域适用边界。
- 确定性程序：校验 Profile、Manifest、状态、摘要和实际安装内容。
- 人工确认：首次写入前选择 `core`、`full` 或 `core + 可选项`；另行授权 Apply；决定终态、Commit 与 Push。

## 兼容与迁移

- 向后兼容：单项安装命令不变；旧状态无 Profile 时自动按 `full` 计划和验证。
- 数据或配置迁移：下次 Distribution Apply/Upgrade 将 Profile 写入安装状态；不修改业务配置。
- 回退方式：恢复旧 CLI/推荐契约即可继续按旧完整集合工作；没有卸载动作需要恢复。

## 验证策略

| 完成条件 | 实现路径 | 验证方式 | Evidence 来源关系 |
| --- | --- | --- | --- |
| AC-001/004 | 推荐契约与 CLI | 正常/未知/重复/全集漂移单测，CLI 端到端 | 执行观察 |
| AC-002/003 | Distribution/状态 | 新项目、旧全量状态、core+可选项、Upgrade 回归 | 执行观察 + 交叉验证 |
| AC-005 | 既有安全门禁 | 全量 Harness、Source Link、冲突与打包回归 | 交叉验证 |
| AC-006 | 文档与 Skill | 定向术语搜索、Markdown 链接、Eval Replay | 执行观察 |
| AC-007 | 全仓闭环 | npm test/check、Doctor、Distribution、Knowledge、Specflow | 执行观察 |
| AC-008/009 | 推荐输出与首次门禁 | 推荐字段、首次 Plan/Apply、已有状态与 Source Link 聚焦测试 | 执行观察 |
| AC-010 | 组合选择 | API/CLI 正常与重复、未知、冗余负例；Upgrade/Verify 回归 | 执行观察 + 交叉验证 |
| AC-011 | Agent 接入规范 | Install/Bootstrap 定向术语搜索、npm pack 与全量回归 | 执行观察 |

## 风险

| 风险 | 可能性 | 影响 | 缓解方式 |
| --- | --- | --- | --- |
| Upgrade 忘记已有可选 Skill | 中 | 受管内容漂移 | 维护集合始终并入 Manifest 内的现有记录 |
| Verify 因 Profile 缩小而漏检 | 中 | 已安装损坏未发现 | Verify 使用同一维护并集，不只检查 Profile 最小项 |
| 文档仍称完整集合为默认 | 高 | 接入行为冲突 | 使用自然语言一致性定向搜索覆盖所有命中 |
| Apply 门禁误伤已有采用项目或生产者 | 中 | 升级/自举中断 | 仅对没有 Foundation 版本且没有受管记录的普通副本首次 Apply 生效 |

## 增量价值与删除条件

- 直接消费者：使用公开 CLI 接入新项目或升级受管 Skill 的维护 Agent。
- 增量缺口：Host 能发现 Skill，但当前仓库没有区分发布全集与默认推荐集合，也不能持续维护一个已选择的子集。
- 验证：新/旧项目安装状态、Upgrade、Source Link 与源码仓外 CLI 回归共同证明。
- 删除或降级条件：若目标 Host 的原生项目级 Profile 能直接消费本仓推荐契约并提供同等摘要保护，本仓兼容选择入口应退化为内容发布或移除。

## 未决问题

- 无；新增领域 Profile 需要未来真实消费者和评测证据，不在本事项预建。
