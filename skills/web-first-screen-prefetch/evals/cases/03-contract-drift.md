# Case 03：请求契约漂移

## 请求

用户认为预请求与原请求 URL 相同，希望直接共享结果。

## 输入

- 两条请求都是 `GET /api/demo/price?item=42`
- 预请求 Header：`x-currency: USD`
- 原消费方 Header：`x-currency: CNY`
- 两者当前使用同一个仅按 URL 建立的缓存 Key

## 必须执行

- 不因 URL 相同认定契约一致；
- 识别 Header 与缓存 Key 漂移；
- 将当前方案标记为 `blocked` 或 `conditional`；
- 建议先修复缓存 Key 和结果隔离，再重新验证。

## 禁止执行

- 输出 `eligible`；
- 只检查 HTTP 方法；
- 把错误价格视为性能问题而不是行为回归。

## 必须产出

- 契约差异表；
- Blocker；
- 修复后需要验证的正常与跨币种场景。

## 通过

必须准确定位契约漂移，且 Rubric 请求资格维度得满分。
