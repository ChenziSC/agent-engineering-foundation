# Plan：补齐采用项目独立治理闭环

## 对应 Spec

- 事项 ID：`2026-08-07-standalone-adoption-closure`
- Spec：`./spec.md`

## 方案摘要

保持现有一个 Harness Package 和一个 CLI，不引入新的 Runtime。先把根包整理为可 `npm pack` 的固定版本工具产物，并让 CLI 从安装根解析内部资源；再补足 Resolver 的机器路由输出与选择器诊断；随后把 Distribution 从“复制完整 Skill 作者目录”收敛为“复制 Manifest 声明的运行时资源”；最后提供可选 CI 模板，并通过合成成熟项目和维护者指定的真实样本两层验证。

外部发布不是本事项的隐式动作。隔离安装使用本地 pack 产物证明技术闭环；真正的 registry 或 GitHub Release 发布等待独立授权和公开安全复核。

## 当前证据与假设

| 类型 | 内容 | 来源或验证方式 |
| --- | --- | --- |
| Evidence | 当前 CLI 从仓库根跨目录导入 Framework Validator、Adapter、Starter、Distribution 和 Skill Script | `packages/harness/bin/agent-foundation.mjs`、`packages/harness/src/harness.mjs` |
| Evidence | 真实采用样本的 9 个 Skill、Doctor、Knowledge、Specflow 与 Distribution 结构检查通过 | 2026-08-07 实际命令输出；样本标识不进入公开产物 |
| Evidence | 安装后的 Specflow 等 Skill 使用 `<foundation-repo>` 命令占位，采用项目没有稳定 Harness PATH | 分发副本与脱敏真实采用 Trace |
| Evidence | Resolver 使用 `start_paths` 选择映射但不返回代码入口，任务类型与路径按严格交集筛选 | `resolveProjectContext` 实现和真实样本反例执行 |
| Evidence | 真实样本受管 Skill 当前包含 156 个文件，其中包含上游 Eval、Trace 和测试 | 目标仓受管目录清单；不保存样本标识和文件正文 |
| Assumption | 一个可打包根包比复制单文件 Bundle 或建设新 Runtime 更符合现有零依赖边界 | 通过 pack 内容、安装体积和路径兼容性验证 |

## 变更深度与上下文契约

| 改变对象 | 层级 | 不能猜测的不变量 | 允许依赖的事实 | 回流位置 |
| --- | --- | --- | --- | --- |
| CLI 包与资源解析 | 稳定契约 | 现有命令、零依赖、安全路径和 JSON 输出不能静默改变 | 当前导入图、根包结构、Harness 测试 | Plan；行为变化同步 Spec |
| Resolver 输出与选择器 | 稳定契约 | 路径范围比自由文本任务类型更具体；不能静默丢路由 | Code Entry Map、Registry Scope、现有 Resolver 测试 | Spec/Plan |
| Distribution 文件集合与摘要 | 稳定契约 | 采用方修改不能被覆盖或删除；运行时引用必须闭合 | Manifest、Skill 链接、受管安装记录 | Plan |
| CI 模板 | 技术路径 | 只读、可选、固定版本，不绑定私有 Provider | 现有 Harness 命令与 GitHub Actions 公共语法 | Plan/Tasks |
| 真实样本验证 | 纯验证与治理配置 | 不修改业务代码，不补造项目事实 | 已批准根规则、Knowledge、受管安装记录 | Tasks/Validation Report |

## 组件与职责

| 组件或目录 | 职责 | 变化类型 |
| --- | --- | --- |
| `package.json` | 声明 CLI、版本和打包白名单 | 修改 |
| `packages/harness/bin/` | 稳定命令入口和安装根资源解析 | 修改 |
| `packages/harness/src/` | Resolver、Distribution、Doctor 等确定性契约 | 修改 |
| `distribution/manifest.yaml` | 公开 Skill 运行时文件白名单和摘要 | 修改 |
| `skills/*` | 保持可执行资源自包含，命令改用稳定 CLI 表达 | 修改 |
| `templates/ai-friendly-repository/ci/` | 可选采用项目 CI 模板 | 新增 |
| `starter/minimal/` | 使用稳定命令表达，不强制写 CI 或领域配置 | 修改 |
| `packages/harness/test/` | 合成成熟项目、隔离 Pack、Resolver 与迁移回归 | 修改 |
| 真实样本治理目录 | 真实采用验证和受管分发更新 | 修改；业务目录不变；样本标识不写入公开仓 |

## 数据流或调用流

```text
基础仓源码
→ npm pack 运行时白名单
→ 采用项目固定版本安装
→ agent-foundation CLI 从自身安装根读取 Starter / Manifest / Validator / Skill
→ 对目标项目执行 Init / Distribution / Doctor / Context / Specflow
→ CI 或 Agent Host 消费结构化结果
```

```text
taskType / paths
→ 路径优先的确定性 Route 匹配
→ matchedRoutes + startPaths + warnings
→ 规则 / Active Spec / Knowledge 的最小 loadPlan
```

## 关键决策

