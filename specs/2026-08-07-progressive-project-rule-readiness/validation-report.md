# Validation Report：补齐渐进式项目规则就绪评估

## 当前状态

- 结果：`pass`
- 当前 Spec 仍为 `in-progress`；验证通过不构成归档、提交或推送声明。

## 完成条件映射

| 完成条件 | Evidence | 结果 |
| --- | --- | --- |
| AC-001 | Skill 工作流明确分开项目规则就绪度与 Skill 能力就绪矩阵 | pass |
| AC-002 | 报告模板包含八类维度、四态、Evidence、落点、完善阶段和维护者问题 | pass |
| AC-003 | 工作流 Reference 定义 `initial`、`task-triggered`、`mature` 及五类内容落点 | pass |
| AC-004 | Skill 硬门禁和工作流均禁止首次接入预建空 Registry、Adapter、模块规则或制度 | pass |
| AC-005 | 新增 `06-generic-rules-not-ready.md` 行为 Case | pass |
| AC-006 | Eval Rubric 将“以文件或工具存在替代规则语义完整”列为阻塞项 | pass |
| AC-007 | Docs 已投影 6 个 Case；Skill List 计算的内容摘要与 Distribution Manifest 一致 | pass |
| AC-008 | 全量测试、Repository Check、Specflow Check、Knowledge Check 与 Diff Check 通过 | pass |
| AC-009 | Repository 敏感扫描和有界标识扫描未发现真实采用项目或受限来源信息 | pass |
| AC-010 | 当前 Skill 在真实采用项目上完成只读识别、受管更新、候选生成、维护者确认与长期投影；未确认运行时保持可见 | pass |

## 执行记录

| 检查 | 结果 | 说明 |
| --- | --- | --- |
| `npm test` | pass | 82 项测试全部通过 |
| `npm run check` | pass | Markdown、YAML、Skill、Distribution、Knowledge、Specflow 与敏感扫描通过；Bootstrap 动态识别 6 个 Case |
| `node packages/harness/bin/agent-foundation.mjs skill list` | pass | `project-context-bootstrap` 内容摘要为 `sha256:1a32c0d6557d11b73aff84c8565cc3e4d8c15af709a9ea086345281dcaa8bf8e`，与 Manifest 一致 |
| `node packages/harness/bin/agent-foundation.mjs specflow check` | pass | Active Spec 结构和状态一致 |
| `node packages/harness/bin/agent-foundation.mjs knowledge check` | pass | Knowledge 导航与 Registry 一致 |
| Knowledge Projection Plan/Apply/Verify | pass | 仓库定位、确定性核心边界和公开泛化政策均复核为 `still-valid` |
| `git diff --check` | pass | 未发现空白错误 |

## 真实采用项目只读验证（脱敏）

### 验证边界

- 目标是一个已安装完整公开 Skill 集合、具有根规则、Knowledge、Code Entry Map 和已归档接入 Spec 的真实 Web 项目；
- 只读取项目治理文件、包清单、构建入口和已批准 Knowledge，不读取或保存环境地址、外部服务 Key、数据库配置、凭证或生产数据；
- 本仓不记录目标项目名称、远程地址、revision、业务名称、具体组件、接口或跨仓实现路径；
- 第一阶段使用本仓当前工作区的源码版 `project-context-bootstrap` 做只读语义评估；维护者随后明确要求验证自动取证与候选落仓闭环，第二阶段才执行受管更新和候选写入。

### 确定性接入结果

