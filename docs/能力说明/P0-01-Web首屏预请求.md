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

- 当前：已验证 Skill + Web 预请求设计框架 + 报告、验证模板和脱敏 Trace Evidence；
- 当前成熟度：Skill `validated`，Framework `designed`；
- 首期不要求：实现 `prefetch-core`、Checkpoint、Evidence、BrowserProvider 或可运行 Demo；
- 未来可选：Validator、Mock Adapter、合成 Demo 和共享 Core 的参考实现。

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

- `prefetch-core` 校验 readiness、请求资格、显式调度策略和比较结果；
- `checkpoint-core` 保存 Run、Stage、Event、Decision 和外部引用；
- `evidence-core` 校验 Evidence、Claim、Blocker、Verification 和 Claim 新鲜度；
- 组合 Validator 根据 Checkpoint 与 Evidence 状态检查阶段退出条件；
- Adapter 采集浏览器证据和版本证据。

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

## 首期资源

- `SKILL.md`：完整执行流程、判断规则和安全门禁；
- `references/`：请求资格规则、readiness 模式、失败模式和证据要求；
- `assets/`：分析报告、验证清单和 Provider 配置模板；
- `evals/`：触发、安全判断、证据纪律、行为回归和版本边界案例；
- `scripts/` 和 `tests/`：首期不需要，因为尚未承诺确定性参考实现。

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

- `prefetch-core` 与组合 Validator；
- Checkpoint 和 Evidence 的参考实现；
- Mock BrowserProvider、Mock VersionEvidenceProvider；
- 完全合成的可运行 Web Demo；
- 对应程序测试。
