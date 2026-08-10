# Spec：Bootstrap 行为增益与连续采用验证

## 背景

`project-context-bootstrap` 已有 6 个行为 Case、Rubric 和一次脱敏真实采用记录，但仍缺少当前职责版本的独立正式 Replay，也没有把宿主原生行为与加载 Skill 后的行为放在相同任务、相同仓库 revision 和相同工具边界下比较。现有证据能证明接入链路可运行，不能证明 Skill 相对主流 Harness Agent 的原生搜索、阅读和推理具有稳定增益。

维护者自有的存量 Web 项目已从默认分支建立独立治理候选，适合提供首批跨新会话观察。该样本规模较小，因此本事项只验证所测行为与首批连续采用表现，不声称已经获得大型项目或长期团队采用结论。

## 目标问题

1. `project-context-bootstrap` 是否能比宿主原生行为更稳定地区分 Bootstrap、普通新会话恢复和领域任务？
2. Skill 是否能减少无边界扫描、避免把治理结构存在误判为项目规则就绪，并保持 Evidence、授权和不确定性边界？
3. 真实采用样本在多个独立只读会话中，是否能稳定复用已建立的规则、Knowledge 和代码入口，而不重复执行 Bootstrap 或污染业务仓库？

## 宿主基线与增量缺口

- 主流 Harness Agent 已能读取项目规则、搜索代码、使用工具、规划任务并报告结果；这些基础行为不属于本仓增量能力。
- 本仓增量只包括：Bootstrap 专有触发边界、候选分类、长期准入状态、项目规则就绪与 Skill 就绪分离、Evidence 分层、停止条件和未授权写入门禁。
- 当前缺口是上述增量尚无同条件 baseline/candidate 对照和完整 Replay，不能仅凭 Skill 文本与结构测试提升成熟度。

## 范围

- 固定真实采用样本的同一不可变 revision，运行宿主原生 baseline 与加载项目级 Skill/规则后的 candidate；
- 至少覆盖项目规则就绪审计、普通新会话恢复和稳定契约复核三类任务；
- 所有执行使用独立只读会话，不修改样本仓库，不保存 Prompt、思维过程、原始工具输入输出、远端、绝对路径或业务敏感配置；
- 将可公开复现的行为沉淀为 Skill Trace、Replay、回归报告和必要 Case 修正；
- 用现有 Skill Eval Runner 校验 candidate Replay；首个消费者阶段不扩展通用 Runner。

## 非目标

- 不证明大型项目、长期团队采用、业务正确性或构建可复现性；
- 不把一次批量运行称为长期数据；
- 不修改样本仓库的业务代码、治理文件、分支历史或远端；
- 不新增通用 Agent Runtime、Trace 平台、模型选择器或 Capability Registry；
- 不记录或比较模型私有推理过程；
- 不实现字段级 AST、运行态数据流或其他 Host Adapter。

## 产物与直接消费者

| 产物 | 直接消费者 |
| --- | --- |
| baseline/candidate 对照协议与脱敏观察报告 | 维护者、成熟度评审 |
| `project-context-bootstrap` 正式 Trace 与 Replay | Skill Eval Runner、后续行为回归 |
| 必要的 Case/Rubric 修正 | 调用该 Skill 的 Agent Host 与评审者 |
| 成熟度和 Knowledge Projection | 采用项目与后续 Specflow 上下文 |

## 完成条件

- AC-001：固定同一真实样本 revision、相同任务输入、只读工具边界和独立会话条件，完成 baseline/candidate 对照协议。
- AC-002：至少三类任务均完成 baseline 与 candidate 观察，并区分事实、程序输出、Agent 判断和不可判定项。
- AC-003：普通新会话任务不会机械触发 Bootstrap；接入/规则审计任务能识别真实缺口并在满足范围后停止。
- AC-004：candidate 没有未授权写入、虚构 Evidence、敏感信息泄露、无边界扫描或把候选当批准事实等阻塞级行为。
- AC-005：6 个现有 Case 全部进入正式 Replay，Trace Evidence 可被 Runner 引用，结果无遗漏且可重复校验。
- AC-006：形成首批连续采用观察，明确它只证明所测任务，不外推为长期或大型项目结论。
- AC-007：只有观察到稳定增益时才调整成熟度；结果持平、回归或不可比较时保持现状并记录原因。
- AC-008：Specflow、Knowledge Projection、Skill Eval、仓库检查和差异检查通过，真实样本工作区与任务开始前相比零新增业务改动。

## 删除条件

- 对照任务无法固定相同输入或只读边界，导致结果不可比较；
- 行为差异只来自宿主原生能力、模型随机性或提示词措辞，没有 Bootstrap 专有增量；
- 公开 Evidence 无法在移除样本标识和敏感细节后保留可复核性。

满足删除条件时不新增 Runner 或抽象层；保留失败或不可判定报告，并移除没有消费者的候选实现。