| 检查 | 结果 | 观察 |
| --- | --- | --- |
| Doctor | pass | Starter、根规则、2 条 Knowledge、4 类入口和 9 个已安装 Skill 可识别 |
| Context Resolve | pass | 能按任务返回根规则、2 条相关 Knowledge 和默认排除项 |
| Knowledge Check | pass | Registry、Code Entry Map 与规则导航一致 |
| Specflow Check | pass | 已归档接入事项结构有效，没有 Active Spec |
| 初次 Distribution Verify | expected-fail | 只发现当前源码版 Bootstrap 与目标项目已安装旧版的内容摘要不一致 |
| Distribution Plan | pass | 只计划无冲突更新 Bootstrap，其余 8 个 Skill 均为 `noop` |
| Distribution Apply / Verify | pass | 获得写入授权后更新 Bootstrap；最终 9 个 Skill 内容摘要一致 |
| 项目内候选生成 | pass | Active Spec 自动保存 Evidence、两个就绪矩阵、投影候选和两组维护者问题 |
| 维护者确认与 Knowledge Projection | pass | 可由代码归纳的流程经确认后进入 README、根规则和 Knowledge；无法由全部 Git 历史证明的运行时没有被猜测补写 |

这些结果证明治理结构可以被确定性消费，但不能证明项目规则语义已经完整。

### 项目规则就绪度结果

| 维度 | 状态 | 脱敏 Evidence 与结论 | 阶段 |
| --- | --- | --- | --- |
| 项目心智模型与主要流程 | `ready` | AI 从当前路由、页面调用与 API 聚合形成候选，经维护者确认后完成长期投影 | `initial` |
| 架构边界与任务路由 | `ready` | 根规则、Knowledge、Code Entry Map 与 Resolver 对入口和任务路由表达一致 | `initial` |
| 工具链与本地开发 | `needs-project-config` | 启动和构建脚本存在，但没有运行时版本、Lockfile 或权威包管理器与安装约定 | `initial` |
| 验证入口 | `ready` | 根规则明确识别失败占位测试，并定义构建、任务相关人工场景、适用静态检查和 Diff 的最低组合；具体页面输入留到任务触发 | `initial` |
| 跨系统与安全边界 | `ready` | 跨仓复核、配置入口、敏感值禁入和不能从单侧静态代码推断运行契约均已表达 | `initial` |
| 项目特有禁止事项 | `ready` | 已记录无效测试、敏感配置和未证明 Schema 等长期红线 | `initial` |
| 模块级规则 | `unresolved`，不阻塞 | 当前没有足够 Evidence 证明存在密集稳定局部工作流，不为目录预建规则 | `mature` |
| Host 规则入口 | `ready` | 根规则入口、项目级 Host Adapter 和受管 Skill 目录均存在；当前 Skill 版本更新单独由 Distribution 处理 | `initial` |

- 报告状态：`ready-for-review`；表示候选足以裁决，不表示项目规则已经全部 `ready`。
- 自动取证后只形成两组问题：当前主要用户流程与有效功能范围；受支持的运行时版本、包管理器和可复现安装命令。前者经维护者确认后投影，后者在全部 Git 历史仍无 Evidence 时保持不可证明，不要求维护者凭记忆编造。
- 组件、设计、埋点、性能、发布、模块规则和具体人工页面场景均没有被提前扩展成首次接入问卷。
- 完整 Skill 矩阵复核后，`project-context-bootstrap` 与依赖可复现开发环境的安全变更能力应为 `needs-project-config`；其余能力沿用已批准的适用性决策，不因本次报告被机械改写。
- 写入授权和维护者确认后，目标项目产生受管 Skill 更新、Active Spec、README、根规则与 Knowledge 投影；没有修改业务实现、后端仓库或外部系统，也没有提交或推送。

## 适用性说明

- Skill Creator 的 `quick_validate.py` 未执行到验证逻辑：当前系统 Python 缺少其外部依赖 PyYAML。仓库自身的零依赖 Skill/YAML/Distribution 检查已经覆盖本次结构与内容摘要门禁，不把本机依赖缺失写成能力通过。
- `distribution verify --target .` 不适用于 Foundation 源仓：该命令验证的是已接入项目，要求目标根目录存在 `agent-foundation.json`；源仓自身由 Repository Check 校验 Distribution Manifest、文件集合和内容摘要。

## 尚未证明

- 单个真实 Web 项目的通过结果足以代表不同规模和技术栈；
- 项目规则内容正确性可以由确定性程序证明；
- 当前真实采用观察可以替代独立保存的 Host 行为 Trace/Replay；
- 其他 Agent Host 的规则入口和薄桥接行为已经验证。
