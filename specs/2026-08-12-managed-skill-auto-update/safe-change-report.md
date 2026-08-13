# 安全变更报告

## 候选与范围

- 候选版本：`agent-engineering-foundation@0.3.0` 发布候选。
- 目标：消费项目的受管 Skill 触发时复用单一 Guard 检查并安全升级；生产者不更新；未来 Skill 缺少声明时失败关闭。
- 非目标：遥测、反馈、用户级 Skill、通用 Host Hook、自动发布、自动归档。
- 变化路径：`skills/`、`distribution/`、`packages/harness/`、`AGENTS.md`、安装说明、长期 Knowledge 与当前 Spec。

## 风险与消费者

| 路径 | 消费者/契约 | 风险 | 可逆性 | Evidence |
| --- | --- | --- | --- | --- |
| `packages/harness/src/runtime/update-guard.mjs` | 消费项目中的受管 Skill | 网络、并发、版本或子进程失败 | 删除 Guard 后可回退显式 Upgrade | 注入测试、并发测试、仓外 npx 探针 |
| `packages/harness/src/harness.mjs` | Distribution Plan/Apply/Verify、Upgrade | 覆盖用户修改或污染生产者 | 摘要保护、备份恢复、冲突失败关闭 | Harness 回归与生产者迁移负例 |
| `skills/*/SKILL.md` | Agent 触发行为 | 更新后继续使用已加载旧指令 | `updated` 后强制重读 | Repository Check 与 Eval Replay |
| `AGENTS.md`、Knowledge、文档 | 维护者与未来 Skill 作者 | 契约重复或术语漂移 | 单一完整声明 + 长期事实投影 | Knowledge Projection、自然语言一致性复核 |

## 增量覆盖矩阵

| 覆盖规则 | 自动检查 | 浏览器场景 | 人工门禁 | Evidence 来源关系 | 结果 |
| --- | --- | --- | --- | --- | --- |
| Guard 状态机与隐私边界 | Update Guard 单测 | 不适用 | 无 | 执行观察 | pass |
| 消费者安装与生产者跳过 | Distribution/Harness 回归 | 不适用 | 无 | 交叉验证 | pass |
| 未来 Skill 声明完整性 | Repository Check 正负例 | 不适用 | 新 Skill 仍需维护者评审 | 执行观察 | pass |
| 全仓兼容性 | 129 项全量测试、2 项规模测试、治理门禁 | 不适用 | 发布另需明确授权 | 交叉验证 | pass |

## 回滚与阻塞

- 回滚条件：Guard 造成不可接受的触发延迟、Host 无法稳定执行前置声明，或 Upgrade 安全语义出现回归。
- 未覆盖路径：真实外部 Host 长期采用、Windows 文件替换行为、Registry 大范围故障。
- 未知外部状态：当前无外部消费项目；新版本尚未发布。
- 最终状态：`validated`
