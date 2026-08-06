# Design-to-Code 治理框架

成熟度：`reference-implemented`

该框架把设计输入到代码实现拆成可追溯契约：设计版本与范围、复用资产、目标代码边界、响应式和交互状态、无障碍要求、视觉与行为 Evidence。它不绑定任何设计平台，也不把像素接近等同于行为正确。

确定性参考实现只验证 [Design Contract](design-contract.schema.json) 的结构、版本映射、状态覆盖和 Evidence 完整性；可从[合成模板](design-contract.template.json)开始采用。设计理解、组件选择、审美判断和代码实现继续由 Agent 与维护者负责。