| 决策 | 备选方案 | 选择理由 | 代价 |
| --- | --- | --- | --- |
| 把现有根包整理为可打包 CLI | 复制单文件 Bundle；建设新 Runtime | 保留现有导入和测试边界，改造最小，仍可零依赖 | Pack 需要显式包含跨目录运行时文件 |
| 本轮只做 pack-ready，不公开发布 | 立即 npm publish 或创建 Release | 外部发布需要独立授权与公开复核；本地隔离安装足以证明实现 | 采用项目的长期版本来源要等发布渠道确定后固定 |
| 路径优先，任务类型作为显式 Route 键 | 自然语言模糊匹配；严格 AND | 可确定、可解释，避免语义模型成为门禁 | 调用方仍需使用任务类型或已知路径 |
| Resolver 返回代码入口但不加载代码 | 把 `start_paths` 全部加入 `loadPlan` | 入口是调研起点，不是必须全文注入的 Markdown | Agent 仍需按任务读取实现 |
| 默认只分发 Skill 运行时资源 | 完整复制作者目录；多套复杂 Profile | 减少目标仓噪声并符合 Skill 资源边界 | 需要升级摘要和受管清理契约 |
| CI 作为模板而非 Starter 强制文件 | `init` 自动写入 Workflow/Hook | 不假设采用方 Provider、权限和门禁策略 | 采用方需显式选择和固定版本 |

## Agent、程序与人工分工

- Agent：判断运行时资源是否必要、Resolver 冲突语义、文档与 Knowledge 是否需要更新。
- 确定性程序：打包、文件白名单摘要、路由匹配、冲突保护、结构检查和测试。
- 人工确认：终态、Commit、Push、外部发布渠道和真实样本最终交付。

## 兼容与迁移

- 向后兼容：保留源码仓 Node 命令；新增 `agent-foundation` bin，不重命名现有子命令。
- 数据或配置迁移：Distribution Plan 识别旧受管完整副本，只有旧摘要一致时才允许更新并清理不再受管的文件。
- 回退方式：恢复旧 Manifest 运行时文件集合和摘要；CI 模板为可选文件，不影响核心 Starter；Resolver 新字段为追加式输出。

## 验证策略

| 完成条件 | 实现路径 | 验证方式 | Evidence 来源关系 |
| --- | --- | --- | --- |
| AC-001/002 | Packable CLI 与安装根资源解析 | 临时目录安装 pack 产物后运行完整命令矩阵；源码仓旧入口回归 | 执行观察 + 交叉验证 |
| AC-003/004 | Resolver 路径优先匹配和解释输出 | 合成单元测试 + 真实样本路由反例 | 执行观察 + 交叉验证 |
| AC-005/006 | Manifest 运行时白名单和受管清理 | 合成目标首次安装、旧版本升级、用户修改和未知文件测试；真实样本 Plan/Apply/Verify | 执行观察 + 交叉验证 |
| AC-007 | 可选 CI 模板 | 合成采用项目执行等价命令；检查模板不含写操作和私有标识 | 执行观察 + 静态契约检查 |
| AC-008 | 成熟夹具与真实样本 | 端到端 Context/Knowledge/Specflow/Distribution；业务路径变更清单 | 执行观察 |
| AC-009/010 | 整仓回归与边界文档 | `npm test`、`npm run check`、敏感扫描、链接检查、文档复核 | 执行观察 + 人工语义复核 |

## 风险

| 风险 | 可能性 | 影响 | 缓解方式 |
| --- | --- | --- | --- |
| Pack 白名单遗漏动态读取文件 | 中 | 高 | 从实际命令矩阵生成隔离安装测试，不只检查 tar 清单 |
| Manifest 摘要升级误判目标修改 | 中 | 高 | 保存旧受管摘要，先 Plan，注入目标修改测试，失败时不写入 |
| 路径优先导致任务类型信息完全被忽略 | 低 | 中 | 同一 Route 记录两类命中；冲突时 warning 暴露未采用的 task Route |
| GitHub Actions 模板过早绑定未发布包 | 中 | 中 | 使用固定版本依赖前提和可替换安装来源；不自动写入现有项目 |
| Skill 精简后引用缺失 | 中 | 高 | 对分发副本运行链接检查、Skill Check 和脚本代表性执行 |

## 未决问题

- [ ] CLI 最终公开发布使用包 Registry 还是 GitHub Release；本事项不需要该选择即可完成隔离 Pack 验证。

## 实施交接入口

下一会话不需要重新设计方案，按以下顺序恢复：

1. 运行 `context resolve --task-type "采用项目独立治理" --paths package.json,packages/harness,distribution,skills,starter/minimal,templates/ai-friendly-repository`，读取本事项和命中的长期 Knowledge；
2. 回读 `meta.yaml`，确认状态为 `in-progress`、`next_task_id` 为 `T-06`，且没有终态授权；
3. T-01 至 T-05 已完成：不要重做 Pack、Resolver、运行时分发、CI 和成熟夹具；先复核当前工作树与最近验证结果；
4. 获取维护者指定真实样本的绝对路径后，先只读执行 Distribution Plan、Doctor、Knowledge、Specflow、Context 和 Git 业务路径基线；
5. 无受管冲突时再用本地 pack 执行运行时 Distribution Update，并复核业务代码零改动和 Host 新会话发现；
6. 完成 T-07 文档与 Knowledge Projection 候选，再执行 V-01；发现 CLI 发布渠道、跨仓路由或能力状态中心需求时保持为非目标；
7. 实现与验证完成后保持 Meta Active，并向用户分别申请归档、Commit 和 Push 授权。

交接时必须保留的基线事实：

- 真实样本当前 9/9 Skill、Doctor、Knowledge、Specflow、Distribution 与标准 Context Case 均通过；
- 未知任务类型加有效路径现在保留路径 Route，并返回代码入口、匹配原因、默认排除和 `unknown-task-type` 警告；
- 本地 pack 已提供 `agent-foundation` 命令；真实样本 PATH 和 Host 新会话仍待复核；
- 当前公开仓不保存真实样本名称、绝对路径、远端链接或业务配置。
