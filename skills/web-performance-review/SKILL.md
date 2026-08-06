---
name: web-performance-review
description: 基于 URL、Lighthouse、Performance Trace 或 HAR 评审 Web 性能，区分事实与推断，识别主要瓶颈，并在提供代码仓库时映射到可验证的实现位置。用于页面加载或交互性能分析、性能结论复核和改造优先级排序；不用于已经明确的首屏预请求专项、没有任何性能证据的猜测、自动改代码、部署或发布。
---

# Web 性能评审

## 目标

从可获得的浏览器性能 Evidence 出发，识别最值得处理的瓶颈，说明证据边界，并按预期收益、风险和验证成本排序建议。

不要只复述性能分数，也不要预设某类优化一定适用。

## 开始前

确认至少具备一种输入：

- 可访问的 URL；
- Lighthouse 报告；
- Performance Trace；
- HAR。

如果只有 URL 但当前环境无法采集浏览器证据，请求用户提供报告或把结果标记为 `blocked`。没有任何 Evidence 时不猜测根因。

可选输入包括代码仓库、页面路由、用户流程、历史测量、版本证据和性能预算。

## 工作流

1. 固定页面、用户流程、设备、网络、缓存和版本范围。
2. 按输入类型整理可以观察和不能观察的内容。
3. 生成指标摘要，但只保留有 Evidence 支持的指标。
4. 识别网络、主线程、渲染、资源、缓存、第三方和架构瓶颈。
5. 为每个根因 Claim 关联 Evidence，并标记置信度和范围。
6. 如果提供仓库，从症状映射到候选代码入口；否则不虚构文件路径。
7. 按收益、风险、改动范围和验证成本排序建议。
8. 设计行为与性能验证，输出报告和 Blocker。

采用方同时接入本仓 Harness 时，可以用 `web-evidence summarize --file <evidence.json>` 将合成或脱敏 HAR/Trace 归一为网络或任务 Observation。Parser 不从 HAR 推断主线程，不从未映射 Trace 自动归因源码，也不从单次采集承诺稳定收益。

按需读取：

- 分析阶段与退出条件：[workflow.md](references/workflow.md)
- 各类输入能证明什么：[evidence-by-input.md](references/evidence-by-input.md)
- 瓶颈分类与判断线索：[bottleneck-taxonomy.md](references/bottleneck-taxonomy.md)
- 从 Evidence 映射到代码：[code-mapping.md](references/code-mapping.md)
- 常见失败与修正方式：[failure-modes.md](references/failure-modes.md)

## 与首屏预请求 Skill 的边界

本 Skill 负责通用性能诊断。如果 Evidence 已经明确表明首屏关键只读请求发送过晚，并且用户希望设计安全预请求方案，转用 `web-first-screen-prefetch`。

不要在本 Skill 中复制请求副作用、缓存契约和消费方复用的完整资格流程。

## 硬性门禁

- 只有 HAR 时，不推断主线程执行或渲染成本。
- 只有 Lighthouse 时，不虚构具体代码根因。
- 没有代码仓库时，不输出具体文件位置。
- 不把时间相关性直接描述成因果关系。
- 不从单次测量承诺稳定收益。
- 没有版本映射时，分别描述页面观察和代码推断。
- 不自动修改代码、部署或发布。

## 输出

复制并填写 [performance-review-report-template.md](assets/performance-review-report-template.md)。

同时按需使用：

- [evidence-matrix-template.md](assets/evidence-matrix-template.md)
- [verification-plan-template.md](assets/verification-plan-template.md)

最终状态：

- `complete`：当前范围内主要结论均有 Evidence，关键限制已说明；
- `partial`：仍有有价值结论，但输入限制了根因或代码映射；
- `blocked`：缺少足以开始分析的 Evidence。

`complete` 不表示建议已经实施或收益已经验证。

## 实现请求

如果用户明确要求修改代码：

1. 先完成评审报告；
2. 只修改最高优先级且 Evidence 足够的候选；
3. 保留行为验证；
4. 改动后重新采集一致条件下的 Evidence；
5. 不执行部署或发布，除非用户另行明确要求。

## 资源决策

本 Skill 自身不复制共享 Parser。HAR/Trace 的确定性 Observation 子集位于仓库的 `frameworks/web-evidence/`；浏览器采集、Source Map 映射和语义判断仍依赖采用方 Adapter、现有工具或人工输入。
