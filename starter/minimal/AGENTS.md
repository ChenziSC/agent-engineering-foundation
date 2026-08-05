# Agent 协作规则

本项目使用项目级 Agent 工程治理骨架。

## 工作入口

1. 先读取本文件；
2. 从 `specs/*/meta.yaml` 选择与请求相关的 Active 事项；
3. 根据 `knowledge/registry.json` 和 `knowledge/code-entry-map.json` 加载相关长期知识；
4. 范围变化更新 Spec，技术路径变化更新 Plan，执行状态和验证更新 Tasks；
5. 只有用户明确要求终态时才归档；提交、推送和外部写入分别需要明确授权。

## 内容边界

- Knowledge 只保存长期稳定事实、设计原因、契约和刷新条件；
- Specflow 保存当前事项，不把聊天摘要写进长期知识；
- 程序负责解析、校验、比较和持久化，Agent 负责理解、判断和权衡；
- 不覆盖未知文件、用户修改或 Symlink 目标；
- 不为已有历史伪造 Spec 或归档证据。

项目可以在理解规则后扩展本文件，但应保持根规则简短，并把模块细节放到更窄范围的规则或 Knowledge 中。
