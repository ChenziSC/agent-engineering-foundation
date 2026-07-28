# Agent 工程基础设施

这个仓库用于沉淀可以被其他公司或个人项目继续使用的 Agent 工程能力。

仓库采用 Markdown-first 方式建设。首要产物是可读、可评审、可复用的框架、Skill、模板、契约草案和合成案例；只有确实能带来额外价值时，才增加 Package、CLI、Adapter 或自动化脚本。

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

对于依赖特定研发平台的能力，公开仓库优先提供通用边界、接口草案和合成示例。是否实现 Adapter 由具体使用方决定。

## 当前阶段

当前先完成通用知识沉淀，不以创建代码包为目标：

1. 确定能力地图和优先级；
2. 明确每项能力应该保留什么、舍弃什么；
3. 用私有覆盖台账保证关键信息没有遗漏；
4. 按交付形态分别沉淀为框架、Blueprint、模板或 Skill；
5. 只有在实际复用需要出现后，才按能力边界增加参考实现。

## 已落地内容

- [Evidence 与 Claim 框架](frameworks/evidence/README.md)
- [长任务 Checkpoint 框架](frameworks/checkpoint/README.md)
- [Web 首屏预请求框架](frameworks/web-prefetch/README.md)
- [`web-first-screen-prefetch` Skill](skills/web-first-screen-prefetch/SKILL.md)
- [Specflow Blueprint 与模板](blueprints/specflow/README.md)
- [Skill 运行时与分发 Blueprint](blueprints/skill-runtime/README.md)
- [Skill 行为评估方法与模板](frameworks/skill-eval/README.md)
- [AI 友好仓库模板](templates/ai-friendly-repository/README.md)
- [`web-performance-review` Skill](skills/web-performance-review/SKILL.md)

## 文档入口

- [迁移总览](docs/00-迁移总览.md)
- [能力地图](docs/01-能力地图.md)
- [目标仓库设计](docs/02-目标仓库设计.md)
- [脱敏与独立重写规范](docs/03-脱敏与独立重写规范.md)
- [能力说明模板](docs/04-能力说明模板.md)
- [交付形态与成熟度](docs/05-交付形态与成熟度.md)
- [公开发布检查清单](docs/06-公开发布检查清单.md)
- [公开内容来源说明](docs/07-公开内容来源说明.md)
- [P0 能力说明](docs/能力说明/)

## 附加资源

- [自定义 Codex 宠物](pets/)

宠物资源与 Agent 工程能力相互独立。它们可以保留在同一仓库中，但不属于框架、Skill、Blueprint 或模板的依赖。

## License

Copyright 2026 ChenziSC。

本仓库全部内容，包括 Agent 工程内容与 `pets/` 资源，采用 [Apache License 2.0](LICENSE)。

## 发布

首次公开发布前按照[公开发布检查清单](docs/06-公开发布检查清单.md)完成仓库命名、权属确认、License、行为评估和最终扫描。
