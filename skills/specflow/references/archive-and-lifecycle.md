# 归档回执、生命周期事件与 Knowledge Projection

## 目标

终态不能只靠把 `meta.yaml.status` 改成 `archived`。归档必须回答：最终需求是什么、最终实现对应哪个版本、完成条件如何验证、哪些长期知识受到影响，以及谁明确授权了终态。

本 Reference 定义 Provider-neutral 的语义契约。当前仓库尚未提供确定性 Validator；模板不能替代摘要计算、原子写入、受保护历史检测和并发控制的程序实现。

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

## Receipt 完整性

模板中的 `integrity.payload_digest` 对 Receipt 中除 `integrity` 之外的规范化 Payload 计算，避免自引用。规范化规则必须由未来 Validator 固定，例如 UTF-8、键排序和 LF 换行；在规则尚未实现前，Agent 不得伪造看似真实的 Digest。

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

## 取代关系

取代至少涉及两个事项：旧事项的 `superseded_by` 和新事项的 `supersedes` 必须互相对应。确定性实现需要先验证两侧均可更新并建立恢复计划，再追加 Event 和最后写状态。

如果只完成一侧写入，检查必须失败并报告不一致；不得为“让门禁通过”而猜测或静默补关系。

## 篡改与恢复

- Receipt 或既有 Event 摘要不匹配：报告篡改或损坏，停止自动修复；
- 受保护版本中存在的 Receipt/Event 被删除：失败，不生成替代文件；
- Receipt 存在但 Meta 仍 Active：验证候选完全一致后允许只重试 Meta；
- Meta 已终态但 Receipt 缺失：失败并要求人工调查，不伪造历史 Receipt；
- Knowledge 过期：保持 Active，先完成复核；
- 外部 Provider 不可用：保留已完成的本地证据，外部交付单独标为未执行，不改变 Specflow 终态语义。

模板见：

- [archive-receipt.template.yaml](../assets/archive-receipt.template.yaml)
- [archive-receipt.schema.json](../assets/archive-receipt.schema.json)
- [lifecycle-event.template.yaml](../assets/lifecycle-event.template.yaml)
- [lifecycle-event.schema.json](../assets/lifecycle-event.schema.json)
- [knowledge-projection.template.yaml](../assets/knowledge-projection.template.yaml)
- [knowledge-projection.schema.json](../assets/knowledge-projection.schema.json)
- [archive-checklist.md](../assets/archive-checklist.md)
