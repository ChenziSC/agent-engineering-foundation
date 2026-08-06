# Validation Report：补齐契约化上下文与设计验证护栏

## 结果

- 事项 ID：`2026-08-06-context-contract-and-design-guardrails`
- 检查日期：`2026-08-06`
- 结果：`pass`

该结论表示本事项当前声明范围通过结构、契约和整仓回归；事项仍保持 `in-progress`，没有据此推断归档、提交或推送授权。

## 完成条件映射

| 完成条件 | Task | Test / Evidence | 结果 |
| --- | --- | --- | --- |
| AC-001～AC-003 | T-02、T-03 | Context Contract、AI 友好仓库模板、Knowledge 入口、Schema 与 Repository Check | pass |
| AC-004～AC-005 | T-04 | Specflow Skill、Plan/Workflow、Case 01 与 12/12 回放 | pass |
| AC-006 | T-05 | Validation Report、Safe Change、Change Validation 与失败模式 | pass |
| AC-007 | T-06、V-01 | Skill Check、Eval Runner、Repository Check | pass |
| AC-008 | T-01、V-01 | Git Diff 范围复核；生命周期、Change Gate、Harness 和 Adapter 未修改 | pass |
| AC-009～AC-013 | T-07 | `project-context-bootstrap`、两份中文模板、两份 Reference、4 个合成 Case 与 Rubric | pass |
| AC-014 | T-08、T-09、T-11、V-02 | Skill Check、Distribution Plan/Apply/Verify、Context Resolve、Knowledge Projection、Repository Check、`npm test` 80/80 | pass |
| AC-015 | T-10、T-11 | 历史 self-review 与本次 4 Case 合成项目/本仓独立正式 Replay、脱敏 Trace、可重算 Replay 和分发摘要修复 | pass |

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
| 新增内容没有产生结构回归 | 本事项 Plan | `npm test` 80/80、Specflow/Knowledge/Repository Check | 执行观察 | pass |

设计说明、自生成检查清单或同一 Agent 的无外部观察复述不能作为唯一正确性证据。

## 执行结果

- `project-context-bootstrap` Skill Check：通过，资源包含 Agents、References、Assets 和 Evals。
- Distribution Plan/Apply/Verify：通过，Manifest 动态包含 9 个可分发 Skill；合成采用项目安装后 Verify 通过，project-context-bootstrap 摘要与真实目录一致。
- Repository Check：通过；新增 Skill 的 4 个 Case 被动态发现，Markdown 链接、YAML 子集、Distribution、Knowledge 和敏感扫描通过。
- Specflow Check：通过，3 个事项 Meta 和关系闭合。
- Knowledge Check / Projection Verify：通过，新增任务路由可解析，三个命中 Knowledge 均复核为 `still-valid`。
- Context Resolve：通过，任务类型“建立项目上下文或任务切片”能加载当前事项与三个相关 Knowledge。
- `npm test`：80/80 通过。
- `git diff --check`：通过。
- 新增范围定向敏感词与绝对路径扫描：无命中。
- `project-context-bootstrap` 独立正式 Eval：4/4 Case 通过，平均分 100，无阻塞项和禁止动作；`evals/replay.json` 可由 Runner 重算并生成一致完整性摘要。
- 本次独立回放严格按“Resolver → Section Index → 局部原文”执行；合成与本仓均未在 Resolver 返回前检索 `sectioned` 核心正文，Trace 只保存脱敏摘要。
- 首轮 Repository Check 发现已有 Distribution Manifest 中 project-context-bootstrap 内容摘要漂移；更新摘要后重跑 Repository、Distribution 和 Eval 均通过。
- 本仓自举能识别 Skill 内容变化对 Distribution Manifest、能力说明、Knowledge 路由和当前 Spec 的直接影响；工作区非干净，因此结果保持 `partial`。
- 私有参考仓库只读对照确认了“规则 → 确定性上下文命令 → Section Index/预算 → 行为与单元测试 → SDD 证据”链路，针对性测试 15/15 通过；公开 Evidence 未保存其名称、路径、业务、平台或提交标识。

## 生命周期检查

- [x] 当前保持 `in-progress`，没有终态授权。
- [x] 没有生成 Receipt，也没有从检查通过推断 Commit、Push 或归档。

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
- 由维护者另行决定提交、推送和事项终态。
