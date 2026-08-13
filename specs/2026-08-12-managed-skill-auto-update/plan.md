# Plan：受管 Skill 触发时自动更新

## 对应 Spec

- 事项 ID：`2026-08-12-managed-skill-auto-update`
- Spec：`./spec.md`

## 方案摘要

在既有项目级兼容 Distribution 上增加一个共享、可复制的 `update-guard.mjs`。消费项目的 Skill 在领域步骤前调用该 Guard；生产者仍使用源码 Source Link，既不复制 Guard，也不查询 npm。Guard 只负责 TTL、Registry 版本选择和精确新版 CLI 启动，实际写入继续由现有 `upgrade apply` 负责。Repository Check 用统一标记约束现存和未来 Skill，不创建独立维护 Skill 或通用 Host Runtime。

## 当前证据与假设

| 类型 | 内容 | 来源或验证方式 |
| --- | --- | --- |
| Evidence | `upgrade apply` 已覆盖版本方向、Profile、用户修改、未知文件、Symlink、原子替换和写后 Verify | `packages/harness/src/harness.mjs` 与回归测试 |
| Evidence | 生产者模式由严格 `.agents/skills -> ../skills` Source Link 识别 | Distribution、Doctor 与 Source Link 测试 |
| Evidence | 当前环境 npm 查询约 0.74–1.21 秒，npx 热/冷约 0.57/2.12 秒 | 2026-08-12 本地执行观察 |
| Assumption | Node.js 20 提供 `fetch`、`AbortSignal.timeout`、原子 rename 和 `spawnSync` | CI Node.js 版本与现有实现基线 |

## 变更深度与上下文契约

| 改变对象 | 层级 | 不能猜测的不变量 | 允许依赖的事实 | 回流位置 |
| --- | --- | --- | --- | --- |
| Skill 触发前更新 | 稳定契约 | 生产者不更新；消费者不覆盖冲突；失败可继续旧版 | 既有 Distribution/Upgrade 安全语义 | Spec |
| Guard 与 Distribution | 技术路径 | 单一实现、固定 Registry、24h TTL、原子状态 | 当前安装状态与 runtimeMode | Plan |

## 组件与职责

| 组件或目录 | 职责 | 变化类型 |
| --- | --- | --- |
| `packages/harness/src/runtime/update-guard.mjs` | 本地 TTL、生产者检测、Registry 查询、精确版本 Upgrade、紧凑结果 | 新增 |
| `packages/harness/src/harness.mjs` | 消费者复制/验证共享 Guard，生产者跳过 | 修改 |
| `skills/*/SKILL.md` | 在领域工作前调用 Guard；更新后重读当前 Skill | 修改 |
| Repository Check | 对所有本仓 Skill 检查统一声明 | 修改 |
| 文档与 Knowledge | 说明边界、延迟和长期契约 | 修改 |

## 数据流或调用流

```text
Skill 触发
→ 读取项目模式
→ producer source-link：producer-skipped
→ consumer：读取本地检查状态
→ TTL 命中：cached
→ TTL 过期：npm latest
→ 无新版：current
→ 有新版：精确版本 upgrade apply → Verify → updated + reloadSkill
→ 任一外部失败：degraded，旧版继续
```

## 关键决策

| 决策 | 备选方案 | 选择理由 | 代价 |
| --- | --- | --- | --- |
| 共享项目级 Guard | 每个 Skill 各带脚本 | 更新逻辑只实现一次，未来 Skill 自动复用 | Distribution 多管理一个运行时文件 |
| Skill 前置声明 + 静态门禁 | 假设所有 Host 都有统一 Hook | 当前没有跨 Host Hook 标准，Skill 内容是现有共同契约 | 依赖 Agent 遵循声明并在更新后重读 |
| 固定 24 小时 TTL | 每次联网或后台更新 | 将普通触发成本限制为本地进程启动 | 新版最多延迟 24 小时 |
| 失败继续旧版 | 网络失败阻断 Skill | 自动维护不应让领域能力因外部网络不可用而失效 | 需要显式暴露 degraded 状态 |

## Agent、程序与人工分工

- Agent：识别项目根、执行 Guard、在 `updated` 后重读当前 Skill、向用户简短报告退化。
- 确定性程序：模式检测、TTL、SemVer、Registry 校验、精确版本启动、原子状态、Distribution 校验。
- 人工确认：消费项目安装时决定是否采用本仓受管自动更新；发布与 Registry 权限仍由维护者控制。

## 兼容与迁移

- 向后兼容：生产者行为不变；消费者已有受管 Skill 由下一次显式升级获得 Guard 和前置声明。
- 数据或配置迁移：新增独立 `.agent-foundation/auto-update-state.json`，不改变现有安装状态 Schema。
- 回退方式：移除消费者 Guard 与 Skill 前置声明，恢复显式 `upgrade plan/apply`；已有 Skill 内容和安装状态仍有效。

## 验证策略

| 完成条件 | 实现路径 | 验证方式 | Evidence 来源关系 |
| --- | --- | --- | --- |
| AC-001～AC-004 | Guard | 注入 Fetch/Spawn/Clock 的正常、TTL、更新、网络、冲突测试 | 执行观察 |
| AC-005 | Distribution | copy/source-link Plan/Apply/Verify 回归 | 执行观察 |
| AC-006 | Skill 与 Repository | 全量 Skill 标记检查及缺失负例 | 交叉验证 |
| AC-007 | 文档 | 定向术语与静态契约测试 | 同源说明 + 静态检查 |
| AC-008 | 全仓 | npm test、scale、check、Doctor、Distribution、Knowledge、Specflow | 执行观察 |

## 风险

| 风险 | 可能性 | 影响 | 缓解方式 |
| --- | --- | --- | --- |
| 并发触发重复查询或升级 | 中 | 多个 npm 进程、写冲突 | 原子锁；锁存在时快速返回 cached/in-progress |
| Registry 返回 prerelease 或无效版本 | 低 | 错误升级 | 只接受稳定三段 SemVer，其他返回 degraded |
| Guard 自身版本较旧 | 中 | 新策略不能即时修复 | 新版 Upgrade 同时替换 Guard；保持最小稳定协议 |
| npm 命令输出过大 | 中 | 上下文和日志成本 | Guard 捕获子进程输出，只返回紧凑状态与错误码 |

## 未决问题

- 无。
