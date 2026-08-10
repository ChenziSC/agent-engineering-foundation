# Harness

`packages/harness/` 是本仓确定性执行入口。它负责解析、校验、比较、持久化和结构性门禁，不理解业务意图，也不替代 Agent 或维护者的语义判断。

## 使用边界

- Node.js 20+，零运行时依赖；
- 普通治理命令输出结构化 JSON；`--help` 与 `--version` 输出稳定单行文本；
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

既有项目先用 `init plan` 判断 Starter 文件应新增、复用还是冲突；再由 [`project-context-bootstrap`](../../skills/project-context-bootstrap/SKILL.md) 基于项目事实生成规则、Knowledge 和代码入口候选。维护者审核候选并单独授权后，才执行 `init` 或人工合并。结构接入完成后，默认通过 Distribution Plan/Apply/Verify 安装 Manifest 中全部公开 Skill，使 Agent Host 能发现完整治理能力目录；具体 Skill 仍按任务触发，并在调用时检查项目配置和 Adapter 前置条件。完成 Harness 化后，日常任务和新会话改用 `context resolve`，不重复 Bootstrap。

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

Context Resolver 同时收到任务类型和路径时，以路径作为更具体的 Route 选择器；任务类型用于补充匹配原因并诊断未知值或冲突。结果中的 `matchedRoutes` 说明选中的任务 Route 和 `matchReasons`，`startPaths` 聚合这些 Route 声明的代码入口，`warnings` 暴露 `unknown-task-type`、`path-route-not-found` 或 `context-selector-conflict`。代码入口只用于后续定位，不会自动进入 Markdown `loadPlan`；旧有 `ruleFiles`、`knowledge`、`activeSpecs` 和 `excludeByDefault` 字段保持兼容。

### Skill 与 Distribution

```bash
node packages/harness/bin/agent-foundation.mjs skill list
node packages/harness/bin/agent-foundation.mjs skill plan --name specflow --target /path/to/project
node packages/harness/bin/agent-foundation.mjs skill install --name specflow --target /path/to/project
node packages/harness/bin/agent-foundation.mjs distribution plan --target /path/to/project
node packages/harness/bin/agent-foundation.mjs distribution apply --target /path/to/project
node packages/harness/bin/agent-foundation.mjs distribution verify --target /path/to/project
```

`list`、`check`、`plan` 和 `verify` 只读；`install`、`update` 和 Distribution `apply` 只操作 Manifest 明确纳管且未被采用方修改的内容。完整底座接入默认使用 Distribution；单项 `skill install` 仅用于明确的局部采用或维护。Distribution 安装状态在顶层保存生成它的 Foundation 版本；`verify` 同时复核工具版本来源、Manifest、受管记录和目标内容。安装成功只证明这些内容一致，不证明项目配置、外部 Adapter 或运行环境已经就绪。确定性核心与可分发 Skill 的依赖方向见[长期依赖契约](../../knowledge/deterministic-core-boundary.md)。

Foundation 源码仓可在 `open-agent` Integration 中使用受控的 `foundation-source://skills` 配置：仅当目标就是当前源码根时，Distribution 才允许 `.agents/skills -> ../skills`，让 Host 的下一次读取直接使用唯一源码。该模式不要求日常源码修改后重新 Apply，但 Repository/Distribution 仍会阻断未更新的发布摘要。其他项目声明该配置、错误链接目标或任意 Symlink 都会失败关闭；普通采用方始终使用不可变复制模式。

### 变更与交付门禁

```bash
node packages/harness/bin/agent-foundation.mjs source-control inspect --target /path/to/project --base <base-ref> --source HEAD --include src,packages
node packages/harness/bin/agent-foundation.mjs change gate check --target /path/to/project --base <base-ref> --source <immutable-source-ref> --spec-id example --phase work
GITHUB_TOKEN=<read-token> node packages/harness/bin/agent-foundation.mjs change gate check --target /path/to/project --base <base-ref> --source <final-source-sha> --spec-id example --phase delivery --required-check 'github-actions/verify@.github/workflows/quality.yml'
```

Source Control Adapter 计算不可变 Merge Candidate 和范围摘要；Change Gate 检查候选与 Active Spec Scope 或受控豁免的关系。Delivery 阶段提供 `--required-check` 后，Harness 默认读取 `origin`（没有 `origin` 时要求仓库只有一个 Remote），由注册 Adapter 的 Remote 匹配器自动选择平台和 Repository；`--delivery-remote` 可指定其他 Remote，`--delivery-provider` 与 `--repository` 可成对显式覆盖。当前 GitHub Actions Adapter 只读复核同一最终 Source SHA 的必需 Check，并用 Check Suite 与 Workflow Path 绑定来源；门禁结论只取显式 Check，不要求包含 Delivery 的整个 Workflow Run 先结束。未识别平台、没有对应 Adapter或多 Adapter 同时匹配都会阻断。Remote 路由不猜测哪些检查应成为门禁，该策略仍须由采用方显式声明。

这些 Adapter 均不创建 Commit、远端 Check 或发布，也不把 Check 成功推断为 Branch Protection、合入、部署或上线。

采用方应区分 Bootstrap、Continuous 与 Delivery。Bootstrap 允许经授权的初始化和运行时分发；Continuous 只运行 Doctor、Knowledge、Specflow、Distribution Verify 等结构检查；Delivery 在不可变 Base/Source SHA 上增加 `change gate check --phase delivery`。可选模板见[采用项目 CI](../../templates/ai-friendly-repository/ci/)。

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

## 不可变包候选

维护者可在干净 Git Commit 上执行 `npm run release:pack -- --target . --output <absolute-directory>`。命令生成 npm tarball 与 `release-manifest.json`，清单绑定包名、SemVer、Source Revision、SHA-256 和 npm integrity；工作区不干净或目标清单已存在时失败关闭。完整授权与 Provider 边界见[不可变包交付](../../docs/不可变包交付.md)。

### 规模回归

默认 `npm test` 包含 small 档，覆盖 10 个历史 Spec、3 个 Active Spec、5 个 Knowledge、10 条 Route 和 1 层规则。维护 Harness、Context、Specflow 或 Knowledge 时，额外运行：

```bash
npm run test:scale
```

独立规模回归生成 mature/large 临时项目，最高覆盖 1000 个历史 Spec、3 个 Active Spec、200 个 Knowledge、500 条 Route 和 6 层祖先规则；它验证 Context 只加载 Active Spec、预算降级与排序稳定，并在集合尾部注入失效回执和来源摘要。夹具完全合成、测试后删除，不保存真实项目内容，也不把 Active Spec 数量设为产品硬门禁。

## 内部模块边界

Harness 保持一个 Package 和一个 CLI，对内按以下职责组织：项目接入、Specflow、Knowledge、Context、Skill Distribution、Source Control、Change Gate、Repository Check 和共享基础设施。CLI 只做参数解析与结果输出，领域模块不读取进程参数。

`src/shared/` 只拥有已有多个领域消费者的无状态原语：统一错误类型、项目内路径与 Symlink 安全、稳定文件树摘要，以及受支持 JSON/YAML 子集的解析和序列化。共享模块不得反向导入 `harness.mjs`、Adapter、Framework 或 Skill；`harness.mjs` 继续作为兼容聚合入口，不要求采用方改写导入路径。

共享确定性实现不得以 `skills/*/scripts/` 的私有路径作为未声明库接口；Skill 自包含脚本和 Harness 共享核心的关系由 Distribution 依赖契约约束。
