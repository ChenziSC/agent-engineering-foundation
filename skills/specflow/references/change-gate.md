# 事项—变更关联与交付门禁

Change Gate 回答两个问题：当前不可变变更候选属于哪些研发事项，以及它是否具备进入下一交付阶段的可复核证据。它不决定业务意图，不创建 Commit、PR/MR、Check 或发布，也不替代 Branch Protection、审批、部署和发布平台策略。

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

声明 Delivery Required Checks 时，只有上述本地 Gate 已通过才读取外部证据。Change Gate 默认从 `origin`（或仓库唯一 Remote）识别平台，并选择唯一匹配的已注册 Delivery Evidence Adapter；未识别、未实现或多匹配都失败关闭。GitHub Actions 首个实现要求同一最终 Source SHA 上的必需 Check 精确匹配 App、Check Name 与 Workflow Path，且 Check Run 和 Workflow Run 都为 `completed/success`。外部证据缺失、未完成、非成功、歧义、权限不足或 API 失败均阻断，但不会回显 Token 或原始响应。

平台可以从 Remote 机械识别，门禁策略不能从当前成功项自动猜测。必需 Check、审批、部署或发布规则必须由采用项目显式声明，否则候选分支可以通过新增一个自选成功任务弱化门禁。

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
agent-foundation change gate check \
  --target <project-root> \
  --base <base-ref> \
  --source HEAD \
  --spec-id <spec-id> \
  --phase work
```

同一候选关联多个 Active Spec 时重复传入 `--spec-id`；参数顺序不影响关联集合和门禁摘要：

```bash
agent-foundation change gate check \
  --target <project-root> \
  --base <base-ref> \
  --source HEAD \
  --spec-id <product-spec-id> \
  --spec-id <technical-spec-id> \
  --phase work
```

复核交付候选；关联 Spec 目录只从 Receipt 摘要范围排除，仍会出现在完整候选证据中。多 Spec 时应排除全部关联事项目录，使每份 Receipt 复核同一个摘要范围：

```bash
agent-foundation change gate check \
  --target <project-root> \
  --base <base-ref> \
  --source HEAD \
  --spec-id <product-spec-id> \
  --spec-id <technical-spec-id> \
  --phase delivery \
  --exclude specs/<product-spec-id>,specs/<technical-spec-id>
```

在 GitHub Actions 中进一步复核同一最终 Source SHA 的外部 Check；选择器必须绑定 Workflow Path，避免同名 Job 冒充。门禁结论取显式选择的 Check；Workflow Run 只提供 Check Suite 与 Path 来源绑定，不要求整个 Run 先结束，避免同一 Workflow 中的 Delivery Job 与其上游 Check 形成自依赖：

```bash
GITHUB_TOKEN=<checks-and-actions-read-token> agent-foundation change gate check \
  --target <project-root> \
  --base <base-sha> \
  --source <final-source-sha> \
  --spec-id <spec-id> \
  --phase delivery \
  --exclude specs/<spec-id> \
  --required-check 'github-actions/verify@.github/workflows/quality.yml'
```

默认 Remote 不适用时可用 `--delivery-remote <name>` 指定。镜像、企业版或特殊代理无法可靠识别时，允许成对传入 `--delivery-provider <id> --repository <provider-repository>`；只提供其中一个会阻断。

无 Spec 的确定性低风险候选：

```bash
agent-foundation change gate check \
  --target <project-root> \
  --base <base-ref> \
  --source HEAD \
  --exemption docs-only \
  --phase delivery
```

输出包含完整候选路径、稳定排序的 Spec 集合、各 Spec 状态、Source Control 摘要、Receipt Scope 摘要和稳定 `gateDigest`。交付阶段还逐项输出 Receipt/Lifecycle 复核结果；启用外部 Provider 时增加规范化的 Check/Workflow Evidence。它是可保存的复核证据，不是 Branch Protection、PR 审批、合入、部署或上线证明。

## Provider 边界

核心门禁消费两类独立契约：Source Control Adapter 提供中立 Merge Candidate，Delivery Evidence Adapter 可选提供同一最终 Source Revision 的外部检查事实。Core 只根据 Git Remote 和 Adapter 声明做确定性路由，不包含 GitHub、GitLab、Bitbucket 或内部平台分支。当前参考实现分别为本地 Git 和 GitHub Actions；后者不从 GitHub Diff API 重做 Git 摘要，也不读取或声称 Branch Protection。其他系统出现真实消费者后增加薄 Adapter 及 Remote 匹配器，即可进入同一路由。Commit Message、分支名和 PR/MR 文本都不是核心关联契约。
