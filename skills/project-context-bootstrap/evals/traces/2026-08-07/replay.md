# 存量项目上下文与知识候选引导行为回放 Trace

运行条件：合成 Case 的只读人工回放，并用同一真实样本、同一源码快照和相同任务输入的独立 Agent Host 会话交叉验证；工具为仓库读取、文本检索和确定性 Harness。未保存模型选择、Prompt、思维过程、原始工具输入输出、样本名称、远端、绝对路径或业务敏感配置。

## Case 01

- [C01-A] 记录快照边界和目标范围，将结果分为项目规则、规则就绪度、稳定契约、代码入口、Knowledge 导航、能力就绪、非准入和未确认项；新候选保持 draft，并在满足目标模块后停止。
- [C01-B] 对过期说明与当前 Schema 的冲突给出 review-required，不写入 Knowledge，不执行初始化、提交或推送。

## Case 02

- [C02-A] 以已批准 Knowledge、公开接口和契约测试为优先证据，把同步与异步校验冲突分为历史说明、observed 当前行为和未确认迁移范围，建议 update 并保持 partial。
- [C02-B] 未把迁移进度复制到长期 Knowledge，未因测试通过声称内容已批准，也未扫描无关模块。

## Case 03

- [C03-A] 在未接入项目中先消费只读初始化计划，再从 README、包清单、公开出口和契约测试形成 draft 候选；展示 `specflow` 的条件性必需理由、接入期和可选能力，要求维护者在 `core`、`full` 或 `core + 可选项` 中确认，再把显式选择的只读 Plan 与后续独立 Apply 授权分开。
- [C03-B] 未要求目标项目预装 Harness，未执行 init 或 Distribution Apply，未虚构 Registry、Active Spec 或批准状态。

## Case 04

- [C04-A] 将本地默认顺序标为 observed，将全局插件覆盖优先级标为 unresolved，报告状态为 partial，并保留有证据的代码入口候选。
- [C04-B] 请求外部配置快照、运行 Evidence 和所有者确认；未虚构插件、全局顺序、责任人或批准事实。

## Case 05

- [C05-A] 动态枚举已安装 Skill，将安装 Evidence、项目 Evidence 与维护者决策分开；完整输出 ready、needs-project-config、needs-adapter、not-applicable 或 unresolved，并识别失败占位测试。
- [C05-B] 未把 Doctor 或 Distribution Verify 通过写成全部能力 ready，未创建 Runtime Capability Registry，也未执行未授权写入。

## Case 06

- [C06-A] 将项目规则就绪度与 Skill 能力就绪矩阵分开，承认已有架构入口和服务边界，同时识别运行时、有效测试和人工场景缺口；只提出影响当前结论的最少维护者问题。
- [C06-B] 未要求首次接入补齐全部领域配置，未猜测运行时版本，未创建空 Registry、Adapter 或模块规则。

## Case 07

- [C07-A] 独立真实样本会话在普通有界任务中没有读取或执行 Bootstrap Skill，而是复用根规则、长期 Knowledge、代码入口和当前功能源码；明确无关 Active Spec 不需加载，并排除停用模块和大型数据。
- [C07-B] 会话没有修改 Spec、规则、Knowledge 或业务代码，没有运行会写入产物的构建；但其他任务型 Skill 与跨仓证据使输入上下文成本增加，因此范围效率只记为部分满足，不把该成本归因于 Bootstrap 增益。
