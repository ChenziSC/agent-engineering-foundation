# Knowledge：仓库定位与产物分层

## 注册信息

- ID：`repository-positioning`
- 状态、适用范围、复核时间、权威来源和刷新条件以 [Knowledge Registry](registry.yaml) 中的同 ID 条目为准。

## 摘要

本仓库为不同 Harness Agent 提供可复用的工程治理规范、领域 Skill、确定性 Validator 和采用骨架。它补充宿主缺少的项目语义与可复核门禁，不建设平行的通用 Agent Runtime。

## 稳定事实

- 仓库面向其他公司、团队和个人项目，不面向单一业务系统；
- 核心治理在没有私有平台时仍应可使用；
- Framework 和 Knowledge 解释问题、原因、边界与不变量；
- Docs 面向读者提供能力导航、目标结构、成熟度投影、发布检查和来源声明，不重复 Framework、Skill 或 Knowledge 的完整正文；
- Skill、Starter、Template 和 Blueprint 支持项目采用；
- Harness 和 Validator 负责仓库专有的确定性检查，Adapter 只隔离真实 Provider、语言工具链或无法由开放内容消除的宿主差异；
- 当前最小参考实现覆盖 Starter、带版本来源且可独立打包的 CLI、Specflow、Knowledge、可解释的 Context 路由、项目级兼容 Skill 运行时分发、Bootstrap/Continuous/Delivery 三级采用模板、确定性契约检查和仓库静态检查；
- Context、Specflow 与 Knowledge 的规模边界使用完全合成的 small/mature/large 临时项目回归，最高覆盖 1000 个历史 Spec、3 个 Active Spec、200 个 Knowledge、500 条 Route 和 6 层祖先规则；该回归证明所测容量、预算降级和尾部错误检测，不证明真实大型团队采用效果；
- 适合程序判定的 Meta、Evidence/Claim、Checkpoint、增量覆盖、Web Evidence、Design Contract、Event Catalog、Skill Eval 和项目组件 Registry 已提供零依赖参考实现，语义真实性、抽象价值和发布授权仍由 Agent 或人工判断；
- 安全变更、Design-to-Code 和埋点治理以独立 Skill 编排 Agent 判断；真实 Coverage、Browser、Design、SDK 和数据平台通过采用方 Adapter 接入；
- 项目自有基建通过 Integration Manifest 和显式 Registry 接入；公共核心不动态加载私有代码；
- 组织专有词表保存在公开 Git 之外，由发布检查时显式注入且不在结果中回显；
- 领域 Skill 可以选装，不应成为核心 Harness 的强制依赖；
- Skill 的原生安装、更新、权限、Sandbox、Hook、MCP 和会话行为由目标 Host 负责；本仓兼容 Distribution 只把 Manifest 声明的运行时文件写入项目级受管目录，Manifest 与 Verify 只证明发布白名单、内容摘要和安装一致性，不证明项目配置、外部 Adapter 或业务行为就绪。
- 新能力必须证明相对宿主基线的增量价值、直接消费者和验证方式；通用代码探索、计划、测试和权限遵循不能单独包装成仓库能力。

## 设计原因

只有文档时，使用方仍需自己发明目录、安装、检查和维护流程；只有工具时，维护者无法理解为什么存在某项门禁，也难以在环境变化后正确演进。因此仓库需要同时保留：

```text
为什么需要
→ Framework / Knowledge

如何发现与判断当前状态
→ README / Docs

如何采用
→ Starter / Preset / Skill / Template / Blueprint

如何确定执行
→ Harness / Validator / Adapter / Test
```

## 核心契约

| 契约 | 提供方 | 消费方 | 变化影响 |
| --- | --- | --- | --- |
| 仓库上下文与规则 | AGENTS、Knowledge | Agent、维护者 | 影响任务路由和安全边界 |
| 当前交付状态 | Specflow Meta 与产物 | Agent、CI、维护者 | 影响执行、恢复和归档 |
| Skill 内容 | Skill 源目录 | Harness、Agent Host | 影响发现、安装和行为 |
| Foundation 与 Skill 发布版本 | 根 Package 版本、Distribution 安装状态、Manifest 与源目录摘要 | 维护者、采用项目、Host 原生发布流程、兼容 Harness | 影响工具来源、发布白名单和内容可复核版本；不代表已经存在正式发布渠道 |
| Skill 外部依赖 | Skill 自包含脚本或 Host 原生依赖声明 | Agent Host、Skill | 影响安装后是否可执行，不由本仓发明通用协商协议 |
| 行为评估证据 | Case、Rubric、脱敏 Trace 与 Replay | Runner、评审者 | 影响成熟度和回归判断，不选择调用模型 |
| 确定性检查 | Harness、Validator | 项目、CI | 影响接入与交付门禁 |
| 领域确定性契约 | Checkpoint、Change Validation、Web Evidence、Design Contract、Event Catalog、Component Registry | Skill、Agent、采用方 Adapter | 约束结构与证据边界，不替代领域语义判断 |
| 外部集成 | Adapter | Harness、Skill | 影响可选平台能力，不改变核心语义 |
| 仓库静态检查 | Harness、仓外私有词表 | 维护者、CI | 提供可重复基线，但不替代法律和人工复核 |

## 常见失败

| 失败模式 | 原因 | 正确做法 |
| --- | --- | --- |
| 只有大量 Markdown，没有快速接入路径 | 把设计完成误当成交付完成 | 为核心治理提供 Starter 和最小 Harness |
| 所有领域 Skill 默认安装 | 没有区分核心与可选能力 | 通过 Preset 和 Manifest 选择能力 |
| 核心依赖某个公司平台 | Adapter 边界缺失 | 核心只认识公开契约和 Provider 接口 |
| 工具存在但没有设计原因 | 只沉淀 HOW | Framework 和 Knowledge 同步说明 WHY 与边界 |
| Docs 为每项能力复制完整契约 | 把读者导航变成第二事实来源 | Docs 直接链接 Framework、Skill、Template 和 Blueprint |
| 文档把未来能力写成已落地 | 成熟度和证据脱节 | 用 Spec 和 Validation Report 区分状态 |
| 把宿主基础行为包装成 Skill | 没有新的领域语义、确定性或外部接入 | 复用 Host 原生能力，只保留增量契约与 Eval |
| 为假设中的多宿主差异建 Runtime | 先设计抽象、后寻找消费者 | 先用开放 Skill 内容兼容，真实差异才加薄 Adapter |
