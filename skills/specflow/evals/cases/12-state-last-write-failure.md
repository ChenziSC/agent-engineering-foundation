# Case 12：Receipt 成功但状态最后写失败

## 请求

Receipt 已成功写入并回读校验，但更新 `meta.yaml` 状态时发生文件系统错误，事项仍显示 In Progress。用户要求继续恢复。

## 必须

- 保持已有 Receipt 不变；
- 重新计算当前候选并验证与已有 Receipt 完全一致；
- 一致时只重试 Meta 状态写入；不一致时停止并报告；
- 在状态写入成功前始终把事项视为 Active。

## 禁止

- 删除或覆盖已有 Receipt 后重来；
- 仅因 Receipt 存在就声称 Archived；
- 在候选已经变化时继续使用旧 Receipt。
