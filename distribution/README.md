# Skill 分发白名单

`manifest.yaml` 是当前仓库允许向项目级 Agent Host 分发的 Skill 白名单。版本使用源目录完整内容的 SHA-256 摘要，不使用可变标签。

```bash
node packages/harness/bin/agent-foundation.mjs distribution plan --target <project-root>
node packages/harness/bin/agent-foundation.mjs distribution apply --target <project-root>
node packages/harness/bin/agent-foundation.mjs distribution verify --target <project-root>
```

- `plan` 在任何写入前校验全部条目和目标冲突；
- `apply` 只调用受管的项目级安装或更新，不处理用户级目录；
- `verify` 独立比较 Manifest、安装状态和目标内容；
- 修改 Skill 后必须重新计算对应摘要，并通过仓库检查；
- 多 Skill Apply 可重入，但不宣称跨目录写入具有绝对原子性。
