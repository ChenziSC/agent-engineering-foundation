# Knowledge

本目录只保存跨任务稳定的事实、设计原因、契约、代码入口和刷新条件。

- `registry.json` 登记知识条目和适用范围；
- `code-entry-map.json` 根据任务类型和路径选择需要读取的知识；
- 当前进度、临时调查和聊天摘要保存在 Specflow，而不是 Knowledge；
- 代码入口或契约变化时，将相关条目标记为 `review-required`，不要静默删除。
- 每个条目的 `source_evidence` 必须覆盖全部 `authoritative_sources` 并保存 SHA-256；摘要变化表示需要语义复核，不能只刷新摘要。

新增正文后，同时更新 Registry 和 Code Entry Map；没有真实知识时保持空注册表，不创建占位正文。

`agent-foundation.json` 的 `context` 控制 Active Spec 核心 Markdown 的全文预算、索引上限和单个规则文件预算，不截断 Knowledge 正文；Knowledge 是否加载仍由 Registry 与 Code Entry Map 决定。Context Resolver 会按请求路径加入根级与沿途 `AGENTS.md`，Doctor 只机械检查规则体量、精确重复和路由结构，不替代自然语言语义复核。

## 接入后的项目导航

本文件初始只提供治理规则。项目完成 Bootstrap 并批准真实 Knowledge 后，应在本页补充简明的项目知识导航：

- 一段知识库定位、覆盖范围和明确非覆盖范围；
- 已批准 Knowledge 正文的标题、链接、用途和典型加载场景；
- 常见任务到代码入口和 Knowledge 的人类可读路由示例；
- Knowledge、项目规则、Specflow 和外部知识源之间的职责边界。

README 只负责帮助人和 Agent 快速发现内容，不复制 Registry 中的 Digest、完整 Scope、状态原因或全部刷新条件，也不替代 Code Entry Map 和 Context Resolver 的确定性选择结果。没有真实且已批准的项目知识时，保留本节说明，不编造项目总览、条目或路由。
