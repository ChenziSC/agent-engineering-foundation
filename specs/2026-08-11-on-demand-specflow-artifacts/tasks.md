# Tasks：Specflow 按需产物与低风险交付豁免

## 执行规则

- 每个任务关联 Spec 完成条件或 Plan 决策。
- 只复用既有 Artifact Map、Context Resolver、Receipt 和 Change Gate，不新增 Profile、状态或命令。
- 修改公共自然语言规则时保留一个权威定义，其他入口使用摘要和链接。
- 不记录 Commit 日记，不自行 Commit、Push、创建 PR 或归档。

## 任务

### T-01 收敛 Meta 与 Receipt 的按需产物契约

- 状态：`done`
- 依赖：无
- 对应：`AC-001`、`AC-002`
- 输入：Meta/Receipt Schema、确定性 Validator、模板和现有生命周期测试。
- 动作：保持 Spec 必需；允许 Plan、Tasks、Research、Validation Report 为安全路径或 `null`；Receipt 冻结实际声明产物。
- 产物：更新后的资产、Validator 和最小/完整/非法测试。
- 验证：Meta、Receipt、Lifecycle 相关单测通过，既有完整 fixture 无需迁移。
- 阻塞条件：需要引入新 Profile、Schema 版本或第二类 Receipt。

### T-02 让 Context Resolver 只加载实际存在的核心产物

- 状态：`done`
- 依赖：`T-01`
- 对应：`AC-003`、`AC-008`
- 输入：Active Spec Resolver、Markdown Index 和合成治理项目 fixture。
- 动作：Spec 必须存在；Plan/Tasks 仅在 Meta 为安全路径时加载；保持排序、预算和 Section Index 算法。
- 产物：Resolver 修改与最小/完整事项测试。
- 验证：最小事项的文件数和 `markdownBytes` 下降，完整事项结果不退化。
- 阻塞条件：需要新增 Resolver 模式或配置字段。

### T-03 统一 Skill、规则与消费者采用说明

- 状态：`done`
- 依赖：`T-01`
- 对应：`AC-004`、`AC-007`、`AC-008`
- 输入：Specflow Skill、根规则、Specs README、Starter、Blueprint、现有 Eval。
- 动作：以 Skill/Blueprint 为权威定义按需触发条件，其他入口保留短摘要；清理固定完整套件的失效表述。
- 产物：范围内自然语言契约和更新后的现有 Eval Case。
- 验证：旧术语定向搜索、Skill check、现有 Replay；主入口和普通消费者加载体量不增加。
- 阻塞条件：需要新增第二套规则、评分体系或 Eval 框架。

### T-04 接通本仓与采用模板的低风险豁免

- 状态：`done`
- 依赖：`T-01`
- 对应：`AC-005`
- 输入：Change Gate 既有豁免、本仓 Delivery 脚本、GitHub Delivery 模板。
- 动作：让调用入口接受 Spec 集合或一个受控豁免，转换为既有 CLI 参数；禁止混用和自由文本。
- 产物：脚本、模板和解析测试。
- 验证：Spec、豁免、缺失、混用、未知类型和路径不匹配场景通过。
- 阻塞条件：需要新增豁免类型、自由文本 bypass 或第二门禁。

### T-05 执行兼容、行为和成本回归

- 状态：`done`
- 依赖：`T-02`、`T-03`、`T-04`
- 对应：`AC-006`、`AC-007`、`AC-008`
- 输入：最终候选和现有测试/Eval/仓库检查。
- 动作：运行针对性单测、全仓测试、规模回归、Skill Eval、Doctor、Distribution、Knowledge、Specflow 和静态检查；比较最小/完整事项体量。
- 产物：`validation-report.md` 和必要的长期 Knowledge/Docs 投影。
- 验证：所有完成条件有执行观察；未改善或未覆盖项明确保留。
- 阻塞条件：公共兼容回归、Token/体量无净下降或新增概念超出非目标。

### T-06 收敛全仓重新审计发现

- 状态：`done`
- 依赖：`T-05`
- 对应：`AC-002`、`AC-004`、`AC-006`、`AC-007`
- 输入：全仓只读审计、Receipt 最小复现、消费者规则定向搜索、Knowledge 与 Eval 证据复核。
- 动作：让 Receipt 后续验证持续绑定 Meta；恢复模板 Digest 计算顺序；补齐 Schema、Starter、回流规则、Knowledge Projection 和按日期保存的 Eval Trace。
- 产物：确定性实现与回归测试、消费者规则、Projection 和最小 Trace。
- 验证：针对性测试、全仓测试、规模回归、Eval、Doctor、Distribution、Knowledge、Specflow 和静态检查全部通过。
- 阻塞条件：修复需要新增 Profile、状态、命令、第二门禁或普通上下文常驻材料。

## 验收任务

### V-01 完成条件复核

- 状态：`done`
- 动作：逐项核对 AC-001～AC-008，并区分同源说明、执行观察和交叉验证。
- 产物：`validation-report.md`。
- 验证：未完成条件和 Blocker 不会被标记为完成。

## 状态说明

- `pending`：尚未开始；
- `in-progress`：正在执行；
- `blocked`：缺少输入、授权或依赖；
- `done`：动作和验证均完成；
- `skipped`：经明确决策不再执行，并记录理由。
