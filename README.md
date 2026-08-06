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

受限来源中的 Agent 能力都会进入非公开能力盘点。公开仓库不按来源或多个通用细节的组合方式一刀切过滤；只要问题、解决思路、流程和能力排布具有跨项目通用性，并且已经移除具体内部标识、真实系统事实、数据与专有实现表达，就可以沉淀为完整 Skill 或参考实现。公开文字、代码、Schema 和案例仍需自行编写或具有明确复用授权。

对于依赖特定研发平台的能力，公开仓库优先提供通用边界、接口草案和合成示例。是否实现 Adapter 由具体使用方决定。

## 当前阶段

仓库已经完成第一轮通用能力盘点，并能够使用自身 Specflow 和 Knowledge 管理后续演进。当前已有多组 Skill、Framework、Blueprint 和 Template，以及 Provider-neutral 的 Specflow 归档契约；实际资产以本页“已落地内容”和[成熟度说明](docs/05-交付形态与成熟度.md)为准。

当前已经提供一个 Node.js 18+、零运行时依赖的最小纵向闭环：

1. 提供一个可复制 Starter；
2. 提供初始化和 Doctor；
3. 支持 Skill 发现、检查、安装、安全更新，以及由内容摘要锁定的 Distribution Manifest；
4. 默认接入一个开放 Host，并允许采用方显式注入自己的项目级 Host Adapter；
5. 提供 Meta、Evidence/Claim、Checkpoint、增量验证、Web Evidence、Design Contract、Event Catalog、Skill Eval 和项目组件 Registry 的确定性校验子集；
6. 用本仓和完全合成的临时项目验证重复执行、冲突和失败保持目标不变。

该实现默认提供项目级 `.agents/skills` 开放 Host，并通过 Adapter Registry 支持采用方注入自己的项目级 Host；Distribution Manifest 以内容摘要锁定全部可分发 Skill，并支持 Plan/Apply/Verify。Specflow Skill 提供完整 Meta Schema、仓库级 Meta/关系检查、单事项目录 Receipt、Lifecycle Event、Meta 状态最后写，以及同一 Specs Root 下双终态事项关系事务。Harness 可以解析 Active Spec 与相关 Knowledge 的最小加载计划，按可配置预算选择全文或 Section Index，并用来源摘要检查 Knowledge 新鲜度。Knowledge Projection 支持确定性的 Plan、Apply 与 Verify。Evidence Bundle、Checkpoint、增量覆盖、Web Evidence、Design Contract 和 Event Catalog 分别提供窄而可测试的本地契约；Skill Eval Runner 动态发现 Case、复核脱敏 Trace、执行阻塞优先评分与版本比较；项目组件 Registry Validator 还可选检查 JavaScript/TypeScript 静态导出、消费者和兼容基线。本地 Git Source Control Adapter 与 Change Gate 继续负责不可变候选关联。当前仍不执行用户级安装，不动态加载插件，不覆盖未知目录或用户修改，也尚未包含真实 Browser、Design、Coverage、Tracking Adapter、Active/多事项/跨仓库关系事务和 npm 发布。因此它是可验证的参考底座，不是已经覆盖所有基建的通用产品。

## 快速试用

在仓库根目录运行：

