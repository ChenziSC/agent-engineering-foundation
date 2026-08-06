# Skill 发布白名单

`manifest.yaml` 记录当前仓库允许发布的 Skill、资源集合和源目录 SHA-256 摘要。它证明发布候选与仓库源内容一致，不是独立 Runtime、通用安装协议或 Host Capability Registry。

```bash
node packages/harness/bin/agent-foundation.mjs distribution plan --target <project-root>
node packages/harness/bin/agent-foundation.mjs distribution apply --target <project-root>
node packages/harness/bin/agent-foundation.mjs distribution verify --target <project-root>
```

- `plan` 在任何写入前校验全部条目和目标冲突；
- `apply` 只服务现有项目级兼容安装，不处理用户级目录；
- `verify` 独立比较 Manifest、安装状态和目标内容；
- 修改 Skill 后必须重新计算对应摘要，并通过仓库检查；
- 多 Skill Apply 可重入，但不宣称跨目录写入具有绝对原子性。

Skill 的安装、更新、权限、Sandbox、Hook、MCP 和用户级状态由目标 Agent Host 的原生 Skill/Plugin 机制负责。Skill 脚本必须自包含，或通过宿主原生机制声明外部依赖；不能因为脚本在本仓可运行，就推断发布副本拥有未随包分发的相对路径。

现有 `plan/apply/verify` 可以维护安全性和兼容性，但不继续扩展 Manifest v2、用户级安装、动态 Plugin、通用 Hook 或 Capability 协商。完整边界见[能力准入、宿主边界与确定性代码依赖](../knowledge/deterministic-core-boundary.md)。
