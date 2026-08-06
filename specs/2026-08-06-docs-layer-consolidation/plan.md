# Plan：收敛 Docs 与仓库结构分层

## 当前证据

- README 逐项列出 9 个 Docs 入口，并以目录链接指向 13 篇能力说明。
- `docs/01`、`docs/05`、`docs/08` 已分别承担能力导航、成熟度和问题库存。
- 每篇能力说明的主要契约已在对应 Framework、Skill、Template 或 Blueprint 中存在。
- `knowledge/public-generalization-policy.md` 已承载公开处理等级，但 Registry 仍把 `docs/00`、`docs/03`、`docs/07` 列为上游来源。

## 目标结构

```text
docs/
├── 能力地图.md
├── 目标仓库设计.md
├── 交付形态与成熟度.md
├── 公开发布检查清单.md
├── 公开内容来源说明.md
└── 能力问题图谱.md
```

## 关键决策

### D-01 取消完整能力说明层

能力说明中的问题模型、执行流程、采用方式和实现证据分别由 Framework、Skill、Blueprint/Template 和实现目录拥有。`docs/01` 与 `docs/05` 提供跨资产导航和状态投影，不再维护第二套完整契约。

### D-02 Docs 不等于 Knowledge

Docs 保留面向读者的导航、当前投影、发布清单和来源声明。跨任务稳定的公开泛化原则进入正式 Knowledge；历史迁移顺序不迁入长期 Knowledge。

### D-03 删除前迁移，删除后深审

先迁移 `docs/00`、`docs/03` 中仍唯一的公开处理规则，再更新入口和 Knowledge 路由，最后删除旧文件。完成结构变更后，按 `refactor-natural-language-content` 执行旧路径、旧标题、规范术语、权威来源和语义重复的全仓复审。

### D-04 取消无语义编号

六个 Docs 是按读者任务选择的并列入口，不定义稳定阅读顺序。移除文件名前缀，用标题表达职责；Archived Spec、Receipt 和 Lifecycle Event 继续保留当时路径。

### D-05 README 下沉到局部所有者

根 README 只保留定位、最短试用路径、能力边界和导航。Harness 的完整命令、只读与写入边界、模块职责由 `packages/harness/README.md` 拥有；Adapter 的实际实现和注册方式由 `adapters/README.md` 拥有。

### D-06 依赖契约先于大规模搬迁

以长期 Knowledge 定义四类边界：Domain Contract、Deterministic Core、Orchestrator、Distribution Bundle。禁止 Package 把 Skill 私有脚本作为未声明共享库；可分发 Skill 可以携带独立脚本，但共享实现必须有稳定 Core 所有者，Distribution Manifest 必须显式表达运行时依赖或声明自包含。

### D-07 保持单包、按领域拆 Harness

不新建多个 npm Package。只在 `packages/harness/src/` 内按现有职责提取模块，并保留原导出与 CLI。共享 Web Evidence 拆到 `frameworks/web-evidence/`，Prefetch Framework 只保留候选判断。

### D-08 Pet 独立发布

使用当前 GitHub 账号建立与主仓同为 Private 的独立 `codex-pets` 仓库，迁移 README、来源声明、License 和两个完整 Pet 包。远端提交和摘要验证完成后，再删除本仓目录及所有当前规则与文档引用。

### D-09 Host 原生优先

Codex、Claude Code 等 Host 已拥有 Skill/Plugin 安装、权限、Sandbox、Hook、MCP、会话和通用代码探索。本仓不建立第二套通用 Runtime；`distribution/manifest.yaml` 只保留发布白名单和内容摘要，现有项目级安装命令作为兼容实现维护，不扩展 Manifest v2、Capability Registry 或用户级安装。

### D-10 增量能力准入

新增能力必须记录目标失败、宿主基线、增量缺口、产物与消费者、验证和删除条件。只有领域不变量、确定性门禁、跨宿主稳定契约、真实外部 Adapter 或经对照验证的增益能够进入实现。通用 Agent 基础行为不能单独形成 Skill、Framework 或 Blueprint。

### D-11 拆分 Context 三种语义（关于公开任务调研模式的部分已由 D-13 取代）

新会话 Context Resolver 负责 Active Spec、Knowledge 和 Section Index；当时把 `project-context-bootstrap` 定义为存量项目候选与有边界调研，并把字段级正反向语义切片保留为需要语言 Adapter 的 `problem-pattern`。后续复核确认普通任务调研属于 Host 原生能力，因此 D-13 进一步删除公开调研模式，只保留存量项目候选推导。

### D-12 恢复原仓的新会话触发语义

