# Knowledge

本目录只保存跨任务稳定的事实、设计原因、契约、代码入口和刷新条件。

- `registry.json` 登记知识条目和适用范围；
- `code-entry-map.json` 根据任务类型和路径选择需要读取的知识；
- 当前进度、临时调查和聊天摘要保存在 Specflow，而不是 Knowledge；
- 代码入口或契约变化时，将相关条目标记为 `review-required`，不要静默删除。

新增正文后，同时更新 Registry 和 Code Entry Map；没有真实知识时保持空注册表，不创建占位正文。
