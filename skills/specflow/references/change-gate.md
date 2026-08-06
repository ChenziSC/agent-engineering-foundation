# 事项—变更关联与交付门禁

Change Gate 回答两个问题：当前不可变变更候选属于哪些研发事项，以及它是否具备进入下一交付阶段的仓库内证据。它不决定业务意图，不创建 Commit、PR/MR 或发布，也不替代外部平台检查。

## 核心不变量

一个候选必须且只能选择一种模式：

- `spec`：显式关联一个或多个 Spec；
- `exemption`：没有 Spec，且完整候选可由路径机械证明为受控低风险类型。

不能同时关联 Spec 和豁免，不能使用自由文本豁免，也不能通过 `--include` 或 `--exclude` 隐藏关联检查范围。Harness 始终对完整 Merge Candidate 执行关联与豁免检查；路径筛选只定义 Receipt 摘要复核范围。

分支和 Merge Candidate 都可能承载多个独立 Spec。Spec 之间不需要为了共同出现在一个候选中而建立额外交付组；只有采用方确实需要表达原子发布、共同灰度或共同回滚时，才在外部流程中补充这种关系。Change Gate 只要求完整声明 Spec 集合，并由这些 Spec 的 Scope 并集解释全部实现变更；多个 Scope 可以重叠。

## 工作态与交付态

### `work`

用于已有不可变 Source Commit、但事项仍在开发中的检查：

- 所有关联 Spec 都必须为 `planned` 或 `in-progress`；
- 除已关联事项目录内的 Specflow 证据外，全部变更路径必须被关联 Meta Scope 的并集覆盖；
- Base/Source 必须可解析为不可变 Commit；
- 工作区存在未提交或未跟踪内容、候选冲突或关联范围不完整时阻断。

### `delivery`

Spec 模式在 `work` 的基础上还要求：

- 所有关联 Meta 都为 `archived`；
- 每个事项的终态授权已经记录；
- 每个事项的 Archive Receipt 和 Lifecycle Chain 可完整验证；
- 每个 Meta 的状态与关系等于各自生命周期链尾；
- 每份 Receipt 的 Base、Scope、算法、Excludes 和变更摘要都与同一最终 Merge Candidate 重新计算结果一致。

归档之后又修改实现，即使 Spec 文档和 Receipt 仍存在，也会因候选摘要漂移而阻断。无 Spec 的受控低风险候选可以直接运行 `delivery`，但它仍必须满足完整候选路径分类。

## 受控低风险类型

| 类型 | 机械判定 |
| --- | --- |
| `docs-only` | 全部路径都是常见纯文档扩展名 |
| `tests-only` | 全部路径位于测试目录或使用常见测试文件命名 |
| `styles-only` | 全部路径都是样式文件 |
| `assets-only` | 全部路径都是常见图片或字体资源 |
| `generated-only` | 全部路径位于明确生成目录或使用 `.generated.*` 命名 |

分类只看路径，因此不能证明 TS/TSX、Python、配置文件或其他行为代码中的“仅文案”“仅重命名”“仅格式”没有行为影响。这类变化应关联轻量 Spec。Owner Override 涉及授权证据与组织策略，不属于首版内置豁免；采用方需要时通过独立策略层扩展，不能退化为任意字符串。

## CLI

关联单个 Active Spec：

```bash
node <foundation-repo>/packages/harness/bin/agent-foundation.mjs change gate check \
  --target <project-root> \
  --base <base-ref> \
  --source HEAD \
  --spec-id <spec-id> \
  --phase work
```

同一候选关联多个 Active Spec 时重复传入 `--spec-id`；参数顺序不影响关联集合和门禁摘要：

```bash
node <foundation-repo>/packages/harness/bin/agent-foundation.mjs change gate check \
  --target <project-root> \
  --base <base-ref> \
  --source HEAD \
  --spec-id <product-spec-id> \
  --spec-id <technical-spec-id> \
  --phase work
```

复核交付候选；关联 Spec 目录只从 Receipt 摘要范围排除，仍会出现在完整候选证据中。多 Spec 时应排除全部关联事项目录，使每份 Receipt 复核同一个摘要范围：

```bash
node <foundation-repo>/packages/harness/bin/agent-foundation.mjs change gate check \
  --target <project-root> \
  --base <base-ref> \
  --source HEAD \
  --spec-id <product-spec-id> \
  --spec-id <technical-spec-id> \
  --phase delivery \
  --exclude specs/<product-spec-id>,specs/<technical-spec-id>
```

无 Spec 的确定性低风险候选：

```bash
node <foundation-repo>/packages/harness/bin/agent-foundation.mjs change gate check \
  --target <project-root> \
  --base <base-ref> \
  --source HEAD \
  --exemption docs-only \
  --phase delivery
```

输出包含完整候选路径、稳定排序的 Spec 集合、各 Spec 状态、Source Control 摘要、Receipt Scope 摘要和稳定 `gateDigest`。交付阶段还逐项输出 Receipt/Lifecycle 复核结果。它是可保存的复核证据，不是 Commit、合入、部署或上线证明。

## Provider 边界

核心门禁只消费 Source Control Adapter 的中立 Merge Candidate 契约。当前参考实现为本地 Git；其他版本控制系统可以提供同等的 Base、Source、最终路径/对象摘要和冲突/脏状态语义。Commit Message、分支名、PR/MR 字段和 CI 环境变量都不是核心契约。
