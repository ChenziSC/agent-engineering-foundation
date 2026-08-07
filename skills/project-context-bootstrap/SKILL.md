---
name: project-context-bootstrap
description: 从存量项目的规则、长期文档、公开契约、代码入口和测试中推导可供维护者审核的项目规则、稳定契约、Knowledge 与代码入口候选。用于未 Harness 化项目完成只读接入计划后补齐项目特有候选、现有规则或 Knowledge 明显缺失、架构或公开契约变化后需要重建候选，或维护者明确要求审计长期项目上下文时。不用于新会话恢复、普通开发任务的代码调研、自动执行 Harness 化或批准 Knowledge，也不提供 AST 字段切片、完整调用图或运行态数据流分析。
---

# 存量项目上下文与知识候选引导

## 目标

用有限、可追溯的仓库证据生成 `ready-for-review` 候选，帮助维护者决定哪些内容应进入项目规则、长期 Knowledge 或代码入口索引。只推导跨任务稳定内容，不把当前任务状态、临时调用链或 Agent 猜测固化为长期事实。

这里的 Bootstrap 是“存量项目治理接入”，不是 Specflow 的“新会话上下文恢复”。后者由采用方的项目规则和 Context Resolver 负责。

## 开始条件

至少取得可读取的项目目录，以及明确的接入或知识审计目标。开始前记录：

- 项目根目录与候选 revision；Git 不可用时记录可复核的快照边界；
- 目标模块、期望补齐的长期上下文和明确非目标；
- 已存在的根级/模块级规则、Knowledge、Active Spec 和代码入口索引。

若目标项目尚未 Harness 化，并且当前环境可以访问本仓 Harness，先执行只读 `init plan`，记录 Starter 文件的新增、复用和冲突；不要在生成并审核项目特有候选前执行 `init`。目标项目不需要预先安装本仓工具。若本仓 Harness 不可访问，则人工记录同等结构差异，并在报告中标为未执行的确定性计划。

若目标项目已经 Harness 化并提供 Context Resolver，且当前会话尚未解析该项目或命中其刷新条件，先消费 Resolver 的最小加载计划。

## 工作流

1. 从根规则、目标模块规则、Manifest、公开入口、Schema、契约测试和现有 Knowledge 开始，不默认扫描全仓。
2. 盘点现有长期上下文，识别缺失、冲突、重复或需要复核的项目规则、稳定契约与代码入口。
3. 只为证明候选而读取最小实现范围。可用入口、符号或数据元素定位真实定义及邻近测试；满足候选判断后立即停止，不把这一步扩展为普通任务调研或全仓调用图。
4. 将每项结果分为：
   - 项目规则候选：仓库边界、目录职责、禁止事项和工作入口；
   - 稳定契约候选：API/Schema、状态约束、不变量、兼容边界和关键流程；
   - 代码与验证入口候选：后续任务的公开入口、关键实现和契约测试；
   - Knowledge README 导航候选：项目知识库定位、已批准正文链接和常见任务路由的人类可读投影；
   - 能力就绪候选：从完整 Distribution 集合评估每个 Skill 的适用性、项目配置与 Adapter 缺口；
   - 非准入内容：当前任务状态、易变实现、临时调用链和无法证明的推断；
   - 未确认项：证据冲突、来源缺失或必须由维护者裁决的内容。
5. 为每项结论记录 Evidence 路径、定位信息、候选 revision，以及 `observed`、`inferred` 或 `unresolved`。Agent 推断不得提升为代码事实。
6. 对每项候选建议 `create`、`update`、`still-valid`、`review-required` 或 `no-admission`，并给出目标位置、刷新条件和批准人。新候选只能是 `draft`；只有已存在且能找到批准证据的内容才能标为 `existing-approved`。
7. 使用[报告模板](assets/context-bootstrap-report-template.md)输出审核材料。Registry 非空或本次建议创建 Knowledge 时，同时给出 Knowledge README 导航候选；README 只链接和解释，不复制 Digest、完整 Scope 或确定性路由事实。存在 Distribution Manifest 或受管安装记录时，动态枚举完整 Skill 集合，先用项目 Evidence 填写能力就绪矩阵，再合并只需维护者回答的最少问题。对接入前项目，将已审核候选整理为后续 Harness 化输入，并建议在结构接入后通过 Distribution 安装完整公开 Skill 集合；本 Skill 不执行 `init` 或安装。未获得写入授权时只报告建议；获得授权时也先生成草稿，维护者批准前不得写成已生效事实。

需要判断证据优先级、准入或停止边界时读取[详细工作流](references/workflow-and-boundaries.md)。遇到扫描失控、错误批准或职责混淆时读取[失败模式](references/failure-modes.md)。

## 输出状态

- `ready-for-review`：候选、Evidence、建议动作、目标位置、刷新条件和未确认项足以供维护者逐项裁决；不表示候选已经批准或写入。
- `partial`：可以形成部分候选，但 revision、权威来源、范围或关键 Evidence 不完整。
- `blocked`：项目不可读、接入目标无法确定，或关键冲突必须先由维护者裁决。

## 硬性门禁

- 不把该 Skill 用作每次仓库任务或新会话的必经步骤。
- 不把 Host 已有的搜索、阅读、符号定位和调用关系探索包装成独立模式。
- 不把未 Harness 化设计成长期 fallback；先做只读计划和语义候选，再由独立授权完成 Harness 化。
- 不要求目标项目预先安装本仓 Harness，也不把 Section Index 当作普遍前置条件。
- 不在维护者审核候选并明确授权前执行 `init`、人工写入或 Distribution Apply。
- 不以文件名、符号名或文本相似代替真实定义和契约 Evidence。
- 不声称静态阅读覆盖反射、动态注册、运行时注入或外部消费者。
- 不把 Agent 推断、Active Spec 状态、当前任务调用链或未经批准的候选写成稳定事实。
- 不把新候选标为 `approved`，也不因报告状态为 `ready-for-review` 推断已获批准。
- 不把 Knowledge README 变成 Registry、Code Entry Map 或 Resolver 的第二机器事实源。
- 不把 Skill 已安装、目录存在或 Doctor 通过写成项目配置、Adapter 或外部基建已经就绪。
- 不因仓库中未发现某类配置就直接判定 Skill `not-applicable`；缺少维护者决策时使用 `unresolved`。
- 不读取或输出凭证、生产数据、个人信息和与目标无关的敏感配置。
- 不因审计请求修改代码；写入规则、Knowledge、Spec、提交或推送分别遵循用户授权和项目规则。
