# P0-01 Web 首屏预请求

## 定位

给定可稳定复现的 Web 首屏场景、实现代码和可获得的浏览器证据，产出一个满足行为安全、请求契约一致和版本边界明确的预请求方案及验证报告。

它完整处理：

```text
页面场景
→ 可见完成条件
→ 阻塞请求
→ 请求资格
→ 最小实现位置
→ 行为验证
→ 性能对比
```

它的价值优先级排第一，因为它同时覆盖分析、决策、实现和验证，适合作为共享底座的第一个综合示范；这不表示它应该早于所有依赖 Package 实现。

## 交付形态

- 当前：已验证 Skill + Web 预请求框架 + Evidence/资格参考实现 + 报告、验证模板和脱敏 Trace Evidence；
- 当前成熟度：Skill `validated`，Framework 与 Evidence/资格子集 `reference-implemented`；
- 当前子集：解析显式 HAR/Trace Observation，校验只读性、重复安全、契约、缓存维度、消费复用、失败回退和行为状态；
- 当前未提供：真实应用 Promise/缓存接入、BrowserProvider、VersionEvidenceProvider、自动部署和可运行合成 Demo。

当前产物：[Web 首屏预请求设计框架](../../frameworks/web-prefetch/README.md)与[`web-first-screen-prefetch` Skill](../../skills/web-first-screen-prefetch/SKILL.md)。

## 触发与不触发条件

应该触发：

- 用户希望优化首屏关键内容出现时间；
- 已知或怀疑关键请求发送过晚；
- 需要判断某个请求能否安全提前发送；
- 需要验证已有预请求方案是否真的改善首屏。

不应触发：

- 目标只是通用性能体检而没有预请求问题；
- 请求具有写入、副作用或无法确认幂等性；
- 页面和请求都无法稳定复现；
- 用户只要求解释某个网络概念。

缺少页面场景、可见完成条件或请求安全信息时，只能输出待验证假设和 Blocker，不能直接给出实施结论。

## 输入

必需输入：

- 页面 URL 或可稳定复现的合成路由；
- 当前实现代码或等价的实现说明；
- 明确的首屏场景和可见完成条件。

可选输入：

- Performance Trace；
- Network 记录；
- DOM Snapshot；
- 历史测量；
- 当前运行版本证据；
- 用户给出的候选请求。

允许对合成 Demo 使用明确写出的测试假设，不允许把假设描述成生产事实。

## 输出契约

结构化输出至少包含：

- `scenario`：页面场景和可见完成条件；
- `evidenceRefs`：支持分析的 Evidence 引用；
- `candidateRequests`：候选请求和选择理由；
- `eligibility`：副作用、幂等、鉴权、缓存、失效和降级判断；
- `consumerContract`：请求与消费方的契约；
- `implementationPlan`：最小实现位置和改动范围；
- `behaviorValidation`：行为回归结果；
- `performanceComparison`：优化前后比较；
- `versionBoundary`：版本映射及结论适用范围；
- `runRef`：可选的 Checkpoint Run 引用；
- `status`：`ready`、`blocked`、`partial` 或 `verified`。

行为验证失败时，`status` 不得为 `verified`。缺少版本映射时必须收窄结论范围。

## 职责划分

Agent 负责：

- 判断用户真正关心的可见终点；
- 从已提供或已采集的证据中选择候选请求；
- 比较预请求、延后非关键工作、修复挂载等方案；
- 解释证据、推断和风险；
- 决定何时需要人工确认。

程序负责：

- 当前 Web Evidence/资格子集解析显式 Observation，并校验请求安全、契约、复用与回退条件；
- 现有 Checkpoint 和 Evidence 参考实现各自校验运行恢复与证据契约，只在上层显式组合时参与本流程；
- 尚未实现的完整 `prefetch-core` 负责调度策略、组合退出门禁和与真实应用的复用接入；
- 尚未提供的 Adapter 负责浏览器证据和版本证据采集。

涉及修改代码、运行浏览器或访问外部环境时，遵循宿主权限策略；发布和部署不属于本 Skill。

## 依赖与状态所有权

对用户只暴露一个 Skill：

```text
web-first-screen-prefetch
├── prefetch-core
├── checkpoint-core
├── evidence-core
├── BrowserProvider
└── VersionEvidenceProvider
```

- `prefetch-core` 是首屏预请求领域内核，不作为独立 Skill 暴露；
- Agent 或人工选择页面终点、候选请求和实现范围；
- `prefetch-core` 只对显式候选执行校验、评分和排序；
- Evidence 与 Claim 只存于 `evidence-core`；
- Checkpoint 只保存运行状态和不透明引用；
- Browser 与版本证据通过 Adapter 接入；
- Skill 负责编排完整流程，不拆成多个相互竞争的 Skill。

## 非目标与安全边界

- 不处理有副作用的请求；
- URL 相同不代表线上协议一致；
- 缓存 Key、鉴权、幂等、失效和降级必须明确；
- 不保证预请求一定优于其他优化方案；
- 行为失败时不能输出性能成功结论；
- 没有版本映射时不能声称验证了目标版本；
- 不负责部署、发布或绕过权限。

## 当前资源

- `SKILL.md`：完整执行流程、判断规则和安全门禁；
- `references/`：请求资格规则、readiness 模式、失败模式和证据要求；
- `assets/`：分析报告、验证清单和 Provider 配置模板；
- `evals/`：触发、安全判断、证据纪律、行为回归和版本边界案例；
- `frameworks/web-prefetch/scripts/` 和 `tests/`：提供 Evidence Observation 与请求资格的确定性参考实现和测试；Skill 目录不复制该程序。

## 合成评估案例

1. 合成商品页的只读请求发送过晚，应识别候选并输出可验证的最小方案。
2. 合成表单提交请求被误认为候选，必须因副作用阻止实施。
3. 合成页面的请求 URL 相同但缓存 Key 不一致，必须识别契约漂移。
4. 合成环境的页面版本与代码版本无法映射，只能输出有限结论。
5. 性能指标改善但空态行为退化，必须判定整体验证失败。

## Skill 首版验收

- `SKILL.md` 明确触发、不触发、输入、输出和安全门禁；
- references 覆盖 readiness、请求资格、证据和版本边界；
- assets 提供分析报告和行为验证清单；
- 合成案例覆盖正常、空态、错误、权限和版本不一致；
- 五个行为 Eval Case 均有明确的必须动作、禁止动作和通过规则；
- Agent 在案例走查中不会把行为失败描述为优化成功。

## 未来可选工程化

- 面向真实应用复用、调度和组合门禁的完整 `prefetch-core`；
- Checkpoint、Evidence 与 Web 预请求状态的显式组合 Validator；
- Mock BrowserProvider、Mock VersionEvidenceProvider；
- 完全合成的可运行 Web Demo；
- 针对上述完整能力的程序测试。
