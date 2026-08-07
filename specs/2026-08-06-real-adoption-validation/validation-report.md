# Validation Report：真实采用验证证据闭环

## 当前状态

实现与双仓验证已经完成。完整底座现在默认通过 Distribution 安装全部公开 Skill，但安装成功不表示项目配置、Adapter 或外部基建已经就绪。事项仍为 `in-progress`，等待维护者明确授权终态迁移；本报告不表示事项已归档，也不构成提交或推送授权。

## 完成条件映射

| 完成条件 | Evidence | 结果 |
| --- | --- | --- |
| AC-001 | 定向扫描未发现样本仓名称、账号、远端链接或绝对路径；Repository Check 敏感扫描通过 | pass |
| AC-002 | 新增 Harness 合成采用测试，连续验证 Starter、Knowledge、受管 Skill、Doctor 与 Context Resolve | pass |
| AC-003 | Bootstrap 工作流 Reference 独立说明 Host 发现与 Harness 命令可用性 | pass |
| AC-004 | 能力地图、问题图谱和成熟度说明保持 `usable`，只收窄剩余缺口 | pass |
| AC-005 | Skill Check、Distribution Plan/Apply/Verify、Specflow、Knowledge、Repository Check 和 82 项测试 | pass |
| AC-006 | 样本前端仓只修改根导航、Knowledge README 与受管 Skill；业务源码无变化；后端样本仓状态干净 | pass |
| AC-007 | Bootstrap 要求 Registry 非空或建议新增 Knowledge 时生成项目化 README 导航候选，并禁止其成为第二机器事实源 | pass |
| AC-008 | Starter 说明接入后的项目化导航要求；空 Registry 不制造虚假项目条目 | pass |
| AC-009 | 样本 README 可人工导航 2 份已批准 Knowledge 与 4 类常见任务，未复制摘要、完整 Scope、Resolver 输出或配置值 | pass |
| AC-010 | 默认接入说明使用完整 Distribution；合成回归动态比较真实 Skill 目录与 Manifest；样本仓 9/9 Apply/Verify、再次 Plan 全部为 `noop` | pass |
| AC-011 | Bootstrap 增加五态能力就绪矩阵、自动取证与最少提问规则；样本接入 Spec 动态覆盖完整安装集合，维护者决策后收敛为 7 项 `ready`、2 项 `not-applicable` | pass |

## 执行结果

- `project-context-bootstrap` Skill Check：通过；当前内容摘要与 Distribution Manifest 一致；
- `project-context-bootstrap` 受管副本刷新后，样本仓 Doctor 能复核安装状态与内容摘要；
- 完整 Distribution 真实应用：样本仓新增 8 个、更新 1 个受管 Skill；Verify 9/9 通过，再次 Plan 全部为 `noop`；
- 新增端到端采用回归：通过；第一次运行准确暴露了不存在的默认排除路径，补齐合成夹具后 Doctor 为 `pass`；回归同时确认 Starter 的 README 项目化提示、根导航规则，以及真实 Skill 目录与 Manifest 全集一致；
- `npm test`：82/82 通过；
- Repository Check：通过，包含 Markdown 链接、YAML 子集、Skill、Distribution、Specflow、Knowledge 与敏感扫描；
- 基础仓 Specflow Check、Knowledge Check：通过；
- 样本仓 Doctor 与 Knowledge Check：通过，识别 2 个 Knowledge 条目、4 个任务入口、1 个规则文件和 9 个受管 Skill；
- 样本仓 Context Resolve：通过；接口与环境连接任务确定性加载根规则、前端架构和服务边界两份 Knowledge，并保留默认排除路径；
- 样本仓 Knowledge README 提供项目总览、正文入口、常见任务路由与事实来源边界；Registry、Code Entry Map 和 Resolver 继续分别承担机器状态、确定性路由与本次选择结果；
- 安装后能力就绪评估：样本仓当前接入 Spec 覆盖 9 个 Skill；维护者完成项目级决策后收敛为 7 个 `ready`、2 个 `not-applicable`，没有 `needs-project-config`、`needs-adapter` 或 `unresolved`；没有把安装成功等同于能力就绪，也没有把任务特有输入固化为项目配置；
- 样本仓首次真实 Specflow 事项：Meta、Spec、Plan、Tasks、Research 与 Validation Report 完整，Specflow Check 与 Context Resolve 均通过；
- 临时真实路径上的 Distribution Plan/Apply/Verify：通过；未经 `realpath` 规范化的 macOS `/var` 临时路径被 Symlink 门禁正确拒绝；
- 基础仓定向标识扫描与双仓 `git diff --check`：通过；样本后端仓保持无本地变化；
- Skill Creator `quick_validate.py`：未执行成功，系统 Python 缺少 PyYAML；本仓零依赖 Skill Check、YAML 子集、链接、Distribution 与 Repository Check 已覆盖本次结构验证。

## 成熟度结论

`project-context-bootstrap` 继续标记为 `usable`。本次证据证明一次真实采用路径与一条可重复的确定性合成闭环，但没有对当前五个行为 Case 进行独立正式 Replay，不能据此提升为 `validated`。

## 尚未证明

- 当前职责版本五个行为 Case 的独立正式 Replay；
- 除本次已观察 Host 外的原生发现与安装行为；
- 样本仓新装 8 个 Skill 在未来真实任务中的逐项触发；当前标为 `not-applicable` 的能力重新启用时，仍需独立验证项目配置、工具和外部 Adapter；
- 真实采用项目的长期治理收益和维护成本。
