# 项目上下文 Bootstrap 审核报告

## 基本信息

- 状态：`ready-for-review | partial | blocked`
- 项目根目录：
- 候选 revision 或快照：
- 接入或知识审计目标：
- 当前治理状态：`pre-harness | harnessed | unknown`
- `init plan` 或等价结构盘点：
- 实际检查范围：
- 明确排除范围：
- 已复用的现有导航：

## 项目规则候选

| 候选 | 建议动作 | 范围 | Evidence | 观察状态 | 建议位置 | 审核责任人 |
| --- | --- | --- | --- | --- | --- | --- |
|  | `create | update | still-valid | review-required | no-admission` |  |  | `observed | inferred | unresolved` |  |  |

## 项目规则就绪度

| 维度 | 状态 | 项目 Evidence | 观察层级 | 缺口 | 建议位置 | 完善阶段 | 需要维护者回答 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 项目心智模型与主要流程 | `ready | needs-project-config | not-applicable | unresolved` |  | `observed | inferred | unresolved` |  | 根 AGENTS / Knowledge | `initial | task-triggered | mature` | 是 / 否 |
| 架构边界与任务路由 |  |  |  |  | 根 AGENTS / Knowledge / Code Entry Map |  |  |
| 工具链、依赖安装与本地开发入口 |  |  |  |  | 根 AGENTS / Knowledge |  |  |
| 构建、测试、静态检查与人工验证 |  |  |  |  | 根 AGENTS / 当前 Spec |  |  |
| 跨仓库、外部服务、配置与敏感边界 |  |  |  |  | 根 AGENTS / Knowledge / Adapter |  |  |
| 项目特有禁止事项 |  |  |  |  | 根 AGENTS / 模块 AGENTS |  |  |
| 模块级密集稳定规则 |  |  |  |  | 模块 AGENTS / Knowledge |  |  |
| Agent Host 规则入口或薄桥接 |  |  |  |  | 根入口 / Host Adapter |  |  |

- 当前最低可开发基线：
- 首次接入必须补齐的项目配置：
- 留到真实任务触发时补充的规则：
- 只有模式稳定后才建议建设的内容：
- 规则就绪结论不能由文件存在、Doctor 或 Skill 安装状态替代。

## 稳定契约与 Knowledge 候选

| 候选 | 建议动作 | 范围 | 权威来源 | 候选状态 | 刷新条件 | 审核责任人 |
| --- | --- | --- | --- | --- | --- | --- |
|  | `create | update | still-valid | review-required | no-admission` |  |  | `draft | existing-approved | review-required` |  |  |

## 代码与验证入口候选

| 路径或符号 | 职责 | 适用任务 | Evidence | 建议动作 |
| --- | --- | --- | --- | --- |
|  |  |  |  | `create | update | still-valid | review-required | no-admission` |

## Knowledge README 导航候选

- 项目知识库定位与非覆盖范围：
- 建议导航的 Knowledge 正文：

| 标题与相对链接 | 用途 | 典型加载场景 | 候选状态 |
| --- | --- | --- | --- |
|  |  |  | `draft | existing-approved | review-required` |

| 常见任务 | 建议入口 | 相关 Knowledge | 备注 |
| --- | --- | --- | --- |
|  |  |  | 仅作人类导航；确定性结果以 Code Entry Map 与 Resolver 为准 |

- 机器事实源声明：Registry 保存条目状态与来源证据，Code Entry Map 保存完整路由，README 不复制 Digest 或完整 Scope。

## 不进入长期层的内容

| 内容 | 原因 | 临时保留位置 |
| --- | --- | --- |
|  |  |  |

## 能力就绪矩阵

| Skill | 状态 | 项目 Evidence | 缺少内容 | 建议落点 | 需要维护者回答 |
| --- | --- | --- | --- | --- | --- |
|  | `ready | needs-project-config | needs-adapter | not-applicable | unresolved` |  |  | AGENTS / Knowledge / 领域配置 / Adapter / 当前 Spec | 是 / 否 |

- Skill 集合来源：`Distribution Manifest | 受管安装记录`
- 集合完整性检查：
- 合并后的最少维护者问题：
- 仅在具体任务触发时再收集的输入：

## 未确认项

| 问题 | 影响 | 阻塞与否 | 所需确认或 Evidence |
| --- | --- | --- | --- |
|  |  |  |  |

## 采用建议

- 建议新增或调整的规则草稿：
- 项目规则就绪度与最低基线缺口：
- 建议新增或更新的 Knowledge 草稿：
- 建议调整的代码入口索引：
- 建议更新的 Knowledge README 导航：
- 需要维护者逐项裁决的内容：
- 供后续 Harness 化使用的已审核输入：
- Distribution Plan 预期动作与冲突：
- 能力就绪矩阵与待确认项：
- 尚未就绪的项目配置、工具或 Adapter：
- 建议的下一阶段：`review | authorized-init | manual-merge | authorized-distribution | verify | no-harness-change`
- 本次未执行的写入、批准或外部动作：
