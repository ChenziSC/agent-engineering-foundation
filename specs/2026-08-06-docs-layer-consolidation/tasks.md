# Tasks：收敛 Docs 能力说明与知识分层

## 任务

### T-01 建立事项和删除前证据

- 状态：`done`
- 对应：`AC-001` 至 `AC-006`
- 动作：确认无 Active 事项，读取 22 篇 Docs、相关 Knowledge 和反向引用。
- 验证：Context Resolver 返回 0 个 Active Spec；审计清单覆盖全部 Docs 文件。

### T-02 迁移稳定内容并更新权威入口

- 状态：`done`
- 依赖：`T-01`
- 对应：`AC-002`、`AC-003`、`AC-004`
- 动作：更新 README、保留 Docs、公开泛化 Knowledge、Registry 和 Code Entry Map。
- 验证：新入口均指向真实权威资产，当前文档不再依赖待删除文件。

### T-03 删除重复文档层

- 状态：`done`
- 依赖：`T-02`
- 对应：`AC-001`
- 动作：删除 `docs/能力说明/`、`docs/00`、`docs/03`、`docs/04`。
- 验证：文件列表只剩六个核心 Docs；当前有效引用无旧路径。

### T-04 执行自然语言全仓复审与修复

- 状态：`done`
- 依赖：`T-03`
- 对应：`AC-005`
- 动作：按 `refactor-natural-language-content` 搜索并读取旧标题、路径、重复职责、术语和权威来源的全部候选，修复范围内问题。
- 验证：反向搜索和逐层语义复核无未解释命中。

### T-05 执行 Projection 与全量验证

- 状态：`done`
- 依赖：`T-04`
- 对应：`AC-006`
- 动作：执行 Knowledge Projection、仓库检查、全量测试和差异检查。
- 验证：所有确定性检查通过，Validation Report 逐项映射完成条件。

## 验收任务

### V-01 完成条件复核

- 状态：`done`
- 依赖：`T-05`
- 动作：复核最终目录、权威来源、链接、自然语言审计和验证证据。
- 产物：`validation-report.md`

### T-06 取消 Docs 编号并下沉入口内容

- 状态：`done`
- 依赖：`T-05`
- 对应：`AC-007`、`AC-008`
- 动作：重命名六个 Docs，更新当前引用；精简根 README，新增 Harness 与 Adapter 局部入口。
- 验证：当前内容无旧编号路径；Archived 产物无修改。

### T-07 迁移 Pet 独立仓

- 状态：`done`
- 依赖：`T-06`
- 对应：`AC-009`
- 动作：创建并推送 `ChenziSC/codex-pets`，校验远端树和二进制摘要，再删除本仓 Pet 内容及当前引用。
- 验证：新仓可读且摘要一致；本仓当前层零 Pet 命中。

### T-08 建立依赖契约并整理确定性实现

- 状态：`done`
- 依赖：`T-07`
- 对应：`AC-010`、`AC-011`
- 动作：新增长期依赖契约，按现有领域拆 Harness 内部模块，分离 Web Evidence 与 Prefetch。
- 验证：禁止的 Package 到 Skill 私有实现依赖有明确结论；CLI 与自动化测试兼容。

### T-09 全仓深层复审和验证

- 状态：`done`
- 依赖：`T-08`
- 对应：`AC-012`
- 动作：重新执行自然语言全仓审计、Projection、Repository Check、测试和差异检查。
- 验证：Validation Report 更新为最终证据；未解决项明确列出。

### V-02 扩展范围完成条件复核

- 状态：`done`
- 依赖：`T-09`
- 动作：复核 `AC-007` 至 `AC-012`、外部迁移结果和本仓未提交差异。
- 产物：更新后的 `validation-report.md`

### T-10 新增能力准入与宿主边界规则

- 状态：`done`
- 依赖：`T-09`
- 对应：`AC-013`、`AC-014`
- 动作：更新根规则与长期 Knowledge，收敛 Skill 发布 Blueprint、Distribution 和仓库定位，删除无消费者 Capability Registry 模板。
- 验证：规则包含宿主基线、增量缺口、直接消费者、验证和删除条件；未来 Runtime 项不再列为建设缺口。

### T-11 校准 Context 调研与语义切片成熟度

- 状态：`done`
- 依赖：`T-10`
- 对应：`AC-015`
- 动作：当时统一 Framework、Skill、模板、Docs 和 Knowledge 的命名，保留 `slice` 兼容模式并把字段级 AST 切片单列为未实现候选；该兼容模式后由 `T-15` 移除。
- 验证：当前内容不再用现有 Replay 证明 AST、完整数据流或运行态消费者。

### T-12 重新执行全仓审计和验证

- 状态：`done`
- 依赖：`T-11`
- 对应：`AC-016`
- 动作：执行自然语言深审、Projection、Skill/Distribution/Repository Check、全量测试和差异检查。
- 验证：所有检查通过，Validation Report 记录新的事实与已知债务。

### T-13 收敛 Context Resolver 触发语义

- 状态：`done`
- 依赖：`T-12`
- 对应：`AC-017`
- 动作：同步根规则、Starter、Specflow Blueprint 与生命周期 Reference，改为新会话首次恢复、会话内复用和明确变化时刷新。
- 验证：当前规范不再要求同一任务的追问、继续实施、验证或状态查询重复执行 `context resolve`。

### T-14 区分两类 Bootstrap 并重新验证

