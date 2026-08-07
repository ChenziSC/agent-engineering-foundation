# Plan：补齐渐进式项目规则就绪评估

## 对应 Spec

- 事项 ID：`2026-08-07-progressive-project-rule-readiness`
- Spec：`./spec.md`

## 当前证据

| 类型 | 内容 | 来源 |
| --- | --- | --- |
| Evidence | Bootstrap 已能生成项目规则、Knowledge、入口和完整 Skill 就绪候选 | Skill、报告模板与五个行为 Case |
| Evidence | 报告只有无结构的“项目规则候选”表，没有最低规则基线或渐进阶段 | `context-bootstrap-report-template.md` |
| Evidence | 能力就绪矩阵可证明 Skill 前置条件，但不能替代项目规则内容完整度 | `workflow-and-boundaries.md` |
| Evidence | 一次真实采用复核出现“治理结构齐全、项目开发规则仍偏通用”的情况 | 脱敏观察，不保存样本标识和具体内容 |
| Evidence | 当前 Skill 已在一个完成 Harness 接入的真实项目上完成只读复核，并在明确授权后生成项目内候选草稿 | 脱敏执行记录；只修改受管 Skill 与治理事项，不修改业务实现 |

## 关键决策

| 决策 | 备选方案 | 选择理由 | 代价 |
| --- | --- | --- | --- |
| 增加报告级规则就绪矩阵 | 新增持久化 Registry 或 Schema | 结论需要语义判断和维护者裁决，当前没有确定性消费者 | 不提供机器硬门禁 |
| 复用四态但独立于 Skill 矩阵 | 把规则维度伪装成 Skill | 防止“Skill 可运行”和“项目规则完整”混为一谈 | 报告增加一个小表 |
| 三阶段渐进完善 | 首次接入一次询问所有领域 | 降低接入负担并避免空配置 | 后续任务需要刷新规则候选 |
| 根规则保持短小 | 生成覆盖所有模块的单一大文件 | 项目事实按所有权进入 Knowledge、模块规则或领域配置 | Agent 需要按路由加载多层内容 |
| 只增加行为 Eval | 新增 CLI 内容质量检查 | 语义正确性不能由文件存在或关键词机械证明 | 保持 `usable` 成熟度 |

## 实现范围

- 更新 Skill 的候选分类、报告要求和硬性门禁；
- 扩展报告模板与工作流 Reference；
- 新增一项“结构齐全但规则语义不完整”的行为 Case，并更新 Rubric；
- 更新能力地图、成熟度说明和 Distribution 内容摘要；
- 不修改 Harness 核心、Starter 或采用项目。

## 验证策略

| 完成条件 | 验证方式 |
| --- | --- |
| AC-001～AC-006 | 逐项静态复核 Skill、模板、Reference、Case 与 Rubric |
| AC-007 | Skill Check、源仓 Distribution 内容摘要校验与 Docs 事实核对 |
| AC-008 | `npm test`、Repository/Specflow/Knowledge Check、`git diff --check` |
| AC-009 | Repository 敏感扫描与有界标识扫描 |
| AC-010 | 对真实采用项目运行 Doctor、Context、Knowledge、Specflow、Distribution Plan/Apply/Verify，并复核自动取证、候选草稿和最少维护者问题是否满足行为契约 |
