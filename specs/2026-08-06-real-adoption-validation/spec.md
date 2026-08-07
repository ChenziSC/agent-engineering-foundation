# Spec：补齐真实项目采用与宿主接入验证证据

## 背景

`project-context-bootstrap` 已有四个合成行为案例，Harness 也分别覆盖初始化、Skill 安装、Doctor、Knowledge 和 Context Resolver。然而这些证据没有证明一条采用流程能够把上述能力连续串联，也没有清楚区分“Agent Host 原生发现项目 Skill”和“采用项目可直接调用 Harness CLI”。

真实采用后的复核还发现：Knowledge 正文、Registry 和 Code Entry Map 已经存在且可被 Resolver 消费，但目录 README 仍是未项目化的 Starter 文案。机器路由成立不等于人和新 Agent 能快速浏览知识全貌。

第二次复核发现：Distribution Manifest 已经能够一次 Plan、Apply、Verify 全部公开 Skill，但项目接入主路径与真实样本只安装了 Bootstrap Skill。单项安装可以验证 Host 发现，却不能证明目标项目获得了完整治理能力目录。

完整安装后的进一步复核发现：Distribution 只证明内容与受管记录一致，不会询问研发约定，也不能判断各 Skill 是否适用、缺少项目配置还是依赖外部 Adapter。若没有安装后的语义评估，采用方仍容易把“已安装”误认为“已就绪”。

本次已在维护者自有存量项目中完成一次真实接入验证。样本项目只作为验证工具；其名称、路径、业务、配置、凭证和实现细节不进入本仓公开证据。

## 目标

- 保存一份最小、脱敏、带边界的真实采用验证记录；
- 通过合成项目回归串联 `init → Knowledge → Skill install → Doctor → context resolve`；
- 明确 Host 原生发现、项目级兼容安装和 Harness 命令可用性的职责边界；
- 明确项目化 Knowledge README 的最小导航职责，同时保持 Registry 和 Code Entry Map 为机器事实源；
- 将 Manifest 中全部公开 Skill 作为完整底座的默认项目级安装集合，同时区分“已安装可发现”和“项目或外部基建已就绪”；
- 让 Bootstrap 动态评估完整 Skill 集合的适用性与就绪状态，优先自动取证，只向维护者询问仓库无法证明且会影响采用决策的信息；
- 用新增证据校准成熟度，不从单次采用外推其他 Host 或长期行为稳定性。

## 非目标

- 不修改、构建、发布或安全整改样本项目的业务实现；只允许更新采用验证所需的 Knowledge README、根规则、接入 Spec 与受管 Skill 集合；
- 不把 Harness CLI 打包进目标项目，也不硬编码同级仓库绝对路径；
- 不建设用户级 Skill 安装器、Plugin Runtime、权限、Hook 或 Capability Registry；
- 不因一次真实采用将 Skill 直接提升为 `validated`；
- 不保存原始 Prompt、完整命令日志、会话标识或敏感配置。

## 能力准入

| 项目 | 结论 |
| --- | --- |
| 目标问题 | 单项测试通过仍可能掩盖采用顺序、受管安装记录、Host 发现路径与 Context 加载计划之间的断点 |
| 宿主基线 | Agent Host 负责发现项目规则和 `.agents/skills` 内容；宿主不会自动实现本仓的 Manifest、Knowledge、Doctor 或 Context Resolver 语义 |
| 增量缺口 | 本仓提供项目级 Starter、受管 Skill 安装、Knowledge/入口契约、Doctor 与 Context Resolver 的连续可复核闭环，并要求人类导航可以发现已批准的项目知识与常见路由 |
| 产物与消费者 | 端到端测试由 CI 消费；脱敏采用记录由成熟度评审与维护者消费；边界说明由采用方和 Agent 消费 |
| 验证 | Harness 定向与全量测试、Skill Check、Specflow、Repository Check、Distribution Verify 和敏感扫描 |
| 删除条件 | 若组合回归被更窄且等价的公开端到端测试覆盖则合并测试；若 Host 原生能力覆盖相同项目治理语义且本仓无增量价值，则降级或删除兼容安装路径 |

## 完成条件

- **AC-001** 新增采用记录不包含样本仓名称、远端链接、绝对路径、业务标识、配置值、凭证、原始 Prompt 或完整工具日志；
- **AC-002** 合成回归连续验证初始化、项目 Knowledge、完整 Skill Distribution、受管记录、Doctor 和 Context Resolve；
- **AC-003** 文档明确 Host 原生发现成功不等于 Harness CLI 已进入采用项目的 `PATH`；
- **AC-004** 能力地图、问题图谱和成熟度说明承认一次真实采用，但仍把当前版本独立行为 Trace/Replay 和其他 Host 验证列为缺口；
- **AC-005** Skill 内容摘要、Distribution Manifest、Specflow、整仓检查和全量测试通过；
- **AC-006** 不修改样本项目业务实现，不修改后端样本仓，不新增 Runtime；前端样本仓只承载 Knowledge README 与受管 Skill 验证；
- **AC-007** 当 Registry 非空时，Bootstrap 输出包含简明的项目知识总览、正文链接和常见任务路由候选，并明确 README 不是机器事实源；
- **AC-008** Starter README 说明接入后的项目化要求，但不预填虚假项目条目或摘要；
- **AC-009** 样本项目 README 能在不复制 Digest、完整 Scope 或配置值的前提下，导航两条 Knowledge 与四类任务路由。
- **AC-010** 完整接入默认通过 Distribution Plan/Apply/Verify 安装 Manifest 的全部公开 Skill；测试动态读取真实集合，不写死名称或数量；安装通过不外推为项目配置、Adapter 或外部基建已经就绪。
- **AC-011** Bootstrap 对 Manifest Skill 全集输出 `ready`、`needs-project-config`、`needs-adapter`、`not-applicable` 或 `unresolved`，每项包含 Evidence、缺口和建议落点；先自动扫描再合并最少维护者问题，不因未发现配置直接判断 `not-applicable`。
