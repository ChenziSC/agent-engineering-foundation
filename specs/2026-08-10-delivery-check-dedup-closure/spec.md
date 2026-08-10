# Spec：GitHub Delivery Check 事件去重纠偏

## 背景与目标

Foundation PR #2 在旧事项归档后的真实 Run `31374609828` 中，Verify 成功但 Delivery 返回 `github-delivery-check-ambiguous`。同一 Source SHA 同时存在 `push` 与 `pull_request` 触发的两个同名 `verify`；Provider 按契约拒绝猜测。Delivery 失败后，“确认门禁没有改写项目”也因缺少 `if: always()` 被跳过。

目标是让功能分支的同一 Source SHA 只产生一个可被 Required Check 精确识别的 PR Check，并确保失败路径仍执行只读复核。

## 增量缺口与直接消费者

- GitHub Actions Provider 已正确阻断歧义，不应放宽为任取一个同名 Check。
- 当前真实消费者是 Foundation PR #2 和 fwwb PR #1；公共 CI 模板也会复制同一触发方式。
- 旧事项已生成不可覆盖 Receipt，本纠偏事项对当前 PR 的完整累计候选重新形成最终 Receipt，不修改旧证据。

## 完成条件

- AC-001：Continuous Workflow 的功能分支只由 `pull_request` 触发，`push` 仅覆盖默认分支 `main`。
- AC-002：Delivery 成功或失败后都执行工作区只读复核。
- AC-003：公共 Continuous/Delivery 模板同步相同约束，并有静态回归。
- AC-004：fwwb 使用同一事件去重策略，真实 PR 仍表现为治理成功、Active Spec 交付失败，且不再产生同 SHA 双 Check。
- AC-005：Foundation PR #2 的最终不可变候选 Verify 与 Delivery 均通过。

## 非目标

- 不放宽 Provider 的歧义阻断；
- 不读取或修改 Branch Protection；
- 不删除历史 Workflow Run；
- 不修改旧事项 Receipt 或伪造其历史 Evidence。
