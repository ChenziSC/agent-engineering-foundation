# Agent 工程治理骨架

这个仓库用于沉淀可以被其他公司、团队或个人项目采用的 Agent Harness、Skill 和 AI 工程治理能力。

仓库同时保留三层资产：Framework 和 Knowledge 解释为什么需要某项能力；Skill、Template、Blueprint 和 Starter 负责如何采用；Harness、Validator 和 Adapter 负责适合确定性执行的部分。当前已提供一个最小的项目级参考闭环，其余能力仍以设计资产和可执行 Skill 为主。

## 语言约定

中文是本仓库内容和协作沟通的首要语言。Skill、规范、模板、示例、评估材料和说明文档默认使用中文编写。代码标识符、命令、文件格式固有字段和通行技术术语可以保留英文；必要时补充中文解释，确保中文读者无需依赖英文材料即可理解核心内容。

## 项目名称

项目公开名称为 `agent-engineering-foundation`。

这个名称强调仓库提供的是 Agent 工程底座，而不是某一组提示词或某一个业务场景。其范围包括设计框架、Skill、Blueprint、模板、契约草案和合成示例，也允许未来按需增加参考实现。

GitHub 仓库与本地根目录统一使用以下标识：

- GitHub 仓库：[ChenziSC/agent-engineering-foundation](https://github.com/ChenziSC/agent-engineering-foundation)；
- 本地仓库根目录：`agent-engineering-foundation/`；
- README 和文档中的英文项目名称：`agent-engineering-foundation`；
- Package 名称和作用域另行设计，不要求与仓库名逐字一致。

它不追求把某个内部项目的 Skill 搬到公开环境后立即运行，而是优先保留真正有长期价值的部分：

- 问题模型；
- 输入输出契约；
- 状态机；
- 决策点与安全门禁；
- 可复用 Schema；
- 校验器；
- 失败模式；
- 扩展接口；
- 评估方法。

受限来源中的 Agent 能力都会进入非公开能力盘点。公开仓库不按来源一刀切过滤，而是根据公开依据和独立重建程度选择完整重建、设计重建、仅保留框架或排除；通用且能够由公开知识独立推导的方案可以沉淀为完整 Skill 或参考实现。

对于依赖特定研发平台的能力，公开仓库优先提供通用边界、接口草案和合成示例。是否实现 Adapter 由具体使用方决定。

## 当前阶段

仓库已经完成第一轮通用能力盘点，并能够使用自身 Specflow 和 Knowledge 管理后续演进。当前已有多组 Skill、Framework、Blueprint 和 Template，以及 Provider-neutral 的 Specflow 归档契约；实际资产以本页“已落地内容”和[成熟度说明](docs/05-交付形态与成熟度.md)为准。

当前已经提供一个 Node.js 18+、零运行时依赖的最小纵向闭环：

1. 提供一个可复制 Starter；
2. 提供初始化和 Doctor；
3. 支持 Skill 发现、检查、安装和安全更新；
4. 默认接入一个开放 Host，并允许采用方显式注入自己的项目级 Host Adapter；
5. 用本仓和完全合成的临时项目验证重复执行、冲突和失败保持目标不变。

该实现默认提供项目级 `.agents/skills` 开放 Host，并通过 Adapter Registry 支持采用方注入自己的项目级 Host；它不执行用户级安装，不动态加载插件，不覆盖未知目录或用户修改，也尚未包含 Archive Validator、Knowledge 新鲜度校验和 npm 发布。因此它是可验证的参考底座，不是已经覆盖所有基建的通用产品。

## 快速试用

在仓库根目录运行：

```bash
npm test
npm run check
node packages/harness/bin/agent-foundation.mjs skill list
node packages/harness/bin/agent-foundation.mjs init --target /path/to/project
node packages/harness/bin/agent-foundation.mjs doctor --target /path/to/project
node packages/harness/bin/agent-foundation.mjs skill plan --name specflow --target /path/to/project
node packages/harness/bin/agent-foundation.mjs skill install --name specflow --target /path/to/project
```

`skill list`、`skill check` 和 `skill plan` 是只读操作；`init`、`skill install` 和 `skill update` 会写入明确指定的项目目录。所有命令输出结构化 JSON，冲突时停止并保留既有内容。

`npm run check` 对当前仓库执行只读检查，包括目录、JSON/JSON Schema、仓库采用的 YAML 子集、Markdown 本地链接、Skill/Eval 结构和高置信秘密格式。发布前还可以把组织专有词逐行保存在仓库外，再运行：

```bash
node packages/harness/bin/agent-foundation.mjs repository check --deny-file /path/to/private-terms.txt
```

检查结果只返回词条摘要，不回显私有词本身。启发式扫描无命中不能替代权属、保密义务和人工内容复核。

## 仓库自身治理

本仓库使用自己提供的 Specflow 和 AI 友好仓库方法管理自身演进：

- [`specs/`](specs/) 保存当前研发事项的范围、方案、任务、状态和验证证据；
- [`knowledge/`](knowledge/) 保存跨任务稳定的仓库定位、设计原因、契约和刷新条件；
- [`AGENTS.md`](AGENTS.md) 定义 Agent 如何发现 Active Spec、相关 Knowledge 和工作边界；
- 不为历史提交伪造 SDD 产物，从正式采用时点开始保留真实可追溯记录；
- 终态、提交、推送、PR/MR 和发布分别需要符合对应授权。

当前 Active 事项是[将仓库升级为可快速接入的 Agent 工程治理骨架](specs/2026-08-05-self-hosted-agent-governance/spec.md)。Starter、最小 Harness、项目级开放 Host、可注入 Adapter Registry、仓库级只读检查和 CI 示例已经落地；归档确定性执行及正式公开发布前的人工权属复核仍未完成。

## 已落地内容

- [Evidence 与 Claim 框架](frameworks/evidence/README.md)
- [长任务 Checkpoint 框架](frameworks/checkpoint/README.md)
- [Web 首屏预请求框架](frameworks/web-prefetch/README.md)
- [`web-first-screen-prefetch` Skill](skills/web-first-screen-prefetch/SKILL.md)
- [`specflow` Skill](skills/specflow/SKILL.md)
- [`refactor-natural-language-content` Skill](skills/refactor-natural-language-content/SKILL.md)
- [Specflow 项目接入 Blueprint](blueprints/specflow/README.md)
- [Skill 运行时与分发 Blueprint](blueprints/skill-runtime/README.md)
- [项目基建 Adapter Blueprint](blueprints/infrastructure-adapters/README.md)
- [最小 Starter](starter/minimal/)
- [最小 Harness CLI](packages/harness/bin/agent-foundation.mjs)
- [项目级开放 Host Adapter](adapters/open-agent/index.mjs)
- [可注入 Adapter Registry](adapters/registry.mjs)
- [Skill 行为评估方法与模板](frameworks/skill-eval/README.md)
- [AI 友好仓库模板](templates/ai-friendly-repository/README.md)
- [`web-performance-review` Skill](skills/web-performance-review/SKILL.md)
- [项目组件治理与维护框架](frameworks/project-component-governance/README.md)
- [`project-component-governance` Skill](skills/project-component-governance/SKILL.md)
- [项目组件治理模板](templates/project-component-governance/README.md)
- [项目组件治理接入 Blueprint](blueprints/project-component-governance/README.md)

## 文档入口

- [迁移总览](docs/00-迁移总览.md)
- [能力地图](docs/01-能力地图.md)
- [目标仓库设计](docs/02-目标仓库设计.md)
- [脱敏与独立重写规范](docs/03-脱敏与独立重写规范.md)
- [能力说明模板](docs/04-能力说明模板.md)
- [交付形态与成熟度](docs/05-交付形态与成熟度.md)
- [公开发布检查清单](docs/06-公开发布检查清单.md)
- [公开内容来源说明](docs/07-公开内容来源说明.md)
- [能力问题图谱](docs/08-能力问题图谱.md)
- [P0/P1 能力说明](docs/能力说明/)

## 附加资源

- [自定义 Codex 宠物](pets/)

宠物资源与 Agent 工程能力相互独立。它们可以保留在同一仓库中，但不属于框架、Skill、Blueprint 或模板的依赖。

## License

Copyright 2026 ChenziSC。

本仓库全部内容，包括 Agent 工程内容与 `pets/` 资源，采用 [Apache License 2.0](LICENSE)。

## 发布

首次公开发布前按照[公开发布检查清单](docs/06-公开发布检查清单.md)完成仓库命名、权属确认、License、行为评估和最终扫描。
