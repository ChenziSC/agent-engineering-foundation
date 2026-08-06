# Spec：补齐契约化上下文与设计验证护栏

## 基本信息

- 事项 ID：`2026-08-06-context-contract-and-design-guardrails`
- 状态：`In Progress`
- 创建日期：`2026-08-06`
- 影响范围：上下文契约、AI 友好仓库模板、Specflow、安全变更和能力地图

## 输入来源

| 类型 | 引用或摘要 | 日期 | 适用范围 |
| --- | --- | --- | --- |
| 维护者决策 | 先补齐契约化上下文、Specflow 回流和独立验证，再继续建设最小存量项目 Bootstrap 与任务切片 Skill；不建设 AST 或运行态平台 | 2026-08-06 | 本事项全部范围 |
| 当前仓库证据 | Context Resolver 已解决最小加载，但没有统一定义稳定契约与任务级动态切片的内容边界 | 2026-08-06 | Context Contract |
| 当前仓库证据 | Specflow、Safe Change 和 Change Validation 已建立验证流程，但没有明确禁止同源设计说明作为唯一正确性证据 | 2026-08-06 | 设计与验证护栏 |

本公开 Spec 只记录通用问题和自行编写的方案，不记录受限来源、内部平台、真实项目、人员、链接、指标或实现细节。

## 背景与目标

本仓已有规则、Knowledge、Active Spec 和 Context Resolver，可以决定一次任务需要加载哪些内容；但采用方仍缺少统一模型来区分必须长期维护的项目规则、需要人工批准的稳定契约，以及只应按任务动态生成的实现切片。结果可能是长期知识保存过多易变细节，或 Agent 在关键不变量上自行猜测。

现有 Specflow 能在范围变化时返回 Spec、技术路径变化时返回 Plan，但对公共契约、不变量、局部实现和验证补充的回流边界仍较粗。设计生成的检查也可能被误当作设计本身正确的充分证据。

目标是以最小改造补齐三项通用能力：

1. 提供 Provider-neutral 的 Context Contract，明确项目规则、稳定契约和动态切片的职责、来源与人工所有权；
2. 让 Specflow 和 Safe Change 在设计、实施与验证时显式判断变更深度，并要求至少一种与待验证主张相对独立的真实 Evidence；
3. 提供可直接消费 Context Resolver 与 Section Index 的 `project-context-bootstrap` Skill，在存量项目接入时生成三层上下文候选，在日常任务中生成有版本和 Evidence 的代码语义切片。

## 非目标

- 不实现 AST、完整调用图、字段级数据流、运行态拓扑或消费者发现引擎；
- 不新增远端知识平台、数据库或特定 Provider Adapter；
- 不修改 Specflow Meta、Receipt、Lifecycle、Change Gate 或多 Spec 关联契约；
- 不把 UML 或任一图形表示设为强制产物；
- 不声称结构校验可以证明契约内容和业务语义正确。

## 用户或调用场景

1. 新项目建立 Agent 上下文时，维护者能判断某项信息属于项目规则、稳定契约还是任务级动态切片。
2. Agent 形成技术方案时，能列出不能猜测的不变量、允许使用的事实及需要的独立 Evidence。
3. 实施过程中出现变化时，Agent 能按产品行为、稳定契约、技术路径或局部实现回到正确产物。
4. 验证规则来自同一份设计时，Agent 不会只凭该设计的自述或自生成清单输出 `validated`。
5. 存量项目首次接入时，Agent 能以目标范围为边界生成规则、稳定契约候选、动态锚点和未确认项。
6. 开发任务开始前，Agent 能复用 Section Index，并围绕入口、符号或数据元素生成有停止边界的语义切片。

## 输出与行为契约

- Context Contract 有公开的问题模型、严格 Schema 和完全合成模板；
- AI 友好仓库模板解释三层上下文及其与 Knowledge、Specflow、Evidence 的关系；
- Specflow Plan 和 Validation Report 显式记录变更深度、不变量、可用事实和 Evidence 来源关系；
- Safe Change 与 Change Validation 明确“矩阵完整”和“业务正确”是不同结论；
- Skill 行为案例覆盖契约变化回流与同源验证不足；
- 新增内容不依赖任何公司或供应商平台；
- Bootstrap/Slice 输出区分观察事实、Agent 推断和未确认项，并绑定 revision 或明确快照；动态切片由当前 Spec 拥有，不自动进入 Knowledge。

## 完成条件

