# Spec：Change Gate 平台路由与 GitHub Actions 外部交付证据 Provider

## 基本信息

- 事项 ID：`2026-08-10-github-delivery-evidence-provider`
- 创建日期：2026-08-10
- 事项状态、关系和影响范围以同目录 `meta.yaml` 为唯一事实来源。

## 输入来源

| 类型 | 引用或摘要 | 适用范围 |
| --- | --- | --- |
| 用户输入 | 归档并推送上下文成本优化后，进入 Change Gate 真实 Git Provider | 本事项整体 |
| 用户修正 | Change Gate 不应绑定 GitHub，应根据不同仓库平台自主判断如何增加门禁 | Core 路由、CLI 与扩展边界 |
| 真实 Provider 观察 | 当前自举仓库远端为 GitHub；GitHub Actions `quality/verify` 对最终推送 Commit 产生可按 SHA 查询的成功 Check Run | Provider 与直接消费者 |
| 真实限制 | 当前默认分支未保护；Private 仓库的 Branch Protection 与 Ruleset API 因当前套餐返回 403 | 非目标与成熟度边界 |
| GitHub 官方契约 | Checks API 可按 Git reference 查询 Check Run；读取 Private 仓库需要 Checks read 权限；Pull Request 事件的 `GITHUB_SHA` 不是 Head SHA | Adapter 输入与模板安全 |

## 背景与目标

现有 `local-git` Adapter 已能对不可变 Base/Source 计算 Merge Candidate，Change Gate 也能复核 Spec Scope、Receipt 和 Lifecycle，但它明确不证明外部 CI 已通过。真实验证确认：Delivery Gate 可以直接使用包含 Receipt/Meta 的最终推送 Commit，并通过排除事项目录后的摘要与 Receipt 复核实现没有漂移；缺口只剩同一最终 Source SHA 上的指定 GitHub Actions Check 是否成功。

本事项增加平台中立的 Delivery Evidence 路由和一个只读 GitHub Actions Adapter，并在 Change Gate 交付阶段组合：本地 Git 继续负责最终候选和 Receipt Scope 摘要；Core 从 Git Remote 选择唯一匹配的已注册 Adapter；GitHub 实现只提供同一 Source Revision 的 Check Run 事实。新增其他真实平台时只注册其 Remote 匹配器与薄 Adapter，不修改 Change Gate Core。

“自主判断”只覆盖可以确定性证明的平台与 Repository 选择。哪些 Check、审批或部署规则属于门禁是项目政策，必须显式声明；不能从候选分支当前有哪些成功项自动猜测。

## 非目标

- 不替换 `local-git` Merge Candidate Adapter，不从 GitHub Diff API 重做 Git 摘要；
- 不创建、重跑、取消或修改 Check Run、Workflow、PR、Branch Protection 或 Ruleset；
- 不把“Check 成功”解释为分支受保护、PR 已批准、已合入、已部署或已发布；
- 不为尚无真实消费者的 GitLab、Bitbucket或内部代码平台提前实现远端 API Adapter；平台路由契约允许它们后续只注册薄 Adapter；
- 不自动猜测 Required Checks、审批、部署或发布策略；
- 不在当前仓库套餐不支持时伪造 Branch Protection Evidence；
- 不记录 Token、原始 API Response、邮箱、稳定个人标识或完整外部日志。

## 输出与行为契约

