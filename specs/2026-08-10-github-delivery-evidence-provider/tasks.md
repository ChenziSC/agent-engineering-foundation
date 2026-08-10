# Tasks：Change Gate 平台路由与 GitHub Actions 外部交付证据 Provider

## 任务

### T-01 确认真实 Provider 与消费者

- 状态：`done`
- 对应：AC-001
- 动作：核对远端、Actions Workflow、Check Run、PR、Branch Protection/Ruleset 与权限；记录脱敏事实。
- 结果：GitHub + `quality/verify` 是真实消费者；Branch Protection/Ruleset 当前不可用。

### T-02 固化双 Provider 契约

- 状态：`done`
- 依赖：T-01
- 对应：AC-002～AC-005
- 动作：验证最终推送 Commit 可直接通过现有 Receipt Scope Gate，确定 Adapter 输入、规范化 Evidence 和失败分类。
- 验证：设计能复用现有 `local-git`，且外部 Provider 缺失时兼容。

### T-03 实现 GitHub Actions Evidence Adapter

- 状态：`done`
- 依赖：T-02
- 对应：AC-002、AC-004
- 动作：实现只读 Checks API 调用、精确选择器、最小输出和错误脱敏。
- 验证：Adapter 单元测试覆盖成功与失败矩阵。

### T-04 集成 Change Gate 与 CLI

- 状态：`done`
- 依赖：T-03
- 对应：AC-003～AC-005
- 动作：增加可选 Delivery Provider 参数，在现有最终 Source/Receipt Scope Gate 之后验证外部 Check；保持现有路径兼容。
- 验证：合成 Git 与 Change Gate 测试。

### T-05 更新 GitHub Actions Delivery 模板

- 状态：`done`
- 依赖：T-04
- 对应：AC-006
- 动作：增加 `checks: read`、Delivery Revision 和 Required Check 输入；继续只读。
- 验证：模板静态测试。

### T-06 执行真实只读验证与整仓回归

- 状态：`done`
- 依赖：T-05
- 对应：AC-007、AC-008
- 动作：对既有归档事项和真实成功 Check Run 执行端到端 Gate；运行全量测试和仓库门禁。
- 验证：公开只保留脱敏结果和限制。

### T-07 同步文档与 Knowledge Projection

- 状态：`done`
- 依赖：T-06
- 对应：AC-009、AC-010
- 动作：更新 Reference、Blueprint、能力地图、成熟度和长期 Knowledge；执行 Projection Plan/Apply/Verify。
- 验证：文档不把 Actions Check 等同于 Branch Protection 或交付成功。

### V-01 完成条件复核

- 状态：`done`
- 依赖：T-07
- 动作：逐项复核 AC-001～AC-010，完成 Validation Report。

### T-08 增加仓库平台自动路由

- 状态：`done`
- 依赖：V-01
- 对应：AC-011
- 动作：从 Git Remote 解析平台与 Repository，由 Registry 选择唯一匹配 Delivery Evidence Adapter；保留 Required Checks 显式策略与受控显式覆盖。
- 验证：GitHub 与合成非 GitHub 平台路由通过；未知、多匹配、Remote 歧义和错误参数失败关闭；全量 99/99 与仓库检查通过。

## 执行规则

- 原始 GitHub API 响应和认证信息不进入仓库；
- 不对远端执行写操作；
- 未经用户再次明确授权，不 commit、push、建 PR 或归档本事项。
