# Tasks：补齐契约化上下文与设计验证护栏

## 执行规则

- 每个任务都必须关联 Spec 完成条件或 Plan 章节。
- 每个任务都必须有验证方式。
- 范围变化时先更新 Spec，再新增任务。
- 不记录 Commit 日记。

## 任务

### T-01 建立事项与技术边界

- 状态：`done`
- 依赖：无
- 对应：`AC-008` / Plan「关键决策」
- 输入：维护者确认的两个 P0 和暂缓项。
- 动作：建立 Spec、Plan、Tasks 和 Meta，冻结非目标。
- 产物：本事项目录。
- 验证：Context Resolver 可识别事项，Meta 与产物 ID 一致。
- 阻塞条件：生命周期或多 Spec 模型必须变化。

### T-02 建立 Context Contract Framework

- 状态：`done`
- 依赖：`T-01`
- 对应：`AC-001`、`AC-002`
- 输入：Context、Knowledge、Specflow 与 Evidence 的现有职责。
- 动作：编写三层模型、Schema 和完全合成模板。
- 产物：`frameworks/context-contract/`。
- 验证：JSON/Schema 可解析，模型不复制其他能力的状态。
- 阻塞条件：需要绑定具体语言或 Provider 才能表达核心契约。

### T-03 接入 AI 友好仓库与能力地图

- 状态：`done`
- 依赖：`T-02`
- 对应：`AC-003`
- 输入：Context Contract 公共模型。
- 动作：更新采用顺序、Knowledge 边界、能力地图和问题图谱。
- 产物：模板、Knowledge 入口和 Docs 更新。
- 验证：链接可达，成熟度只标记为 `designed`。
- 阻塞条件：需要修改 Context Resolver 才能完成首版采用。

### T-04 增强 Specflow 变更回流与验证设计

- 状态：`done`
- 依赖：`T-02`
- 对应：`AC-004`、`AC-005`
- 输入：现有 Plan、Validation Report 和 Workflow。
- 动作：加入变更深度、不变量、允许事实、回流位置和 Evidence 来源关系。
- 产物：Specflow Assets、References 和核心规则更新。
- 验证：Skill 检查通过，职责没有与 Safe Change 重复。
- 阻塞条件：需要修改 Meta 或生命周期状态机。

### T-05 增强独立验证边界

- 状态：`done`
- 依赖：`T-04`
- 对应：`AC-006`
- 输入：Evidence 与 Change Validation 现有结论边界。
- 动作：明确同源设计不能作为唯一证据，并在报告中记录来源关系。
- 产物：Validation Report、Safe Change、Change Validation 说明和模板更新。
- 验证：不会把结构矩阵校验描述成业务正确性证明。
- 阻塞条件：必须由程序自动判断语义独立性。

### T-06 更新行为评估

- 状态：`done`
- 依赖：`T-04`、`T-05`
- 对应：`AC-007`
- 输入：Specflow 与 Safe Change 新规则。
- 动作：更新既有行为案例、Rubric 和脱敏 Trace 描述。
- 产物：Skill Eval 更新。
- 验证：Eval Runner 覆盖真实 Case 且评分引用有效。
- 阻塞条件：需要外部模型或真实项目数据。

### T-07 实现项目上下文 Bootstrap 与任务切片 Skill

- 状态：`done`
- 依赖：`T-02`、`T-03`
- 对应：`AC-009`～`AC-013`
- 输入：Context Contract、Context Resolver、Section Index、Knowledge 与 Specflow 的现有边界。
- 动作：建立双模式 Skill，补充 Section Index 消费规则、锚点扩展和停止边界、中文输出模板、失败模式与合成行为案例。
- 产物：`skills/project-context-bootstrap/`。
- 验证：Skill Creator 与仓库 Skill Check 通过；正文不声称拥有 AST、完整调用图或运行态分析能力。
- 阻塞条件：必须修改 Harness 或引入语言专用依赖才能形成最小可用流程。

