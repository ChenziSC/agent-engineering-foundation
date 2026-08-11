# Plan：Specflow 按需产物与低风险交付豁免

## 对应 Spec

- 事项 ID：`2026-08-11-on-demand-specflow-artifacts`
- Spec：`./spec.md`

## 方案摘要

保留现有 Meta、生命周期与命令，只把 Meta 中 `plan`、`tasks`、`research`、`validation_report` 的值扩展为安全相对路径或 `null`。Specflow Check、Context Resolver 和 Archive Receipt 统一消费 Meta 实际声明的产物集合；Skill 与消费者入口用一份触发规则说明何时增加条件产物。交付侧复用 Change Gate 已有 `--exemption`，仅补齐本仓脚本和采用模板的输入接线。

## 能力准入记录

| 项目 | 结论 |
| --- | --- |
| 目标问题 | 简单行为事项固定生成并加载 Plan、Tasks、Validation Report，已有低风险豁免未贯通本仓与采用模板，造成不必要文件和上下文成本 |
| 主流 Harness Agent 基线 | Host 能读写文档、制定计划和运行测试，但不知道项目的事项状态、Scope、归档证据和受控豁免契约 |
| 增量缺口 | 本仓需要用现有 Meta/Receipt/Context/Change Gate 确定性表达“哪些产物实际存在”和“候选是否可无 Spec 放行”，而不是让 Host 猜测 |
| 新增产物与直接消费者 | 不新增运行时产物；修改既有 Schema、Validator、Resolver、Skill、Starter/Blueprint 和 CI 模板，消费者是本仓自举与所有采用项目 |
| 验证 | 最小/完整/非法 fixture、Receipt/Lifecycle 回归、Context 预算回归、CI 输入解析测试、现有行为 Eval 和全仓检查 |
| 删除条件 | 若可选产物需要新增 Profile、第二状态机或平行门禁，停止该路径；若消费者上下文和文件数没有下降，则不保留仅为形式存在的规则 |

## 当前证据与假设

| 类型 | 内容 | 来源或验证方式 |
| --- | --- | --- |
| Evidence | Meta Schema 和确定性 Validator 固定要求 Spec、Plan、Tasks、Validation Report 路径 | `skills/specflow/assets/meta.schema.json`、`archive-receipt.mjs` |
| Evidence | Context Resolver 固定加载 Active Spec 的 Spec、Plan、Tasks，任一缺失即失败 | `packages/harness/src/harness.mjs` |
| Evidence | Archive Receipt 固定要求四种归档产物，但 Receipt 自身已有独立 validation 结构 | `archive-receipt.mjs`、Receipt Schema |
| Evidence | Change Gate 已实现五类受控低风险豁免及路径验证 | `skills/specflow/references/change-gate.md`、Harness 测试 |
| Evidence | 本仓 Delivery 脚本和消费者 GitHub Delivery 模板只接受 Spec ID | `.github/scripts/run-delivery-gate.mjs`、消费者 CI 模板 |
| Assumption | 保留所有 Meta 键并用 `null` 表示条件产物缺席，可以在不引入版本字段和迁移器的情况下保持兼容 | 最小与完整 fixture 验证 |

## 变更深度与上下文契约

| 改变对象 | 层级 | 不能猜测的不变量 | 允许依赖的事实 | 回流位置 |
| --- | --- | --- | --- | --- |
| Specflow 产物集合 | 公开稳定契约 | Spec 必需；Meta 是唯一索引；缺少条件产物不能伪装成已完成其职责 | Meta 可空路径与现有 Artifact Map | Spec / Plan |
| Receipt 与 Context | 确定性实现 | 只读取和冻结 Meta 实际声明且安全存在的文件 | 现有路径安全、摘要和预算实现 | Plan / Tasks |
| 交付豁免接线 | 兼容与安全门禁 | Spec 与豁免必须二选一；完整候选分类不能被筛选绕过 | 现有 Change Gate CLI 与五类豁免 | Spec / Plan |
| 文档与 Eval | 行为契约 | 不复制内部来源表达；不新增评分器或重复规则源 | 当前公开 Skill、Blueprint 和现有 Eval | Tasks / Validation |

## 组件与职责

| 组件或目录 | 职责 | 变化类型 |
| --- | --- | --- |
| `skills/specflow/assets` | Meta/Receipt Schema、默认模板与可选产物说明 | 修改 |
| `skills/specflow/scripts/archive-receipt.mjs` | Meta、Receipt 和 Lifecycle 结构校验 | 修改 |
| `packages/harness` | Specflow Check、Context Resolver、Change Gate 与测试 | 修改 |
| `skills/specflow/SKILL.md` | 按需产物的唯一执行规则 | 修改并去重 |
| `starter`、`blueprints`、`templates` | 消费者采用摘要和 CI 接线 | 修改 |
| `.github` | 本仓自举 Delivery 的 Spec/豁免二选一 | 修改 |
| `AGENTS.md`、`specs/README.md` | 本仓自举摘要，引用公共契约 | 修改 |
| `distribution/manifest.yaml` | Specflow 运行时内容摘要 | 机械刷新 |

