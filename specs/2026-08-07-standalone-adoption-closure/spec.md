# Spec：补齐采用项目独立治理闭环

## 基本信息

- 事项 ID：`2026-08-07-standalone-adoption-closure`
- 创建日期：`2026-08-07`
- 事项状态、关系和影响范围以同目录 `meta.yaml` 为唯一事实来源。

## 输入来源

| 类型 | 引用或摘要 | 版本/日期 | 适用范围 |
| --- | --- | --- | --- |
| 用户输入 | 对照真实采用样本与成熟复杂项目的问题形态，补齐采用项目仍依赖基础仓源码、上下文路由未返回代码入口、缺少持续门禁和运行时分发偏重的问题 | 2026-08-07 | 本仓接入能力与真实样本验证 |
| 仓库证据 | 维护者指定的存量 Web 样本已通过 Doctor、Knowledge、Specflow、Distribution 与 Context 检查，但安装后的 Specflow 仍使用 `<foundation-repo>` 命令占位 | 2026-08-07 | 独立 Harness 入口 |
| 仓库证据 | Context Resolver 消费 `start_paths` 选择映射，却未在结果中返回代码入口；任务类型使用精确字符串且与路径形成严格交集 | 2026-08-07 | Resolver 输出契约 |
| 真实采用证据 | 已有脱敏 Trace 证明所测 Host 能原生发现项目 Skill，但 Harness 命令没有进入采用项目 PATH | 2026-08-06 | Host 与 Harness 边界 |

## 背景与目标

### 能力演进背景

本仓最初以通用 Agent 工程治理内容沉淀为主，随后逐步补齐 Starter、Harness、Specflow、Knowledge、Context Resolver、Skill Distribution、确定性 Validator 和真实采用验证。现有能力已经跨过“只有 Markdown”的阶段：程序能够初始化目标结构、验证长期知识、解析 Active Spec、安装完整 Skill 集合并检查受管摘要。

真实采用样本进一步证明，根规则、项目化 Knowledge、代码入口索引和项目级 Skill 能被所测 Agent Host 原生发现。随后补充的项目规则就绪评估，也证明 Agent 可以先从代码和公开配置自动归纳项目心智模型、入口、验证和跨系统边界，再只向维护者询问仓库无法证明的信息。

因此，当前问题已经不是“是否有接入骨架”，而是骨架的执行闭环仍有一段依赖基础仓工作区：采用项目可以保存治理内容，却不能仅凭自身声明和一个稳定工具版本重复运行全部确定性检查。

### 当前四个验证面

接入完整性必须区分四个不能互相替代的验证面：

| 验证面 | 当前已证明 | 当前缺口 |
| --- | --- | --- |
| Agent Host 原生发现 | 所测 Host 的新会话可以加载项目根规则、Knowledge Registry 和项目级 Skill | 不能外推所有 Host；精简分发后需要重新验证 |
| 项目语义就绪 | 真实样本已有项目心智模型、任务路由、最低验证、跨仓与安全边界 | 领域能力仍按真实任务渐进补齐，不要求首次接入全部配置 |
| Harness 确定性执行 | 基础仓可以从仓外对样本运行 Init、Doctor、Knowledge、Specflow、Distribution 和 Context | 命令仍由基础仓源码路径提供，采用项目自身没有稳定可固定版本的执行入口 |
| 持续门禁 | 基础仓自身 CI 会运行测试和仓库检查 | 采用项目没有通用、可选、固定工具版本的最小 CI 模板 |

### 已确认的具体缺口

1. **CLI 可移植性**：CLI 会跨目录读取 Adapter、Starter、Distribution、Framework Validator 和 Skill Script；源码仓内测试无法证明打包后文件闭包完整。
2. **代码入口没有进入 Resolver 输出契约**：Code Entry Map 已保存 `start_paths`，但当前结果只返回规则、Knowledge、Active Spec 和默认排除路径，Agent 仍要从人类 README 再找一次入口。
3. **选择器会静默降级**：任务类型采用精确字符串，并与路径按严格交集过滤。自然语言表达稍有变化时，即使路径已经命中，Route 自带的规则和默认排除也可能丢失，而结果仍显示 `resolved`。
4. **运行时分发和作者材料未分层**：默认完整分发会把 Eval、脱敏 Trace、Replay、运行报告和测试一并复制到采用项目。这些材料对基础仓维护有价值，但不是 Agent 执行 Skill 的默认前置条件。
5. **持续验证仍靠人工编排**：采用项目可以手动运行检查，却没有一个不绑定私有平台、不默认写入外部状态的最小 CI 入口。

