# Plan：修复全仓自然语言事实漂移与术语不一致

## 对应 Spec

- 事项 ID：`2026-08-06-repository-content-consistency-repair`
- Spec：`./spec.md`

## 方案摘要

以 Meta、实际目录、可运行实现、自动化测试和 Eval Evidence 为事实来源，按审计风险从高到低修改当前规范性文件。优先去除 Spec 中的动态状态副本，再校准当前能力与成熟度，最后统一术语和说明语言。已归档事项只用于证明历史风险，不作为改写对象。

## 当前证据与假设

| 类型 | 内容 | 来源或验证方式 |
| --- | --- | --- |
| Evidence | 三个旧事项 Meta 均为 `archived`，Spec 正文均保留 `In Progress` | Meta 与 Spec 交叉检查 |
| Evidence | `frameworks/` 有 9 个实际目录，现有设计文档只列 5 个 | 目录清单与 `docs/02` |
| Evidence | Web Evidence、Checkpoint、Evidence 和组件 Validator 均有参考实现及测试 | Framework/Skill 实现、`npm test` |
| Evidence | 9 个 Skill 分为 Replay、报告/Trace 和 Case/Rubric 三种证据形态 | `skills/*/evals/` 全量清单 |
| Assumption | 文档读者需要当前能力状态，而不是重现首轮建设计划 | 与 `docs/05` 当前成熟度表的职责一致 |

## 变更深度与上下文契约

| 改变对象 | 层级 | 不能猜测的不变量 | 允许依赖的事实 | 回流位置 |
| --- | --- | --- | --- | --- |
| Spec 产物职责 | 稳定契约 | Meta 仍是状态、关系和范围的唯一事实来源 | AGENTS、Specflow Skill、Knowledge 现有规则 | Spec / Plan / Knowledge |
| 能力成熟度说明 | 稳定契约 | 不将局部实现扩大为完整产品能力 | 目录、实现、测试和 Eval Evidence | Spec / Plan |
| 术语和示例说明 | 局部实现 | 不改变 Schema 键或公开契约 | 正式 Schema 与中文优先规则 | Tasks |

## 组件与职责

| 组件或目录 | 职责 | 变化类型 |
| --- | --- | --- |
| `skills/specflow/` | 产物职责与 Spec 模板 | 修改 |
| `docs/` | 当前能力、成熟度与证据分类 | 修改 |
| `templates/` / `blueprints/` | 采用说明和稳定术语 | 修改 |
| `knowledge/` | 长期自举治理契约和来源新鲜度 | 修改 |
| `distribution/` | 受影响 Skill 内容摘要 | 机械刷新 |
| 当前事项目录 | 范围、方案、任务和验证 | 新增/修改 |

## 数据流或调用流

```text
审计问题
→ 权威事实与实现证据
→ 当前规范/说明/模板修复
→ 旧术语与冲突反向搜索
→ Harness 检查与全量测试
→ Validation Report
```

## 关键决策

| 决策 | 备选方案 | 选择理由 | 代价 |
| --- | --- | --- | --- |
| Spec 只引用 Meta，不保存动态副本 | 保留创建时快照 | 与唯一事实来源契约一致，避免漂移 | 单独阅读 Spec 时需跟随 Meta 链接 |
| 用“当前子集 / 完整缺口”代替首期叙事 | 保留历史路线图表达 | 能同时保留真实能力与未实现边界 | 需更新多个能力说明 |
| 保留历史封存文本 | 直接统一旧 Spec/Tasks | 遵守 Receipt 不可变和不伪造历史原则 | 搜索仍会看到旧状态 |

## Agent、程序与人工分工

- Agent：判断权威表达、子集边界、术语和不可变历史。
- 确定性程序：校验 Meta、Schema、链接、摘要、Eval 与测试。
- 人工确认：本轮无未决权威冲突；终态收口仍需用户另行明确授权。

## 兼容与迁移

- 向后兼容：不改变文件路径、Schema 或 CLI；新 Spec 只需通过 Meta 获得动态事实。
- 数据或配置迁移：无。
- 回退方式：逐文件恢复文案；不涉及数据或外部系统。

## 验证策略

| 完成条件 | 实现路径 | 验证方式 | Evidence 来源关系 |
| --- | --- | --- | --- |
| AC-001 | Specflow Skill 与 Spec 模板 | 搜索模板的状态/关系/范围副本，运行 `specflow check` | 执行观察 + 交叉验证 |
| AC-002 | `docs/02`、`docs/05`、P0-01/05/08 | 对照目录、脚本、测试和成熟度表，搜索旧叙事 | 交叉验证 |
| AC-003 | 组件 Template/Blueprint | 对照现有 Validator 命令与生产化缺口 | 交叉验证 |
| AC-004 | P0-06 | 动态统计 Skill 和 Eval 证据形态 | 执行观察 |
| AC-005 | 模板、Reference、Schema Example | 搜索旧术语和英文说明 | 交叉验证 |
| AC-006 | Distribution、Knowledge、Harness | `npm run check`、`npm test`、`git diff --check` | 执行观察 |

## 风险

| 风险 | 可能性 | 影响 | 缓解方式 |
| --- | --- | --- | --- |
| 文案修复超出审计问题 | 中 | 制造无关差异 | 仅修改已确认的冲突、事实漂移和术语 |
| 摘要刷新算法与 Distribution 不一致 | 低 | 检查失败 | 使用 Harness 内同一摘要函数或由检查结果反向验证 |
| 历史文本被误修改 | 低 | Receipt 摘要失效 | 变更清单明确排除旧事项正文 |

## 未决问题

- [x] 历史 Spec/Tasks 是否统一：否，保留封存证据。
- [x] 是否新增 Validator：否，本轮只修复自然语权威与模板。
