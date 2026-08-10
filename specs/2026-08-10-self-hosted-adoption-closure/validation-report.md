# Validation Report：Foundation 自举采用、持续交付与采用方回归闭环

## 当前状态

- 结果：`pass`
- 当前阶段：本仓自接入、Continuous/Delivery、本仓真实 PR 负向门禁、干净 Commit 制品、fwwb 真实 CI/PR 与全部 Skill Replay 已完成验证。
- 归档授权：用户已明确授权归档、Commit 与 Push；在最终不可变 Source 和 Receipt 复核通过后执行终态转换。

## 完成条件映射

| 完成条件 | Evidence | 状态 |
| --- | --- | --- |
| AC-001 | 根 `agent-foundation.json`；`doctor --target .` | pass |
| AC-002 | YAML Knowledge 索引回归测试；本仓 YAML Registry Doctor | pass |
| AC-003 | `.agent-foundation/installed-skills.json`；`.agents/skills -> ../skills`；9 个 Source 记录与摘要 | pass |
| AC-004 | Source Link 模式的 Distribution Verify、Doctor、Context、Repository Check 与聚焦回归 | pass |
| AC-005 | `quality.yml` 覆盖单测、规模回归、Repository、Doctor、Distribution、Knowledge、Specflow；静态测试 | pass |
| AC-006 | Delivery `needs: verify`；不可变 Base/Source；PR #2 Run `31371094938` 的 Verify 成功，Delivery 仅以 `change-gate-spec-not-archived` 阻断 Active 候选 | pass |
| AC-007 | Workflow 不显式指定 Provider/Repository；Remote 自动路由；PR 显式声明 1～3 个 Spec | pass |
| AC-008 | `release-package.mjs`、合成干净仓库测试、Release Manifest；从 Commit `8f51bed…` 构建真实制品并由 fwwb 固定 SHA-256 后安装 | pass；未创建 Tag/Release |
| AC-009 | fwwb PR #1 Run `31373140771` 的治理 Job 通过；Delivery 对两个 Active Spec 精确失败；失败后只读复核通过；业务路径无变化，运行时为 `copy` | pass |
| AC-010 | `test:scale` 已进入 Continuous CI；9 个 Skill 共 50 个 Case 均有正式 Replay；本轮 5 个独立只读会话新增 16 个 Case 基线 | pass |
| AC-011 | 合成即时读取；错误链接、采用方误用、用户修改副本迁移均失败关闭；本仓 Source Link 与 fwwb `runtimeMode: copy` 交叉验证；迁移后的真实 Codex 新会话从 `.agents/skills` 发现 9 个本仓 Skill | pass |

## 已执行验证

- 临时不可变 Git 候选执行 Delivery Gate：除 `change-gate-spec-not-archived` 外无其他错误，证明 Active 事项会失败关闭。
- fwwb Distribution Apply 只更新受管 Specflow 与安装记录；全部 9 个 Skill 摘要通过 Verify。
- Foundation `.agents/skills` 已从摘要一致的受管副本迁移为 `../skills`；107/107 单测、2/2 规模回归、Repository、Doctor、Distribution、Knowledge、Specflow 通过。
- 迁移后的真实 Codex 新会话将 `.agents/skills` 注册为项目 Skill 根，并发现其中 9 个本仓 Skill，补齐 Host 侧 Source Link 发现证据。
- fwwb 使用同一 Harness 复核仍返回 `runtimeMode: copy`，Doctor 和 9 个已安装 Skill 通过，证明生产者特例没有改变采用方运行时。
- Knowledge Projection 对 `repository-positioning`、`deterministic-core-boundary`、`self-hosted-governance` 执行 `update`，对 `public-generalization-policy` 执行 `still-valid`，Plan/Apply/Verify 均通过。
- Foundation [PR #2](https://github.com/ChenziSC/agent-engineering-foundation/pull/2) 的 [Run 31371094938](https://github.com/ChenziSC/agent-engineering-foundation/actions/runs/31371094938) 已证明真实 Active 候选会失败关闭。
- fwwb [PR #1](https://github.com/ChenziSC/fwwbWeb/pull/1) 的 [Run 31373140771](https://github.com/ChenziSC/fwwbWeb/actions/runs/31373140771) 已证明采用方能从不可变 vendored 包执行治理，并在同 SHA 上运行 Delivery。
- 5 个新增 Replay 均使用 Codex CLI `0.147.0-alpha.6.5`、`gpt-5.6-sol`、`high`、只读临时会话；Eval Runner 结果依次为：design-to-code 85、safe-change 92.5、tracking-governance 90、web-first-screen-prefetch 94、web-performance-review 99，均无阻断项。

## 未执行边界

- 未获独立 Tag/Release 授权，不创建 GitHub Release；真实制品仅由 fwwb 仓内 vendoring 消费。
- fwwb 的正向 Archived 候选需要其两个事项分别获得终态授权后执行；当前 Evidence 覆盖 Active 负向契约，不越权伪造 Receipt。
- GitHub Check 失败不等于已启用 Branch Protection；本仓没有读取或声明保护规则状态。
- 新增 Replay 使用合成 Case 且不访问真实业务仓库、网络或浏览器；分数只证明所测行为，不据此升级成熟度。
- 其他操作系统和其他 Agent Host 的目录链接发现行为未验证，本结论只覆盖当前 macOS Codex Host。
