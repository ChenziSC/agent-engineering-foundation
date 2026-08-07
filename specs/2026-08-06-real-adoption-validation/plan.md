# Plan：真实采用验证证据闭环

## 实施路径

1. 将真实验证结果压缩为只含阶段、状态、边界和限制的公开记录；
2. 在现有 Harness 测试中增加一个合成采用项目，串联已有公开 API；
3. 在 Bootstrap 工作流 Reference 中拆分 Host 发现与 Harness 命令验证；
4. 更新三个成熟度投影，只收窄证据缺口，不提升为 `validated`；
5. 刷新 Distribution 内容摘要并运行完整回归。
6. 将真实采用复核发现的 README 导航缺口纳入 Bootstrap 输出，并在样本项目前端仓验证简明投影。
7. 复用现有 Distribution Plan/Apply/Verify，把完整公开 Skill 集合作为默认接入步骤，并在合成项目与真实样本中动态验证。
8. 在 Bootstrap 报告中增加动态能力就绪矩阵；真实样本把评估保存到当前接入 Spec，只向维护者暴露合并后的未决问题。

## 关键决策

- 真实采用记录不是当前五个行为 Case 的正式 Replay，不能替代独立评分；
- 端到端测试只验证确定性采用链路，不验证 Agent 对候选内容的语义质量；
- Host 发现使用真实新会话结果作为观察，Harness 行为使用确定性命令和合成回归作为证据；
- README 只提供项目总览、正文链接和常见路由示例；条目状态、完整 Scope、摘要和确定性选择仍以 Registry、Code Entry Map 与 Resolver 为准；
- 样本项目不成为本仓测试依赖，所有自动化输入重新构造。
- 完整底座默认安装 Manifest 中全部公开 Skill；具体 Skill 仍按触发条件调用，并在调用时检查项目配置与 Adapter 前置条件。
- 就绪评估由 Agent 基于 Skill 契约和项目 Evidence 判断，不把自然语言适用性硬编码进 Distribution CLI；首版不新增 Capability Registry。

## 变更控制

- 不新增生产依赖；
- 不修改 Harness 公共 API；
- 不让 `init` 隐式执行 Distribution Apply；结构初始化与受管 Skill 写入继续分别计划、授权和验证；
- 不在安装阶段交互式询问全部领域问题；先自动取证，再按共享决策合并问题，避免每个 Skill 重复询问；
- 不把 Foundation 专用 `repository check` 伪装成普通采用项目门禁；采用项目使用 Doctor、Knowledge、Specflow 与适用 Validator；
- 任何成熟度提升必须有当前职责版本的独立正式 Replay，不由本事项自动完成。
