# Validation Report：补齐契约化上下文与设计验证护栏

## 结果

- 事项 ID：`2026-08-06-context-contract-and-design-guardrails`
- 检查日期：`2026-08-06`
- 结果：`pass`

该结论表示本事项声明范围通过结构、契约和整仓回归。维护者已于 `2026-08-06` 明确要求归档全部 Spec，并授权本轮提交与一次推送；公开发布未获授权。

## 完成条件映射

| 完成条件 | Task | Test / Evidence | 结果 |
| --- | --- | --- | --- |
| AC-001～AC-003 | T-02、T-03 | Context Contract、AI 友好仓库模板、Knowledge 入口、Schema 与 Repository Check | pass |
| AC-004～AC-005 | T-04 | Specflow Skill、Plan/Workflow、Case 01 与 12/12 回放 | pass |
| AC-006 | T-05 | Validation Report、Safe Change、Change Validation 与失败模式 | pass |
| AC-007 | T-06、V-01 | Skill Check、Eval Runner、Repository Check | pass |
| AC-008 | T-01、V-01 | Git Diff 范围复核；生命周期、Change Gate、Harness 和 Adapter 未修改 | pass |
| AC-009～AC-013 | T-07 | `project-context-bootstrap`、两份中文模板、两份 Reference、4 个合成 Case 与 Rubric | pass |
| AC-014 | T-08、T-09、T-11、V-02 | Skill Check、Distribution Plan/Apply/Verify、Context Resolve、Knowledge Projection、Repository Check、`npm test` 81/81 | pass |
| AC-015 | T-10、T-11 | 历史 self-review 与本次 4 Case 合成项目/本仓独立正式 Replay、脱敏 Trace、可重算 Replay 和分发摘要修复 | pass |
| AC-016 | T-12 | 文档事实复核、真实 Git 候选空白检查配置、Replay 变体摘要回归测试、Node.js 支持声明与 CI 对齐、整仓回归 | pass |

## 整仓复核修复

- [x] README 和目标仓库设计不再复制当前 Active 事项集合、终态授权或工作区 Source 状态，动态事实只从 Meta、Resolver 和候选 Evidence 获取。
- [x] README 与 Specflow Blueprint 明确一个候选可关联一个或多个 Active Spec，并以 Scope 并集覆盖完整变更。
- [x] Quality Workflow 使用完整 Git 历史，并按 PR Base 或 Push 前置提交对真实候选执行 `git diff --check`；初始推送等 Base 不可用场景回退检查当前提交。
- [x] Eval Runner 排除 `replay.json`、`replay.self.json` 等约定命名的 Replay JSON Evidence；新增测试同时证明行为文件变化仍会改变摘要。
- [x] `package.json`、README、设计计划和现有 CI 的最低 Node.js 版本统一为 20，不增加 CI 矩阵或运行时依赖。

## P1 Skill 行为与边界复核

- [x] `bootstrap` 与 `slice` 两个模式共享 Evidence、分层和持久化边界，但各自步骤与输出清晰。
- [x] Skill 先消费 Context Resolver；`sectioned` Spec 只通过 Section Index 定位，读取相关章节原文后才形成结论。
- [x] Slice 支持 `entrypoint`、`symbol`、`data_element`，默认只展开直接关系和一条关键数据链。
- [x] 直接消费者、异常/兼容、验证入口、停止边界和动态消费者盲区保持可见。
- [x] 输出区分 `observed`、`inferred`、`unresolved`，绑定 revision 或明确快照。
- [x] 动态切片进入当前 Spec 的 Research/Evidence；稳定契约未经维护者批准不进入 Knowledge。
- [x] 没有引入 AST、完整调用图、运行态平台、语言专用依赖或公司基建 Adapter。

## Evidence 来源关系

| 待验证主张 | 设计来源 | 验证 Evidence | 来源关系 | 结论 |
| --- | --- | --- | --- | --- |
| Context Contract 的结构和链接有效 | 本事项 Plan | Repository Check、JSON/Schema 解析 | 执行观察 | pass |
| Context Contract 的职责不复制现有状态 | 本事项 Plan | Framework 与 Knowledge/Specflow/Evidence 边界复核 | 同源说明 + 内容复核 | pass |
| Bootstrap/Slice Skill 可被发现和分发 | Skill 与 Manifest | Skill Check、Distribution Plan、Repository Check | 确定性执行观察 | pass |
| Section Index 与语义切片职责不重叠 | 本事项 Plan | Skill 工作流、Reference、Case 02 与现有 Resolver 测试 | 契约交叉复核 | pass |
| 新增内容没有产生结构回归 | 本事项 Plan | `npm test` 81/81、Specflow/Knowledge/Repository Check | 执行观察 | pass |
| 整仓复核问题已经闭合 | Review 发现与 AC-016 | Eval 摘要回归测试、CI 候选命令与版本配置复核、文档全文检索 | 独立于说明文案的程序检查 | pass |