### 成熟复杂项目参考的使用边界

受限来源仓只作为“真实问题是否存在、能力组合是否完整”的只读参考。例如，自包含项目 CLI、按路径下沉的模块规则、长期知识反向复核和自动门禁证明这些工程问题确实会在复杂项目中出现。公开实现只复用通用问题、职责边界和可验证思路，不复制其内部实现、业务规则、平台标识、仓库拓扑、接口、配置或特有阈值。

规模差异本身不构成缺陷。真实样本是小型单体 Web 项目，当前不需要复制复杂项目的多层模块规则和大量 Knowledge；本事项要验证的是底座在项目未来变复杂时可以渐进承载，而不是把首次接入改造成完整企业制度。

### 本事项目标

本事项要形成一个不过度设计的独立采用闭环：基础仓可以产出可固定版本的 CLI 包；采用项目只依赖该产物即可运行主要 Harness 命令；Resolver 返回可解释的真实代码入口；默认 Skill 分发只包含运行时资源；采用方可以选择最小 CI 模板持续验证这些契约。

完成后的目标链路为：

```text
项目接入与语义审核
→ 安装固定版本 CLI 与完整运行时 Skill
→ Agent Host 原生发现规则和 Skill
→ CLI 独立执行 Context / Specflow / Knowledge / Doctor
→ 可选 CI 持续验证结构与摘要
→ 领域配置继续按真实任务渐进补齐
```

## 非目标

- 不建设新的通用 Agent Runtime、Hook 系统或 Host Capability Registry；
- 不建设跨仓自动 Clone、多仓事务或外部平台编排；
- 不建设 Skill `ready/not-applicable` 的机器状态中心；
- 不自动为采用项目创建模块级 `AGENTS.md`、组件 Registry 或领域 Adapter；
- 不修改真实采用样本或其关联服务的业务实现；
- 不在本事项中公开发布 npm 包、GitHub Release、PR/MR 或其他外部产物；
- 不从任何受限来源复制内部实现、业务规则、平台标识、仓库拓扑、接口或配置。

## 用户或调用场景

1. 维护者把本仓打包为固定版本 CLI，在没有基础仓源码目录的临时项目中运行初始化、分发、Doctor、Knowledge、Specflow 和 Context 命令。
2. Agent 只知道任务类型时，可以从 Resolver 获得建议代码入口；自然语言任务类型没有精确命中但已知路径时，仍能保留路径路由并看到明确警告。
3. 项目安装完整 Skill 集合时，只接收执行所需的 Skill、Reference、Asset 和 Script，不接收上游 Eval、Trace 与测试材料。
4. 项目可以显式采用通用 CI 模板持续运行治理检查，但不会被强制安装 Hook 或执行外部写入。
5. 维护者指定的存量 Web 项目作为真实样本验证独立 CLI 和精简分发，不改变业务代码，也不把小项目机械扩张为复杂组织级治理结构。

## 输出与行为契约

- CLI 包从自身安装根解析 Starter、Distribution、Framework Validator、Adapter 和 Skill 运行时资源，不依赖基础仓绝对路径。
- 旧的源码仓 `node packages/harness/bin/agent-foundation.mjs` 调用方式保持兼容。
- Context Resolver 返回 `matchedRoutes`、聚合后的 `startPaths`、匹配原因和选择器警告；代码入口不自动混入 Markdown `loadPlan`。
- 同时提供任务类型和路径时，以真实路径作为更具体的范围；未知任务类型不能静默清空路径命中的默认排除与规则路由。
- Distribution 摘要只覆盖 Manifest 声明的运行时文件集合；受管旧版本可以安全移除不再分发的文件，用户修改或未知文件必须阻断或保留。
- CI 模板只读运行治理检查，不提交、推送、归档、发布或调用私有平台。

