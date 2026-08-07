# Tasks：补齐采用项目独立治理闭环

## 执行规则

- 每个任务都必须关联 Spec 完成条件或 Plan 章节。
- 每个任务都必须有验证方式。
- 范围变化时先更新 Spec，再新增任务。
- 不记录 Commit 日记；归档、Commit、Push 和外部发布分别等待用户授权。

## 任务

### T-01 建立事项基线与独立 Pack 契约

- 状态：`done`
- 依赖：无
- 对应：`AC-001`、`AC-002` / Plan“组件与职责”“关键决策”
- 输入：当前 Package、CLI 跨目录导入图、现有命令测试和真实采用缺口。
- 动作：建立 Active Spec；声明根包 Bin 与打包白名单；修复 CLI 默认资源路径；增加隔离安装测试。
- 产物：Specflow 产物、`package.json`、CLI/Harness 实现与测试。
- 验证：`npm pack` 临时安装后运行 Init、Distribution、Doctor、Knowledge、Specflow、Context；源码入口回归。
- 阻塞条件：无法在不复制未知运行时代码的情况下闭合 Pack 导入图。

### T-02 补齐 Resolver 代码入口与选择器诊断

- 状态：`done`
- 依赖：`T-01`
- 对应：`AC-003`、`AC-004` / Plan“数据流或调用流”
- 输入：Code Entry Map、Registry、当前 Resolver 和真实样本反例输出。
- 动作：实现路径优先 Route 选择、`matchedRoutes`、`startPaths`、匹配原因和 warning；保持旧字段兼容。
- 产物：Resolver 实现、README 契约和单元测试。
- 验证：六类选择器 Case、嵌套规则和默认排除回归。
- 阻塞条件：路径与任务类型冲突无法用确定性规则表达。

### T-03 收敛 Skill 运行时分发

- 状态：`done`
- 依赖：`T-01`
- 对应：`AC-005`、`AC-006` / Plan“兼容与迁移”
- 输入：Distribution Manifest、9 个 Skill 引用图、受管安装记录。
- 动作：把 Manifest 资源声明作为摘要和复制白名单；排除 Eval/Test；实现旧受管文件安全清理与冲突保护。
- 产物：Manifest、Distribution 实现、更新后的摘要和迁移测试。
- 验证：首次安装、重复安装、旧版升级、用户修改、未知文件、链接和脚本回归。
- 阻塞条件：某个 Skill 的运行行为确实依赖 Eval/Test 路径。

### T-04 提供可选的采用项目 CI 模板

- 状态：`done`
- 依赖：`T-01`、`T-03`
- 对应：`AC-007` / Plan“关键决策”
- 输入：稳定 CLI 命令、完整底座检查和 Provider-neutral 边界。
- 动作：新增最小 GitHub Actions 模板及采用说明；不由 Init 自动写入，不默认启用 Hook 或 Change Gate。
- 产物：CI 模板、模板导航和相关静态检查。
- 验证：合成采用项目运行等价命令；扫描模板无 Commit、Push、发布和私有标识。
- 阻塞条件：CLI 仍没有可固定版本的安装形态。

### T-05 建立成熟阶段合成端到端验证

- 状态：`done`
- 依赖：`T-02`、`T-03`
- 对应：`AC-008`、`AC-009`
- 输入：现有合成采用测试和成熟复杂项目提供的问题真实性参考；不读取或复制受限实现作为公开底稿。
- 动作：扩展夹具覆盖嵌套规则、多个 Active Spec、Section Index、Knowledge 复核、选择器降级和分发迁移。
- 产物：端到端测试和脱敏验证证据。
- 验证：测试能够先暴露目标缺口，并在实现后稳定通过。
- 阻塞条件：夹具需要任何真实公司、项目或平台数据。

### T-06 在维护者指定的真实样本验证独立接入

- 状态：`done`
- 依赖：`T-01`、`T-02`、`T-03`
- 对应：`AC-008`、`AC-009`、`AC-010`
- 输入：本地 Pack 产物、真实样本已批准治理配置和现有受管 Skill；样本位置由执行环境提供，不固化到公开产物。
- 动作：使用独立 CLI 执行治理命令；安全更新运行时 Skill；验证标准和非标准任务描述；记录业务代码零改动。
- 产物：真实样本治理更新和本事项脱敏 Validation Evidence。
- 验证：Doctor、Knowledge、Specflow、Distribution、Context、Host 新会话发现和 Git 路径检查。
- 阻塞条件：受管 Skill 存在采用方修改，或需要修改业务代码才能通过。
- 当前进展：已从维护者指定样本的默认主分支建立全新验证分支；独立 CLI、运行时 Distribution、治理检查、选择器 Case、业务代码零改动及只读 Agent Host 新会话对根规则和 9 个项目级 Skill 的原生发现均通过。公开 Evidence 不保存样本绝对路径、远端或业务配置。

### T-07 更新长期文档与知识投影候选

- 状态：`done`
- 依赖：`T-04`、`T-05`、`T-06`
- 对应：`AC-009`、`AC-010`
- 输入：最终实现、真实验证和现有 Knowledge Registry。
- 动作：更新 Harness、Distribution、能力地图和采用说明；语义复核命中 Knowledge；准备 Projection 候选。
- 产物：文档、Knowledge 正文/Registry 候选、Validation Report。
- 验证：整仓检查、敏感扫描、链接检查和 Projection Plan/Verify。
- 阻塞条件：实现证据不足以支持长期表述。

## 验收任务

### V-01 完成条件复核

- 状态：`done`
- 动作：逐项检查 Spec 的完成条件，明确尚未证明内容；保持事项 Active 等待终态授权。
- 产物：`validation-report.md`
- 验证：完成项均有独立执行证据，未完成项不会被标记为完成。

## 状态说明

- `pending`：尚未开始；
- `in-progress`：正在执行；
- `blocked`：缺少输入、授权或依赖；
- `done`：动作和验证均完成；
- `skipped`：经明确决策不再执行，并记录理由。
