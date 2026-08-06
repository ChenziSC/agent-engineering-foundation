# Adapter 扩展层

`adapters/` 隔离真实 Provider、版本控制、语言工具链和现有项目级兼容安装差异。核心只依赖显式注册的契约，不扫描目录，也不动态执行未知实现。

## 当前实现

| 路径 | 职责 |
| --- | --- |
| `registry.mjs` | 创建显式 Adapter Registry，检查重复名称和能力边界 |
| `open-agent/index.mjs` | 面向项目级 `.agents/skills` 的兼容目录 Adapter；不扩展为通用 Host Runtime |
| `source-control/local-git.mjs` | 基于本地 Git 对象计算不可变 Merge Candidate 和范围摘要 |

采用方可以在自己的仓库实现真实 Provider 或语言工具链 Adapter，并通过 Integration Manifest 显式注入；Skill/Plugin 安装优先使用 Agent Host 原生机制。公司专有 SDK、内部域名、凭证和真实生产配置不进入本仓。

## 设计边界

- Adapter 负责协议转换和外部系统差异，不拥有业务状态；
- Core 和 Harness 不读取 Adapter 私有字段；
- 凭证只通过采用方运行环境中的引用传递，不进入仓库配置；
- 未注册、重复注册或能力类型不匹配必须明确失败；
- Mock 只能使用合成数据，不能伪装成真实外部 Evidence。

跨能力注册、状态和凭证引用契约见[项目基建 Adapter Blueprint](../blueprints/infrastructure-adapters/README.md)，当前调用方式见 [Harness 使用说明](../packages/harness/README.md)。