- 现有 `local-git` 继续对最终 Source Revision 计算完整候选和 Receipt Scope 摘要；摘要不一致时，外部 Check 即使成功也阻断；
- 声明 Required Checks 后，默认从 `origin` 或唯一 Git Remote 解析平台与 Repository，并选择唯一匹配的已注册 Adapter；无匹配、多匹配或 Remote 歧义均失败关闭；
- 特殊镜像或企业版允许成对显式覆盖 Provider 与 Repository；只提供一项或将显式覆盖与 Remote 选择混用时阻断；
- GitHub Adapter 只按精确 Repository、Source Revision、Check Name、App Slug 和 Workflow Path 查询 Check Run；
- 每个必需 Check 必须存在、`status=completed`、`conclusion=success`，缺失、排队、跳过、失败、错误 App、未授权或 API 异常均失败关闭；
- 输出只保留规范化 Evidence：Provider、Repository、Revision、Check 名称、App、状态、结论、不可变 ID 与详情链接；不回显认证信息或原始响应；
- 未指定外部 Provider 时，现有 Change Gate 行为和输出保持兼容；外部 Evidence 只允许用于 `delivery` 阶段；
- GitHub Actions 模板显式授予 `checks: read`，使用调用方提供的最终不可变 Source SHA；涉及 Pull Request 自动取值时，必须明确选择 Merge SHA 或 Head SHA，不能混用；
- Branch Protection/Ruleset 保持 `not-applicable`，直到出现可读取且真实启用的消费者。

## 完成条件

- [x] **AC-001** 记录真实 Git Provider、Actions Check 消费者、当前保护规则限制，以及本地 Git 与 GitHub 外部证据的职责分界。
- [x] **AC-002** 新增只读 GitHub Actions Delivery Evidence Adapter，使用最小读取权限，输出不包含 Token 或原始 API Response。
- [x] **AC-003** Change Gate 在现有最终 Source 与 Receipt Scope Digest 复核通过后，才组合同一 Source SHA 的 GitHub Check Evidence。
- [x] **AC-004** 精确匹配必需 Check Name、App 与 Workflow Path；缺失、未完成、非成功、重复歧义、错误 App/Workflow、认证失败和 API 失败均产生稳定错误码。
- [x] **AC-005** 未启用外部 Provider 时现有 CLI/API 与测试保持兼容；外部 Provider 不可用于 `work` 阶段。
- [x] **AC-006** GitHub Actions Delivery 模板声明 `checks: read`，传递 Repository 与必需 Check，并继续只读、不创建或修改远端状态。
- [x] **AC-007** 合成测试覆盖成功、摘要漂移、缺失/失败 Check、错误 Workflow、认证/API 错误和兼容路径。
- [x] **AC-008** 使用当前自举仓库已有的真实成功 Check Run 完成一次只读端到端验证，公开 Evidence 脱敏且不含仓库所有者、Run ID 或 URL。
- [x] **AC-009** 文档和成熟度明确：GitHub Actions Evidence 可用不等于 Branch Protection、合入、部署或发布成功。
- [x] **AC-010** Knowledge Projection 与 Repository、Specflow、Knowledge、敏感扫描及全量测试通过。
- [x] **AC-011** Change Gate 可根据 Git Remote 自动选择唯一匹配的已注册 Delivery Evidence Adapter；合成非 GitHub 平台证明扩展不修改 Core，未支持/歧义平台失败关闭，Required Checks 仍需显式声明。

## 风险与约束

| 类型 | 内容 | 处理方式 |
| --- | --- | --- |
| Risk | Check 名称在不同 App 下重名 | Name 与 App Slug 共同精确匹配；重复结果失败关闭 |
| Risk | Receipt 内实现 Source 与最终推送 Commit 不同 | 继续使用现有 Receipt Scope Digest 复核最终 Source，不额外发明 ancestry 契约 |
| Risk | PR 事件 SHA 语义容易混淆 | 模板明确区分 Head、Merge 与 Workflow SHA |
| Risk | Token 或 API 错误泄露 | Adapter 只返回稳定分类，不回显 Header、Token 或原始 Body |
| Constraint | Branch Protection/Ruleset 当前不可读取和启用 | 本事项明确排除，不创建空字段或假 Evidence |

## Section Index

| 章节 | 说明 | 何时读取 |
| --- | --- | --- |
| 背景与目标 | 双 revision 与真实消费者 | 设计或恢复任务时 |
| 输出与行为契约 | Provider 和 Change Gate 不变量 | 实施与 Review 时 |
| 完成条件 | 可判定验收范围 | 验证与归档时 |
