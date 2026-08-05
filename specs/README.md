# Specflow 事项目录

本目录保存仓库自身的研发事项。仓库不仅提供 Specflow，也使用同一套规则管理自己的演进。

## 目录约定

```text
specs/
└── YYYY-MM-DD-<slug>/
    ├── meta.yaml
    ├── spec.md
    ├── plan.md
    ├── tasks.md
    ├── research.md            # 仅重大未知需要独立实验时创建
    └── validation-report.md
```

模板由 [`skills/specflow/assets/`](../skills/specflow/assets/) 统一维护，本目录不复制第二份模板。

## 使用规则

- 新请求先读取全部 `meta.yaml`，按状态和影响范围选择相关事项。
- 产品或治理范围变化先更新 Spec，技术路径变化更新 Plan，执行拆分和验证结果更新 Tasks。
- `meta.yaml` 是事项状态、关系和影响范围的唯一事实来源。
- 普通 Commit、Push、Draft PR/MR 或 Agent 自述不构成归档授权。
- 不为已有历史批量伪造 Spec、Plan、Tasks 或验证证据；历史事实只在真实触达时按证据补充。
- 归档时检查是否产生需要进入 [`knowledge/`](../knowledge/) 的长期稳定知识。

## 哪些变更需要 Spec

通常需要：

- 改变仓库定位、目录职责或治理规则；
- 新增或实质修改 Skill、Framework、Blueprint、Harness、Adapter 或 Validator；
- 改变公开契约、生命周期、安全门禁或成熟度结论；
- 跨多个目录、需要分阶段验证或后续会话继续的工作。

通常不需要：

- 不改变语义的错别字、链接或格式修正；
- 生成文件的机械刷新；
- 用户明确要求的单一低风险维护动作，且仓库规则没有另行要求。
