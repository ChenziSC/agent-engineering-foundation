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
- [ ] 完整 Merge Candidate 已显式关联一个或多个 Spec，且其 Scope 并集覆盖全部实现变更；或者全部路径满足一个受控低风险豁免；
- [ ] 没有同时声明 Spec 与豁免，也没有用 Include/Exclude 隐藏关联检查范围；
- [ ] 实现变化摘要的 Scope、算法和排除项明确；
- [ ] Spec、Plan、Tasks 和 Validation Report 内容摘要已计算并回读；
- [ ] 变更摘要由稳定版本边界或 Provider 产生，没有用 Agent 总结伪造；产物和 Payload 摘要由 Receipt 脚本计算。

## Knowledge Projection

- [ ] 已按影响范围读取相关 Knowledge 和 Registry；
- [ ] 每项命中知识都有 `create/update/still-valid/supersede/retire` 结论和证据；
- [ ] 没有影响时记录 `impact: none` 和理由；
- [ ] `review-required`、过期或证据版本不匹配的 Knowledge 已先复核；
- [ ] Knowledge 正文、Registry 和 Projection 一致。
- [ ] 已传入真实变更路径执行 Projection Plan，没有遗漏 Scope 反向命中；
- [ ] 已执行 Projection Apply 和独立 Verify，或明确记录采用方等价人工步骤；
- [ ] 退役知识不再被 Code Entry Map 路由，取代目标有效。

## 写入与恢复

- [ ] Receipt 目标不存在，或已有 Receipt 与候选完全相同；
- [ ] 已使用 `finalize-receipt` 生成并回读不可覆盖 Receipt，再执行 Meta 状态最后写；
- [ ] Receipt 已完整写入并回读校验；
- [ ] Meta 状态在全部证据之后最后写入；
- [ ] 状态写入失败时保持 Active，并保留可诊断的已有 Receipt；
- [ ] 取代关系在两侧一致，不通过猜测自动补全；
- [ ] 两个终态事项的父子或取代关系已使用 `finalize-relation`，事务意图和双方 Event 均先于 Meta 投影写入；
- [ ] `verify-relation` 已通过；若中断，只用完全相同的候选补齐，不删除证据或把中间态表述为回滚完成；
- [ ] 既有 Receipt 和 Lifecycle Event 没有被覆盖、删除或重排。
- [ ] 后续 Event 已使用 `finalize-event` 连续追加，并通过 `verify-chain` 复核；

## 交付门禁

- [ ] 已对最终不可变 Source 执行 `change gate check --phase delivery`；
- [ ] Spec 关联模式下，Meta 已终态、Receipt 和 Lifecycle 链可验证，且 Receipt 摘要仍对应最终候选；
- [ ] 豁免模式下，完整候选仍全部满足同一个受控路径分类；
- [ ] 门禁结果只作为仓库内证据，没有被解释为 PR/MR、部署、上线或终态授权。
