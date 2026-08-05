# Specs

需要长期追溯的研发事项使用 `specs/YYYY-MM-DD-<slug>/`，至少包含：

- `meta.yaml`：状态、关系、影响范围和当前入口；
- `spec.md`：目标、非目标、场景和完成条件；
- `plan.md`：实现证据、技术方案、风险和验证策略；
- `tasks.md`：任务依赖、产物、状态和验证；
- `validation-report.md`：完成条件与真实证据映射。

不改变语义的错别字、链接和格式修正通常不要求 Spec。归档、取消和取代必须有明确授权，不从 Commit、Push 或 PR/MR 推断。
