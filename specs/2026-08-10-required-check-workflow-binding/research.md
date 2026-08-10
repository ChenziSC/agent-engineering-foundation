# Research：Required Check 与 Workflow 来源绑定语义纠偏

## Evidence

- Foundation Run `31375683343`，Source SHA `ce79b25d055c115012b7496754d37feaf7d91556`。
- `verify` 已成功且来源唯一；Delivery 返回 `github-delivery-workflow-unsuccessful`。
- 失败发生时 Workflow Run 尚在执行当前 Delivery；失败后的只读复核成功。

## 判断

Workflow Run 在这里承担来源证明，不应成为未显式声明的第二 Required Check。否则同 Workflow 的 Delivery 永远无法在执行期间证明整个 Workflow 已完成成功。

## 纠偏后真实 Evidence

- Foundation Run `31376631603`，Source SHA `1b7cda5cf76358e9e0910ed0cc7bd7ec03dade67`：`verify` 成功，Delivery 仅返回当前事项的 `change-gate-spec-not-archived`，失败后的只读复核成功。
- fwwb Run `31376683138`，Source SHA `76968fed4dc990dfda8a36e608a4fccff1ced653`：`governance` 成功，Delivery 仅返回两个 Active Spec 的 `change-gate-spec-not-archived`，失败后的只读复核成功。
- 两个 Run 均未再出现 `github-delivery-workflow-unsuccessful`、Check 歧义或错误 Workflow 来源错误。