## 完成条件

- [x] **AC-001** 从 `npm pack` 产物安装 CLI 后，在与基础仓源码隔离的临时项目中完成 `init`、完整 Distribution、Doctor、Knowledge、Specflow 和 Context 闭环。
- [x] **AC-002** 源码仓旧命令入口和现有公开命令保持兼容，CLI 默认资源路径不受调用目录影响。
- [x] **AC-003** Resolver 对任务类型、路径、两者一致、未知任务类型加有效路径、选择器冲突分别返回可复核的 `matchedRoutes`、`startPaths`、匹配原因和警告。
- [x] **AC-004** 路径路由不会因未知任务类型丢失 `module_rules`、Knowledge 或 `exclude_by_default`，代码入口不会被误当作必须全文加载的文档。
- [x] **AC-005** 默认 Distribution 为 9 个公开 Skill 分发运行时必需内容，不向采用项目复制 Eval、Trace、Replay、运行报告或测试。
- [x] **AC-006** Distribution Update 只清理仍属于受管旧版本的非运行时文件，不覆盖采用方修改和未知文件。
- [x] **AC-007** 提供可选、Provider 表达通用的最小 CI 模板，固定 CLI 版本后可以运行 Doctor、Knowledge、Specflow、Distribution Verify 和 Diff 检查。
- [x] **AC-008** 合成成熟项目夹具覆盖嵌套规则、多个 Active Spec、Section Index、Knowledge 复核状态与选择器降级；维护者指定的真实样本完成独立 CLI 和精简分发验证且业务代码零改动。
- [x] **AC-009** 本仓全部自动化测试、仓库检查、敏感扫描、Skill 与 Distribution 检查通过；真实样本的 Doctor、Knowledge、Specflow、Distribution 与 Context 检查通过。
- [x] **AC-010** 文档明确 Host 原生发现、CLI 可执行性、项目配置就绪和 CI 门禁是不同验证面，不把任一检查通过外推为业务行为正确。

## 约束

- 技术约束：Node.js 20+、零运行时依赖、结构化 JSON 输出、现有安全路径与 Symlink 门禁继续成立。
- 兼容约束：不破坏源码仓命令；Manifest 或安装记录升级必须可计划、可验证且遇冲突停止。
- 权限与安全约束：不自动执行归档、Commit、Push、PR/MR、发布或外部写入。
- 数据与隐私约束：合成夹具使用自造内容；公开产物不记录真实样本名称、远端地址、绝对路径、业务标识或配置值。

## 风险、假设与待确认项

| 类型 | 内容 | 影响 | 处理方式 | 状态 |
| --- | --- | --- | --- | --- |
| Risk | 当前 CLI 跨目录导入多个 Framework、Adapter 和 Skill Script，打包白名单遗漏会造成安装后命令失败 | 影响 AC-001 | 用隔离安装和完整命令矩阵验证实际包内容 | open |
| Risk | 精简 Distribution 后，旧目标目录可能残留 Eval/Test 或误删采用方文件 | 影响 AC-005/006 | 基于旧受管摘要和逐文件计划执行清理；注入冲突测试 | open |
| Risk | 任务类型与路径合并策略可能过度加载不相关路由 | 影响 AC-003/004 | 路径优先，返回匹配原因和冲突 warning；增加反例测试 | open |
| Assumption | CLI 的外部发布渠道不是实现独立打包和隔离安装验证的前置条件 | 不阻塞实现 | 本轮只生成本地 pack 产物并在临时目录安装，发布另行授权 | accepted |

## Section Index

| 章节 | 说明 | 何时需要读取 |
| --- | --- | --- |
| 背景与目标 | 当前内容闭环与执行闭环的差异 | 判断改造价值时 |
| 输出与行为契约 | CLI、Resolver、Distribution 和 CI 的稳定边界 | 设计和实现时 |
| 完成条件 | 本事项客观验收范围 | 实施、验证和收口时 |