```bash
npm test
npm run check
node packages/harness/bin/agent-foundation.mjs skill list
node packages/harness/bin/agent-foundation.mjs init plan --target /path/to/existing-project
node packages/harness/bin/agent-foundation.mjs init --target /path/to/project
node packages/harness/bin/agent-foundation.mjs doctor --target /path/to/project
node packages/harness/bin/agent-foundation.mjs specflow check --target /path/to/project
node packages/harness/bin/agent-foundation.mjs knowledge check --target /path/to/project
node packages/harness/bin/agent-foundation.mjs knowledge projection plan --target /path/to/project --projection specs/example/knowledge-projection.yaml --spec-id example --reviewed-at 2026-08-05 --paths src,packages
node packages/harness/bin/agent-foundation.mjs knowledge projection apply --target /path/to/project --projection specs/example/knowledge-projection.yaml --spec-id example --reviewed-at 2026-08-05 --paths src,packages
node packages/harness/bin/agent-foundation.mjs knowledge projection verify --target /path/to/project --projection specs/example/knowledge-projection.yaml --spec-id example --reviewed-at 2026-08-05 --paths src,packages
node packages/harness/bin/agent-foundation.mjs context resolve --target /path/to/project --task-type "新增或修改 Skill" --paths skills/example
node packages/harness/bin/agent-foundation.mjs source-control inspect --target /path/to/project --base <base-ref> --source HEAD --include src,packages --exclude specs/example-work
node packages/harness/bin/agent-foundation.mjs change gate check --target /path/to/project --base <base-ref> --source <immutable-source-ref> --spec-id example --phase work
node packages/harness/bin/agent-foundation.mjs change gate check --target /path/to/project --base <base-ref> --source <immutable-source-ref> --exemption docs-only --phase delivery
node packages/harness/bin/agent-foundation.mjs skill plan --name specflow --target /path/to/project
node packages/harness/bin/agent-foundation.mjs skill install --name specflow --target /path/to/project
node packages/harness/bin/agent-foundation.mjs distribution plan --target /path/to/project
node packages/harness/bin/agent-foundation.mjs distribution apply --target /path/to/project
node packages/harness/bin/agent-foundation.mjs distribution verify --target /path/to/project
node packages/harness/bin/agent-foundation.mjs component check --target /path/to/project
node packages/harness/bin/agent-foundation.mjs eval run --skill specflow --target /path/to/foundation-repo
node packages/harness/bin/agent-foundation.mjs evidence check --file /path/to/evidence-bundle.json
node packages/harness/bin/agent-foundation.mjs checkpoint check --file /path/to/checkpoint.json
node packages/harness/bin/agent-foundation.mjs checkpoint resume --file /path/to/checkpoint.json --input-digest sha256:<digest>
node packages/harness/bin/agent-foundation.mjs change-validation check --file /path/to/change-validation.json
node packages/harness/bin/agent-foundation.mjs web-evidence summarize --file /path/to/web-evidence.json
node packages/harness/bin/agent-foundation.mjs prefetch check --file /path/to/prefetch-candidate.json
node packages/harness/bin/agent-foundation.mjs design check --file /path/to/design-contract.json
node packages/harness/bin/agent-foundation.mjs tracking check --file /path/to/event-catalog.json
```

`init plan`、`knowledge check`、`knowledge projection plan/verify`、`context resolve`、`skill list`、`skill check` 和 `skill plan` 是只读操作。已有项目应先执行 `init plan`，审阅将新增、复用或阻断的文件；存在同路径不同内容时，Harness 不自动合并。`init`、`knowledge projection apply`、`skill install` 和 `skill update` 会写入明确指定的项目目录。所有命令输出结构化 JSON，冲突时停止并保留既有内容。

Context 预算在 `agent-foundation.json` 的 `context` 中配置。单事项或总预算超限时，Resolver 不把该事项的核心 Markdown 加入全文 `loadPlan`，而是返回 H1–H3 行区间、字节数、AC/FR 等规则编号位置和清单完成度；标题与位置来自原文，不生成摘要，也不建立第二份事实源。`maxRuleFileBytes` 限制单个规则文件体量；Resolver 会按请求路径自动加入根级与沿途 `AGENTS.md`，Doctor 阻断失效入口、重复路由值、同路径纳入/排除矛盾和超预算规则，并把 Code Entry Map 已登记父子规则中的精确重复报告为警告。自然语言语义冲突仍由 Agent 或人工判断。

`source-control inspect` 解析 Base/Source Commit，在临时 Git 对象库中计算无冲突 Merge Candidate，并对范围内按路径排序的最终对象 ID 生成稳定摘要；变更状态作为复核证据返回，但不参与摘要，避免 Rename 启发式差异改变同一最终快照。范围内存在未提交或未跟踪改动、候选冲突或版本无法解析时直接阻断；命令不执行 Stage、Commit、Push，也不修改工作树、Index 或引用。

`change gate check` 始终使用完整 Merge Candidate 判断事项关联，不允许用 Include/Exclude 隐藏变更。候选必须二选一：显式关联一个 Scope 覆盖完整的 Active Spec，或使用 `docs-only`、`tests-only`、`styles-only`、`assets-only`、`generated-only` 之一，并由全部候选路径机械证明。`--phase delivery` 还会校验 Archived Meta、Receipt、Lifecycle 摘要链以及 Receipt 中的变更摘要是否仍对应最终候选。门禁不创建 Commit、不推断终态授权，也不代表外部 PR/MR、部署或发布成功；完整契约见[事项—变更关联与交付门禁](skills/specflow/references/change-gate.md)。

