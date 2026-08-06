# Plan：补齐契约化上下文与设计验证护栏

## 对应 Spec

- 事项 ID：`2026-08-06-context-contract-and-design-guardrails`
- Spec：`./spec.md`

## 方案摘要

新增一个不带执行引擎的 Context Contract Framework，以严格 Schema 和合成模板定义上下文三层模型；扩充现有 AI 友好仓库、Knowledge、Specflow、Safe Change 和 Change Validation 的说明、模板与行为案例；在该模型稳定后增加 `project-context-bootstrap` Skill，复用现有 Resolver/Section Index 编排最小 Bootstrap 与只读语义切片。保持所有现有生命周期和 Harness 契约不变。

## 当前证据与假设

| 类型 | 内容 | 来源或验证方式 |
| --- | --- | --- |
| Evidence | Context Resolver 已按路径、Active Meta、Registry 和预算生成加载计划 | `packages/harness/` 与 `knowledge/README.md` |
| Evidence | Knowledge 已保存长期事实、设计原因、契约和刷新条件 | `knowledge/README.md`、AI 友好仓库模板 |
| Evidence | Specflow 目前只明确范围变化回 Spec、技术路径变化回 Plan | `skills/specflow/references/workflow.md` |
| Evidence | Change Validation 只证明声明矩阵的结构覆盖，不证明规则充分 | `frameworks/change-validation/README.md` |
| Assumption | 同源性和语义独立性仍需要 Agent 或人工判断 | 不能由路径或 Evidence ID 可靠机械证明 |
| Evidence | Resolver 的 Section Index 已提供标题、行区间、规则位置和 Checklist，但不解释正文 | `packages/harness/src/harness.mjs` 与测试 |

## 变更深度与上下文契约

| 改变对象 | 层级 | 不能猜测的不变量 | 允许依赖的事实 | 回流位置 |
| --- | --- | --- | --- | --- |
| Context Contract 公共结构 | 稳定契约 | 状态所有权、三层职责、Evidence 边界 | 当前 Framework、Knowledge、Specflow 契约 | Spec、Plan |
| Plan 与 Validation 模板 | 稳定工作流 | 范围变化和终态授权规则不变 | 当前 Skill 和行为案例 | Plan |
| 文档措辞与合成示例 | 局部实现 | 不引入内部事实、不夸大成熟度 | 本仓公开规范 | Tasks |
| Bootstrap/Slice Skill | 技术路径 | 不替代 Resolver、Knowledge、Specflow，不把静态搜索伪装为完整调用图 | Context Contract、Section Index、Skill Eval 规则 | Plan、Tasks |

## 组件与职责

| 组件或目录 | 职责 | 变化类型 |
| --- | --- | --- |
| `frameworks/context-contract/` | 定义上下文三层模型和中立数据契约 | 新增 |
| `templates/ai-friendly-repository/` | 给采用方提供接入说明和长期知识模板 | 修改 |
| `knowledge/README.md`、能力地图 | 说明能力边界、成熟度和后续缺口 | 修改 |
| `skills/specflow/` | 编排变更深度、回流和独立验证 | 修改 |
| `skills/safe-change/`、`frameworks/change-validation/` | 显式记录 Evidence 来源关系和结论边界 | 修改 |
| `skills/project-context-bootstrap/` | 编排存量项目最小上下文与任务级动态切片 | 新增 |

## 数据流或调用流

```text
任务目标与仓库证据
→ Context Resolver 选择规则、Knowledge 与 Active Spec
→ Context Contract 区分项目规则、稳定契约与动态切片
→ project-context-bootstrap 复用 Section Index 并生成有边界的候选/切片
→ Specflow 形成方案并声明不变量、事实与验证来源
→ Safe Change / Change Validation 执行声明的覆盖矩阵
→ 独立 Evidence 与设计主张交叉验证
→ Validation Report 保留已证明、未证明与回流决定
```

## 关键决策

