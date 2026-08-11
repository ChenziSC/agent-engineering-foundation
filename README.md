# Agent 工程治理骨架

`agent-engineering-foundation` 为不同 Harness Agent 提供可复用的项目规则、Specflow、领域 Skill、确定性 Validator 和采用骨架。

本仓只补充宿主缺少的项目语义和工程门禁，不重新实现 Agent Host 已有的 Skill/Plugin 安装、权限、Sandbox、Hook、MCP、会话恢复或通用代码探索能力，也不绑定某一家公司的研发平台。

| 本仓直接提供 | 采用方负责补齐 |
| --- | --- |
| Starter、Knowledge 与 Specflow 骨架、领域 Skill、确定性检查、发布白名单和 Adapter 契约 | Agent Host 原生运行能力、项目专属知识、构建/测试/Lint、真实 Provider、观测和审批发布策略 |

## 快速开始

### 使用公开 CLI

需要 Node.js 20+。采用项目固定使用明确版本，不依赖可变的 `latest`：

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- agent-foundation --version
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation init plan --target /path/to/existing-project
```

面向 Coding Agent 的完整接入决策树、安全边界、授权点和成功标准见 [`Install.md`](Install.md)。对既有项目先运行只读 `init plan`，审阅待新增、复用和冲突文件；Harness 不自动合并同路径的未知内容。

已经完成 Distribution 接入的项目升级时，先由维护者选择一个已发布的精确版本，再使用该版本 CLI 计划和应用整套受管 Skill 更新：

```bash
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation upgrade plan --target /path/to/adopted-project
npm exec --yes --package=agent-engineering-foundation@0.1.0 -- \
  agent-foundation upgrade apply --target /path/to/adopted-project
```

示例中的 `0.1.0` 应替换为维护者批准的目标版本。CLI 不自动追随 `latest`；Plan 只读，Apply 复用 Distribution 的用户修改保护并在写入后 Verify。

### 从源码开发

需要 Node.js 20+；仓库自身无运行时依赖。

```bash
npm test
npm run check
node packages/harness/bin/agent-foundation.mjs skill list
node packages/harness/bin/agent-foundation.mjs init plan --target /path/to/existing-project
node packages/harness/bin/agent-foundation.mjs init --target /path/to/project
node packages/harness/bin/agent-foundation.mjs doctor --target /path/to/project
node packages/harness/bin/agent-foundation.mjs context resolve --target /path/to/project --task-type "新增或修改 Skill" --paths skills/example
```

完整命令、写入边界和模块职责见 [Harness 使用说明](packages/harness/README.md)。

## 仓库分层

| 目录 | 职责 |
| --- | --- |
| `specs/` | 当前研发事项的范围、方案、任务和验证证据 |
| `knowledge/` | 跨任务稳定的事实、设计原因、契约和刷新条件 |
| `docs/` | 能力导航、结构说明、成熟度投影和发布检查 |
| `frameworks/` | 通用问题模型、不变量、Schema 和窄参考实现 |
| `skills/` | Agent 可直接执行的能力编排及其 References、Assets 和 Evals |
| `templates/` | 不属于单一 Skill 的可复制资产 |
| `blueprints/` | 项目接入、扩展点和生产化缺口 |
| `starter/` | 可复制的最小项目接入骨架 |
| `packages/` | Harness 与共享确定性实现 |
| `adapters/` | Host、版本控制和其他外部系统隔离层 |
| `distribution/` | Skill 发布白名单和内容摘要版本 |

目录只在存在真实产物时创建。详细边界和采用路径见[目标仓库设计](docs/目标仓库设计.md)。

## 当前能力边界

当前参考实现覆盖：项目初始化与 Doctor、项目级兼容 Skill 安装及版本升级、发布内容校验、Specflow 与 Knowledge 检查、最小上下文解析、Knowledge Projection、本地 Git Merge Candidate、Change Gate、仓库扫描，以及多组确定性契约校验。

真实 Browser、Design、Coverage、Tracking 和企业研发平台 Adapter，以及完整 Agent Runtime、跨仓库事务仍由采用方或后续实现补齐。本仓提供只接受干净 Commit 的不可变包构建器，以及从版本 Tag 向 npmjs.org 发布固定 tarball并生成 Provenance 的手动 Workflow；不创建 GitHub Release。能力成熟度、证据和缺口的唯一投影见[交付形态与成熟度](docs/交付形态与成熟度.md)。

## 自举治理

本仓使用自身能力管理演进：

- `AGENTS.md` 定义 Agent 工作入口和全仓不变量；
- `skills/` 是唯一 Skill 源码；本仓 `.agents/skills` 使用严格仓内 Source Link，采用项目仍通过 Distribution 消费不可变副本；
- `specs/*/meta.yaml` 是当前事项状态、关系和影响范围的唯一事实来源；
- `knowledge/registry.yaml` 与 `knowledge/code-entry-map.yaml` 路由长期知识；
- Commit、Push、事项终态和外部发布分别需要对应授权。

## 文档入口

- [能力地图](docs/能力地图.md)
- [目标仓库设计](docs/目标仓库设计.md)
- [交付形态与成熟度](docs/交付形态与成熟度.md)
- [能力问题图谱](docs/能力问题图谱.md)
- [公开发布检查清单](docs/公开发布检查清单.md)
- [Foundation 不可变包交付](docs/不可变包交付.md)
- [公开内容来源说明](docs/公开内容来源说明.md)
- [公开泛化与脱敏复用政策](knowledge/public-generalization-policy.md)
- [Harness 使用说明](packages/harness/README.md)
- [Adapter 扩展说明](adapters/README.md)

## 语言与许可

中文是仓库内容和协作沟通的首要语言。代码标识符、命令、文件格式字段和通行技术术语可以保留英文；核心内容不要求中文读者依赖英文材料理解。

Copyright 2026 ChenziSC。本仓内容采用 [Apache License 2.0](LICENSE)。首次公开发布前按照[公开发布检查清单](docs/公开发布检查清单.md)完成权属确认、行为评估和最终扫描。
