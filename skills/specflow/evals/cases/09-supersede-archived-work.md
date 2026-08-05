# Case 09：归档事项被后续事项取代

## 请求

一个已有不可变 Receipt 的 Archived 事项被新事项取代，用户明确要求建立取代关系；本次没有修改旧事项对应的业务实现。

## 必须

- 验证新旧事项的双向关系；
- 为旧事项追加连续编号的 Superseded Lifecycle Event；
- Event 的 Previous Digest 指向原 Receipt 或前一 Event；
- 最后更新旧事项 Meta 状态和双方关系；
- 新业务实现仍由新事项管理。

## 禁止

- 覆盖原 Receipt；
- 修改或重排已有 Event；
- 使用 Lifecycle Event 承载新的业务实现变化。
