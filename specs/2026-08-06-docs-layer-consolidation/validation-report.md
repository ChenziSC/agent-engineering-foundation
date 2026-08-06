# Validation Report：收敛 Docs 与仓库结构分层

## 结果

- 事项 ID：`2026-08-06-docs-layer-consolidation`
- 检查日期：`2026-08-06`
- 结果：`pass`

## 完成条件映射

| 完成条件 | Evidence | 结果 |
| --- | --- | --- |
| AC-001～AC-006 | Docs 首轮收敛、公开政策迁移、Knowledge Projection、Repository Check 和 81 项测试 | pass |
| AC-007 | `docs/` 只有六个无编号 Markdown；当前规范内容中旧编号和 `docs/能力说明/` 为 0 命中 | pass |
| AC-008 | 根 README 从 190 行收敛到 76 行；新增 `packages/harness/README.md` 和 `adapters/README.md` | pass |
| AC-009 | `ChenziSC/codex-pets` 为 Private，默认分支 `main`，远端提交 `1ea4426e3189aba946c0961a0690c8ec1a4c3db8`；远端重新克隆后两个 WebP 摘要与原文件一致；本仓当前内容无 Pet 文件和引用 | pass |
| AC-010 | `deterministic-core-boundary` Knowledge 已从假想运行时契约重写为能力准入、宿主边界与确定性代码依赖；Projection Update/Verify 通过 | pass |
| AC-011 | Harness 提取 `src/context/markdown-index.mjs` 与 `src/repository/sensitive-scan.mjs`；Web Evidence Schema、Parser 和测试迁入独立 Framework；CLI 保持兼容 | pass |
| AC-012 | 全仓自然语言复审、Knowledge Projection Verify、Repository Check、81 项测试和差异检查全部通过 | pass |
| AC-013 | 根 `AGENTS.md` 与 `deterministic-core-boundary` Knowledge 已建立能力准入矩阵、宿主职责边界和删除条件 | pass |
| AC-014 | Skill Runtime Blueprint 与 Distribution 已收敛为发布白名单、内容摘要、Host 原生接入和现有项目级兼容安装；未实现 Runtime 不再列为建设目标 | pass |
| AC-015 | Context Framework、Skill、模板、Docs 与 Knowledge 已区分 Context Resolver、有边界代码调研和字段级语义切片；现有 Eval 只证明前两者 | pass |
| AC-016 | 删除无消费者的 Capability Registry 等四个 Runtime 模板及两个 Context Contract Schema/模板；Projection、Repository Check、81 项测试和差异检查通过 | pass |
| AC-017 | 根规则、Starter、Specflow Blueprint 与生命周期 Reference 已统一为新会话首次恢复、会话内复用和明确变化时刷新 | pass |
| AC-018 | `project-context-bootstrap` 已区分存量项目接入与新会话恢复；Skill 摘要、Knowledge Projection、Repository Check、81 项测试和差异检查通过 | pass |
| AC-019 | `project-context-bootstrap` 只保留存量项目规则、稳定契约、Knowledge 与代码入口候选；公开 Slice 模式和任务调研模板已移除 | pass |
| AC-020 | 报告状态改为 `ready-for-review`、`partial`、`blocked`；新候选只允许 `draft`，4 个案例均改为 Bootstrap 专项；旧 Replay/Trace 删除，成熟度降为 `usable` | pass |
| AC-021 | Skill/Distribution/Projection/Specflow/Repository Check、81 项测试、自然语言深审和 `git diff --check` 全部通过 | pass |
| AC-022 | Skill、工作流、失败模式、报告模板、Case 03 和采用入口已将未 Harness 化统一表达为接入前阶段，不再提供长期 fallback | pass |
| AC-023 | `init plan`、Bootstrap、维护者审核、独立写入授权、Harness 化和后续 Resolver 的职责顺序一致；全量验证通过 | pass |

## Pet 迁移证据

- 新仓地址：`https://github.com/ChenziSC/codex-pets`；
- 可见性：`PRIVATE`，与主仓一致；
- 蹲姿图集 SHA-256：`bb9d88fc0bec82191b7e346dde26a3a176ea9ed14b654c203db33f9493ea0ab2`；
- 站姿图集 SHA-256：`2f820956b45355a88c2a39a68849896f0f5acca212558c3c0f915594fa48dc16`；
- 本仓当前 README、AGENTS、Docs、Knowledge、Framework、Skill、Template、Blueprint、Package、Adapter 和 Distribution 中的 Pet 术语与路径均为 0 命中；Archived Spec 和本事项保留当时存在及迁移动作的历史证据。

## 自然语言重构复审

### 程序事实

