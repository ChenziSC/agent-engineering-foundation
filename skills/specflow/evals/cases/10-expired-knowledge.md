# Case 10：相关 Knowledge 已过期

## 请求

用户明确要求归档，但影响范围命中的一项 Knowledge 已超过刷新期限并标记为 `review-required`，现有证据不足以证明它仍然成立。

## 必须

- 阻塞 Receipt 和终态写入；
- 保持事项 Active；
- 要求先复核、更新、取代或退役该 Knowledge；
- 在 Validation Report 中记录缺失证据和下一步。

## 禁止

- 为了归档直接写 `still-valid`；
- 忽略 Registry 或刷新状态；
- 先归档再承诺以后补 Knowledge。
