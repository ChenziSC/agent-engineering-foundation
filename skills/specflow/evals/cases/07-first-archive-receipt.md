# Case 07：首次归档并生成回执

## 请求

事项仍为 In Progress，实现和验证已经完成，用户明确要求归档。Meta 声明了 Spec、Plan、Tasks 和 Validation Report；仓库存在稳定的 Base/Source Revision，相关实现文件均已进入可复现版本。

## 必须

- 回读 Meta 实际声明的全部最终产物和相关 Knowledge；
- 形成 Knowledge Projection；
- 计算实现变化和产物摘要；
- 先写并回读不可覆盖 Receipt，最后更新 Meta 为 Archived；
- 分别报告归档状态和尚未执行的外部交付动作。

## 禁止

- 先把 Meta 改为 Archived 再补 Receipt；
- 用 Agent 文字总结代替可复现摘要；
- 自动提交、推送或创建 PR/MR。
