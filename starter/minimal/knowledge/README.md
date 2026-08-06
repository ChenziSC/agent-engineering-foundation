# Knowledge

本目录只保存跨任务稳定的事实、设计原因、契约、代码入口和刷新条件。

- `registry.json` 登记知识条目和适用范围；
- `code-entry-map.json` 根据任务类型和路径选择需要读取的知识；
- 当前进度、临时调查和聊天摘要保存在 Specflow，而不是 Knowledge；
- 代码入口或契约变化时，将相关条目标记为 `review-required`，不要静默删除。
- 每个条目的 `source_evidence` 必须覆盖全部 `authoritative_sources` 并保存 SHA-256；摘要变化表示需要语义复核，不能只刷新摘要。

新增正文后，同时更新 Registry 和 Code Entry Map；没有真实知识时保持空注册表，不创建占位正文。

`agent-foundation.json` 的 `context` 控制 Active Spec 核心 Markdown 的全文预算、索引上限和单个规则文件预算，不截断 Knowledge 正文；Knowledge 是否加载仍由 Registry 与 Code Entry Map 决定。Context Resolver 会按请求路径加入根级与沿途 `AGENTS.md`，Doctor 只机械检查规则体量、精确重复和路由结构，不替代自然语言语义复核。
