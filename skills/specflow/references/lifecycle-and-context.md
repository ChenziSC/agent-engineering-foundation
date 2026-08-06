# 生命周期与上下文恢复

## 生命周期

```text
Draft → Planned → In Progress → Archived → Superseded
  └──────── Active ─────────┬→ Cancelled
                            └→ Superseded
```

- Draft：范围或完成条件尚未闭合。
- Planned：Spec 和 Plan 已可执行。
- In Progress：实施或验证已经开始。
- Archived：最终产物和验证已经收口。
- Superseded：被另一个事项取代；Active 首次进入该状态时使用 Receipt，Archived 后变化使用追加式 Event。
- Cancelled：Active 事项停止且没有替代事项，使用首次终态 Receipt，不伪装成已完成交付。

终态需要用户明确授权。提交、推送、PR/MR 状态和 Agent 自述都不能替代授权。

首次终态的 Receipt、状态最后写和归档后 Event 规则见 [archive-and-lifecycle.md](archive-and-lifecycle.md)。

## 关系

父子、取代和被取代关系必须双向一致。Superseded 必须指向替代事项；Cancelled 必须记录停止原因。不要为方便而修改历史终态，后续行为变化优先建立新事项并关联。

## 新会话恢复

当前会话第一次收到仓库相关请求时：

1. 读取可访问的 `meta.yaml`；
2. 找出非终态事项；
3. 根据影响范围和当前请求选取相关事项；
4. 只加载所选事项的 Spec、Plan 和未完成 Tasks；
5. 大文档先读取 Section Index，再按需展开。

没有 Active 事项时返回空结果，不虚构上下文，也不机械创建新事项。

同一会话、同一分支和同一任务范围内复用恢复结果。切换分支、Active 事项集合变化、任务目标或相关路径明显变化、用户明确要求刷新时重新恢复；后续追问、继续实施、验证和状态查询不单独触发。

## 新鲜度

以下变化需要重新检查归档内容：

- 影响范围内的代码入口变化；
- 依赖契约或 Schema 变化；
- 被引用的架构决策被取代；
- 完成条件或外部约束变化。

发现变化时标记 `review-required`，不得自动把终态改回 In Progress。相关 Knowledge 已过期或需要复核时，不得为新的 Active 事项生成 `still-valid` Projection 或完成归档。

## 与 Checkpoint 的边界

Meta 管理事项生命周期；Checkpoint 管理一次 Agent 运行的恢复位置。Checkpoint 可以引用 Specflow 产物，但不能复制业务状态。Checkpoint 丢失不改变事项状态。
