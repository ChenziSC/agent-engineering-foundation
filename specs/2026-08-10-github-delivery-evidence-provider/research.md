# Research：GitHub Actions 外部交付证据 Provider

## 已观察事实

- 当前自举仓库的真实远端 Provider 是 GitHub，默认分支为 `main`。
- 仓库为 Private，已有启用的 `quality` GitHub Actions Workflow，并在本次归档分支最终推送 Commit 上产生 `github-actions/verify` 成功 Check Run。
- 当前没有 PR；`main` 返回 `protected: false`，required status checks 为空。
- Branch Protection 与 Repository Ruleset API 因当前 Private 仓库套餐返回 403；这不是“已验证无规则”，而是功能当前不可用。
- Actions 已启用，当前允许第三方 Action 且没有强制完整 SHA Pin；这些是仓库策略事实，不是本事项要自动修改的对象。
- 现有 Delivery 模板依赖调用方手工传入 Base/Source/Spec，权限只有 `contents: read`，没有读取 Checks。

## 真实契约缺口

本次归档已经形成可复现例子：

1. Receipt Source 是归档前的实现提交；
2. 最终推送 Commit 增加 Receipt 与 archived Meta；
3. GitHub Actions Check Run 绑定最终推送 Commit；
4. 现有 Delivery Change Gate 已验证可直接使用最终 Commit，并通过 Receipt 排除范围摘要证明实现未漂移；
5. 当前唯一缺口是 Gate 不读取最终 Commit 的真实 Check Run。

因此无需新增双 revision 或 ancestry 契约；只需在现有本地 Gate 通过后，按同一个最终 Source SHA 查询并组合外部 Check Evidence。

## 官方契约复核

- Checks REST API 支持按 Git reference 查询 Check Run，并允许用 `check_name`、`status`、`filter` 等参数收窄结果；Private 仓库需要 Checks read 权限。
- Check Run 只有 `status=completed` 且 `conclusion=success` 才能作为本事项的通过证据；`neutral`、`skipped`、`stale` 等不自动接受。
- 只匹配 App 与 Check Name 不足以识别受信 Workflow；Adapter 还需用 Check Suite ID 关联同一 Source SHA 的 Workflow Run，并精确匹配 Workflow Path。
- GitHub Actions Pull Request 事件中的 `GITHUB_SHA` 指向 PR Merge Commit；需要 Head Commit 时应使用 `github.event.pull_request.head.sha`。模板不能混用这些语义。

官方参考：

- <https://docs.github.com/en/rest/checks/runs>
- <https://docs.github.com/en/actions/reference/workflows-and-actions/variables>
- <https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows>

## 决策

- 实现 `github-actions` Delivery Evidence Adapter；
- 不实现 GitHub Source Control Diff Adapter；
- 不实现当前无真实消费者且不可读取的 Branch Protection/Ruleset；
- 用当前仓库已有 Check Run 作为一次脱敏真实 Provider 验证，合成测试负责失败矩阵。
