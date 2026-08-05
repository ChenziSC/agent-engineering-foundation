# Specflow 收口检查清单

## 授权与状态

- [ ] 用户明确要求归档、取消、取代或准备最终收口；
- [ ] 当前状态允许目标转换；
- [ ] 提交、推送、PR/MR 或 Agent 自述没有被当作终态授权；
- [ ] 外部交付状态与 Specflow 状态分开表达。

## 最终产物

- [ ] Spec 反映最终范围和完成条件；
- [ ] Plan 反映最终实现路径和关键决策；
- [ ] Tasks 状态与真实执行结果一致；
- [ ] Validation Report 为每个完成项提供证据；
- [ ] 未完成项、Blocker、风险和未验证结论保持可见。

## 版本与摘要

- [ ] 实现版本和 Base 版本稳定且可复现；
- [ ] 不存在会进入摘要范围的未提交变化；
- [ ] 实现变化摘要的 Scope、算法和排除项明确；
- [ ] Spec、Plan、Tasks 和 Validation Report 内容摘要已计算并回读；
- [ ] Agent 没有在缺少 Validator 时伪造 Digest。

## Knowledge Projection

- [ ] 已按影响范围读取相关 Knowledge 和 Registry；
- [ ] 每项命中知识都有 `create/update/still-valid/supersede/retire` 结论和证据；
- [ ] 没有影响时记录 `impact: none` 和理由；
- [ ] `review-required`、过期或证据版本不匹配的 Knowledge 已先复核；
- [ ] Knowledge 正文、Registry 和 Projection 一致。

## 写入与恢复

- [ ] Receipt 目标不存在，或已有 Receipt 与候选完全相同；
- [ ] Receipt 已完整写入并回读校验；
- [ ] Meta 状态在全部证据之后最后写入；
- [ ] 状态写入失败时保持 Active，并保留可诊断的已有 Receipt；
- [ ] 取代关系在两侧一致，不通过猜测自动补全；
- [ ] 既有 Receipt 和 Lifecycle Event 没有被覆盖、删除或重排。
