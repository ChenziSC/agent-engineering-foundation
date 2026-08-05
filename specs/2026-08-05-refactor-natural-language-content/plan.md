# Plan：建立自然语言工程内容一致性重构 Skill

## 对应 Spec

- 事项 ID：`2026-08-05-refactor-natural-language-content`
- Spec：`./spec.md`

## 方案摘要

采用单一可选 Skill 和行为 Eval，不先抽取 Framework 或实现专用程序。Skill Frontmatter 负责限定触发范围，正文区分只读审计与授权重构，Reference 保存分层扫描和失败模式，Eval 验证触发准确性、语义保真、授权边界和成本门禁。

## 当前证据与假设

| 类型 | 内容 | 来源或验证方式 |
| --- | --- | --- |
| Evidence | 仓库已有 Skill、Eval 方法和静态检查闭环 | `skills/`、`frameworks/skill-eval/`、`npm run check` |
| Evidence | Repository Doctor 已负责目录、引用、Schema 和部分重复来源检查 | `packages/harness/`、能力问题图谱 |
| Evidence | 用户明确排除普通代码修改，并关注每次风险判断的 Token 与时间成本 | 本事项输入 |
| Assumption | 依据请求、差异和搜索命中逐级扩大范围，足以降低首版无条件全文扫描成本 | 合成 Eval 和后续行为回放 |

## 组件与职责

| 组件或目录 | 职责 | 变化类型 |
| --- | --- | --- |
| `skills/refactor-natural-language-content/SKILL.md` | 触发、授权、核心流程和硬性门禁 | 新增 |
| `skills/refactor-natural-language-content/references/` | 分层扫描方法和失败模式 | 新增 |
| `skills/refactor-natural-language-content/evals/` | 触发、成本、授权和语义质量行为案例 | 新增 |
| `specs/2026-08-05-refactor-natural-language-content/` | 当前事项、方案、任务和验证证据 | 新增 |
| README 与能力文档 | 提供入口、成熟度和问题图谱定位 | 修改 |

## 数据流或调用流

```text
用户请求与当前差异
→ 低成本影响门禁
→ 局部检查 / 定向搜索 / 全文语义扫描
→ 问题分类与权威判断
→ 只读审计或授权重构
→ 残留引用和语义复查
```

## 关键决策

| 决策 | 备选方案 | 选择理由 | 代价 |
| --- | --- | --- | --- |
| Skill 支持隐式只读审计和显式重构 | 只允许 `$skill` 手动触发；或隐式直接重构 | 兼顾主动发现与写入授权 | 需要清晰区分两个模式 |
| 每次修改只做增量门禁 | 每次重读全文 | 避免低风险编辑产生线性上下文成本 | 可能延迟发现没有风险信号的远端问题 |
| 首版复用搜索工具 | 新增 Parser 或索引器 | 当前问题主要依赖语义判断，尚无重复程序需求证据 | 超大文档效率依赖宿主工具 |
| 新 Skill 不并入 Repository Doctor | 扩展 Doctor 做语义重构 | 保持程序检查和 Agent 判断分层 | 使用方需要理解两项能力边界 |
| 工作名使用 `refactor-natural-language-content` | 使用更宽泛的 content 或 docs 名称 | 名称以动作开头并明确自然语言范围 | 仍需在描述中限定工程内容 |

## Agent、程序与人工分工

- Agent：判断语义影响、分类冲突与重复、提出或执行授权范围内的重构、复查语义保真。
- 确定性程序：搜索字符串、标题、引用和规则 ID，执行目录、Frontmatter、链接和 Eval 结构检查。
- 人工确认：决定权威来源不明的冲突、批准扩大改写范围，并判断高风险重构是否符合真实意图。

## 兼容与迁移

- 向后兼容：不改变既有 Skill、Specflow 或 Repository Doctor 行为。
- 数据或配置迁移：无。
- 回退方式：删除新增 Skill 和能力入口即可；本事项保持真实记录，不伪造未发生状态。

## 验证策略

| 完成条件 | 实现路径 | 验证方式 |
| --- | --- | --- |
| AC-001～AC-003 | Frontmatter、核心流程和硬性门禁 | Skill 校验、内容走查和负向 Eval |
| AC-004 | 七个合成 Case 和 Rubric | 仓库 Eval 结构检查与人工可判定性走查 |
| AC-005 | 复用 Skill Creator 与 Harness 检查 | `quick_validate.py`、`npm run check`、`git diff --check` |
| AC-006 | 更新仓库入口和成熟度 | 链接与内容一致性检查 |
| AC-007 | 中文独立设计和完全合成案例 | 内容检查与仓库敏感信息门禁 |

## 风险

| 风险 | 可能性 | 影响 | 缓解方式 |
| --- | --- | --- | --- |
| Frontmatter 过长 | 中 | 每轮常驻上下文增加 | 只保留触发和排除条件，细节放正文与 Reference |
| 全文扫描边界含糊 | 中 | 不同 Agent 行为漂移 | 在 workflow Reference 中给出硬信号和退出条件 |
| Eval 只验证文案不验证行为 | 中 | Skill 看似完整但不可用 | Case 明确必须、禁止和可观察产物 |
| 首版没有行为回放 | 高 | 不能声明 `validated` | 成熟度保持 `usable`，明确尚未证明 |

## 未决问题

- [x] 首版不增加专用脚本或 Framework。
- [x] 隐式触发只允许只读审计，显式重构请求才允许扩大改写。
- [x] 普通源代码修改不触发；代码中的 Prompt 只有在自然语言内容本身是主要目标时才纳入。
