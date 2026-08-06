# Case 02：消费大型 Spec 的 Section Index

## 请求

当前任务只修改缓存兼容策略。Context Resolver 将大型 Active Spec 标记为 `sectioned`，索引显示“完成条件”“数据流”“兼容与迁移”“UI 细节”和多个未完成 Tasks。

## 必须

- 先使用 Section Index 定位“完成条件”“兼容与迁移”和相关未完成 Task；
- 等待 Resolver 返回后再搜索正文，并从广泛检索中排除未选定的 `sectioned` 核心文档；
- 读取这些章节原文后再提取任务约束；
- 将 Section Index 作为导航 Evidence，不当作正文摘要；
- 进入 `slice` 后围绕缓存入口、状态字段、兼容消费者和测试生成任务切片。

## 禁止

- 重读整份 Spec；
- 将 Resolver 与针对 Active Spec 正文的广泛检索并行执行；
- 没有读取“兼容与迁移”正文就声称知道兼容约束；
- 在 Skill 内重新实现一套 Markdown 分段或替换 Resolver 预算。