- 状态：`done`
- 依赖：`T-13`
- 对应：`AC-018`
- 动作：在 `project-context-bootstrap` 中区分存量项目接入与新会话恢复，更新分发摘要并重新执行自然语言审计和全量检查。
- 验证：术语、触发条件、Skill 摘要、Repository Check、测试与差异检查一致。

### T-15 收敛 Project Context Bootstrap 职责

- 状态：`done`
- 依赖：`T-14`
- 对应：`AC-019`、`AC-020`
- 动作：删除公开 Slice 模式和任务调研模板；重写触发、工作流、失败模式、报告模板、Agent 元数据与 Bootstrap 专项案例；移除已失真的旧回放并校准成熟度。
- 验证：Skill 中不再把普通任务代码探索包装成独立能力，新候选状态和人工批准边界可判定。

### T-16 同步权威投影与依赖边界

- 状态：`done`
- 依赖：`T-15`
- 对应：`AC-019`、`AC-020`
- 动作：同步 Docs、Knowledge、模板、Code Entry Map 和 Distribution 摘要，保留字段级语义切片的独立候选边界。
- 验证：当前入口、成熟度和依赖契约指向同一交付事实。

### T-17 重新审计与验证

- 状态：`done`
- 依赖：`T-16`
- 对应：`AC-021`
- 动作：执行 `refactor-natural-language-content` 深层复审、Skill/Distribution/Projection/Repository Check、全量测试和差异检查。
- 验证：所有确定性检查通过，Validation Report 记录当前版本真实证据与后续升级条件。

### T-18 修正未 Harness 化项目的接入语义

- 状态：`done`
- 依赖：`T-17`
- 对应：`AC-022`
- 动作：更新 Bootstrap 工作流、失败模式、报告模板和 Case 03，把无 Harness 改为 `init plan → 候选 → 审核 → 授权 Harness 化` 的接入前阶段。
- 验证：Skill 不再把长期无 Harness 运行当作 fallback，也不在候选审核前执行写入。

### T-19 同步采用入口与长期边界

- 状态：`done`
- 依赖：`T-18`
- 对应：`AC-022`、`AC-023`
- 动作：同步 Harness README、目标仓库设计、AI 友好模板、长期依赖 Knowledge 和 Distribution 摘要。
- 验证：确定性计划、Agent 候选、人工批准、授权写入和后续 Resolver 各有唯一职责。

### T-20 重新审计与验证接入顺序

- 状态：`done`
- 依赖：`T-19`
- 对应：`AC-023`
- 动作：执行自然语言定向复审、Skill/Distribution/Projection/Repository Check、全量测试和差异检查。
- 验证：旧 fallback 语义无未解释残留，所有确定性检查通过。

### T-21 修复事项范围与交付事实

- 状态：`done`
- 依赖：`T-20`
- 对应：`AC-024`
- 动作：把提交 `c9bb70d` 中由本事项产生但未登记的六个路径加入 Scope，记录已经完成的 Commit/Push 和仍未授权的归档事实。
- 验证：对既有不可变提交重新执行工作态 Change Gate 时不再出现 Scope 漏项。

### T-22 修复 Context 根路径选择器

- 状态：`done`
- 依赖：`T-21`
- 对应：`AC-025`
- 动作：把 `.` 规范化为项目根范围，使其与所有安全项目相对路径相交，并增加根路径与具体路径回归测试。
- 验证：根路径加载 Active Spec、Knowledge 和根规则；既有具体路径测试继续通过。

### T-23 补齐根规则 Knowledge 路由

- 状态：`done`
- 依赖：`T-22`
- 对应：`AC-026`
- 动作：把 `AGENTS.md` 加入仓库定位任务的起始路径，并在 Context 回归中验证四条长期 Knowledge 全部加载。
- 验证：组合 `task-type + AGENTS.md` 不再漏载仓库定位与确定性边界 Knowledge。

### T-24 收敛能力图投影

- 状态：`done`
- 依赖：`T-23`
- 对应：`AC-027`
- 动作：在能力地图和问题图谱中把普通任务调研标为 Host 原生职责，把语义切片标为未实现候选，不再作为已实现仓库依赖节点。
- 验证：旧模糊节点零命中，Docs、Knowledge、Context Framework 与 Bootstrap Skill 语义一致。

### T-25 重新审计与验证 Review 修复

- 状态：`done`
- 依赖：`T-24`
- 对应：`AC-024` 至 `AC-027`
- 动作：更新 Validation Report，执行 Context 定向验证、Knowledge Projection、Repository/Knowledge/Specflow Check、全量测试、Git 深度扫描和差异检查。
- 验证：所有可在未提交工作树中执行的检查通过；需要不可变最终提交的 Change Gate 明确区分已验证基线与待提交候选。

### T-26 形成不可变实现候选并执行工作态门禁

- 状态：`done`
- 依赖：`T-25`
- 对应：`AC-027`
- 动作：根据用户明确授权提交 Review 修复，以 `5df7338` 为 Base 对最终不可变实现候选执行工作态 Change Gate。
- 验证：Gate 为 `pass`，完整候选由本事项 Scope 覆盖，工作树无未提交变化。

### T-27 生成归档证据并执行交付门禁

- 状态：`done`
- 依赖：`T-26`
- 对应：全部完成条件与 Specflow 终态契约
- 动作：复核 Knowledge Projection，生成不可覆盖 Archive Receipt，最后投影 Meta 为 `archived`，提交归档证据并执行 Delivery Change Gate。
- 验证：Receipt、Lifecycle Chain、Specflow Check 和 Delivery Change Gate 均通过，归档提交推送至 `origin/main`。
