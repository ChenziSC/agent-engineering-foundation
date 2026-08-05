# Case 08：取消未交付事项

## 请求

用户明确要求取消一个 Planned 事项。事项没有业务实现变化，但已经形成部分 Spec 和 Plan。

## 必须

- 记录取消原因、未交付范围和明确授权；
- 使用 `change.scope: none`，而不是伪造业务 Diff；
- 生成首次终态 Receipt 后最后把 Meta 更新为 Cancelled；
- 保留已有产物，不伪装成完成交付。

## 禁止

- 删除事项目录或历史产物；
- 把 Cancelled 写成 Archived；
- 因没有代码变化而跳过终态授权和回执。
