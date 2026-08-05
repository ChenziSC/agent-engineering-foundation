# Knowledge：仓库自举治理

## 元信息

- ID：`self-hosted-governance`
- 状态：`current`
- 适用范围：AGENTS、Specflow、Knowledge 和仓库演进工作流
- 最后复核：`2026-08-05`
- 权威来源：根 AGENTS、`specs/README.md` 和 `skills/specflow/SKILL.md`

## 摘要

仓库必须使用自己提供的 Specflow 和 Knowledge 治理自身变化。自举不是展示案例，而是用真实维护工作验证上下文恢复、状态所有权、归档、知识投影和检查机制是否可用。

## 稳定事实

- `specs/` 保存当前需求、方案、任务、验证和生命周期；
- `meta.yaml` 是事项状态、关系和影响范围的唯一事实来源；
- `knowledge/` 只保存长期稳定事实、设计原因、契约和刷新条件；
- 根 `AGENTS.md` 保存全仓不变量、目录地图和路由规则；
- 当前任务进度不能进入 Knowledge，长期设计原因不能只留在聊天；
- 不为历史批量伪造 Spec、Plan、Tasks、归档回执或验证证据；
- 普通提交、推送和 PR/MR 不构成归档授权。

## 设计原因

如果仓库自身不使用这些能力，模板和规则只能证明“看起来完整”，不能暴露真实维护中的上下文体量、重复事实源、状态漂移和归档循环依赖。真实自举能把治理能力变成持续回归场景。

## 变更分流

通常建立或继续 Spec：

- 新增或实质修改 Skill、Framework、Blueprint、Harness、Adapter 或 Validator；
- 改变仓库定位、公开契约、目录职责、生命周期、安全门禁或成熟度；
- 工作需要跨阶段、跨会话或多个目录协同。

通常不建立 Spec：

- 不改变语义的错别字、链接和格式修正；
- 机械生成文件刷新；
- 用户明确要求的单一低风险维护动作，且没有其他规则要求。

## 状态与知识流

```text
维护请求
→ 选择或建立 Active Spec
→ Spec / Plan / Tasks
→ 实现与 Validation
→ 明确授权后 Archive
→ 将长期稳定 WHY 投影到 Knowledge
```

归档失败时保持 Active；Knowledge 更新失败不能伪装成归档完成。归档机制工程化前，使用 Validation Report 明确记录尚未证明的内容。

## 常见失败

| 失败模式 | 原因 | 正确做法 |
| --- | --- | --- |
| 每个小改都建立完整 Spec | 把治理变成仪式 | 按语义、风险和持续时间分流 |
| 当前 Tasks 复制到 Knowledge | 混淆写模型和长期读模型 | Knowledge 只记录稳定结果和原因 |
| 为旧提交补齐漂亮历史 | 追求形式完整 | 只从真实采用时点开始，历史按证据触达 |
| Commit 后自动 Archived | 把机械动作当业务授权 | 保持 Active，等待明确收口意图 |
| 自举规则只约束使用方 | 仓库自身不回归 | 本仓所有实质能力变化遵守同一流程 |

## 刷新条件

- Specflow 生命周期、状态或产物职责变化；
- Knowledge 准入、Registry 或投影规则变化；
- 根级 Agent 工作流变化；
- Harness 开始提供自动 Context、Archive 或 Doctor 能力。