| 决策 | 备选方案 | 选择理由 | 代价 |
| --- | --- | --- | --- |
| 先稳定 Framework，再增加一个双模式 Skill | 分别建立 Bootstrap 和 Slice 两个 Skill | 两个模式共享证据、分层和持久化边界，合并可减少重复；模式仍显式区分 | Skill 触发描述需要覆盖两类场景 |
| 复用 Section Index，不在 Skill 内重新分段 | 用 Agent 摘要替代索引 | 保留确定性导航，语义判断只发生在实际读取章节之后 | 需要两阶段读取 |
| 默认只扩展直接关系和一条关键数据链 | 建设完整调用图 | 控制成本并与无 AST 的首版边界一致 | 动态调用和间接消费者可能保持 `partial` |
| 不修改 Change Validation Schema | 增加 Evidence 来源枚举并机械判断独立性 | 来源的语义独立不能由枚举可靠证明，避免制造伪确定性 | Agent/人工仍需判断 |
| 扩充现有 Specflow/Safe Change | 新建技术设计、TDD 和 Review Skill | 现有能力已经拥有相同生命周期和验证职责 | 需要保持 References 简洁 |
| 不强制 UML | 固定图形表达 | 不同项目的高密度契约形式不同 | 采用方需自行选择表示方式 |
| 对整仓复核项做最小契约修正 | 新增命令、Schema 或 CI 矩阵 | 问题来自现有文档和校验边界不一致，修正文案、候选检查和确定性测试即可 | 不验证所有 Node.js 主版本，也不扩展 Eval Evidence 类型系统 |

## Agent、程序与人工分工

- Agent：判断信息层级、变更深度、Evidence 来源关系和是否需要回流。
- 确定性程序：校验 Schema、文件结构、引用和现有 Change Validation 矩阵。
- 人工确认：批准稳定契约，裁决业务语义和真正的 Evidence 独立性。

## 兼容与迁移

- 向后兼容：不改变现有 Meta、Receipt、Change Gate 和 Change Validation v1。
- 数据或配置迁移：Distribution Manifest 新增一个可分发 Skill，不改变采用方既有安装状态。
- 回退方式：移除新增 Framework，并恢复模板与 Skill 文本；不涉及持久化状态迁移。

## 验证策略

| 完成条件 | 实现路径 | 验证方式 | Evidence 来源关系 |
| --- | --- | --- | --- |
| AC-001～AC-003 | Framework、模板、Knowledge 和能力地图 | Schema 解析、链接与仓库检查、人工边界复核 | 结构检查 + 独立内容复核 |
| AC-004～AC-006 | Specflow、Safe Change、Change Validation | Skill 检查、行为案例、文本契约复核 | 行为案例 + 现有确定性检查 |
| AC-007 | Eval 与整仓验证 | 运行测试、Skill Eval 和 Repository Check | 实际命令输出 |
| AC-008 | Git Diff 与范围复核 | 检查未修改目录和公开扫描结果 | 候选差异观察 |
| AC-009～AC-013 | 新 Skill、模板、References 与合成 Cases | Skill Creator 校验、Skill Check、行为边界人工复核 | 结构检查 + 内容复核 |
| AC-014 | 分发和仓库接入 | Distribution Plan、Repository Check、Eval 结构检查与 `npm test` | 实际命令输出 |
| AC-015 | 合成、本仓与私有来源自回放；project-context-bootstrap 独立正式回放 | 保存 self-review Evidence，并为 4 个 Case 保存脱敏正式 Trace/Replay；将失败修复与最终重跑分开记录 | 当前工具观察 + 脱敏人工评分 + Eval Runner 重算；正式 Replay 与 self-review 分开 |
| AC-016 | README、目标仓库设计、CI、Eval Runner 与 Node.js 支持声明 | 文档事实复核、CI 配置检查、Replay 变体摘要回归测试、整仓测试与仓库检查 | 真实 Git 候选 + 确定性测试输出 |

## 风险

| 风险 | 可能性 | 影响 | 缓解方式 |
| --- | --- | --- | --- |
| Schema 过早固化实现细节 | 中 | 后续 Skill 难以适配 | 只表达通用锚点、来源和状态，不定义语言或 Provider 字段 |
| Skill 规则重复 | 中 | 常驻上下文膨胀 | 核心步骤留在 SKILL，详细判断放 References 和模板 |
| 行为案例与实际 Skill 不一致 | 低 | 成熟度误判 | 修改现有案例并运行动态 Eval 覆盖检查 |

## 未决问题

- 无阻塞问题；首版不建立语言专用静态分析脚本，真实采用效果由后续行为回放验证。
