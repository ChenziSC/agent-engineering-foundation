# Tasks：建立自然语言工程内容一致性重构 Skill

## 执行规则

- 每个任务都必须关联 Spec 完成条件或 Plan 章节。
- 每个任务都必须有验证方式。
- 范围变化时先更新 Spec，再新增任务。
- 不记录 Commit 日记。

## 任务

### T-01 固定触发、授权与成本契约

- 状态：`done`
- 依赖：无
- 对应：`AC-001`、`AC-002`、`AC-003`
- 输入：用户讨论结论、仓库规则、现有 Skill 和 Eval 契约。
- 动作：定义适用内容、代码排除、审计/重构模式、增量门禁和全文扫描信号。
- 产物：本 Spec、Plan 和新 Skill 的核心工作流。
- 验证：行为边界可由合成 Case 判定，不依赖隐含权限或每次全文扫描。
- 阻塞条件：触发或授权语义存在重大歧义。

### T-02 实现 Skill 与 References

- 状态：`done`
- 依赖：`T-01`
- 对应：`AC-001`、`AC-002`、`AC-003`、`AC-007`
- 输入：已闭合的行为契约、Skill Creator 规范。
- 动作：初始化 Skill，编写中文 SKILL、分层扫描流程和失败模式。
- 产物：`skills/refactor-natural-language-content/`。
- 验证：Frontmatter 仅含 name/description，正文简洁，Reference 无重复事实源。
- 阻塞条件：初始化或结构校验失败。

### T-03 建立行为评估

- 状态：`done`
- 依赖：`T-02`
- 对应：`AC-003`、`AC-004`、`AC-007`
- 输入：Skill 触发、成本和安全门禁。
- 动作：建立 Rubric 和七个完全合成的正向、负向与边界 Case。
- 产物：`skills/refactor-natural-language-content/evals/`。
- 验证：每个 Case 均包含必须、禁止和可观察结果，覆盖 Spec 所列场景。
- 阻塞条件：Case 不能区分正确行为与表面文案。

### T-04 更新仓库入口并验证

- 状态：`done`
- 依赖：`T-03`
- 对应：`AC-005`、`AC-006`、`AC-007`
- 输入：新 Skill、能力地图、成熟度和仓库检查。
- 动作：更新 README、能力地图、问题图谱和成熟度；运行结构、链接、Eval 和敏感信息检查。
- 产物：更新后的仓库入口与 Validation Report。
- 验证：`quick_validate.py`、`npm run check` 和 `git diff --check` 通过。
- 阻塞条件：检查失败或文档将未回放行为写成 `validated`。

## 验收任务

### V-01 完成条件复核

- 状态：`done`
- 依赖：`T-04`
- 动作：逐项检查 Spec 的完成条件，并记录 Knowledge 影响与尚未证明内容。
- 产物：`validation-report.md`。
- 验证：完成项均有文件或检查证据，未完成项不会被标记为完成。

## 状态说明

- `pending`：尚未开始；
- `in-progress`：正在执行；
- `blocked`：缺少输入、授权或依赖；
- `done`：动作和验证均完成；
- `skipped`：经明确决策不再执行，并记录理由。
