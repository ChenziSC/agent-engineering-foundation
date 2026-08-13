# Spec：受管 Skill 触发时自动更新

## 基本信息

- 事项 ID：`2026-08-12-managed-skill-auto-update`
- 创建日期：`2026-08-12`
- 事项状态、关系和影响范围以事项目录内的 `meta.yaml` 为唯一事实来源。

## 输入来源

| 类型 | 引用或摘要 | 版本/日期 | 适用范围 |
| --- | --- | --- | --- |
| 用户输入 | 现存 Skill 触发时自动更新；未来本仓新建 Skill 同样具备；生产者模式不更新 | 2026-08-12 | 本仓公开受管 Skill 与项目级 Distribution |

## 背景与目标

当前 `0.2.0` 已提供精确版本驱动的 `upgrade plan/apply`，但仍需维护者主动选择版本并执行。目标是在不复制九份更新实现、不引入遥测或反馈采集的前提下，让消费项目中的受管 Skill 在触发时运行统一 Update Guard；Guard 以有界频率检查 npm 稳定版本，命中新版本后复用现有冲突保护和写后 Verify，并通知 Agent 重读当前 Skill。Foundation 生产者源码通过严格 Source Link 工作，必须跳过远端检查和自更新。

## 非目标

- 不实现用量遥测、反馈采集或消费项目身份上报；
- 不更新用户级 Host Skill、Plugin、Marketplace 或未受 Distribution 管理的目录；
- 不自动覆盖用户修改、未知文件、Symlink 或降级冲突；
- 不建设常驻进程、通用 Hook Runtime、依赖求解或自动发布；
- 不保证已经散落在外部项目且从未升级的历史副本凭空获得此能力。

## 用户或调用场景

1. 消费项目触发任一 Foundation 受管 Skill，先运行本地 Guard；TTL 内快速继续，过期时检查 npm，必要时升级并重读 Skill。
2. Foundation 生产者仓触发源码 Skill，Guard 识别严格 Source Link 后立即跳过，不访问 Registry、不修改源码。
3. 维护者以后新增 Skill；Repository Check 在该 Skill 缺少统一更新声明时失败，进入 Distribution 后复用同一 Guard。
4. Registry 不可用或升级发生冲突；Guard 保留旧 Skill，输出简短退化状态，领域流程仍可使用旧版继续。

## 输出与行为契约

- Update Guard 只输出紧凑结构：`producer-skipped`、`cached`、`current`、`updated` 或 `degraded`。
- 默认检查间隔固定为 24 小时；TTL 内不联网。
- 仅消费项目且安装状态有效时查询固定公共 npm Registry 的稳定 `latest`。
- 发现更高版本时使用精确版本 CLI 执行既有 `upgrade apply`；成功后返回 `reloadSkill: true`。
- 网络、Registry、npm 执行或升级冲突不覆盖旧内容，返回 `degraded` 与非敏感原因。
- 所有本仓 Skill 的 `SKILL.md` 使用同一短前置声明；更新实现只存在一份。

## 完成条件

- [x] **AC-001** 生产者严格 Source Link 场景不联网、不写状态，返回 `producer-skipped`。
- [x] **AC-002** 消费者 TTL 命中只读取本地状态；过期时查询 npm，版本相同返回 `current` 并原子刷新检查时间。
- [x] **AC-003** 消费者发现更高稳定版本时以精确版本复用 `upgrade apply`，成功返回 `updated` 与 `reloadSkill: true`。
- [x] **AC-004** 网络错误、无效 Registry 数据、npm 失败和 Upgrade 冲突保留旧内容并返回 `degraded`，不记录 Prompt、工具输入输出或个人标识。
- [x] **AC-005** Distribution 为消费者安装和验证唯一共享 Guard；生产者 Source Link 不安装 Guard 副本。
- [x] **AC-006** 现存全部本仓 Skill 包含统一触发前置声明，Repository Check 对未来 Skill 遗漏失败关闭。
- [x] **AC-007** 文档明确生产者/消费者边界、24 小时 TTL、耗时、失败策略与实际更新后重读语义。
- [x] **AC-008** 聚焦测试、全量测试、规模回归、Repository、Doctor、Distribution、Knowledge 与 Specflow 检查通过。

## 约束

- 技术约束：Guard 为零运行时依赖的单文件 Node.js 程序，使用固定 npmjs.org Registry 和原子状态写入。
- 兼容约束：复用现有安装状态、Profile、已有受管集合和 Upgrade 安全语义；不改变首次安装选择。
- 权限与安全约束：自动更新只对安装时已经授权纳管的副本生效；不扩大到用户级目录或源码生产者。
- 数据与隐私约束：只持久化检查时间、观察到的公开版本和状态码，不记录项目名、路径、Prompt、Token 或业务内容。

## 风险、假设与待确认项

| 类型 | 内容 | 影响 | 处理方式 | 状态 |
| --- | --- | --- | --- | --- |
| Risk | Skill 正文已加载后才执行更新 | 当前执行可能继续使用旧指令 | 更新成功必须重读当前 `SKILL.md`；项目规则要求在领域步骤前执行 | mitigated |
| Risk | 自动执行新包扩大供应链暴露 | npm 包被篡改会影响消费项目 | 固定官方 Registry、只选择稳定 SemVer、npm integrity、精确版本执行并保留现有冲突保护 | mitigated |
| Assumption | 24 小时延迟可接受 | 新版最多延迟一天被消费 | 固定 TTL，避免每次触发承担网络延迟 | accepted |

## Section Index

| 章节 | 说明 | 何时需要读取 |
| --- | --- | --- |
| 输出与行为契约 | 自动更新状态与失败语义 | 实现和评审 Guard 时 |
| 完成条件 | 可验证验收边界 | 规划、测试和验收时 |
