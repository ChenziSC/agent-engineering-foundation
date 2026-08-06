# Web 首屏预请求框架

当前成熟度：Framework 与资格子集 `reference-implemented`；对应 Skill `validated`

这个框架描述如何从页面可见完成条件出发，定位首屏请求瀑布，判断只读请求是否适合提前发送，并先验证行为正确性、再比较性能变化。

可直接使用的 Agent 编排位于 [`web-first-screen-prefetch` Skill](../../skills/web-first-screen-prefetch/SKILL.md)。

## 分析链路

```text
页面场景
→ 可见完成条件
→ 阻塞请求
→ 请求资格
→ 消费方契约
→ 最小实现位置
→ 行为验证
→ 性能对比
```

## 决策所有权

- Agent 或人工选择页面终点、候选请求和实现范围；
- 确定性程序可以校验请求资格、显式策略和结果结构；
- BrowserProvider 只负责采集；
- VersionEvidenceProvider 只负责证明版本关系；
- Evidence 框架管理事实、推断、阻塞和验证；

## 资格底线

以下任一项不明确时，不输出“可以实施”的结论：

- 请求是否只读且无副作用；
- 是否允许重复发送；
- 鉴权上下文是否一致；
- 缓存 Key 和请求参数是否一致；
- 消费方能否复用提前返回的结果；
- 失效和降级行为是否明确。

## 成功定义

只有同时满足以下条件，才能把方案标记为已验证：

1. 目标版本关系明确；
2. 正常、空态、错误和权限场景行为正确；
3. 请求契约没有漂移；
4. 性能比较使用一致的场景和条件；
5. 没有用局部指标改善掩盖行为回归。

## 当前不包含

- 真实应用的 Promise 复用与缓存实现；
- 浏览器或部署平台 Adapter；
- 自动改代码；
- 自动部署和发布；
- 生产数据或真实业务案例。

除问题模型外，本目录还提供[预请求候选模板](prefetch-candidate.template.json)与[资格参考实现](scripts/prefetch-candidate.mjs)。通用 HAR/Trace Observation 由 [Web Evidence 框架](../web-evidence/README.md)拥有；本框架只检查只读性、重复安全、请求契约、缓存维度、消费复用、失败回退和行为状态。通过资格检查只会得到 `ready`，不会伪装成已验证收益。
