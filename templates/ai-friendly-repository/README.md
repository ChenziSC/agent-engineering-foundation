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
- [可选的 GitHub Actions 持续治理模板](ci/github-actions.yml)
- [可选的 GitHub Actions 交付门禁模板](ci/github-actions-delivery.yml)

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
11. 需要持续门禁时，显式复制持续治理模板，并把 `REPLACE_WITH_EXACT_PACKAGE_SPEC` 替换为已批准的精确 CLI 包版本、不可变 tarball URL 或 Commit SHA；当前仓不会自动写入 Workflow，也不会替采用方选择发布渠道。
12. 需要交付门禁时，再显式复制 Delivery 模板；由采用方工作流传入目标和候选的 40 位 Commit SHA 及本次 Spec ID，模板复用现有只读 Change Gate，不从分支名或聊天推断交付关联。

## 三级采用路径

| 阶段 | 目的 | 主要命令 | 写入边界 |
| --- | --- | --- | --- |
| Bootstrap | 首次建立项目规则、Knowledge、Specflow 和运行时 Skill | `init plan`、经授权的 `init`、`distribution apply`、`doctor`、`context resolve` | 只有 `init` 和 `distribution apply` 写入明确受管路径 |
| Continuous | 日常任务或普通 CI 持续发现结构、摘要和路由漂移 | `doctor`、`knowledge check`、`specflow check`、`distribution verify`、`git diff --exit-code` | 全部只读 |
| Delivery | 对不可变 Git 候选复核 Spec Scope、Receipt、Projection 与最终差异 | Continuous 全部命令，加 `change gate check --phase delivery` | 全部只读，不推断终态授权 |

两个 CI 模板只提供 GitHub Actions 外壳，内部命令保持 Provider 无关。它们不运行 Distribution Apply，不创建 Hook，也不执行 Commit、Push、归档、发布或外部平台写入。Delivery 模板是可复用或手动调用的门禁单元；采用方负责从自身 PR/MR 事件安全解析不可变 SHA 和 Spec ID。CLI 包尚未进入采用方批准的发布渠道时，不应删除精确版本占位保护。

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
