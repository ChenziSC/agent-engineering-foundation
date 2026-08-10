# Spec：Required Check 与 Workflow 来源绑定语义纠偏

## 背景与目标

Foundation PR #2 在事件去重并归档后，Run `31375683343` 的 Verify 成功，但 Delivery 返回 `github-delivery-workflow-unsuccessful`。Required Check `verify` 与 Delivery 位于同一 Workflow；执行 Delivery 时整个 Workflow 必然仍在运行，形成自依赖。

目标是让 GitHub Provider 严格验证显式 Required Check 的 Source SHA、App、名称、Check Suite 与 Workflow Path，同时只以该 Check 的完成和成功结论作为门禁，不把未被选择的 Job 或整个 Workflow 结论扩张为 Required Check。

## 增量缺口与消费者

- Check 精确匹配与 Workflow 来源绑定已有实现；缺口是把来源证明错误提升为整个 Workflow 成功门禁。
- 直接消费者是 Foundation 同 Workflow 的 Verify/Delivery，以及后续使用 `check-name@workflow-path` 的采用方。
- fwwb 当前 vendored Package 需要升级到包含该 Provider 修复的干净 Commit，确保未来归档正向候选不再自依赖。

## 完成条件

- AC-001：显式 Required Check 仍必须唯一、同 Source SHA、指定 App、已完成且成功。
- AC-002：Workflow Run 仍必须通过 Check Suite、Workflow Path 与 Source SHA 唯一绑定，但其整体状态/结论不覆盖 Check 门禁结论。
- AC-003：合成测试覆盖同 Workflow `in_progress` 和其他 Job 导致整体 `failure` 时，显式成功 Check 仍可作为 Evidence；错误来源与歧义仍失败关闭。
- AC-004：Foundation 全量与规模回归、Repository、Knowledge、Specflow、Projection 通过。
- AC-005：Foundation PR #2 最终 Verify 与 Delivery 均通过；fwwb 固定升级后的不可变 Package 并保持 Active 负向契约。

## 非目标

- 不接受未完成或失败的 Required Check；
- 不放宽 Workflow Path、Check Suite、Source SHA 或歧义校验；
- 不把 Check 成功解释为 Branch Protection、审批、合入或发布；
- 不修改或覆盖既有 Receipt。