`context resolve` 保留本仓新增的 Scope、Knowledge、规则和代码入口路由，但强制触发回到原仓的“新会话首次恢复 + 明确变化时刷新”。同一会话、同一分支和同一任务范围内复用结果；切换分支、Active 事项集合变化、任务目标或相关路径明显变化、用户明确要求刷新时重新执行。不建立磁盘会话缓存，也不把命令幂等性解释为每个对话回合都必须执行。

### D-13 Bootstrap 只拥有存量项目候选推导

`project-context-bootstrap` 保留稳定机器名，只在首次接入存量项目、治理骨架缺失或架构变化后重建长期上下文候选时触发。普通任务的入口、符号和调用关系调研是 Agent Host 原生代码探索的一部分，结果按需要进入当前 Spec，不再包装成公开 `slice` 模式。Bootstrap 为证明候选而进行的局部代码阅读只是内部取证方法。字段级语义切片继续作为需要语言 Adapter、直接消费者和对照收益证据的独立候选。

旧正式回放覆盖的是已经删除的 Slice 行为，不能继续证明当前版本。删除该回放并把 Skill 降为 `usable`；保留 Bootstrap 专项案例和 Rubric，待新的独立 Trace/Replay 后再升级为 `validated`。

### D-14 未 Harness 化是接入前状态

不把“没有 Harness”设计成独立 fallback 能力。对存量项目先使用本仓 `init plan` 只读识别缺失、复用与冲突；再由 `project-context-bootstrap` 推导通用 Starter 无法生成的项目规则、稳定契约、Knowledge 和代码入口候选。维护者审核后，另行授权 `init` 或人工合并；完成 Harness 化后，新会话使用 `context resolve`，不重复 Bootstrap。

`init plan` 负责结构差异，Bootstrap 负责语义候选，写入和批准分别拥有独立授权。目标项目不需要先安装本仓 Harness 才能执行计划，但 Bootstrap 也不能绕过计划直接把通用骨架写入未知项目。

### D-15 深度 Review 缺口按证据层修复

先让 Meta Scope 覆盖真实 Merge Candidate，并同步已经完成的 Commit/Push 事实；再修复 `.` 根路径的确定性匹配和 `AGENTS.md` 的 Knowledge 路由；最后把 Docs 依赖图中的普通任务调研明确标为 Host 原生职责，把字段级语义切片保留为未实现候选。Context 根路径属于公共选择器语义，必须增加与具体路径相互独立的回归测试；文档投影不能继续把 Host 职责画成本仓能力。

## 验证策略

1. 删除前后分别搜索全部旧文件名和 `docs/能力说明/` 引用。
2. 对六个保留文件及其直接权威资产做逐层语义复查。
3. 运行 Knowledge Projection Plan/Apply/Verify。
4. 运行 `npm run check`、`npm test` 和 `git diff --check`。
5. 验证 Pet 新仓远端默认分支、文件树和二进制摘要。
6. 搜索 Docs 旧编号、Pet 术语、跨层 import 和 Web Prefetch 共享归属残留。
7. 搜索 Manifest v2、Capability Registry、用户级安装、多宿主 Hook 和任务切片的当前表述，确认只在禁止/边界说明中出现。
8. 运行 `project-context-bootstrap` Skill Check 和既有 Eval 一致性检查，确认改名没有扩大行为证据。
9. 搜索“每次仓库相关请求”“执行任务前先运行”等旧触发表述，确认当前规则只保留新会话首次恢复和明确刷新条件。
10. 搜索 `project-context-bootstrap` 的 `slice`、任务调研和旧成熟度表述，确认当前入口只描述存量项目候选推导，旧回放不再参与正式验证。
11. 搜索“无 Harness 降级”“先安装 Harness”等表述，确认当前接入顺序统一为只读计划、候选审核、授权落地和后续 Resolver。
12. 验证 `context resolve --paths .`、`--paths README.md` 和仓库定位任务配合 `--paths AGENTS.md` 的返回集合。
13. 对 `HEAD^..HEAD` 及本轮最终不可变候选执行工作态 Change Gate，确认 Scope 覆盖全部实现路径；没有新的 Commit 授权时，只报告未提交候选无法形成最终门禁证据。
14. 搜索 `Repository Context Audit`、`Task-scoped Evidence View`、`Semantic Slice Candidate` 及中文等价表述，确认当前投影明确标注 Host 与候选边界。

## 回退策略

在未提交工作树中使用精确补丁恢复必要文件；不修改 Archived 证据，不通过保留兼容占位文件掩盖失效引用。
