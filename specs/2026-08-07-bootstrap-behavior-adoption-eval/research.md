# Research：Bootstrap 行为增益与连续采用验证

## 当前证据

- `project-context-bootstrap` 已有 6 个 Case 和 100 分 Rubric，但没有 `evals/replay.json`，因此尚未形成 Runner 可封存的正式行为报告。
- 既有真实采用 Trace 证明一次接入链路、项目级 Skill 发现和仓外 Harness 命令可用性边界，但明确把当前职责版本正式 Replay和长期采用收益列为未解决。
- 真实样本当前接入候选已经包含根规则、两条长期 Knowledge、代码入口索引、完整 Skill 分发和一个 Active 验证事项；业务源码基于默认分支同一 revision，治理候选尚未提交。
- 真实样本的测试命令是固定失败占位，Node 版本和 Lockfile 缺失；这些事实适合验证规则就绪审计是否能区分“治理结构存在”与“项目可开发基线完整”。

## 方案选择

### 采用

- 三类任务各自使用新的只读 Agent 会话；
- baseline/candidate 使用同一源码 revision和相同任务文本；
- 现有 Runner 只封存 Skill candidate Replay；
- baseline/candidate 增益由脱敏对照报告按相同 Rubric 逐项复核。

### 不采用

- 不把同一会话中的前后回答当作独立对照；
- 不把宿主原生 baseline 伪装成某个 Skill 版本交给 `eval compare`；
- 不为了一个消费者修改通用 Eval Schema；
- 不保存原始 Prompt、完整工具日志、思维过程或样本敏感内容；
- 不把首批三类任务称为长期采用验证。

## 待执行事实

- Codex CLI 版本和可用性；
- 用户选择的只读 Agent Host 运行条件；
- 三类任务的实际读取范围、停止行为、Evidence 分层和阻塞项；
- candidate 是否相对 baseline 产生稳定、可解释的增益。
