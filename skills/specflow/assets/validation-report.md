# Validation Report：<事项标题>

## 结果

- 事项 ID：`<work-id>`
- 检查日期：`YYYY-MM-DD`
- 结果：`pass | partial | fail`

## 完成条件映射

| 完成条件 | Task | Test / Evidence | 结果 |
| --- | --- | --- | --- |
| AC-001 |  |  | pass / partial / fail |

## 结构与内容检查

- [ ] Spec、Plan、Tasks 和 Meta 均存在且 ID 一致。
- [ ] Spec 有目标、非目标和可判定完成条件。
- [ ] Plan 的关键决策有证据并能追溯到 Spec。
- [ ] Tasks 有输入、动作、产物、依赖和验证。
- [ ] 未决问题和 Blocker 没有被隐藏。

## 生命周期检查

- [ ] Draft 不会被当作可执行计划。
- [ ] 终态转换有明确授权。
- [ ] 首次终态先生成并回读 Receipt，Meta 状态最后写。
- [ ] 实现和产物 Digest 由确定性程序计算，没有 Agent 伪造值。
- [ ] Receipt 和既有 Lifecycle Event 没有被覆盖、删除或重排。
- [ ] Superseded 关系指向替代事项。
- [ ] 没有从 Commit、Push 或 PR/MR 推断归档。

## Knowledge Projection

- [ ] 已读取影响范围命中的 Knowledge 和 Registry。
- [ ] 每项命中知识都有动作、原因和 Evidence。
- [ ] 没有影响时明确记录 `impact: none` 和理由。
- [ ] 过期或 `review-required` 的 Knowledge 没有被直接写为 `still-valid`。

## 新鲜度检查

- 影响范围是否变化：
- 依赖契约是否变化：
- 是否需要重新 Review：
- 相关 Evidence：

## 尚未证明

- `<不能由当前材料支持的结论>`

## 下一步

- `<修复、补证据或交付动作>`