### T-08 接入分发、能力地图与自举治理

- 状态：`done`
- 依赖：`T-07`
- 对应：`AC-014`
- 输入：完成的 Skill 目录与现有成熟度模型。
- 动作：登记 Distribution Manifest，更新能力地图、问题图谱、Knowledge 路由和事项投影。
- 产物：分发与文档更新、Knowledge Projection。
- 验证：摘要与真实目录一致，成熟度不高于实际 Evidence。
- 阻塞条件：Distribution 契约无法表达新增 Skill。

### T-09 验证 P1 Skill 与整仓回归

- 状态：`done`
- 依赖：`T-08`
- 对应：`AC-009`～`AC-014`
- 输入：新增 Skill、分发与自举更新。
- 动作：运行 Skill、Eval 结构、Specflow、Knowledge、Distribution、敏感扫描、Repository 和整仓测试。
- 产物：更新后的 `validation-report.md`。
- 验证：命令实际通过；成熟度只按已有正式 Trace/Replay 证据判断，没有正式回放时保持 `usable`。
- 阻塞条件：结构或内容检查发现未解决问题。

### T-10 执行当前会话前向自回放

- 状态：`done`
- 依赖：`T-09`
- 对应：`AC-015`
- 输入：4 个合成 Case、本仓真实结构和一个本地私有参考仓库。
- 动作：执行合成、本仓和私有参考仓库只读验证；保存脱敏 Trace 与 `replay.self.json`；记录首次失败、修复和重跑结果。
- 产物：Skill self-review Evidence、更新后的 Skill 和 Validation Report。
- 验证：Eval Runner 使用非正式 Replay 通过；公开产物不含私有仓库名称、真实路径、业务名、内部平台或原始 Trace；成熟度保持 `usable`。
- 阻塞条件：无法在不泄露内部信息的情况下形成可复核证据。

### T-11 独立验证 project-context-bootstrap Skill

- 状态：`done`
- 依赖：`T-10`
- 对应：`AC-014`、`AC-015`
- 输入：4 个 Eval Case、完全合成项目、本仓真实结构和现有 Skill/Distribution 契约。
- 动作：不参考既有 Replay 的评分结论，按四个 Case 在合成项目和本仓独立回放；保存脱敏正式 Trace/Replay；发现并修复 Distribution Manifest 内容摘要漂移后重跑。
- 产物：`skills/project-context-bootstrap/evals/replay.json`、独立 Trace、更新后的 Distribution Manifest 和验证证据。
- 验证：Eval 4/4 Case 通过、平均分 100；Skill Check、Distribution Plan/Apply/Verify、Repository Check、`npm test` 80/80 和 `git diff --check` 通过；无 Commit、Push 或归档。
- 阻塞条件：Trace 无法脱敏、Runner 无法重算，或任一正式门禁失败。

## 验收任务

### V-01 完成原 P0 条件复核

- 状态：`done`
- 依赖：`T-02`～`T-06`
- 动作：执行 Framework、Skill、Specflow、Knowledge、Repository 和测试检查，逐项复核 AC。
- 产物：`validation-report.md`。
- 验证：完成项均有真实命令或文件 Evidence，未证明项保持可见。

### V-02 完成 P1 Skill 条件复核

- 状态：`done`
- 依赖：`T-07`～`T-11`
- 动作：逐项复核 AC-009～AC-015、独立正式 Replay、Git Diff、成熟度和未证明项。
- 产物：更新后的 `validation-report.md`。
- 验证：Skill 可被发现和分发，4 个 Case 的正式 Replay 可重算，Section Index/语义切片职责不重叠，未越权执行提交或推送。

## 状态说明

- `pending`：尚未开始；
- `in-progress`：正在执行；
- `blocked`：缺少输入、授权或依赖；
- `done`：动作和验证均完成；
- `skipped`：经明确决策不再执行，并记录理由。
