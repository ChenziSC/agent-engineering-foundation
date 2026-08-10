# Research：Required Check 与 Workflow 来源绑定语义纠偏

## Evidence

- Foundation Run `31375683343`，Source SHA `ce79b25d055c115012b7496754d37feaf7d91556`。
- `verify` 已成功且来源唯一；Delivery 返回 `github-delivery-workflow-unsuccessful`。
- 失败发生时 Workflow Run 尚在执行当前 Delivery；失败后的只读复核成功。

## 判断

Workflow Run 在这里承担来源证明，不应成为未显式声明的第二 Required Check。否则同 Workflow 的 Delivery 永远无法在执行期间证明整个 Workflow 已完成成功。
