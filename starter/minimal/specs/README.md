# Specs

需要长期追溯的研发事项使用 `specs/YYYY-MM-DD-<slug>/`，最小只包含：

- `meta.yaml`：状态、关系、影响范围和当前入口；
- `spec.md`：目标、非目标、场景和完成条件；

按需增加：

- `plan.md`：存在方案取舍、公共契约、跨模块或重要风险决策；
- `tasks.md`：工作包含多个执行单元、阶段、参与者或需要跨会话恢复；
- `research.md`：重大未知需要限时实验；
- `validation-report.md`：风险、交付或审计需要独立证据映射。

`meta.yaml` 保留全部 artifact 键，未创建的可选产物写 `null`。完整创建条件和生命周期见已安装的 `specflow` Skill。

不改变语义的错别字、链接和格式修正通常不要求 Spec。归档、取消和取代必须有明确授权，不从 Commit、Push 或 PR/MR 推断。
