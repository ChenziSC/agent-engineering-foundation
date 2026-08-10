# Tasks：Foundation 自举采用、持续交付与采用方回归闭环

## T-01 本仓正式接入 Starter 与 Doctor

- 状态：`done`
- 对应：AC-001、AC-002
- 动作：增加根 Manifest；让 Doctor 复用多格式 Knowledge 索引发现；增加本仓真实采用测试。
- 验证：`doctor --target .`。

## T-02 本仓接入 Distribution 与 Host Skill 发现

- 状态：`done`
- 依赖：T-01
- 对应：AC-003、AC-004
- 动作：通过 Distribution 生成受管 `.agents/skills` 与安装状态，固定唯一源码与漂移门禁。
- 验证：`distribution verify --target .`、Host 目录与安装记录摘要一致。

## T-02A 本仓生产者 Source 模式

- 状态：`done`
- 依赖：T-02
- 对应：AC-003、AC-004、AC-011
- 已完成：为 `open-agent` 增加仅限 Foundation 源码根的 Source Link；`.agents/skills` 已迁移为 `../skills`，Harness 正负向、全量回归和 fwwb 复制模式均通过；迁移后的真实 Codex 新会话已从 `.agents/skills` 发现本仓 9 个 Skill。
- 验证：源文件修改即时透过链接可见；精确链接、路径逃逸和普通目录冲突测试；本仓 Doctor/Distribution/Repository 与现有采用方闭环。

## T-03 接入 Continuous CI

- 状态：`done`
- 依赖：T-02
- 对应：AC-005、AC-010
- 动作：让真实 Workflow 执行采用方治理命令、单测和规模回归。
- 验证：Workflow 静态契约测试、本地等价命令。

## T-04 接入 Delivery Change Gate

- 状态：`done`
- 依赖：T-03
- 对应：AC-006、AC-007
- 已完成：PR #2 的 Run `31371094938` 在不可变 Source SHA 上先完成 Verify，再由 Delivery 精确返回 `change-gate-spec-not-archived`；失败符合 Active Spec 负向契约。
- 验证：本地正负向合成用例与真实 PR Check；平台 Branch Protection 仍不在本仓事实范围内。

## T-05 固化不可变包交付约定

- 状态：`done`
- 依赖：T-03
- 对应：AC-008
- 已完成：实现只接受干净 Git Commit 的包构建器、Release Manifest、合成仓库测试、交付文档和手动 GitHub Release Workflow。
- 已完成：从干净 Commit `8f51bed3146d81923e735a96ce2028dc9a810eef` 构建真实 npm tarball 与 Release Manifest，fwwb 以 SHA-256 `be7a936a…8648f6` vendoring 并在 GitHub Actions 安装验证。
- 验证：源码仓外 `npm pack`、模板静态检查、采用方真实安装；未创建 Tag/GitHub Release，发布仍需独立授权。

## T-06 fwwb 持续升级验证

- 状态：`done`
- 依赖：T-04、T-05
- 对应：AC-009
- 已完成：在 fwwb PR #1 中升级 9 个受管 Skill 和 Foundation 版本；Run `31373140771` 的 Continuous 成功，Delivery 对两个 Active Spec 精确失败，失败后的只读复核成功，业务代码未变化，运行时保持 `copy`。
- 验证：Doctor、Distribution Verify、Context、平台门禁正负向证据。

## T-07 补齐 Replay 与规模基线

- 状态：`done`
- 依赖：T-03
- 对应：AC-010
- 已完成：规模回归已进入 Continuous CI；5 个缺口 Skill 使用 `gpt-5.6-sol`、`high`、只读临时会话完成独立 Replay，新增 16 个 Case 的脱敏 Trace/评分基线。全仓 9 个 Skill、50 个 Case 均有正式 Replay。
- 验证：5 个 Eval Runner 均通过；Repository Check 与规模 CI 通过。Replay 不替代真实业务运行态，也不自动提升成熟度。

## V-01 完成条件与 Knowledge Projection

- 状态：`done`
- 依赖：T-01～T-07
- 已完成：本轮影响的 4 项长期 Knowledge 已执行 Projection Plan/Apply/Verify；T-04～T-07 的真实 Evidence、完成条件与未证明边界已复核，事项可进入获授权归档。
