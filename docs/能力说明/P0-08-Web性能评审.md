# P0-08 Web 性能评审

## 定位

给定至少一种浏览器性能证据以及可选的代码仓库，产出范围明确、证据可追溯并按收益和风险排序的性能瓶颈报告；有代码时把结论映射到可验证的实现位置。

## 交付形态

- 当前：已验证 Skill + 性能评审报告模板和脱敏 Trace Evidence；
- 当前成熟度：Skill `validated`；
- 首期不要求：Trace/HAR Parser、Browser Adapter 或指标计算程序；
- 未来可选：浏览器采集和报告解析参考实现。

当前产物：[`web-performance-review` Skill 与配套模板](../../skills/web-performance-review/SKILL.md)。

## 触发与不触发条件

应该触发：

- 用户需要分析页面加载或交互性能；
- 已有 Lighthouse、Trace、HAR 或可访问 URL；
- 需要从性能证据定位代码改造方向；
- 需要复核已有性能结论。

不应触发：

- 用户已经确定问题是某个请求发送过晚，并希望设计预请求方案；
- 没有任何性能证据且无法采集；
- 用户只要求解释某个性能指标的定义。

只有 HAR 时可以分析网络，但不能推断主线程成本；没有仓库时不能虚构代码根因。

## 输入

至少提供一种：

- URL；
- Lighthouse 报告；
- Performance Trace；
- HAR。

可选输入：

- 代码仓库；
- 页面路由；
- 用户操作流程；
- 历史测量；
- 当前版本证据；
- 性能预算。

## 输出契约

- `scope`：页面、流程、版本和证据边界；
- `metricSummary`：可被 Evidence 支持的指标摘要；
- `bottlenecks`：根因分类、Claim 和 Evidence 引用；
- `recommendations`：按预期收益、风险和验证成本排序的改造项；
- `codeLocations`：存在仓库证据时的实现位置；
- `verificationPlan`：行为和性能验证方案；
- `blockers`：当前无法成立的结论；
- `status`：`complete`、`partial` 或 `blocked`。

报告必须区分观察事实、程序推导和 Agent 推断。

## 职责划分

Agent 负责：

- 判断指标和用户体验之间的关系；
- 综合多类 Evidence 形成根因 Claim；
- 比较改造收益、风险和验证成本；
- 在有仓库时解释代码与性能行为的联系。

程序负责：

- 解析和归一化 Lighthouse、Trace、HAR；
- 计算确定性指标；
- 校验 Evidence 引用和范围；
- 检查版本映射；
- 生成结构化报告和前后对比。

采集 URL、登录页面或访问外部环境时遵循宿主权限策略。

## 依赖与状态所有权

- `evidence-core` 唯一管理 Evidence、Claim、Blocker 和 Verification；
- BrowserProvider 负责采集，不解释性能根因；
- VersionEvidenceProvider 负责版本关系，不触发部署；
- 代码定位通过 SourceControl 或本地仓库 Adapter；
- Web 首屏预请求是可选的后续专项 Skill，性能评审不复制其资格校验逻辑；
- 长时间采集需要恢复时可以接入 Checkpoint，但首版不强制依赖。

## 非目标与安全边界

- 不只复述 Lighthouse 分数；
- 只有 HAR 时不推断主线程成本；
- 没有代码仓库时不虚构实现原因；
- 不把相关性直接描述为因果关系；
- 不承诺没有验证的性能收益；
- 不自动修改代码、部署或发布；
- 不在公开案例中使用真实生产 Trace、HAR、URL 或业务数据。

## 首期资源

- `SKILL.md`：证据分析流程、边界和排序规则；
- `references/`：指标语义、常见瓶颈、证据限制和失败模式；
- `assets/`：评审报告、证据矩阵和验证计划模板；
- `evals/`：证据边界、代码映射、排序和禁止幻觉案例；
- `scripts/` 和 `tests/`：首期不需要。

## 合成评估案例

1. 合成 URL 和 Trace 显示资源瀑布，应识别主要阻塞并给出验证方案。
2. 只有合成 Lighthouse 报告，应输出有限建议而不虚构代码位置。
3. 只有合成 HAR，应分析网络但明确不能判断主线程成本。
4. 合成代码仓库与 Trace 可映射，应定位候选实现并保留推断标记。
5. 合成微前端容器中共享资源影响多个页面，不得把证据扩大成单页面唯一根因。

## Skill 首版验收

- `SKILL.md` 能处理 URL、Lighthouse、Trace、HAR 中至少三种输入路径；
- 输出符合统一 Evidence 与 Claim 模型；
- 有仓库和无仓库两种模式边界清楚；
- 五个合成 Eval Case 有明确评分标准；
- 缺少关键证据时能输出 partial 或 blocked，而不是完整结论。

## 未来可选工程化

- Lighthouse、Trace 和 HAR Parser；
- 指标归一化与比较；
- BrowserProvider 和 VersionEvidenceProvider；
- Schema 校验和报告生成；
- 确定性程序测试。
