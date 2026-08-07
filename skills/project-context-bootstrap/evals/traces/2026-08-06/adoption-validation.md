# 真实采用验证记录：存量项目接入

## 记录边界

- 日期：`2026-08-06`；
- 场景：维护者自有的存量 Web 项目；
- 目标：验证 Bootstrap 候选审核、最小 Starter、项目 Knowledge、项目级 Skill 安装、Doctor、Context Resolver 和 Agent Host 原生发现能否形成连续接入路径；
- 非目标：验证样本项目的业务实现、构建、运行、安全整改或发布。

本记录不保存样本仓名称、远端链接、本机绝对路径、业务标识、配置值、凭证、原始 Prompt、完整命令日志、会话标识或思维过程。公开自动化不依赖该样本项目。

## 观察

| 阶段 | 证据类型 | 脱敏结果 | 边界 |
| --- | --- | --- | --- |
| 接入前结构盘点 | Harness `init plan` | Starter 候选均可新增，无路径冲突 | 结构计划不生成项目语义 |
| 项目候选审核 | Bootstrap 输出复核 | 形成项目规则、两条长期 Knowledge 与四类代码入口候选 | 候选先经维护者审核，不由 Skill 自动写入 |
| Harness 化 | Harness `init` | 最小 Starter 写入成功 | 写入发生在独立授权之后 |
| Skill 安装 | Harness `skill install` 与受管状态 | `project-context-bootstrap` 安装到项目级开放 Skill 目录，安装摘要在当时版本匹配 | 兼容安装不是用户级 Plugin Runtime |
| 确定性检查 | Doctor、Knowledge Check、Skill Check | 必需文件、Manifest、Host Adapter、Knowledge、代码入口和安装记录通过 | 不证明业务运行正确性 |
| 上下文解析 | Context Resolver | 相关任务只加载根规则和命中的 Knowledge，并排除默认大文件 | 没有 Active Spec 时不虚构事项上下文 |
| Knowledge 导航 | 项目化 README 复核 | README 可浏览两条已批准正文与四类常见任务，根规则可发现该入口 | README 不复制 Digest、完整 Scope 或 Resolver 输出 |
| Host 原生发现 | 全新 Agent Host 会话 | 会话实际加载项目级 Skill、根规则和 Knowledge Registry | 只观察所测 Host，不外推其他 Host |
| Harness 命令可用性 | 全新 Agent Host 会话 | Host 会话未在项目 `PATH` 中发现 `context` 或 `specflow` 独立命令 | Host 能发现 Skill 不表示 Harness CLI 已安装到采用项目 |

## 结论

- `observed`：项目级开放 Skill 目录可以被所测 Agent Host 原生发现；
- `observed`：本仓 Harness 可以从仓外对采用项目完成初始化、安装、Doctor、Knowledge 与 Context Resolve；
- `observed`：Host 原生 Skill 发现和 Harness CLI 可用性是两个独立验证面；
- `observed`：机器路由与人类导航可以共享正文链接，但必须保持不同事实所有权；
- `unresolved`：其他 Agent Host 的原生发现、安装与更新行为；
- `unresolved`：当前职责版本五个行为 Case 的独立正式 Replay；
- `unresolved`：长期采用后的收益、维护成本和知识新鲜度表现。

因此本记录补足一次真实采用观察，但不单独支持把 `project-context-bootstrap` 从 `usable` 提升为 `validated`。
