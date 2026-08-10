# 安全变更报告：Foundation 生产者 Source 模式

## 候选与范围

- 候选版本：`codex/self-hosted-adoption-closure` 未提交工作区。
- 目标：让 Foundation 本仓 Host 从唯一源码 `skills/` 读取最新逻辑，同时保持采用项目不可变复制。
- 非目标：任意 Symlink、仓外源目录、采用方 Source 模式、自动提交或发布。
- 变化路径：`agent-foundation.json`、`.agents/skills`、`.agent-foundation/`、`adapters/open-agent/`、`packages/harness/`、相关 Spec/Docs/Knowledge。

## 风险与消费者

| 路径 | 消费者/契约 | 风险 | 可逆性 | Evidence |
| --- | --- | --- | --- | --- |
| `.agents/skills` | Codex 等 Open Agent Host | Host 不跟随链接或缓存旧内容 | 可恢复复制镜像 | 临时目录执行观察；真实 Codex 新会话发现 9 个本仓 Skill |
| Distribution | 本仓与采用项目 | Source 模式误开放给消费者 | 删除 `configRef` 即回到复制模式 | 正负向 Harness 测试 |
| Repository/Doctor | CI、维护者 | 允许链接时扩大路径逃逸面 | 只撤销精确例外 | 仓外/错误目标失败测试 |
| `skills/` | 发布包、Eval、Host | 源码和发布摘要漂移 | 更新摘要或回滚源改动 | Repository/Distribution Verify |

## 增量覆盖矩阵

| 覆盖规则 | 自动检查 | 浏览器场景 | 人工门禁 | Evidence 来源关系 | 结果 |
| --- | --- | --- | --- | --- | --- |
| 源修改可由链接入口即时读取 | 临时目录与合成仓库测试 | 不适用 | 真实 Codex 新会话发现 | 执行观察＋Host 交叉验证 | `pass` |
| 只允许精确仓内链接 | 错误目标、采用方误用、用户修改副本迁移测试 | 不适用 | Diff 复核 | 执行观察 | `pass` |
| 采用方仍复制并校验摘要 | 既有采用闭环与 fwwb Verify | 不适用 | fwwb 业务零改动 | 交叉验证 | `pass` |
| 本仓全量治理不退化 | 107/107、2/2、Repository、Doctor、Distribution、Knowledge、Specflow | 不适用 | 未提交边界复核 | 执行观察 | `pass` |

## 回滚与阻塞

- 回滚条件：真实 Host 无法通过 `.agents/skills` 链接发现 Skill；任意非目标链接可以通过；普通采用方不再生成独立副本。
- 未覆盖路径：其他操作系统和其他 Agent Host 的目录链接发现行为。
- 未知外部状态：其他操作系统创建目录链接的权限和行为未验证，不外推为跨平台保证。
- 最终状态：`validated`（当前 macOS Codex Host 范围）。
