# Validation Report：Change Gate 平台路由与 GitHub Actions 外部交付证据 Provider

## 结果

- 检查日期：2026-08-10
- 结果：`pass`
- 结论：Change Gate 已能在本地最终候选与 Receipt Scope 校验通过后，从 Git Remote 与 Registry 自动选择唯一交付平台 Adapter，再只读复核同一 Source SHA 的显式 Required Checks。GitHub Actions 是首个真实 Provider；Branch Protection、审批、合入、部署和发布仍不在实现范围。

## 完成条件映射

| 完成条件 | Test / Evidence | 结果 |
| --- | --- | --- |
| AC-001 | 真实远端、Workflow、Check、默认分支保护状态和 API 能力只读发现 | pass |
| AC-002 | `github-actions` Delivery Evidence Adapter；`checks: read`、`actions: read`；无远端写 API | pass |
| AC-003 | 现有最终 Source/Receipt Scope Gate 后置调用外部 Adapter；本地失败时不发起外部读取 | pass |
| AC-004 | App + Check Name + Workflow Path + Check Suite 绑定；缺失、歧义、状态、来源、认证和响应失败矩阵 | pass |
| AC-005 | 不带外部参数的既有 Gate 回归通过；`work` 阶段显式阻断外部 Provider | pass |
| AC-006 | Delivery 模板增加最小读取权限与受信 Check 选择器，由 Remote 自动解析 Repository，静态只读测试通过 | pass |
| AC-007 | GitHub Adapter 失败矩阵与 Change Gate 组合测试通过 | pass |
| AC-008 | 对已归档事项的最终推送 Commit 与既有成功 Check 执行真实只读 Gate | pass |
| AC-009 | Reference、Adapter/Template/Harness 说明、Blueprint、能力地图和成熟度均保留外推限制 | pass |
| AC-010 | Projection Plan/Apply/Verify、Repository Check、Specflow/Knowledge、敏感扫描与 `git diff --check` 通过 | pass |
| AC-011 | HTTPS/SSH/SCP Remote 解析、合成非 GitHub Adapter、自动/显式路由、未知平台、多匹配与多 Remote 歧义测试；全量 99/99 | pass |

## 真实 Provider Evidence

- 最终 Source SHA 同时由本地 Git Candidate 与 GitHub Actions Evidence 使用；Receipt Scope Digest 与归档时冻结值一致。
- 必需 Check 精确匹配 `github-actions` App、`verify` Job 与受信 Workflow Path；Check Run 和 Workflow Run 均为 `completed/success`。
- 公开材料不保存仓库所有者、账号、Run/Job ID、详情 URL、Token 或原始 API Response；认证只在单次只读进程环境中使用。
- 临时 clone 已在验证后删除，不可恢复；真实仓库和 GitHub 设置未被修改。

## 失败关闭与兼容性

- 默认读取 `origin`，没有 `origin` 时只接受唯一 Remote；平台与 Repository 由 Adapter 的 Remote 匹配器解析，Core 不包含平台分支。
- 未识别平台、无已注册 Provider、多 Provider 匹配、多 Remote 无默认项，以及 Provider/Repository 只显式提供一项时均阻断；错误不回显未知 Remote Host。
- 自动路由只决定使用哪个 Adapter；Required Checks 不从当前成功项猜测，避免候选分支用自选 Check 弱化门禁。
- 缺少 Check、错误 App、错误 Workflow、重复匹配、未完成、非成功、响应截断、认证失败和无效响应均产生稳定错误码。
- 外部 Adapter 返回的 Provider、Repository 或 Revision 与请求不一致时由 Core 阻断。
- 现有 `local-git` 算法、Receipt Schema、Meta 状态和不启用外部 Provider 的 Gate Digest 路径没有改变。
- Delivery Job 不能把自身作为必需上游 Check；此时会因尚未完成而阻断。

## 未实现与外推限制

- 当前默认分支未保护；Private 仓库的 Branch Protection/Ruleset API 在当前套餐下不可用。本事项没有把 403 解释为“规则已验证”，也没有增加空 Provider。
- Check 成功只证明所指定 Workflow/Job 的 GitHub 事实，不证明 PR 审批、受保护历史、合入、部署、发布或业务正确性。
- 只真实验证 GitHub Actions；合成非 GitHub Provider 证明新平台可通过注册 Remote 匹配器与薄 Adapter 接入而不修改 Core，其他平台 API 仍需出现直接消费者后实现。

## 生命周期结论

- 实施、验证和 Knowledge Projection 已完成；事项保持 `in-progress`，等待用户明确决定是否提交、推送或归档。
- 本事项尚未执行 commit、push、PR 或归档。