- [x] **AC-001** `frameworks/context-contract/` 定义项目规则、稳定契约和动态切片三层模型，且不与 Context Resolver、Knowledge、Specflow 或 Evidence 争夺状态所有权。
- [x] **AC-002** Context Contract Schema 与模板能够表达范围、人工所有权、稳定约束、动态视图锚点、Evidence、未确认项和刷新条件，示例完全合成。
- [x] **AC-003** AI 友好仓库与 Knowledge 入口说明何时长期保存契约、何时只生成任务切片，并能路由到 Context Contract。
- [x] **AC-004** Specflow Plan 要求判断变更深度、不可猜测的不变量、允许依赖的事实和独立验证来源。
- [x] **AC-005** Specflow 工作流明确产品行为、稳定契约、技术路径、局部实现和纯验证变化各自的回流位置。
- [x] **AC-006** Validation Report、Safe Change 与 Change Validation 明确同源设计说明或自生成清单不能作为唯一正确性证据。
- [x] **AC-007** Specflow 和 Safe Change 的行为评估覆盖本次新增规则，相关 Skill 与仓库检查通过。
- [x] **AC-008** 本事项不修改生命周期、Change Gate、多 Spec、Harness 命令或外部 Adapter，不把设计模型标记为已实现的分析引擎。
- [x] **AC-009** `project-context-bootstrap` 同时提供最小 `bootstrap` 与任务级 `slice` 模式，触发边界和输出状态清晰。
- [x] **AC-010** Skill 复用 Context Resolver 和 Markdown Section Index；索引只负责导航，读取相关章节原文后才形成语义结论。
- [x] **AC-011** Slice 至少支持 `entrypoint`、`symbol`、`data_element` 锚点，并覆盖直接消费者、关键数据链、异常/兼容边界、验证入口和停止条件。
- [x] **AC-012** Bootstrap 和 Slice 明确 revision/Evidence、`observed`/`inferred`/`unresolved`、稳定契约人工批准以及敏感信息边界。
- [x] **AC-013** Skill 提供中文模板、参考规则和合成行为 Eval，不依赖语言专用分析器或公司基建。
- [x] **AC-014** Skill 进入 Distribution Manifest 和能力地图，Skill Check、Repository Check、Eval 结构检查及整仓测试通过；没有正式行为回放时不标记为 `validated`。
- [x] **AC-015** 当前事项保存四个合成 Case、本仓自举任务和私有参考仓库只读对照的脱敏 self-review Evidence；project-context-bootstrap 另以独立正式 Replay 完成四个 Case 的合成项目与本仓回放，self-review 不作为唯一验证证据，发现的分发摘要漂移已修复并通过重跑。
- [x] **AC-016** 整仓复核发现的事实与校验边界已修正：长期文档不复制当前 Active 事项集合或工作区状态，多 Spec Change Gate 表述与实现一致，CI 对真实候选执行空白检查，非正式 Replay 变体不影响 Skill 行为摘要，声明的最低 Node.js 版本与 CI 验证版本一致。

## 约束

- 技术约束：Schema 使用 JSON Schema 2020-12；首版不新增运行时依赖。
- 兼容约束：不改变现有 Specflow 和 Change Validation 数据格式。
- 权限与安全约束：不执行提交、推送、发布或外部状态变更。
- 数据与隐私约束：示例只使用合成目录、接口和数据。

## 风险、假设与待确认项

| 类型 | 内容 | 影响 | 处理方式 | 状态 |
| --- | --- | --- | --- | --- |
| Risk | Context Contract 与 Knowledge 重复 | 形成第二事实源 | 规定稳定契约由 Knowledge 拥有，Contract 是可复制结构；动态视图留在当前事项 | resolved |
| Risk | “独立 Evidence”被误解为程序可证明语义独立 | 产生虚假安全感 | 只建立记录和行为门禁，明确仍需 Agent 或人工判断来源关系 | resolved |
| Assumption | 首版无需 AST 或运行态 Provider 即可验证模型价值 | 控制实现范围 | 以 Schema、模板、行为案例和人工采用路径交付 | accepted |

## 关联事项

- 父事项：无
- 子事项：无
- 取代：无
- 被取代：无

## Section Index

| 章节 | 说明 | 何时需要读取 |
| --- | --- | --- |
| 背景与目标 | 当前缺口与目标结果 | 判断设计必要性时 |
| 完成条件 | 本次 P0 的验收边界 | 规划和验证时 |
| 非目标 | 防止扩张为复杂平台 | 评估新增实现时 |
