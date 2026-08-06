# Skill 发布与宿主接入 Blueprint

成熟度：发布内容白名单与项目级兼容安装子集 `reference-implemented`

本 Blueprint 只定义本仓 Skill 如何形成可复核发布内容，以及如何交给 Agent Host 的原生 Skill/Plugin 机制消费。它不建设独立 Agent Runtime，也不把不同宿主已经提供的安装、权限、Hook、Sandbox、MCP 和会话能力重新统一一遍。

## 职责边界

| 所有者 | 负责 | 不由其负责 |
| --- | --- | --- |
| Skill 源目录 | 触发描述、领域工作流、References、Assets、Evals 和必要的自包含脚本 | 安装状态、权限和宿主生命周期 |
| `distribution/manifest.yaml` | 发布白名单、源路径、必需文件、资源集合和内容摘要 | 运行时能力协商和用户环境配置 |
| Agent Host | Skill/Plugin 的发现、安装、更新、权限、Sandbox、Hook、MCP 和会话行为 | 本仓领域契约的正确性 |
| Harness | 本仓内容检查、项目级兼容安装与摘要验证 | 通用多宿主 Runtime |

Skill 源目录是内容唯一事实来源；安装目录只是派生副本。修改源内容后重新计算发布摘要，不反向从安装目录合并未知修改。

## 发布内容

开放 Skill 目录按需包含：

```text
skill-name/
├── SKILL.md
├── agents/
├── references/
├── assets/
├── evals/
├── scripts/
└── tests/
```

- 不创建空的可选目录；
- 生成、分析、评审或规划类 Skill 必须有领域行为 Eval；
- 脚本必须自包含，或通过目标 Host 的原生机制声明外部命令、MCP、Package 或 Plugin 依赖；
- 可分发内容不能通过相对路径读取本仓未发布目录；
- 不为通用 Agent 基础行为单独创建 Skill，准入规则见[能力准入、宿主边界与确定性代码依赖](../../knowledge/deterministic-core-boundary.md)。

Manifest 示例见[模板](../../templates/skill-runtime/manifest.example.yaml)。

## 宿主接入

优先使用目标 Host 的原生项目级 Skill 目录或 Plugin 包。多宿主发布时尽量复用同一份开放 Skill 内容；仅当真实验证证明元数据、工具声明或打包布局无法兼容时，才增加薄转换层。

宿主接入需要验证：

1. Host 能发现 Skill，且触发描述没有依赖本仓私有路径；
2. References、Assets、脚本和外部依赖在安装后可达；
3. 领域 Eval 在目标 Host 上保留相同阻塞条件；
4. Host 原生权限和 Sandbox 没有被脚本绕过；
5. 卸载或更新由 Host 原生机制处理，不建立第二份用户级状态。

## 当前兼容实现

仓库已有 `skill list/check/plan/install/update` 和 `distribution plan/apply/verify`，用于合成项目和不具备原生发布流程的项目级兼容场景。它们提供内容摘要、冲突与 Symlink 阻断、受管副本校验和失败回滚。

```bash
node packages/harness/bin/agent-foundation.mjs distribution plan --target <project-root>
node packages/harness/bin/agent-foundation.mjs distribution apply --target <project-root>
node packages/harness/bin/agent-foundation.mjs distribution verify --target <project-root>
```

`plan` 与 `verify` 只读；`apply` 只处理明确目标项目中的受管副本。该实现可以修复安全缺陷并保持回归兼容，但不继续扩展为：

- 用户级或全局 Skill 安装器；
- Marketplace、远端动态来源或通用 Plugin 管理器；
- Host Capability Registry 或 Manifest v2 协商协议；
- 通用 Hook、权限、Sandbox、MCP 或会话 Runtime；
- 自动选择或下载可执行依赖。

当目标 Host 原生发布机制能够覆盖采用场景时，优先停用兼容安装入口，只保留发布白名单、内容摘要和仓库检查。

## 验证门禁

- Manifest 条目必须对应真实 Skill 目录和完整内容摘要；
- 必需文件和声明资源必须存在，未知资源阻断发布；
- Skill 脚本的本地导入不得越出发布根目录；
- 项目级兼容安装不得覆盖用户修改或沿 Symlink 写出目标目录；
- 行为 Eval 证明领域工作流，安装测试只证明内容可达；两类证据不能相互替代。