设计说明、自生成检查清单或同一 Agent 的无外部观察复述不能作为唯一正确性证据。

## 执行结果

- `project-context-bootstrap` Skill Check：通过，资源包含 Agents、References、Assets 和 Evals。
- Distribution Plan/Apply/Verify：通过，Manifest 动态包含 9 个可分发 Skill；合成采用项目安装后 Verify 通过，project-context-bootstrap 摘要与真实目录一致。
- Repository Check：通过；新增 Skill 的 4 个 Case 被动态发现，Markdown 链接、YAML 子集、Distribution、Knowledge 和敏感扫描通过。
- Specflow Check：通过，3 个事项 Meta 和关系闭合。
- Knowledge Check / Projection Verify：通过，新增任务路由可解析，三个命中 Knowledge 均复核为 `still-valid`。
- Context Resolve：通过，任务类型“建立项目上下文或任务切片”能加载当前事项与三个相关 Knowledge。
- `npm test`：81/81 通过；新增用例证明非正式 Replay JSON 不影响 Skill 行为摘要，而行为 Case 变化会改变摘要。
- `git diff --check`：通过。
- Quality Workflow 的 YAML 子集检查通过；PR/Push Base 选择、完整历史检出和候选 `git diff --check` 配置复核通过。
- Node.js 最低版本声明与现有 CI 均为 20。
- 新增范围定向敏感词与绝对路径扫描：无命中。
- `project-context-bootstrap` 独立正式 Eval：4/4 Case 通过，平均分 100，无阻塞项和禁止动作；`evals/replay.json` 可由 Runner 重算并生成一致完整性摘要。
- 本次独立回放严格按“Resolver → Section Index → 局部原文”执行；合成与本仓均未在 Resolver 返回前检索 `sectioned` 核心正文，Trace 只保存脱敏摘要。
- 首轮 Repository Check 发现已有 Distribution Manifest 中 project-context-bootstrap 内容摘要漂移；更新摘要后重跑 Repository、Distribution 和 Eval 均通过。
- 本仓自举能识别 Skill 内容变化对 Distribution Manifest、能力说明、Knowledge 路由和当前 Spec 的直接影响；实现候选已冻结为不可变 Source，结果由归档 Receipt 继续固化。
- 私有参考仓库只读对照确认了“规则 → 确定性上下文命令 → Section Index/预算 → 行为与单元测试 → SDD 证据”链路，针对性测试 15/15 通过；公开 Evidence 未保存其名称、路径、业务、平台或提交标识。

## 生命周期检查

- [x] 维护者已明确授权将全部 Spec 归档；授权证据引用为 `conversation:2026-08-06:archive-all-specs`。
- [x] 实现候选已冻结为 Source `38096e9be57b002e87d8f3c2e03ec460624624b4`，Base 为 `89e74f74a9dbf66b2aecde9ede75532682ebe3e4`。
- [x] 两个待归档事项共享同一 Merge Candidate，范围摘要为 `sha256:2390d7ad00cec9e8689d79b9cb2d0f9a877dd5a2ed9b086a03e511c7fae618d5`；两个事项目录作为终态证据写入范围排除。
- [x] 归档按“Receipt 先写并回读验证，Meta 终态最后写”的顺序执行，不从检查通过反推历史授权。

## Knowledge Projection

- [x] `repository-positioning`、`self-hosted-governance` 和 `public-generalization-policy` 均记录 `still-valid`。
- [x] Projection Plan/Apply/Verify 通过，README 权威来源摘要与当前工作区一致。
- [x] Code Entry Map 增加“建立项目上下文或任务切片”路由，不新增重复 Knowledge 正文。

## 尚未证明

- `project-context-bootstrap` 已通过本次独立正式 Replay，当前成熟度可标记为 `validated`；该证据覆盖合成项目和本仓行为，不等同于真实采用方长期复核。
- 已完成私有参考仓库的只读问题链路对照，但尚未由独立采用方在真实接入任务中复核 Bootstrap 产物；语言级间接调用、动态注册和外部消费者仍需要采用方工具或 Adapter Evidence。
- Skill Creator 的 `quick_validate.py` 在系统 Python 和工作区 Python 中均因缺少 PyYAML 无法运行；本仓 Skill Check、YAML 子集、链接、Eval 结构、Distribution 和 Repository Check 已通过。
- 敏感扫描无命中不能替代最终权属、保密义务、二进制内容和私有词表人工复核。

## 后续选项

- 在真实但可脱敏的项目任务中前向使用 Skill，保存最小 Trace Evidence 后补充 Replay；
- 按真实缺口选择语言符号或运行态消费者 Adapter，不预先建设完整分析平台；
- 本轮完成 Receipt、Meta 终态、归档提交和一次推送；公开发布由维护者另行决定。
