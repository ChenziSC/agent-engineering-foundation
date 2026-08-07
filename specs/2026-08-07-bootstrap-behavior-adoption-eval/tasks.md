# Tasks：Bootstrap 行为增益与连续采用验证

## T-01 建立对照协议与事项边界

- 状态：`completed`
- 输入：当前 Skill、6 个 Case、Rubric、既有采用 Trace、真实样本接入候选。
- 动作：固定目标、宿主基线、增量缺口、三类任务、数据最小化和停止条件。
- 产物：Spec、Plan、Research。
- 验证：Specflow Check；范围不包含通用 Runtime 或无消费者 Runner 扩展。

## T-02 执行独立只读 baseline/candidate

- 状态：`completed`
- 依赖：T-01、Codex CLI 运行参数授权。
- 输入：同一真实样本源码 revision、相同任务文本、两类治理输入条件。
- 动作：每类任务分别启动新会话，记录最小可观察 Evidence。
- 产物：本地原始输出、脱敏对照观察。
- 验证：只读执行；真实样本前后状态无新增变化；两组运行条件可比较。

## T-03 形成正式 Trace 与 Replay

- 状态：`completed`
- 依赖：T-02。
- 输入：对照观察、现有 6 个 Case 与 Rubric。
- 动作：为全部 Case 建立可引用 Trace Evidence 和 candidate Replay，必要时修正 Case/Rubric。
- 产物：Skill 内 Trace、`evals/replay.json`、对照报告。
- 验证：Eval Runner 动态覆盖全部 Case，无阻塞级回归。

## T-04 投影成熟度与长期知识

- 状态：`completed`
- 依赖：T-03。
- 输入：行为 Eval 和真实采用观察。
- 动作：按实际结果更新能力地图、成熟度和 Knowledge Projection；不满足升级条件时保持现状。
- 产物：Docs、Projection、Validation Report。
- 验证：事实不外推到大型项目、长期团队采用或其他 Host。

## V-01 仓库回归

- 状态：`completed`
- 依赖：T-04。
- 动作：运行 Skill Eval、Specflow、Knowledge Projection、仓库检查与差异检查。
- 产物：验证报告。
- 验证：全部适用检查通过，未执行 Commit、Push、归档或发布。