## 数据流或调用流

```text
任务语义与风险
→ Agent 决定是否需要 Spec
→ Meta 声明实际存在的条件产物
→ Specflow Check 校验声明与文件
→ Context 只加载存在的核心产物
→ Receipt 冻结实际产物 + 独立 validation
→ Change Gate 选择 Spec 集合或受控路径豁免
```

## 关键决策

| 决策 | 备选方案 | 选择理由 | 代价 |
| --- | --- | --- | --- |
| 保留键、值可为 `null` | 新增 Profile；删除键；新增 Schema 版本 | 与现有 Research 可空模式一致，旧 Meta 不变，不需要迁移器 | 消费者仍需理解四个条件产物名 |
| Spec 始终必需，Receipt 其他 Artifact 可选 | 删除 Receipt；为轻量事项另建 Receipt | 保留验证、授权和摘要不变量，不建第二生命周期 | Receipt Validator 需调整最小角色集合 |
| Context 跳过空产物 | 为轻量事项新增 Resolver 模式 | 复用现有 Artifact Map 和预算算法 | 需要覆盖不同产物组合 |
| CI 复用 `--exemption` | 新建 skip 命令或自由文本 | 已有确定性分类和测试 | 调用入口需要二选一解析 |
| 只更新现有 Eval | 新建复杂度评分器或第二套 Eval | 保持行为证据但不扩大维护面 | 只证明所覆盖分流场景 |

## Agent、程序与人工分工

- Agent：根据任务语义、风险和协作需求决定条件产物；判断 Knowledge 和验证深度。
- 确定性程序：校验可空路径、文件存在、Receipt 实际集合、Context 加载和豁免路径。
- 人工确认：高风险方案、终态授权、Commit/Push/PR 和外部交付策略。

## 兼容与迁移

- 向后兼容：现有非空 Plan/Tasks/Validation Report Meta 与 Receipt 保持合法；公共状态和命令不变。
- 数据或配置迁移：不批量修改既有 Spec；新事项按需把条件产物值设为 `null`。
- 回退方式：恢复条件产物为非空路径即可回到完整套件；Schema/Validator 变更可按文件回退，不涉及数据写入。

## 验证策略

| 完成条件 | 实现路径 | 验证方式 | Evidence 来源关系 |
| --- | --- | --- | --- |
| AC-001/002 | Meta、Receipt Schema 与 Validator | 最小/完整/非法结构单测，现有 Lifecycle 回归 | 执行观察 |
| AC-003 | Context Resolver | Meta + Spec 与完整事项 fixture，预算/索引断言 | 执行观察 |
| AC-004/007 | Skill、摘要入口和现有 Eval | 定向旧术语搜索、Skill check、行为 Replay | 交叉验证 |
| AC-005 | 本仓脚本与消费者 CI | Spec、豁免、混用、未知值解析测试；Change Gate 路径测试 | 执行观察 |
| AC-006 | 全仓兼容 | `npm test`、`npm run check`、Doctor、Distribution、Knowledge、Specflow | 执行观察 |
| AC-008 | 文件和上下文成本 | 最小/完整 fixture 的文件数与 `markdownBytes` 对照，Skill 字节数和概念清单复核 | 交叉验证 |

## 风险

| 风险 | 可能性 | 影响 | 缓解方式 |
| --- | --- | --- | --- |
| Optional 被误解为不需要验证 | 中 | 交付质量下降 | Receipt validation 始终必需；Skill 按风险要求独立报告 |
| 文档触发规则漂移 | 中 | Agent 选择不一致 | Skill/Blueprint 为权威，其他入口仅摘要引用；修改后定向搜索 |
| 最小事项破坏 Context 假设 | 中 | 新会话恢复失败 | Resolver 按实际路径构造 artifactDocuments，覆盖预算和索引测试 |
| CI 输入模式扩展形成绕过 | 低 | 无 Spec 行为变更放行 | 复用枚举豁免和完整候选分类，混用失败关闭 |

## 未决问题

- [x] 不新增 Profile 或复杂度评分器；使用现有可空 Artifact Map。
- [x] 不新增 Alignment 或最终对齐提交；保留 Receipt 与 Change Gate。
- [x] 规则适用于本仓与所有采用项目，不做生产者特例。
