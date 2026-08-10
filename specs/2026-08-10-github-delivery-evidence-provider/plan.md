# Plan：Change Gate 平台路由与 GitHub Actions 外部交付证据 Provider

## 对应 Spec

- 事项 ID：`2026-08-10-github-delivery-evidence-provider`
- Spec：`./spec.md`

## 方案摘要

保留现有 `local-git` 作为唯一 Merge Candidate 计算者，增加 Git Remote 驱动的 Delivery Evidence Resolver，并新增 `delivery-evidence:github-actions` 薄 Adapter。Change Gate 在声明 Required Checks 时先完成现有候选与 Receipt Scope 校验，再从 Remote 与 Registry 自动选择 Provider，最后要求同一 Source SHA 上的平台证据成功。任何远端 Evidence 都不能反向修改平台状态。

## 能力准入记录

| 项目 | 结论 |
| --- | --- |
| 目标问题 | 本地 Gate 不能证明最终推送 Commit 的外部 Actions Check 已通过 |
| 主流 Harness Agent 基线 | Host 能运行 Git/`gh` 和读取 CI，但不会自动把 Specflow Receipt Scope、Git ancestry 与外部 Check 组合为失败关闭门禁 |
| 增量缺口 | Provider-specific 的 Checks API 读取、Git Remote 到注册 Provider 的确定性路由，以及与现有 Source Revision 的失败关闭组合 |
| 新增产物与直接消费者 | 平台 Resolver、GitHub Actions Evidence Adapter、Change Gate 可选参数与规范化输出、Delivery 模板；消费者是当前自举仓库已存在的 `quality/verify` Check 和采用该契约的其他平台 Adapter |
| 验证 | 注入式合成 API 测试、本地 Git 双 revision 测试、现有 93 项回归、一次真实 GitHub 只读端到端验证 |
| 删除条件 | 无法把外部 Check 与 Receipt Scope/Delivery Revision 机械绑定，或没有真实成功 Check 可验证时，不进入实现；GitHub 原生能力若完整覆盖本仓 Specflow 关联则降级为模板 |

## 关键设计

### 两类 Provider

```text
Final Source Revision
      ├── local-git：Merge Candidate + Receipt Scope Digest
      └── Remote Resolver → registered delivery-evidence adapter → required checks
```

- Source Control Provider：`local-git`，解析最终 Commit、Merge Candidate、路径和摘要；
- Delivery Evidence Resolver：读取默认或指定 Git Remote，只在 Registry 中选择唯一匹配 Adapter；
- Delivery Evidence Provider：`github-actions`，只读取同一最终 Revision 上的 Check Run；
- Change Gate Core：组合两类 Evidence、执行状态与失败分类，不理解任何平台原始 JSON，也不包含平台条件分支。

### 最小输入

- 一个或多个 `--required-check <github-actions/check-name@workflow-path>`
- 可选 `--delivery-remote <remote-name>`；默认选择 `origin` 或唯一 Remote
- 只有无法安全识别时才成对显式使用 `--delivery-provider <id> --repository <provider-repository>`

外部参数只在 `--phase delivery` 接受。认证由标准环境变量提供，CLI 不接受 Token 参数，避免进入进程列表或日志。

### Adapter 输出

Adapter 返回稳定、最小的规范化 Evidence；不返回原始 API Body。Change Gate 将其与本地 Gate Evidence 一起参与最终 Gate Digest。详情链接只用于人工追溯，不作为成功判定的唯一事实。

## 组件与职责

| 组件 | 职责 | 变化 |
| --- | --- | --- |
| `adapters/delivery-evidence/github-actions.mjs` | 调用 Checks API、精确匹配并规范化外部 Evidence | 新增 |
| `adapters/delivery-evidence/remote-resolver.mjs` | 解析 Remote，并从 Registry 选择唯一匹配的平台 Adapter | 新增 |
| `adapters/registry.mjs` | 注册真实 GitHub Delivery Evidence Adapter | 修改 |
| Harness / CLI | 参数校验、双 Provider 编排、稳定错误与 Gate Digest | 修改 |
| Delivery 模板 | 只读权限和双 revision 输入 | 修改 |
| 测试与文档 | 合成失败矩阵、真实只读验证和成熟度边界 | 修改 |

## 兼容与安全

- 不提供外部参数时完全沿用现有本地 Change Gate；
- 外部 Provider 不参与 `work`，也不能绕过本地 Gate；
- Remote 无法解析、平台未注册、多个 Adapter 匹配或多个 Remote 无默认项时失败关闭；
- 自动路由只选择 Adapter，不发现或猜测门禁策略；Required Checks 保持显式输入；
- 认证缺失、API 403/404/限流、响应结构异常均失败关闭但不回显响应正文；
- Check `neutral`、`skipped`、`stale` 等非 `success` 结论默认失败；
- 不读取 Branch Protection 或 Ruleset，不声明受保护历史；
- 不新增远端写权限和 API。

## 验证策略

| 层级 | 验证 |
| --- | --- |
| Adapter | 合成 Client 覆盖成功、缺失、错误 App、重复、状态/结论、认证与 API 异常 |
| Source Control | 复用现有合成 Git 仓的最终 Source 与同 Scope 摘要漂移回归 |
| Change Gate | 单/多 Spec 现有路径回归；Remote 自动路由、显式覆盖与外部 Provider 的成功/失败组合 |
| Template | 静态检查 `checks: read`、双 revision 与只读命令 |
| 真实 Provider | 使用已存在的成功 Check Run 只读执行，不保存身份、Run ID、URL 或原始响应 |
| 仓库 | `npm test`、`npm run check`、Specflow/Knowledge/Projection、敏感扫描、`git diff --check` |

## 未决问题

- [x] 真实 Provider 是 GitHub，当前已有 Actions Check Run 消费者。
- [x] Branch Protection/Ruleset 当前未启用且套餐 API 不可用，本事项不实现。
- [x] Check 选择器必须包含 App、Name 与 Workflow Path；只用 `github-actions/verify` 会允许候选中的同名 Job 冒充受信 Workflow。
- [x] 现有 Gate 可直接以最终归档 Commit 为 Source 并复核 Receipt Scope，不需要新增双 revision 或 ancestry 契约。
- [x] 详情链接保留在人工追溯输出中但不进入 Gate Digest；Digest 只使用 Check/Workflow ID、来源和状态字段。
- [x] 平台由 Git Remote 与 Adapter Registry 自动选择；Required Checks 不从当前平台状态猜测。
