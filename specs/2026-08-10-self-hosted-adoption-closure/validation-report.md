# Validation Report：Foundation 自举采用、持续交付与采用方回归闭环

## 当前状态

- 结果：`pending`
- 当前阶段：本仓自接入、Continuous CI、Delivery 负向验证和不可变包构建器已通过本地验证；真实 PR Evidence、真实 Commit 制品、fwwb CI 与 5 个 Skill Replay 待完成。
- 归档授权：未请求；本事项保持 `in-progress`。

## 完成条件映射

| 完成条件 | Evidence | 状态 |
| --- | --- | --- |
| AC-001 | 根 `agent-foundation.json`；`doctor --target .` | pass |
| AC-002 | YAML Knowledge 索引回归测试；本仓 YAML Registry Doctor | pass |
| AC-003 | `.agent-foundation/installed-skills.json`；`.agents/skills -> ../skills`；9 个 Source 记录与摘要 | pass |
| AC-004 | Source Link 模式的 Distribution Verify、Doctor、Context、Repository Check 与聚焦回归 | pass |
| AC-005 | `quality.yml` 覆盖单测、规模回归、Repository、Doctor、Distribution、Knowledge、Specflow；静态测试 | pass |
| AC-006 | Delivery `needs: verify`；不可变 Base/Source；临时 Commit 的 Active Spec 仅以 `change-gate-spec-not-archived` 阻断 | partial：待真实 PR Check |
| AC-007 | Workflow 不显式指定 Provider/Repository；Remote 自动路由；PR 显式声明 1～3 个 Spec | pass |
| AC-008 | `release-package.mjs`、合成干净仓库测试、Release Manifest、手动 Release Workflow 与交付文档 | partial：待本分支获授权 Commit 后构建真实制品；未创建 Tag/Release |
| AC-009 | fwwb 独立分支已完成受管 Skill/版本升级；Doctor、Distribution Verify、Context、Knowledge、Specflow 通过；业务路径无变化 | partial：待不可变制品后补 Continuous/Delivery CI |
| AC-010 | `test:scale` 已进入 Continuous CI；当前 9 个 Skill 均有 Case，4 个有正式 `replay.json` | partial：待其余 5 个 Skill 的独立 Replay |
| AC-011 | 合成即时读取；错误链接、采用方误用、用户修改副本迁移均失败关闭；本仓 Source Link 与 fwwb `runtimeMode: copy` 交叉验证；迁移后的真实 Codex 新会话从 `.agents/skills` 发现 9 个本仓 Skill | pass |

## 已执行验证

- 临时不可变 Git 候选执行 Delivery Gate：除 `change-gate-spec-not-archived` 外无其他错误，证明 Active 事项会失败关闭。
- fwwb Distribution Apply 只更新受管 Specflow 与安装记录；全部 9 个 Skill 摘要通过 Verify。
- Foundation `.agents/skills` 已从摘要一致的受管副本迁移为 `../skills`；107/107 单测、2/2 规模回归、Repository、Doctor、Distribution、Knowledge、Specflow 通过。
- 迁移后的真实 Codex 新会话将 `.agents/skills` 注册为项目 Skill 根，并发现其中 9 个本仓 Skill，补齐 Host 侧 Source Link 发现证据。
- fwwb 使用同一 Harness 复核仍返回 `runtimeMode: copy`，Doctor 和 9 个已安装 Skill 通过，证明生产者特例没有改变采用方运行时。
- Knowledge Projection 对 `repository-positioning`、`deterministic-core-boundary`、`self-hosted-governance` 执行 `update`，对 `public-generalization-policy` 执行 `still-valid`，Plan/Apply/Verify 均通过。

## 未执行边界

- 当前变更尚未获授权 Commit，因此真实 PR Check、当前源码的干净 Commit 制品均未执行。
- 未获独立 Tag/Release 授权，不创建 GitHub Release。
- fwwb 不使用本地路径、可变分支或无摘要 URL 作为 CI 包来源。
- 缺少正式 Replay 的 5 个 Skill 尚未执行独立行为会话，成熟度不据此升级。
- 其他操作系统和其他 Agent Host 的目录链接发现行为未验证，本结论只覆盖当前 macOS Codex Host。