Knowledge Projection 文件只记录 `create`、`update`、`still-valid`、`supersede`、`retire` 或明确的 `impact: none` 判断。正文和 Registry 条目必须先由人或 Agent 在项目内准备；`plan` 会按 `--paths` 与 Registry Scope 反向检查遗漏，阻断仍被 Code Entry Map 引用的退役知识和无效取代关系；`apply` 仅在排他锁内原子改写 Registry、刷新权威来源摘要并记录 `last_projection` 指纹；`verify` 可独立检查结果是否漂移。省略 `--paths` 时结果会保留“覆盖范围未提供”警告，不能把它解释为已完成代码反向命中。

`npm run check` 对当前仓库执行只读检查，包括目录、JSON/JSON Schema、仓库采用的 YAML 子集、Markdown 本地链接、Skill/Eval 结构和高置信秘密格式。发布前还可以把组织专有词逐行保存在仓库外，再运行：

```bash
node packages/harness/bin/agent-foundation.mjs repository check --deny-file /path/to/private-terms.txt
node packages/harness/bin/agent-foundation.mjs repository check --deny-file /path/to/private-terms.txt --git-scope all
```

默认命令扫描当前工作区；正式发布候选应增加 `--git-scope all`，覆盖暂存区、分支与 Tag 可达历史、Reflog 和不可达对象。检查结果只返回词条或路径摘要，不回显私有词和命中内容。启发式扫描无命中不能替代权属、保密义务和人工内容复核。

## 仓库自身治理

本仓库使用自己提供的 Specflow 和 AI 友好仓库方法管理自身演进：

- [`specs/`](specs/) 保存当前研发事项的范围、方案、任务、状态和验证证据；
- [`knowledge/`](knowledge/) 保存跨任务稳定的仓库定位、设计原因、契约和刷新条件；
- [`AGENTS.md`](AGENTS.md) 定义 Agent 如何发现 Active Spec、相关 Knowledge 和工作边界；
- 不为历史提交伪造 SDD 产物，从正式采用时点开始保留真实可追溯记录；
- 终态、提交、推送、PR/MR 和发布分别需要符合对应授权。

当前 Active 事项是[将仓库升级为可快速接入的 Agent 工程治理骨架](specs/2026-08-05-self-hosted-agent-governance/spec.md)。Starter、最小 Harness、项目级开放 Host、可注入 Adapter Registry、单事项归档生命周期、双终态事项关系事务、Context/Knowledge 检查、Knowledge Projection Registry 更新器、本地 Change Gate、仓库级只读检查和 CI 示例已经落地；Active/多事项/跨仓库关系事务、知识正文的语义生成及正式公开发布前的人工权属复核仍未完成。

## 已落地内容

- [Evidence 与 Claim 框架](frameworks/evidence/README.md)
- [长任务 Checkpoint 框架](frameworks/checkpoint/README.md)
- [增量覆盖与浏览器验证框架](frameworks/change-validation/README.md)
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
- [`safe-change` Skill](skills/safe-change/SKILL.md)
- [Design-to-Code 框架](frameworks/design-to-code/README.md)
- [`design-to-code` Skill](skills/design-to-code/SKILL.md)
- [埋点治理框架](frameworks/tracking-governance/README.md)
- [`tracking-governance` Skill](skills/tracking-governance/SKILL.md)
- [项目组件治理与维护框架](frameworks/project-component-governance/README.md)
- [`project-component-governance` Skill](skills/project-component-governance/SKILL.md)
- [项目组件治理模板](templates/project-component-governance/README.md)
- [项目组件治理接入 Blueprint](blueprints/project-component-governance/README.md)

## 文档入口

- [迁移总览](docs/00-迁移总览.md)
- [能力地图](docs/01-能力地图.md)
- [目标仓库设计](docs/02-目标仓库设计.md)
- [公开化与权属规范](docs/03-公开化与权属规范.md)
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
