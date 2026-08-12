# Skill 发布白名单

`manifest.yaml` 记录当前仓库允许发布的 Skill、运行时资源集合和这些文件的 SHA-256 摘要。`recommendations.json` 独立记录安装建议、Profile 和每个 Skill 的适用条件；发布白名单不等于默认安装集合。默认运行时内容只包含 `SKILL.md` 及其执行所需的 `agents`、`references`、`assets`、`scripts`，不复制上游 Eval、Trace、Replay、运行报告或测试。这些契约证明发布候选与声明内容一致，不是独立 Runtime、通用安装协议或 Host Capability Registry。

```bash
node packages/harness/bin/agent-foundation.mjs skill recommend
node packages/harness/bin/agent-foundation.mjs distribution plan --profile core --include-skill safe-change --target <project-root>
node packages/harness/bin/agent-foundation.mjs distribution plan --profile full --target <project-root>
node packages/harness/bin/agent-foundation.mjs distribution apply --profile core --target <project-root>
node packages/harness/bin/agent-foundation.mjs distribution verify --target <project-root>
```

- `plan` 在任何写入前校验全部条目和目标冲突；
- `apply` 只服务现有项目级兼容安装，不处理用户级目录；
- `verify` 独立比较 Manifest、安装状态和目标内容；
- 新项目默认推荐 `core`，但首次 Apply 必须显式选择 `core` 或 `full`；`full` 精确覆盖 Manifest 全集；
- `--include-skill` 可重复表达 `core + 可选项`；实际维护集合是所选 Profile、显式可选项与仍在 Manifest 中的已有受管 Skill 的并集，Profile 缩小不触发卸载；
- 旧 Distribution 状态缺少 Profile 时按历史 `full` 兼容；Foundation 源码仓的 Source Link 固定使用 `full`；
- 旧受管版本升级时，只清理仍与旧摘要一致且新 Manifest 不再声明的文件；采用方修改或未知文件不会被静默覆盖或删除；
- 修改 Skill 后必须重新计算对应摘要，并通过仓库检查；
- 多 Skill Apply 可重入，但不宣称跨目录写入具有绝对原子性。

Foundation 源码仓是唯一生产者特例：Integration 显式声明 `foundation-source://skills` 时，`apply` 可以把摘要一致且无用户修改的既有受管副本迁移为 `.agents/skills -> ../skills`。之后 Host 从 `skills/` 读取最新源码，`verify` 校验精确链接、安装记录与发布摘要；不需要为每次源码编辑复制运行时文件。该配置只在目标项目等于当前 Foundation 源码根时有效，采用项目、仓外目标和其他 Symlink 均拒绝。

Skill 的安装、更新、权限、Sandbox、Hook、MCP 和用户级状态由目标 Agent Host 的原生 Skill/Plugin 机制负责。Skill 脚本必须自包含，或通过宿主原生机制声明外部依赖；不能因为脚本在本仓可运行，就推断发布副本拥有未随包分发的相对路径。

现有 `plan/apply/verify` 可以维护安全性和兼容性，但不继续扩展 Manifest v2、用户级安装、动态 Plugin、通用 Hook 或 Capability 协商。完整边界见[能力准入、宿主边界与确定性代码依赖](../knowledge/deterministic-core-boundary.md)。
