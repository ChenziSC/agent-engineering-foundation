# Validation Report：Specflow 按需产物与低风险交付豁免

## 结论

- 结果：`pass`
- 事项状态：保持 `in-progress`；用户未授权归档、提交、推送或创建 PR/MR。
- 未解决 Blocker：无。

## 完成条件与证据

| 完成条件 | 结果 | 证据 |
| --- | --- | --- |
| AC-001 | pass | Meta Schema、模板和确定性 Validator 保留完整键集合，Spec 必需，四类条件产物接受安全路径或 `null`；最小与完整 fixture 均通过。 |
| AC-002 | pass | Receipt 最少只要求 Spec；Seal 与后续 Verify 均校验其角色/路径集合与当前 Meta 的非空声明完全一致；模板 Artifact Digest 先安全校验描述符、计算后再做完整校验。最小、完整、漏项、Meta 漂移、模板占位符、越界和 Lifecycle 回归通过。 |
| AC-003 | pass | Context Resolver 跳过值为 `null` 的 Plan/Tasks；测试同时覆盖最小事项、完整事项、全文预算与 Section Index。 |
| AC-004 | pass | Skill、Blueprint、根规则、Specs README 和 Starter 已统一；消费者根指令和回流表不再无条件创建 Plan/Tasks；未新增 Profile、评分器、状态或命令。 |
| AC-005 | pass | 本仓 PR 描述支持 `Spec-IDs` 或 `Spec-Exemption` 二选一；采用项目 Delivery 模板支持 `spec_id` 或 `exemption` 二选一，并复用现有 Change Gate 校验。 |
| AC-006 | pass | 115 个单测、2 个规模测试及全部治理检查通过，既有完整事项无需迁移。 |
| AC-007 | pass | 现有 Eval Case 01/04/07 与 Rubric/Replay 已覆盖复杂需求、无 Spec 小改、Meta + Spec 简单行为和实际声明产物归档；本次只为变化 Case 新增 2026-08-11 最小 Trace，未改写旧 Trace；13/13 Case 通过。 |
| AC-008 | pass | 简单 Context fixture 从 3 份 Markdown 降为 1 份且 `markdownBytes` 严格下降；默认事项目录从 4 份固定 Markdown 降为 1 份必需 Markdown；Skill 主入口和 Blueprint 各减少 14 字节。 |

## 执行观察

| 检查 | 结果 |
| --- | --- |
| `npm test` | pass，115/115 |
| `npm run test:scale` | pass，2/2 |
| `npm run check` | pass |
| `agent-foundation eval run --skill specflow --target . --replay evals/replay.json` | pass，13/13，平均分 99.54 |
| `agent-foundation doctor --target .` | pass |
| `agent-foundation distribution verify --target .` | pass |
| `agent-foundation knowledge check --target .` | pass |
| `agent-foundation specflow check --target .` | pass |
| `git diff --check` | pass |

## 全仓重新审计收敛

| 审计发现 | 修复与执行证据 |
| --- | --- |
| Receipt 只在 Seal 时绑定 Meta | `verifyArchiveReceipt`、Lifecycle、Relation Transaction 和 CLI 均携带 Meta 路径；终态 Artifact Map 漂移测试失败关闭。 |
| 模板 Digest 占位符被前置完整校验拒绝 | 前置阶段只校验 Artifact 描述符和安全路径，摘要计算后执行完整结构校验；模板占位符测试通过。 |
| Receipt Schema 未表达 Spec 必需 | Schema 使用 `contains`、`minContains`、`maxContains` 固定唯一 Spec；结构断言测试通过。 |
| 消费者仍可能固定创建 Plan/Tasks | Starter 根指令和 Specflow 回流表改为按创建条件补建；初始化测试阻断旧表述。 |
| Knowledge 只机械刷新 Digest | 新增本事项 Projection，1 个 `update`、3 个 `still-valid` 已完成 Plan/Apply/Verify，Registry 复核日期和决策指纹同步到 2026-08-11。 |
| 新 Replay 改写旧日期 Trace | 恢复 2026-08-05 Trace，只为 Case 01/04/07 新增 2026-08-11 最小只读走查 Trace。 |

## 兼容与成本复核

- 兼容：现有非空 Plan、Tasks、Validation Report 和完整 Receipt fixture 保持合法；未增加 Schema 版本或迁移器。
- 消费者：Distribution 仍发布同一份 Specflow Skill；Starter、Blueprint 和 Delivery 模板均采用相同按需契约，没有生产者特例。
- 上下文：普通 Skill 主入口没有因解释按需规则变长；终态 Reference 仍只在对应场景按需加载。
- Knowledge：通过本事项 Knowledge Projection 更新 `self-hosted-governance`，并确认其他三个条目仍然有效；来源摘要、复核日期和 `last_projection` 已由现有 Plan/Apply/Verify 同步。
- 限制：路径型豁免仍不能证明行为代码中的“仅文案”或“仅格式”安全，这类修改继续使用轻量 Meta + Spec。

## Evidence 来源关系

- 同源说明：Spec、Plan、Skill 与 Blueprint 描述目标和契约，不单独证明实现正确。
- 执行观察：单测、规模测试、Eval、Repository Check、Doctor、Distribution、Knowledge 与 Specflow Check 证明各自覆盖范围内的行为。
- 交叉验证：最小/完整 fixture、生产者/采用方入口、字节数对照和旧术语定向搜索共同复核兼容与减法目标。
