# Evidence 与 Claim 框架

成熟度：`reference-implemented`

这个框架用于把 Agent 分析中的观察事实、程序推导和 Agent 推断分开表达，并明确证据不足、冲突和过期时哪些结论不能成立。

本目录同时提供设计框架和零运行时依赖的参考实现：

- [正式 Schema](evidence.schema.json)：冻结 v1 Bundle 字段；
- [候选模板](evidence.template.json)：使用合成占位摘要；
- [校验与封存脚本](scripts/evidence-bundle.mjs)：校验引用、状态、双向 Blocker 关系和完整性摘要；
- [旧 Schema 示例](evidence.schema.example.json)：仅用于理解早期字段，不是 v1 契约。

检查已封存 Bundle：

```bash
node <foundation-repo>/packages/harness/bin/agent-foundation.mjs evidence check --file <bundle.json>
```

参考实现能证明结构、引用和摘要一致，不能证明 Claim 的语义真实性；Evidence 内容和人工确认仍需由真实来源复核。

## 核心对象

| 对象 | 职责 |
| --- | --- |
| Evidence | 描述一次可验证观察的来源、范围、时间和完整性 |
| Claim | 描述由 Evidence 支持、部分支持、反驳或阻塞的主张 |
| Blocker | 指出缺少什么，以及具体阻断哪些 Claim |
| Verification | 描述证实或证伪 Claim 的动作、预期结果和实际结果 |

Claim 必须标明类型：

- `observation`：工具、文件或人工确认直接支持；
- `derived`：可由确定性规则从 Evidence 推导；
- `inference`：Agent 对 Evidence 的解释。

## 状态

```text
supported
├── partial
├── refuted
└── stale

blocked
└── supported / partial / refuted
```

- `supported`：当前范围内证据充分；
- `partial`：部分成立，必须描述缺口；
- `blocked`：关键证据缺失，不能下结论；
- `refuted`：已有反证；
- `stale`：依赖的 Evidence 已过期或内容发生变化。

## 不变量

1. Claim 必须引用 Evidence，不能用置信度代替证据。
2. Evidence 必须说明适用范围，不能从共享模块自动扩大到全部页面。
3. Blocker 只阻断明确列出的 Claim。
4. Evidence 冲突时保留冲突并提出 Verification，不能静默任选一份。
5. 人工确认可以成为 Evidence，但必须记录确认范围和时间。
6. Evidence 内容摘要变化时，依赖 Claim 需要重新判断。
7. `blocked` Claim 与 Blocker 必须双向引用；`supported` Claim 只能依赖当前有效 Evidence。

## 与 Checkpoint 的边界

- 本框架唯一管理 Evidence、Claim、Blocker、Verification 和 Claim 状态；
- Checkpoint 只能保存这些对象的不透明引用；
- Checkpoint 不复制或重新解释 Claim；
- 上层 Skill 根据 Claim 状态决定阶段是否可以退出。

## 合成走查

### 直接观察

合成 Network 记录显示 `/api/demo/catalog` 在页面启动 800ms 后发出。请求时间是 `observation`；“它阻塞首屏主内容”仍然是需要 DOM 或渲染证据支持的 `inference`。

### 范围不足

一份共享模块 Trace 只能证明该模块发生了同步初始化，不能直接证明每个页面都受影响。相关 Claim 应为 `partial`。

### 冲突

两次合成测量对同一请求的缓存命中情况不一致。保留两份 Evidence，标记冲突，并增加一次控制缓存条件的 Verification。

### 过期

页面版本或 Evidence 内容摘要改变后，依赖旧 Evidence 的 Claim 变为 `stale`，但不影响没有引用它的其他 Claim。
