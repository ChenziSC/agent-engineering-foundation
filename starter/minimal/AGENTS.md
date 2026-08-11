# Agent 协作规则

本项目使用项目级 Agent 工程治理骨架。

## 工作入口

1. 先读取本文件；
2. 当前会话首次处理本仓请求时，Harness 可用则运行 `context resolve` 生成最小加载计划；标记为 `sectioned` 的事项按返回的 Section Index 读取相关章节，不直接加载全部正文；否则从 `specs/*/meta.yaml` 人工选择相关 Active 事项。同一会话、分支和任务范围内复用结果；切换分支、Active 事项集合变化、任务目标或相关路径明显变化、用户明确要求刷新时重新解析；
3. 根据加载计划加载相关长期知识；需要人工浏览知识全貌时先看 `knowledge/README.md`，确定性条目状态与路由仍以 `knowledge/registry.json`、`knowledge/code-entry-map.json` 和 Resolver 为准；
4. 范围或完成条件变化更新 Spec；只有命中已安装 `specflow` Skill 的创建条件时才补建 Plan、Tasks 或 Validation Report，未创建项在 Meta 中保持 `null`；已有条件产物只在其职责发生变化时更新；
5. 只有用户明确要求终态时才归档；提交、推送和外部写入分别需要明确授权。

## 内容边界

- Knowledge 只保存长期稳定事实、设计原因、契约和刷新条件；
- Specflow 保存当前事项，不把聊天摘要写进长期知识；
- 程序负责解析、校验、比较和持久化，Agent 负责理解、判断和权衡；
- 不覆盖未知文件、用户修改或 Symlink 目标；
- 不为已有历史伪造 Spec 或归档证据。

项目可以在理解规则后扩展本文件，但应保持根规则简短，并把模块细节放到更窄范围的规则或 Knowledge 中。
