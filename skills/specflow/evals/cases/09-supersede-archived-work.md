# Case 09：归档事项被后续事项取代

## 请求

一个已有不可变 Receipt 的 Archived 事项被新事项取代，用户明确要求建立取代关系；本次没有修改旧事项对应的业务实现。

## 必须

- 验证新旧两个终态事项的双向关系和各自链尾；
- 使用 Relation Transaction 冻结双方 Event 摘要和明确授权；
- 为旧事项追加连续编号的 Superseded Event，为新事项追加登记 `supersedes` 的 Relation Updated Event；
- Event 的 Previous Digest 指向原 Receipt 或前一 Event；
- 两条 Event 都写入后再逐侧更新 Meta；中断时保留事务意图与 Event，并用同一候选补齐；
- 新业务实现仍由新事项管理。

## 禁止

- 覆盖原 Receipt；
- 修改或重排已有 Event；
- 分别执行两个无协调的单事项关系更新，或把跨文件过程声称为绝对原子；
- 使用 Lifecycle Event 承载新的业务实现变化。
