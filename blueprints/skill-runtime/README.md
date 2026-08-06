# Skill 运行时与分发 Blueprint

成熟度：Blueprint `designed`；项目级 Host 注册与 Distribution Manifest 子集 `reference-implemented`

这个 Blueprint 描述如何发现、校验、计划安装和更新仓库内的 Agent Skill，并为不同宿主生成统一能力清单。仓库已提供最小 CLI、项目级开放 Host、可注入 Adapter Registry 和仓库级 Distribution Manifest；采用方可以显式组装自己的 Host。用户级安装和能力注册表仍是设计契约。

## 当前参考实现

- 入口：[`packages/harness/bin/agent-foundation.mjs`](../../packages/harness/bin/agent-foundation.mjs)；
- Host：[`adapters/open-agent/index.mjs`](../../adapters/open-agent/index.mjs)；
- Registry：[`adapters/registry.mjs`](../../adapters/registry.mjs)；
- 范围：项目级 `.agents/skills`；
- 命令：`skill list`、`skill check`、`skill plan`、`skill install`、`skill update`，以及 `distribution plan/apply/verify`；
- 安全性：内容摘要、受管状态、冲突阻断、Symlink 阻断、临时目录替换和失败回滚；
- 限制：默认 CLI 只打包开放 Host；自定义 Host 由采用方组合入口注入；Distribution 只允许项目级安装，不支持用户级或远端动态来源。

## 配套模板

- [Manifest 示例](../../templates/skill-runtime/manifest.example.yaml)
- [Host Target 示例](../../templates/skill-runtime/host-target.example.yaml)
- [安装计划模板](../../templates/skill-runtime/install-plan.template.md)
- [能力注册表示例](../../templates/skill-runtime/capability-registry.example.yaml)
- [安全报告模板](../../templates/skill-runtime/safety-report.template.md)

## 开放 Skill 目录

```text
skill-name/
├── SKILL.md
├── agents/
├── references/
├── assets/
├── evals/
├── scripts/    # 按需
└── tests/      # 仅在存在 scripts 时按需
```

最低要求：

- 目录名与 Skill `name` 一致；
- `SKILL.md` Frontmatter 只包含必要元数据；
- `description` 同时说明能力和触发场景；
- 生成、评审、规划类 Skill 具有行为 Eval；
- 不要求空的可选目录。

## 核心输入

### Skill Source

Skill 源目录是内容的唯一事实来源。安装目录是派生副本，不能反向静默修改源目录。

### Integration Manifest

项目 `agent-foundation.json` 声明能力类别、Adapter ID 和可选的不透明 `configRef`。当前 Harness 实际解析该 Manifest，并要求一个项目级 Host。完整扩展边界见[项目基建 Adapter Blueprint](../infrastructure-adapters/README.md)。

### Distribution Manifest

仓库根目录的 [`distribution/manifest.yaml`](../../distribution/manifest.yaml) 声明允许分发的 Skill、固定源路径、内容摘要、必需文件和可选资源。参考实现会在摘要漂移、缺少文件、未知资源、目标冲突或用户修改时阻断。

```bash
node packages/harness/bin/agent-foundation.mjs distribution plan --target <project-root>
node packages/harness/bin/agent-foundation.mjs distribution apply --target <project-root>
node packages/harness/bin/agent-foundation.mjs distribution verify --target <project-root>
```

`plan` 与 `verify` 只读；`apply` 会逐项使用已有安全安装/更新原语，成功项保持幂等。若进程在多项之间中断，重跑同一 Manifest 会从已记录状态继续，不宣称跨 Skill 文件系统事务绝对原子。

### Host Target

Host Target 描述：

- 宿主 ID；
- 项目级和用户级目标目录；
- 支持的文件；
- Symlink 策略；
- 路径冲突策略。

Host Target 不包含凭证，也不执行 Skill。

## 操作模式

```text
check
→ plan
→ apply
```

### Check

- 发现 Skill；
- 校验目录、Frontmatter 和 Integration Manifest；
- 检查目标 Host 是否已知；
- 不产生文件写入。

### Plan

- 比较源目录与目标目录；
- 列出新增、更新、保留、冲突和拒绝处理的路径；
- 检查 Symlink 和文件归属；
- 不产生文件写入。

### Apply

- 只执行已经展示且获得授权的计划；
- 操作后生成结果和安全报告；
- 遇到计划外变化时停止，不扩大范围。

## 安装范围

### 项目级

只影响当前项目目录。用户明确要求安装到项目时，可以生成项目级计划。

### 用户级

影响多个项目，属于更高影响范围的外部写操作。必须获得明确授权，不能从“安装这个 Skill”自动推断。

## 更新规则

1. 只更新此前由工具管理且位于 Distribution Manifest 白名单中的 Skill。
2. 不静默安装新出现的 Skill。
3. 不删除无法确认归属的文件。
4. 目标目录存在用户修改时报告冲突，不覆盖。
5. 源目录内容变化后重新生成计划。
6. Apply 前后的计划摘要和内容摘要必须一致。

## Symlink 安全

- 比较路径时先识别链接本身和链接目标；
- 替换 Symlink 时只处理目标目录中的链接节点；
- 不沿链接修改源目录；
- 链接目标未知或越出允许范围时阻断；
- Blueprint 不规定必须使用复制还是 Symlink，由 Host Target 明确。

## 能力注册表

能力注册表用于让宿主或用户查看：

- Skill 名称；
- 触发描述；
- 当前版本；
- 安装范围；
- 资源能力；
- 是否存在行为 Eval。

注册表是安装结果的派生产物，不是 Skill 内容的事实来源。

## 合成走查

### 无冲突的项目级安装

Check 通过，Plan 只包含新增文件。用户确认后才能进入 Apply。

### 未授权用户级安装

Plan 显示用户级目标目录，但没有明确授权。状态保持 `planned`，不执行写入。

### Symlink 指向源目录

目标项是 Symlink。更新只能替换链接节点或按策略停止，不能沿链接修改源目录。

### Manifest 漂移

Manifest 声明一个不存在的 Skill。Check 返回 `blocked`，目标目录保持不变。

## 当前参考实现不包含

- 默认 CLI 内置多个 Host、动态插件加载与用户级安装；
- 未经显式命令触发的自动安装或更新；
- npm、编辑器插件或 Marketplace 发布；
- 使用遥测；
- 远端能力服务。
