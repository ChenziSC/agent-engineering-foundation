---
name: project-context-bootstrap
description: 从可访问仓库的规则、Knowledge、Active Spec、代码、Schema、配置和测试建立项目上下文候选，或围绕当前开发任务生成只读代码语义切片。用于首次接入存量项目、Agent 缺少可靠的项目边界或不变量、任务开始前需要定位入口/符号/数据元素/直接消费者/异常与测试，或大型 Active Spec 需要结合 Section Index 按需读取时。不用于替代宿主上下文窗口、Markdown Section Index 或完整调用图/数据流分析器，也不在未经批准时把 Agent 推断写入长期 Knowledge。
---

# 项目上下文引导与任务切片

## 目标

用有限、可追溯的仓库证据建立“足以继续工作”的上下文。区分长期稳定事实与当前任务视图，避免每次会话重读全仓，也避免把易变实现静默固化为长期知识。

## 选择模式

- `bootstrap`：首次接入存量项目，或需要重建项目规则、稳定契约候选、代码入口和未确认项。
- `slice`：已有明确任务，需要定位相关入口、符号、数据元素、直接消费者、异常路径和验证入口。
- 两者都需要时，先执行最小 `bootstrap`，只建立完成当前任务所需的规则与契约候选，再执行 `slice`；不要借机全面盘点全仓。

## 开始条件

至少需要可读取的项目目录，以及项目接入目标或当前任务目标。开始前记录：

- 项目根目录与候选版本；Git 可用时记录 revision，不可用时记录明确的快照说明并将结论标为 `partial`；
- 用户要求、目标路径和非目标；
- 已存在的根级/模块级规则、Knowledge、Active Spec 和代码入口映射。

若项目提供本仓 Harness，先运行 `context resolve`：

```bash
node <foundation-repo>/packages/harness/bin/agent-foundation.mjs context resolve \
  --target <project-root> \
  --task-type "<任务类型>" \
  --paths <相关路径>
```

等待 Resolver 完整返回后再搜索 Active Spec 正文。消费其加载计划；对标记为 `sectioned` 的 Spec，先读取 Section Index，再展开与目标、完成条件、非目标、兼容、未完成任务相关的章节。在选定章节前，将该 Spec 的核心文档排除在广泛 `rg`、全文读取和并行搜索之外。不要重新实现 Markdown 分段，也不要总结未读取章节。

## Bootstrap 工作流

1. 从根规则、目标模块规则、Manifest、公开入口、Schema 和邻近测试开始，不默认扫描全仓。
2. 把观察结果分为：
   - 项目规则：仓库边界、目录职责、禁止事项和工作入口；
   - 稳定契约候选：API/Schema、状态约束、不变量、兼容边界和关键流程；
   - 动态视图锚点：后续任务可从何处按入口、符号或数据元素展开；
   - 未确认项：证据冲突、来源缺失或必须由维护者裁决的内容。
3. 为每项结论记录 Evidence 路径、定位信息和观察状态；Agent 推断必须与代码事实分开。
4. 只输出建议写入位置。用户已授权接入时可以生成草稿，但稳定契约在维护者批准前保持 `draft`，不得伪装成已批准 Knowledge。
5. 使用[报告模板](assets/context-bootstrap-report-template.md)输出采用建议，并按[详细工作流](references/workflow-and-boundaries.md)控制扫描范围。

## Slice 工作流

1. 从任务目标提取至少一个锚点：
   - `entrypoint`：路由、命令、事件、接口或用户场景入口；
   - `symbol`：函数、组件、类型、配置项或其他可定位符号；
   - `data_element`：请求字段、状态字段或 Schema 属性。
2. 定位锚点的真实定义，记录路径、符号或行号；同名命中不能直接视为同一语义。
3. 默认只扩展直接关系：入口处理者、核心被调用符号、直接调用者/消费者、相关类型或 Schema、异常/降级/兼容分支，以及最接近的测试。
4. 选择一条与任务判断有关的关键数据链，从输入、转换到输出或持久化位置。只有直接关系不足以解释目标行为时才继续深入，并说明扩展原因。
5. 到达公开契约、已有稳定 Knowledge、第三方边界或无关模块时停止；不为了“完整”构建全仓调用图。
6. 将内容分别标为 `observed`、`inferred` 或 `unresolved`，并绑定候选版本和 Evidence。缺少消费者、动态调用或运行态证据时保持可见，不补成确定事实。
7. 使用[任务切片模板](assets/task-context-slice-template.md)输出。存在 Active Spec 时，详细切片进入 Research 或 Evidence，Plan 只保留精简调用链和引用；不要直接写入长期 Knowledge。

## 输出状态

- `complete`：锚点、关键关系、边界、Evidence 和未确认项足以支持当前任务决策。
- `partial`：可以形成有限上下文，但版本、消费者、动态分支或运行证据不完整。
- `blocked`：项目不可读、任务目标无法定位，或关键冲突必须先由维护者裁决。

`complete` 只表示当前上下文切片闭合，不表示实现、测试或交付已经完成。

## 硬性门禁

- 不把字节预算或宿主上下文窗口当作语义切片规则。
- 不以文件名、符号名或文本相似代替真实定义和调用 Evidence。
- 不声称静态搜索覆盖反射、动态注册、运行时注入或外部消费者。
- 不把 Agent 推断、任务临时调用链或未经批准的候选写成稳定事实。
- 不复制 Active Spec 状态到 Knowledge，也不把 Context Slice 变成第二套任务状态。
- 不读取或输出凭证、生产数据、个人信息和与任务无关的敏感配置。
- 不因分析请求修改代码；写入规则、Knowledge、Spec、提交或推送分别遵循用户授权和项目规则。

常见误用与修正方式见[失败模式](references/failure-modes.md)。
