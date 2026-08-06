# 仓库长期知识

本目录保存 Agent 和维护者长期需要理解的稳定事实、设计原因、契约、边界和刷新条件。当前需求范围、方案、任务和状态保存在 [`specs/`](../specs/)，不能复制到 Knowledge 形成第二事实源。

## 入口

- [Knowledge Registry](registry.yaml)
- [代码入口映射](code-entry-map.yaml)
- [仓库定位与产物分层](repository-positioning.md)
- [仓库自举治理](self-hosted-governance.md)
- [契约化上下文框架](../frameworks/context-contract/README.md)
- [项目上下文 Bootstrap/Slice Skill](../skills/project-context-bootstrap/SKILL.md)

## 准入条件

内容同时满足以下条件才进入 Knowledge：

1. 对后续多个任务仍然有价值；
2. 不能仅靠快速阅读一个文件直接得到完整原因；
3. 有可定位的权威来源或明确的维护者决策；
4. 可以说明适用范围和触发重新复核的变化；
5. 不包含当前任务进度、未确认猜测、凭证、个人信息或生产数据。

## 信息层级

- 项目规则保存全仓或模块必须遵守的稳定边界，通常进入根级或模块级 `AGENTS.md`；
- 稳定契约保存 Agent 不能自行猜测的 API、Schema、状态、不变量、兼容边界和关键流程，满足上述准入条件并经维护者批准后进入 Knowledge；
- 动态切片只描述当前任务相关的入口、符号、数据元素、调用路径和异常分支，进入当前 Spec 的 Plan、Research 或 Evidence，不进入长期 Knowledge；
- Agent 可以生成或刷新稳定契约候选，但人工批准状态、来源范围和未确认项必须显式保留；
- 三层结构、所有权与合成数据契约见[契约化上下文框架](../frameworks/context-contract/README.md)。

## 状态

- `current`：权威来源和适用范围仍成立；
- `review-required`：触发刷新条件或证据发生冲突，需要复核；
- `retired`：不再适用，保留替代关系或历史原因。

## 更新规则

- 需求或治理变化先更新对应 Spec；
- 实现和验证稳定后，归档阶段判断是否需要 Knowledge Projection；
- 新增稳定概念使用新 ID，修改既有概念更新原条目；
- 被取代时记录替代项，不静默删除；
- 代码入口、核心契约或仓库定位变化时，把相关条目标记为 `review-required`；
- Registry 是发现和路由入口，也是条目状态、适用范围、复核时间、权威来源、来源摘要和刷新条件的唯一元数据事实源；Knowledge 正文只保留稳定内容及其解释，不复制这些易变元数据。
- 每个 Registry 条目的 `source_evidence` 保存全部 `authoritative_sources` 当前 UTF-8/原始字节的 SHA-256；摘要变化只证明需要复核，不能自动判断知识正文应如何修改。
- `current` 条目的来源摘要不一致会阻断 Knowledge Check；先复核正文和来源，再更新摘要或把状态改为 `review-required`，不能只刷新摘要掩盖语义变化。
- Projection Apply 可以在语义复核完成后机械刷新摘要和状态，但只作用于已经准备好的正文与 Registry 条目；`last_projection` 记录 Spec、动作、日期和决策摘要，用于幂等复核，不是新的内容事实源。

## 确定性检查与上下文解析

```bash
node packages/harness/bin/agent-foundation.mjs knowledge check --target /path/to/project
node packages/harness/bin/agent-foundation.mjs knowledge projection plan --target /path/to/project --projection specs/example/knowledge-projection.yaml --spec-id example --reviewed-at 2026-08-05 --paths src,packages
node packages/harness/bin/agent-foundation.mjs knowledge projection apply --target /path/to/project --projection specs/example/knowledge-projection.yaml --spec-id example --reviewed-at 2026-08-05 --paths src,packages
node packages/harness/bin/agent-foundation.mjs knowledge projection verify --target /path/to/project --projection specs/example/knowledge-projection.yaml --spec-id example --reviewed-at 2026-08-05 --paths src,packages
node packages/harness/bin/agent-foundation.mjs context resolve --target /path/to/project --task-type "<任务类型>" --paths path/one,path/two
```

`knowledge check` 校验 Registry、Code Entry Map、引用、项目内路径、取代关系和权威来源摘要，并检查失效起始路径、路由数组重复、同路径纳入/排除矛盾、规则文件预算和已登记父子规则精确重复。Projection 的 `plan/verify` 只读，`apply` 在排他锁内原子改写 Registry；变更路径命中 Scope 却没有决策、退役知识仍被路由或取代目标无效时阻断。`context resolve` 返回根级/祖先规则、Knowledge 路径与 Active Spec；预算内事项进入全文加载计划，超限事项返回由原文标题和位置构成的 Section Index。命令不生成知识正文，也不替代 Agent 对任务相关性、自然语言冲突与内容正确性的判断。

## 公开边界

只记录本公开仓库自身的设计。私有来源映射、内部平台、域名、接口、人员、生产实例和真实业务数据不进入本目录。