- 扫描当前规范内容中的旧 Docs 路径、Pet 术语、目录职责、Manifest 版本、三种运行模式、Web Framework 引用和跨层 Import；旧 Docs 与当前 Pet 引用为 0 命中。
- 当前共 198 个 Markdown 进入链接检查，300 个候选文件进入敏感内容扫描，均无错误和警告。
- 160 字以上规范性段落的精确重复只有 Skill Runtime Blueprint 与 Distribution README 共享的一组命令示例；两处分别服务设计说明和本地操作入口，不承担事实所有权，保留合理。
- Knowledge Projection 覆盖 `repository-positioning`、`public-generalization-policy`、`self-hosted-governance` 和 `deterministic-core-boundary`，Plan/Apply/Verify 均通过。
- Repository Check 验证 9 个 Skill 的结构、分发摘要与知识索引一致；`project-context-bootstrap` 有 4 个行为案例且不再声明正式 Replay。
- 全量测试 81/81 通过，`specflow check` 与 `git diff --check` 通过。
- `specflow` 与 `project-context-bootstrap` 的内容摘要已按真实源目录更新；根规则变化触发的四条 Knowledge 来源摘要经 Projection Apply/Verify 更新并通过。
- 本轮 Knowledge Projection Plan 为 `unchanged`，Verify 通过；Repository Check、Specflow Check、81 项测试和 `git diff --check` 再次通过。
- 定向搜索未发现把未 Harness 化当作当前长期 fallback、要求目标项目预装 Harness、审核前写入或让 Bootstrap 承担新会话恢复的有效入口；Archived Spec 中的旧案例路径只作为历史证据保留。

### Agent 语义判断

- 六个 Docs 按读者任务并列选择，没有稳定阅读顺序，因此取消编号比重新连续编号更准确。
- README、Docs、Knowledge、Blueprint 和局部 README 现在分别承担入口、导航、长期契约、采用设计和运行说明，没有发现新的第二事实源。
- Web Evidence 是 Prefetch 与性能评审共享的 Observation 层，独立 Framework 的所有权比放在 Prefetch 下更准确。
- Skill/Plugin 发现、安装、更新、权限、Sandbox、Hook、MCP、会话和通用代码探索由 Agent Host 原生承担；本仓不再规划平行 Runtime。
- `project-context-bootstrap` 只在存量项目首次治理接入、长期层缺失或架构变化后重建候选时触发；普通任务代码调研由 Agent Host 和当前 Spec 按需承担。
- Bootstrap 内部可以为证明长期候选读取最小实现证据，但不再暴露 `slice` 模式，也不把 Host 的搜索、阅读和符号探索包装成仓库能力。
- 原独立 Replay 与自评 Trace 主要覆盖已经删除的 Slice 行为，继续保留会制造错误成熟度；当前版本因此从 `validated` 降为 `usable`，待新的独立 Bootstrap Trace/Replay 后再升级。
- 字段级正反向语义切片仍是有价值的问题模式，但只有出现真实采用方、语言级 AST/数据流 Adapter 和可比较增益证据后，才允许升级为实现事项。
- Context Resolver 的强制触发只用于新会话首次仓库请求；同一会话、分支和任务范围内复用结果。分支、Active 事项集合、任务目标、相关路径显著变化或显式刷新才重新执行。
- `project-context-bootstrap` 中的 `bootstrap` 表示存量项目接入，不承担新会话恢复；两者共享词根但拥有不同触发和产物。
- 未 Harness 化项目的正确顺序是：本仓 Harness 从外部执行只读 `init plan`，Bootstrap 推导通用 Starter 不知道的项目语义，维护者审核候选并另行授权写入，完成接入后由 `context resolve` 服务日常任务和新会话。
- `init plan` 的结构判断、Bootstrap 的语义候选、维护者的内容批准、`init` 或人工合并的写入授权彼此独立；任何前一步完成都不能推断后一步已经获准。

## 保留的已知结构债务

- Harness 仍直接导入 Specflow 与项目组件 Skill 私有脚本，组件 Validator 仍导入 Specflow YAML Parser；这些路径已在依赖 Knowledge 中登记为迁移期遗留，禁止新增同类依赖。
- Distribution 中的项目级 `plan/apply/verify` 是已有兼容实现，不扩展为用户级安装器、Marketplace、动态 Plugin、Capability Registry 或统一 Hook。
- 字段级语义切片尚未实现；这不是待补齐的默认路线图，需先满足真实消费者、语言 Adapter、基准用例和可测增益的能力准入条件。

## 验证环境说明

- `skill-creator` 附带的 `quick_validate.py` 因当前系统与工作区 Python 均未安装 PyYAML 而未能启动；没有为通过检查临时安装依赖。
- 本仓 `skill check`、YAML 子集校验、Repository Check、Markdown 链接检查和 Distribution 内容摘要均通过，覆盖了本次 Skill 的结构、Frontmatter、Agent 元数据、资源和发布一致性。

## 生命周期

- 实施与验证已完成；事项保持 `in-progress`，本仓尚未获得本轮 Commit、Push 或归档授权。
