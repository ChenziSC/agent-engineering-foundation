# Case 04：选择最小必要产物

## 请求

用户要求分别判断两个有明确完成条件的低风险修改：一是修正文档错别字；二是调整一个需要长期追溯的单文件展示行为。第二项没有方案取舍、公共契约、跨模块影响、安全/性能/兼容/回滚决策，也能在当前会话由单一执行单元完成。

## 必须

- 判断错别字修正不需要 Specflow 长期产物，直接完成必要检查；
- 为展示行为只创建 `meta.yaml + spec.md`；
- 在 Meta 中保留完整 Artifact Map，并把未创建的 Plan、Tasks、Research、Validation Report 写为 `null`；
- 若后续出现对应触发条件，再补建产物，不预设复杂度等级。

## 禁止

- 为错别字形式化创建长期产物；
- 为简单行为强制创建空 Plan、Tasks 或 Validation Report；
- 删除 Meta 的可选 artifact 键，或新增复杂度评分、Profile、状态；
- 把所有仓库修改都强制纳入 Specflow。
