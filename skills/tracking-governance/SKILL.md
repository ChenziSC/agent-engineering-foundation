---
name: tracking-governance
description: 为产品行为设计、生成或评审埋点时，建立事件目的、触发语义、属性来源、隐私分类、代码落点、重复触发防护和验证场景。适用于新增埋点、埋点迁移、事件口径评审、代码生成或数据质量排查。
---

# 埋点治理

1. 从分析问题或产品决策反推事件目的，不从现有 SDK 调用猜测口径。
2. 为每个事件定义唯一名称、精确触发时机、属性类型、来源、必填性和隐私分类。
3. 敏感属性必须有权利基础或审批引用；缺失时阻断生成和接入。
4. 映射代码落点时区分事实与推断，避免在多次渲染、重试或重复挂载中重复触发。
5. 生成代码前输出 Event Catalog 和变更计划；真实 SDK 由项目 Adapter 注入。
6. 验证首次触发、重复防护、缺失属性、错误/取消路径及版本一致性。
7. 不自动发布数据 Schema，不采集 Prompt、原始工具输入或稳定个人标识。

输出使用[事件设计模板](assets/event-design-template.md)，并遵守[失败模式](references/failure-modes.md)。项目采用 `frameworks/tracking-governance/` 时可运行确定性 Event Catalog Validator。
