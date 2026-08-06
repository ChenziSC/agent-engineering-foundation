# 归档回执、生命周期事件与 Knowledge Projection

## 目标

终态不能只靠把 `meta.yaml.status` 改成 `archived`。归档必须回答：最终需求是什么、最终实现对应哪个版本、完成条件如何验证、哪些长期知识受到影响，以及谁明确授权了终态。

本 Reference 定义 Provider-neutral 的语义契约。当前仓库已提供首次终态 Receipt、Lifecycle Event 摘要链、不可覆盖追加、Meta 状态最后写、双终态事项关系事务和失败恢复脚本，并由 Harness 的本地 Git Adapter 提供 Merge Candidate 摘要与两阶段 Change Gate 子集；Active 或多事项关系事务、跨仓库事务、其他版本控制 Adapter、受保护 Git 历史检测和外部交付平台集成尚未实现。

## 目录

- [三类事实来源](#三类事实来源)
- [首次终态](#首次终态)
- [收口顺序](#收口顺序)
- [实现变化摘要](#实现变化摘要)
- [产物摘要](#产物摘要)
- [Knowledge Projection](#knowledge-projection)
- [Receipt 完整性](#receipt-完整性)
- [追加式 Lifecycle Event](#追加式-lifecycle-event)
- [取代关系](#取代关系)
- [篡改与恢复](#篡改与恢复)

## 三类事实来源

| 载体 | 唯一职责 | 是否可覆盖 |
| --- | --- | --- |
| `meta.yaml` | 当前生命周期状态、关系和影响范围 | Active 阶段可更新；终态受保护 |
| `archive-receipt.yaml` | 首次终态时冻结最终产物、实现摘要、验证、授权和 Knowledge Projection | 不可覆盖 |
| `lifecycle/*.yaml` | 首次终态之后的真实状态或关系变化 | 只追加，不修改既有事件 |

Receipt 和 Event 是证据；Meta 仍是当前状态的机器单一信源。Checkpoint、PR/MR 状态和外部工作项都不能复制或替代它。

## 首次终态

从 `draft`、`planned` 或 `in-progress` 进入 `archived`、`cancelled` 或 `superseded` 时生成首个 Receipt：

- `archived`：必须冻结最终 Spec、Plan、Tasks、Validation Report 和实现变化摘要；
- `cancelled`：必须记录停止原因、授权和未交付范围；允许 `change.scope: none`；
- `superseded`：必须记录替代事项，并保证双向关系可验证。

不存在明确终态授权时，不得生成 Receipt 或修改 Meta 终态。

## 收口顺序

确定性实现应遵循以下顺序：

1. 读取 Meta、最终产物、实现版本和相关 Knowledge；
2. 验证状态转换、双向关系、完成条件、未解决 Blocker 和终态授权；
3. 计算实现变化摘要和 Spec/Plan/Tasks/Validation Report 内容摘要；
4. 形成 Knowledge Projection，并验证受影响知识的新鲜度；
5. 在内存或临时文件中构造完整 Receipt，校验 Schema 和全部 Digest；
6. 以“目标不存在”为前提写入 Receipt；已经存在时只允许验证完全相同，不得覆盖；
7. 回读 Receipt 并验证其摘要；
8. **最后**更新 `meta.yaml` 的状态、关系、终态时间和 Receipt 路径；
9. 回读 Meta 和 Receipt，确认二者一致。

第 1～7 步任一步失败时，Meta 保持 Active。第 8 步失败时，可能存在 Receipt 但 Meta 仍为 Active；恢复时必须验证已有 Receipt 与当前候选完全一致，再只重试状态写入，不能重建或覆盖 Receipt。

## 实现变化摘要

Receipt 不保存完整 Diff，只保存可复现摘要：

- 摘要算法必须显式记录，首版推荐 `sha256`；
- `scope` 必须说明摘要对象，例如 `merge-candidate`、`committed-range` 或 `none`；
- 必须记录稳定的 base/source revision 或等价不可变版本；
- 必须说明排除了哪些文件，例如 Receipt 自身、Meta 的终态字段和本地运行文件；
- 未提交内容或无法稳定解析的版本边界必须阻塞 `archived`，不能退化为 Agent 文字总结。

不同版本控制系统通过 Adapter 产生相同中立结构；核心契约不出现某个 Provider 的 PR、MR、Pipeline 或 Branch 专有字段。

本仓本地 Git Adapter 使用不可变 Base/Source Commit，在临时对象库中计算 Merge Candidate。摘要输入为范围内按路径稳定排序的候选 Tree 对象 ID，标识为 `source-control-snapshot-v1`；删除路径的对象 ID 为 `null`。Rename 等状态作为复核证据返回但不进入摘要，避免启发式状态差异改变同一最终快照。范围内存在未提交/未跟踪内容或候选冲突时阻断。Provider 输出中的 `baseRevision`、`sourceRevision`、`change.digest` 与 `change.excludes` 可以投影到候选 Receipt；完整路径清单只作为当次复核证据，不写入 Receipt 正文。

## 产物摘要

Receipt 至少冻结：

- `spec.md`；
- `plan.md`；
- `tasks.md`；
- `validation-report.md`；
- 存在时的 `research.md`。

摘要覆盖 UTF-8 原始字节。路径必须位于事项目录内，不能使用绝对路径。Receipt 自身和生命周期事件不进入自身摘要。

## Knowledge Projection

Knowledge Projection 是“本事项对长期知识有什么影响”的收口判断，不是知识正文副本。

允许动作：

| 动作 | 含义 | 必需信息 |
| --- | --- | --- |
| `create` | 产生新的长期稳定知识 | 目标 ID/路径、原因、证据 |
| `update` | 既有知识需要修改 | Knowledge ID、变更原因、证据 |
| `still-valid` | 命中或复核的既有知识仍然成立 | Knowledge ID、复核证据 |
| `supersede` | 既有知识被另一项知识替代 | 原 ID、替代 ID、原因、证据 |
| `retire` | 既有知识不再成立且没有替代项 | Knowledge ID、原因、证据 |

如果影响范围没有命中任何长期 Knowledge，使用 `impact: none` 并记录判断理由；不能用空数组掩盖未执行复核。

Knowledge 正文必须在生成 Receipt 前完成并回读。Registry、正文、代码入口和 Projection 不一致时阻塞归档。已过刷新期限、标记为 `review-required` 或证据版本不匹配的 Knowledge 不能直接写 `still-valid`，必须先复核、更新或保留事项 Active。

本仓 Harness 实现了 Registry 投影的确定性子集。Agent 或人工先完成语义判断、正文编辑、Registry 条目准备和 Code Entry Map 调整；程序再执行：

1. `plan`：验证 Projection、正文、Registry、来源文件、路径反向命中、Code Entry Map 和取代关系，不写文件；
2. `apply`：在 Registry 专用排他锁内重新计划，只原子更新状态、`last_reviewed_at`、来源摘要、退役原因、取代目标和 `last_projection` 决策指纹；
3. `verify`：重新计算同一计划，只有 Registry 不再产生差异时通过。

`create` 要求正文和 `review-required` Registry 条目已经准备；`update` 和 `still-valid` 只作用于未退役条目；`supersede` 目标必须最终为 `current`；退役条目不能继续出现在 Code Entry Map。`--paths` 用 Registry Scope 反向发现受影响知识，命中却没有对应决策时阻断；没有传入路径时只能保留人工覆盖警告，不能声称程序证明了无影响。

`last_projection` 保存 Spec ID、动作、复核日期和规范化决策摘要，用于幂等重试和独立验证，不复制 Evidence 正文。程序不生成 Knowledge 内容，也不判断业务结论是否正确；这些仍由 Agent 与人工 Review 负责。

## Receipt 完整性

模板中的 `integrity.payload_digest` 对 Receipt 中除 `integrity` 之外的规范化 Payload 计算，避免自引用。当前脚本固定生成 `canonical-json-v1`：对象键按 Unicode 码点排序、数组保持顺序、标量使用 JSON 表达，再对 UTF-8 字节计算 SHA-256。验证器兼容本仓早期使用的等价标识 `canonical-json-v1:recursive-key-sort:utf8`，但新证据不再生成旧标识。Agent 不得手工伪造 Digest。

`authorization.evidence_ref` 只保存不透明引用或本地证据位置，不复制聊天全文、邮箱和外部平台敏感字段。

## 追加式 Lifecycle Event

首次终态后的状态或关系变化使用 Event：

- 文件名使用连续序号，例如 `lifecycle/0001-superseded.yaml`；
- 每个 Event 记录前一状态、后一状态、原因、授权和关系变化；
- `previous_digest` 指向 Receipt 或上一个 Event 的完整摘要；
- `event_digest` 对除自身 Integrity 字段外的规范化 Payload 计算；
- 序号、Previous Digest 或状态链断裂时，后续事件无效；
- 既有 Event 不得覆盖、删除、重排或重新编号。

Event 只表达归档后的真实状态或关系演进。存在新的业务实现变化时必须新建 Spec；不能用 Event 绕过新的 Spec、验证和 Receipt。

当前脚本使用 `finalize-event` 执行单事项目录内的追加和状态最后写：先复核 Receipt、已有链以及 Meta 是否已投影到当前链尾，再以连续 Sequence、精确文件名、Previous Digest 和关系前置值 Seal Event，最后在 Meta 锁内原子替换 Meta。Event 已写但 Meta 更新失败时，用同一候选重试；在恢复完成前不能追加下一 Event。候选差异、链断裂或关系前置值变化都会阻断。

## 取代关系

取代至少涉及两个事项：旧事项的 `superseded_by` 和新事项的 `supersedes` 必须互相对应。父子关系也要求 child 的 `parent` 与 parent 的 `children` 对应。

本地 v1 Relation Transaction 只协调同一 Specs Root 下的两个终态事项：

1. 读取双方 Receipt、Event 链、Meta 和 Event 候选，验证 Sequence、前置状态和关系严格互反；
2. 先把事务 ID、双方目录、候选路径、Sequence 和 Event Digest 写入 `.specflow-transactions/<transaction-id>.yaml`；
3. 两条 Event 都 Seal 成功后，才按候选顺序逐侧投影 Meta；
4. 使用 `verify-relation` 独立复核事务摘要、Event 摘要和双方 Meta 是否位于各自链尾。

跨两个 Meta 文件无法通过一次 Rename 获得绝对原子可见性。若第二个 Meta 更新失败，第一侧可能已经可见；这不是“已完成”或“已回滚”。不可变事务意图和 Event 是恢复依据，用完全相同的候选重跑只补齐缺失步骤。已有证据不一致、单侧关系、夹带第三项变化或候选变化都会阻断，不通过猜测静默补关系。

## 篡改与恢复

- Receipt 或既有 Event 摘要不匹配：报告篡改或损坏，停止自动修复；
- 受保护版本中存在的 Receipt/Event 被删除：失败，不生成替代文件；
- Receipt 存在但 Meta 仍 Active：验证候选完全一致后允许只重试 Meta；
- Meta 已终态但 Receipt 缺失：失败并要求人工调查，不伪造历史 Receipt；
- Knowledge 过期：保持 Active，先完成复核；
- 外部 Provider 不可用：保留已完成的本地证据，外部交付单独标为未执行，不改变 Specflow 终态语义。

仓库内候选与事项的关联、受控低风险豁免和交付阶段摘要复核见[事项—变更关联与交付门禁](change-gate.md)。该门禁复用本 Reference 的 Receipt 与 Lifecycle 证据，但不创建版本、不确认终态授权，也不替代外部平台检查。

模板见：

- [archive-receipt.template.yaml](../assets/archive-receipt.template.yaml)
- [archive-receipt.schema.json](../assets/archive-receipt.schema.json)
- [lifecycle-event.template.yaml](../assets/lifecycle-event.template.yaml)
- [lifecycle-event.schema.json](../assets/lifecycle-event.schema.json)
- [relation-transaction.template.yaml](../assets/relation-transaction.template.yaml)
- [relation-transaction.schema.json](../assets/relation-transaction.schema.json)
- [knowledge-projection.template.yaml](../assets/knowledge-projection.template.yaml)
- [knowledge-projection.schema.json](../assets/knowledge-projection.schema.json)
- [archive-checklist.md](../assets/archive-checklist.md)

首次 Receipt、Lifecycle Event、Relation Transaction 和 Meta 状态最后写命令见 [archive-receipt.mjs](../scripts/archive-receipt.mjs)。候选文件可以使用本 Skill 支持的 YAML 子集；输出仍为 YAML。脚本只接受指定 Root 内的普通文件，不跟随 Symlink；Git 变化摘要与 Change Gate 由 Harness 单独计算，脚本不替代候选关联、授权判断或远端事务。
