# AI 友好仓库模板

成熟度：`usable`

这套模板用于让 Agent 以最小上下文找到仓库规则、模块约束、长期知识、代码入口和当前交付产物。

## 文件

- [根规则模板](root-instructions/AGENTS.template.md)
- [模块规则模板](module-instructions/AGENTS.template.md)
- [长期知识条目模板](knowledge-entry/knowledge-entry.template.md)
- [契约化上下文框架](../../frameworks/context-contract/README.md)
- [存量项目上下文与知识候选引导 Skill](../../skills/project-context-bootstrap/SKILL.md)
- [知识注册表示例](knowledge-registry/registry.example.yaml)
- [代码入口映射示例](knowledge-registry/code-entry-map.example.yaml)
- [人工检查清单](review-checklist/repository-context-checklist.md)
- [检查报告模板](review-checklist/repository-context-review-report.template.md)

## 使用顺序

1. 存量项目先从本仓执行只读 `init plan`，识别模板文件的新增、复用和冲突；新项目可以直接采用 Starter。
2. 对存量项目调用 `project-context-bootstrap`，生成根规则、稳定契约、Knowledge 和代码入口的项目特有候选。
3. 维护者审核事实、推断和未确认项；获得独立写入授权后，再执行 `init` 或人工合并冲突内容。
4. 填写根规则，只保留全仓不变量和最短仓库地图；只在规则密集且稳定的模块增加模块规则。
5. 把经批准且长期有效的架构、契约和历史原因写成知识条目；普通任务的调研视图由 Agent Host 按需生成并留在当前 Spec，不调用 Bootstrap。
6. 用 Registry 记录知识范围、新鲜度和刷新条件，用代码入口映射帮助 Agent 按任务类型定位文件。
7. 当前需求、计划和任务通过 Specflow 等交付产物维护，不复制进长期知识。
8. 有长期知识变化时先完成人工或 Agent 语义复核，再通过 Projection Plan/Apply/Verify 维护 Registry 状态和来源证据。
9. 完成 Harness 化后，日常任务与新会话使用 `context resolve`；使用 Doctor 检查规则预算、失效入口、路由结构矛盾和精确继承重复。
10. 发布或大规模调整前使用人工检查清单复核自然语言语义冲突。

## 分层原则

### 根规则

只包含：

- 全仓必须遵守的约束；
- 顶层模块地图；
- 常用验证命令；
- 破坏性操作和权限边界；
- 下层规则的发现方式。

不要放具体任务进度、长篇架构解释或某个模块的局部细节。

### 模块规则

只有满足以下条件才创建：

- 模块有不同于全仓的稳定约束；
- Agent 经常在该模块犯相同错误；
- 规则适用范围可以通过目录明确表达。

不要为每个目录机械复制根规则。

### 长期知识

适合记录：

- 稳定架构；
- 核心契约；
- 重要技术决策及原因；
- 常见失败模式；
- 代码入口。

不适合记录：

- 本周进度；
- 尚未确认的猜测；
- 单次故障过程；
- 当前任务的待办。

### 任务调研视图

任务调研视图用于回答“当前任务实际涉及哪些入口、符号、数据元素、消费者和异常分支”。需要保存时应绑定候选版本和 Evidence，进入当前 Spec 的 Plan、Research 或 Evidence；不要为了复用方便直接写入长期知识。它由 Agent Host 的普通任务工作流按需生成，不是 Bootstrap 的公开模式，也不等于字段级 AST 数据流切片。只有其中的结论跨任务稳定、具有权威来源并经维护者批准时，才提升为稳定契约。

### 当前交付产物

当前范围、方案、任务和状态由 Specflow 或等价产物管理。知识条目只保存引用，不能成为第二事实源。

## 冲突处理

发现规则冲突时：

1. 标明冲突范围；
2. 找到应当权威的最窄来源；
3. 不静默合并语义不同的规则；
4. 未经确认不删除原规则；
5. 修复后更新 Registry 和引用。

## 新鲜度

知识条目至少声明：

- 适用范围；
- 最后复核日期；
- 依赖的代码入口或契约；
- 触发重新复核的变化。

过期知识先标记 `review-required`，不自动删除。

## 首期不包含

- 自然语言规则冲突的自动判断；
- 自动删除或改写规则；
- 特定 Agent 产品的安装器；
- 真实公司、仓库或人员信息。
