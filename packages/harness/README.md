# Harness

`packages/harness/` 是本仓确定性执行入口。它负责解析、校验、比较、持久化和结构性门禁，不理解业务意图，也不替代 Agent 或维护者的语义判断。

## 使用边界

- Node.js 20+，零运行时依赖；
- 所有命令输出结构化 JSON；
- 冲突时停止并保留既有内容；
- 不自动执行 Stage、Commit、Push、PR/MR、部署或发布；
- 外部系统通过显式 Adapter Registry 接入，不动态加载未知插件。

## 命令分组

### 项目接入与检查

```bash
node packages/harness/bin/agent-foundation.mjs init plan --target /path/to/existing-project
node packages/harness/bin/agent-foundation.mjs init --target /path/to/project
node packages/harness/bin/agent-foundation.mjs doctor --target /path/to/project
node packages/harness/bin/agent-foundation.mjs repository check
```

`init plan` 和 `doctor` 只读；`init` 只写入明确目标，不覆盖同路径不同内容，也拒绝通过 Symlink 越出目标边界。

既有项目先用 `init plan` 判断 Starter 文件应新增、复用还是冲突；再由 [`project-context-bootstrap`](../../skills/project-context-bootstrap/SKILL.md) 基于项目事实生成规则、Knowledge 和代码入口候选。维护者审核候选并单独授权后，才执行 `init` 或人工合并。完成 Harness 化后，日常任务和新会话改用 `context resolve`，不重复 Bootstrap。

### Specflow、Knowledge 与上下文

```bash
node packages/harness/bin/agent-foundation.mjs specflow check --target /path/to/project
node packages/harness/bin/agent-foundation.mjs knowledge check --target /path/to/project
node packages/harness/bin/agent-foundation.mjs context resolve --target /path/to/project --task-type "新增或修改 Skill" --paths skills/example
node packages/harness/bin/agent-foundation.mjs knowledge projection plan --target /path/to/project --projection /path/to/knowledge-projection.yaml --spec-id example --reviewed-at 2026-08-06 --paths src,packages
node packages/harness/bin/agent-foundation.mjs knowledge projection apply --target /path/to/project --projection /path/to/knowledge-projection.yaml --spec-id example --reviewed-at 2026-08-06 --paths src,packages
node packages/harness/bin/agent-foundation.mjs knowledge projection verify --target /path/to/project --projection /path/to/knowledge-projection.yaml --spec-id example --reviewed-at 2026-08-06 --paths src,packages
```

`context resolve --paths .` 明确表示以整个项目根目录作为选择范围；具体文件或目录路径仍只选择与其范围相交的 Active Spec、Knowledge 和规则文件。Projection 的 `apply` 只更新已经由人或 Agent 准备好的正文和 Registry 投影，不生成长期知识。Context Resolver 只基于真实文件生成全文加载计划或 Section Index，不生成第二份摘要事实源。

### Skill 与 Distribution

```bash
node packages/harness/bin/agent-foundation.mjs skill list
node packages/harness/bin/agent-foundation.mjs skill plan --name specflow --target /path/to/project
node packages/harness/bin/agent-foundation.mjs skill install --name specflow --target /path/to/project
node packages/harness/bin/agent-foundation.mjs distribution plan --target /path/to/project
node packages/harness/bin/agent-foundation.mjs distribution apply --target /path/to/project
node packages/harness/bin/agent-foundation.mjs distribution verify --target /path/to/project
```

`list`、`check`、`plan` 和 `verify` 只读；`install`、`update` 和 Distribution `apply` 只操作 Manifest 明确纳管且未被采用方修改的内容。确定性核心与可分发 Skill 的依赖方向见[长期依赖契约](../../knowledge/deterministic-core-boundary.md)。

### 变更与交付门禁

```bash
node packages/harness/bin/agent-foundation.mjs source-control inspect --target /path/to/project --base <base-ref> --source HEAD --include src,packages
node packages/harness/bin/agent-foundation.mjs change gate check --target /path/to/project --base <base-ref> --source <immutable-source-ref> --spec-id example --phase work
```

Source Control Adapter 计算不可变 Merge Candidate 和范围摘要；Change Gate 检查候选与 Active Spec Scope 或受控豁免的关系。两者均不创建 Commit，也不推断事项终态或外部发布成功。

### 确定性契约

```bash
node packages/harness/bin/agent-foundation.mjs component check --target /path/to/project
node packages/harness/bin/agent-foundation.mjs eval run --skill specflow --target /path/to/foundation-repo
node packages/harness/bin/agent-foundation.mjs evidence check --file /path/to/evidence-bundle.json
node packages/harness/bin/agent-foundation.mjs checkpoint check --file /path/to/checkpoint.json
node packages/harness/bin/agent-foundation.mjs change-validation check --file /path/to/change-validation.json
node packages/harness/bin/agent-foundation.mjs web-evidence summarize --file /path/to/web-evidence.json
node packages/harness/bin/agent-foundation.mjs prefetch check --file /path/to/prefetch-candidate.json
node packages/harness/bin/agent-foundation.mjs design check --file /path/to/design-contract.json
node packages/harness/bin/agent-foundation.mjs tracking check --file /path/to/event-catalog.json
```

这些命令只验证各自声明的窄契约。程序通过不证明业务判断、Evidence 独立性、发布授权或真实环境行为正确。

## 内部模块边界

Harness 保持一个 Package 和一个 CLI，对内按以下职责组织：项目接入、Specflow、Knowledge、Context、Skill Distribution、Source Control、Change Gate、Repository Check 和共享基础设施。CLI 只做参数解析与结果输出，领域模块不读取进程参数。

共享确定性实现不得以 `skills/*/scripts/` 的私有路径作为未声明库接口；Skill 自包含脚本和 Harness 共享核心的关系由 Distribution 依赖契约约束。
