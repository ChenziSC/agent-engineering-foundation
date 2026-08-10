# Adapter 扩展层

`adapters/` 隔离真实 Provider、版本控制、语言工具链和现有项目级兼容安装差异。核心只依赖显式注册的契约，不扫描目录，也不动态执行未知实现。

## 当前实现

| 路径 | 职责 |
| --- | --- |
| `registry.mjs` | 创建显式 Adapter Registry，检查重复名称和能力边界 |
| `open-agent/index.mjs` | 面向项目级 `.agents/skills` 的兼容目录 Adapter；不扩展为通用 Host Runtime |
| `source-control/local-git.mjs` | 基于本地 Git 对象计算不可变 Merge Candidate 和范围摘要 |
| `delivery-evidence/remote-resolver.mjs` | 从 Git Remote 选择唯一匹配的已注册 Delivery Evidence Provider；不猜测门禁策略 |
| `delivery-evidence/github-actions.mjs` | 只读复核最终 Source SHA 上由指定 Workflow Path 产生的必需 GitHub Actions Check |

采用方可以在自己的仓库实现真实 Provider 或语言工具链 Adapter，并通过 Integration Manifest 显式注入；Skill/Plugin 安装优先使用 Agent Host 原生机制。公司专有 SDK、内部域名、凭证和真实生产配置不进入本仓。

## 设计边界

- Adapter 负责协议转换和外部系统差异，不拥有业务状态；
- Core 和 Harness 不读取 Adapter 私有字段；
- 凭证只通过采用方运行环境中的引用传递，不进入仓库配置；
- 未注册、重复注册或能力类型不匹配必须明确失败；
- Delivery Change Gate 默认从 `origin`（或唯一 Remote）自动选择 Provider；无匹配或多匹配时失败关闭，显式 Provider/Repository 仅作为受控覆盖；
- Remote 只决定“由哪个 Adapter 读取事实”，必需 Check、审批或部署策略仍由采用项目显式声明，不能从候选分支当前成功项反向猜测；
- Mock 只能使用合成数据，不能伪装成真实外部 Evidence。
- GitHub Actions Evidence 只证明指定 Check 与 Workflow Run 成功，不证明 Branch Protection、PR 审批、合入、部署或发布。

跨能力注册、状态和凭证引用契约见[项目基建 Adapter Blueprint](../blueprints/infrastructure-adapters/README.md)，当前调用方式见 [Harness 使用说明](../packages/harness/README.md)。
