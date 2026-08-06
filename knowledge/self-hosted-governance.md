# Knowledge：仓库自举治理

## 注册信息

- ID：`self-hosted-governance`
- 状态、适用范围、复核时间、权威来源和刷新条件以 [Knowledge Registry](registry.yaml) 中的同 ID 条目为准。

## 摘要

仓库必须使用自己提供的 Specflow 和 Knowledge 治理自身变化。自举不是展示案例，而是用真实维护工作验证上下文恢复、状态所有权、归档、知识投影和检查机制是否可用。

## 稳定事实

- `specs/` 保存当前需求、方案、任务、验证和生命周期；
- `meta.yaml` 是事项状态、关系和影响范围的唯一事实来源；
- 完整 Meta Schema 与 `specflow check` 负责精确字段、产物路径、本地关系和终态证据链校验；程序检查不取得终态授权；
- `knowledge/` 只保存长期稳定事实、设计原因、契约和刷新条件；
- 根 `AGENTS.md` 保存全仓不变量、目录地图和路由规则；
- 当前任务进度不能进入 Knowledge，长期设计原因不能只留在聊天；
- 不为历史批量伪造 Spec、Plan、Tasks、归档回执或验证证据；
- 普通提交、推送和 PR/MR 不构成归档授权。
- 单事项目录内 Receipt、Lifecycle Event 和 Meta 的确定性生命周期由 Specflow 自带脚本负责：先不可覆盖地写入并回读证据，再最后原子更新 Meta；脚本不计算未知版本变化，也不自行确认授权。
- Harness 根据任务类型、相关路径、Active Meta、Knowledge Registry 和 Code Entry Map 生成最小加载计划；Active Spec 核心 Markdown 在可配置预算内全文加载，超限时只返回确定性的章节与未完成项位置索引；Registry 使用权威来源摘要暴露知识过期风险，但不自动改写知识状态或正文。
- Context Resolver 按请求路径加载根级与祖先规则；Doctor 检查规则文件预算、失效入口、结构性路由矛盾和已登记规则的精确继承重复。精确重复只产生不回显正文的警告，自然语言语义冲突仍由 Agent 或人工判断。
- 本地 Git Source Control Adapter 使用显式 Include/Exclude 范围，从不可变 Base/Source 计算 Merge Candidate 摘要；范围内脏内容或候选冲突会阻断，且不会自行 Stage、Commit 或 Push。
- 当存在不可变 Base/Source 时，Change Gate 对完整候选执行一个或多个 Spec 的显式集合关联和 Scope 并集覆盖，或者使用受控路径型豁免；交付阶段逐项复核 Archived Receipt、Lifecycle 摘要链和同一最终候选摘要。Include/Exclude 只限定 Receipt 摘要复核范围，不能缩小关联检查范围。
- Change Gate 结果是仓库内可复核证据，不是终态授权或外部交付成功证明；当前工作区没有获准形成不可变版本时，应明确记录“未执行”，不得自行提交以让门禁通过。
- Skill 行为成熟度使用 Case、Rubric、脱敏 Trace 和 Replay 配置形成可重算证据；Runner 动态读取真实目录并执行阻塞优先评分，但不把评分者的语义判断伪装成确定性事实，也不固定模型或推理强度。
- Distribution Manifest 以内容摘要声明允许分发的 Skill；Plan/Verify 只读，Apply 只写项目级受管目录，进程中断后依靠已有安装状态幂等继续。

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

归档失败时保持 Active；Knowledge 更新失败不能伪装成归档完成。语义复核、正文和 Registry 条目先由 Agent/人工准备，再通过 Projection Plan/Apply/Verify 机械校验路径覆盖并刷新状态、来源摘要与取代关系；`last_projection` 指纹只服务于幂等恢复。Receipt 或 Event 已写但 Meta 最后写失败时，保留已验证证据和原 Meta，使用完全相同的候选恢复，不能覆盖重建。两个终态事项的父子或取代关系使用 Relation Transaction：先验证严格互反并写事务意图与双方 Event，再逐侧投影 Meta；跨文件中断可能短暂暴露中间态，但同一候选可幂等补齐，不能声称绝对原子或已回滚。Active 事项关系事务、三个及以上事项关系事务和跨仓库关系事务仍是显式扩展边界。

## 常见失败

| 失败模式 | 原因 | 正确做法 |
| --- | --- | --- |
| 每个小改都建立完整 Spec | 把治理变成仪式 | 按语义、风险和持续时间分流 |
| 当前 Tasks 复制到 Knowledge | 混淆写模型和长期读模型 | Knowledge 只记录稳定结果和原因 |
| 来源摘要变化后只刷新 Digest | 把机械一致性冒充语义复核 | 先判断长期结论是否仍成立，再更新正文、状态和证据 |
| 为旧提交补齐漂亮历史 | 追求形式完整 | 只从真实采用时点开始，历史按证据触达 |
| Commit 后自动 Archived | 把机械动作当业务授权 | 保持 Active，等待明确收口意图 |
| 为了运行 Change Gate 自行 Commit | 把验证前置条件误当授权 | 保持未执行，等待有权限的一方形成不可变候选 |
| 自举规则只约束使用方 | 仓库自身不回归 | 本仓所有实质能力变化遵守同一流程 |
