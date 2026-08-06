# 埋点治理框架

成熟度：`reference-implemented`

该框架用平台无关的 Event Catalog 管理“为什么采集、何时触发、属性从哪里来、哪些字段涉及隐私、如何验证”，避免从代码中的零散调用反推产品口径。

[Event Catalog Schema](event-catalog.schema.json)、[合成模板](event-catalog.template.json)和参考 Validator 只校验确定性契约：事件唯一性、触发说明、属性类型与来源、敏感字段审批引用、废弃替代项和验证场景。真实 SDK、数据平台 Schema 发布和线上数据验收由采用方 Adapter 负责。
