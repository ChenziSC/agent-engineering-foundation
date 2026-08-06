# P0-06 Skill 行为评估

## 定位

给定 Skill 定义、合成案例、执行 Trace 和评分 Rubric，产出可比较的行为评分、失败证据和版本回归报告，而不只检查文件格式。

## 交付形态

- 当前：Skill 行为评估方法论 + Case、Rubric、Trace/报告模板 + 零依赖 Runner/Scorer/比较器；
- 成熟度：`reference-implemented`；
- 当前边界：不调用或选择模型，不自动判断语义评分是否正确，不归一化宿主原始 Trace；
- 未来可选：宿主 Trace 归一化和 Meta Eval。

当前产物：[Skill 行为评估方法与模板](../../frameworks/skill-eval/README.md)。

## 调用与不调用条件

应该调用：

- 新增或修改分析、生成、评审、规划类 Skill；
- Skill 的触发、输出或安全行为需要回归；
- 需要比较两个 Skill 版本或两次运行结果；
- 需要验证 Agent 是否遵守证据和人工门禁。

不应调用：

- 只需要验证 Parser、Schema 或状态机；
- 没有预期行为和评分规则；
- 输入案例包含未经授权的真实敏感数据。

## 输入

必需输入：

- Skill 定义和版本；
- Eval Case；
- Rubric；
- 可归一化的执行 Trace 或待运行配置。

可选输入：

- 基线版本结果；
- 宿主和工具配置；
- 影响复核的调用环境说明；
- 人工评分；
- 允许的波动范围。

## 输出契约

- `NormalizedTrace`：与宿主无关的关键行为序列；
- `CaseScore`：逐项评分、证据和阻塞项；
- `RunReport`：一轮 Eval 的汇总；
- `RegressionReport`：与基线的差异；
- `MetaEvalReport`：评分器自身的可靠性检查；
- `status`：`pass`、`fail`、`blocked` 或 `inconclusive`。

分数必须关联具体 Trace 或产物证据；无法观察的行为不能默认为通过。

## 职责划分

Agent 或人工负责：

- 定义需要评估的行为；
- 编写或评审 Rubric；
- 解释需要语义判断的输出质量；
- 裁决无法自动判断的边界案例。

程序负责：

- 校验 Case 和 Rubric Schema；
- 校验脱敏 Trace 的 Evidence 引用和真实 Case 全量覆盖；
- 运行阻塞优先评分；
- 聚合评分；
- 生成版本差异和回归报告。

自动评分器不得覆盖人工设定的阻塞项。

## 评估维度

- 触发准确度；
- 输入识别；
- 流程覆盖；
- 安全门禁；
- 证据纪律；
- 输出结构；
- 失败与恢复；
- 版本回归。

每个 Eval Case 至少描述用户请求、输入材料、预期触发原因、必须动作、禁止动作、必须产物、阻塞条件和评分规则。

## 依赖与资产所有权

- 评估方法论：定义 Case、Rubric、Trace 和报告的语义；
- `skills/<name>/evals/`：拥有该 Skill 的案例、Fixture 和 Rubric；
- 仓库顶层 `evals/`：只拥有跨 Skill 的集成回归和仓库级安全案例；
- 单元测试验证确定性程序，Eval 验证 Agent 行为，两者不互相替代；
- 本仓 `frameworks/skill-eval/scripts/eval-runner.mjs` 统一提供 Runner、Scorer 和比较器。

## 非目标与安全边界

- 不用单一分数代替失败证据；
- 不声称 Eval 覆盖真实世界全部输入；
- 不把生产数据直接作为公开 Fixture；
- 不把调用环境的非确定性波动误报为确定性程序错误；
- 不执行未经授权的外部写操作；
- 不用 Eval 替代单元测试、集成测试或人工 Review。

## 当前资源

- 方法论文档：评估维度、评分偏差、Trace 证据和失败模式；
- 模板：Case、Rubric、单次报告和版本对比报告；
- 合成案例：安全门禁、虚构 Evidence、阻塞级回归和证据不足；
- `scripts/`、Schema 和 `tests/`：动态读取真实 Case、封存摘要、阻塞优先评分与版本比较；
- `evals/`：五个现有 Skill 均保存正式行为回放，新增三项可由 Replay 配置重算。

## 合成应用案例

1. 合成 Skill 正确拒绝副作用请求，应通过安全门禁评分。
2. 合成输出结构完整但引用了不存在的 Evidence，必须因证据纪律失败。
3. 两个合成版本总分相近，但新版新增一个阻塞级违规，回归报告必须判定失败。
4. 合成 Trace 缺少关键工具结果，评分应为 inconclusive 而不是自动通过。

## 当前验收

- 提供 Case、Rubric、Trace 证据和报告模板；
- 说明如何人工回放和评分；
- Skill 本地 Eval 与仓库级 Eval 职责无重复；
- 四个合成案例覆盖通过、失败、回归和不可判定；
- 评分必须能追溯到具体产物或行为证据。
- Runner 遗漏真实 Case、引用不存在 Evidence 或新增阻塞级违规时确定性失败。

## 未来可选工程化

- Trace 归一化；
- Meta Eval；
- 确定性组件测试。
