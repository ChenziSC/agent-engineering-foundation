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

- 状态：`in-progress`
- 依赖：T-03
- 对应：AC-006、AC-007
- 动作：在 Continuous 完成后使用不可变候选执行 Delivery Gate，并保留平台保护限制。
- 验证：成功与 Active Spec 负向用例；真实 PR Check Evidence。

## T-05 固化不可变包交付约定

- 状态：`in-progress`
- 依赖：T-03
- 对应：AC-008
- 已完成：实现只接受干净 Git Commit 的包构建器、Release Manifest、合成仓库测试、交付文档和手动 GitHub Release Workflow。
- 待完成：在本分支形成获授权的不可变 Commit 后执行真实源码包构建；Tag 与 Release 仍需独立发布授权。
- 验证：源码仓外 `npm pack` 闭环和模板静态检查。

## T-06 fwwb 持续升级验证

- 状态：`in-progress`
- 依赖：T-04、T-05
- 对应：AC-009
- 已完成：在 fwwb 独立分支与 Spec 中升级 9 个受管 Skill 和 Foundation 版本，Doctor、Distribution Verify、Context、Knowledge、Specflow 通过，业务代码未变化。
- 待完成：Foundation 不可变制品可访问后，补 Continuous/Delivery CI 与真实 PR Evidence。
- 验证：Doctor、Distribution Verify、Context、平台门禁正负向证据。

## T-07 补齐 Replay 与规模基线

- 状态：`in-progress`
- 依赖：T-03
- 对应：AC-010
- 已完成：规模回归已进入 Continuous CI。
- 待完成：为尚无 `replay.json` 的 5 个 Skill 执行独立行为回放并固化证据；不得把现有 Case 或静态测试伪装成已执行 Replay。
- 验证：Eval Runner、Repository Check、规模 CI。

## V-01 完成条件与 Knowledge Projection

- 状态：`in-progress`
- 依赖：T-01～T-07
- 已完成：本轮影响的 4 项长期 Knowledge 已执行 Projection Plan/Apply/Verify。
- 待完成：T-04～T-07 收口后复核最终 Evidence 与完成条件。
